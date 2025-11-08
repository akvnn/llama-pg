from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from src.depedency import get_db_pool
from src.models.user import (
    CreateOrganizationRequest,
    CreateOrganizationResponse,
    OrganizationInfo,
    OrganizationUserInfo,
    OrganizationUserKickRequest,
    OrganizationUserKickResponse,
    OrganizationUserRequest,
    UserRequest,
    UserResponse,
)
from src.auth import (
    get_current_user_id,
    verify_password,
    hash_password,
    generate_jwt_token,
)
from src.utils import create_org_schema

router = APIRouter()


@router.post("/login", response_model=UserResponse)
async def login(body: UserRequest, pool=Depends(get_db_pool)):
    try:
        username = body.username
        password = body.password
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                        SELECT u.id, u.username, u.password_hash,
                        COALESCE(ARRAY_AGG(uo.org_id) FILTER (WHERE uo.org_id IS NOT NULL), ARRAY[]::uuid[]) as org_ids
                        FROM users u
                        LEFT JOIN user_org uo ON u.id = uo.user_id
                        WHERE u.username = %s
                        GROUP BY u.id, u.username, u.password_hash;
                    """,
                    (username,),
                )
                user = await cur.fetchone()
                if not user:
                    raise HTTPException(
                        status_code=401,
                        detail="Invalid username or password",
                    )
                if not verify_password(password, user[2]):
                    raise HTTPException(
                        status_code=401,
                        detail="Invalid username or password",
                    )
                # generate JWT token that includes user id and expiration
                token = generate_jwt_token(user_id=str(user[0]))
                await cur.execute(
                    """
                    UPDATE users SET last_login = NOW() WHERE id = %s;
                    """,
                    (str(user[0]),),
                )
                await conn.commit()
        return UserResponse(token=token, org_ids=user[3])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error during login",
        )


@router.post("/signup", response_model=UserResponse)
async def signup(body: UserRequest, pool=Depends(get_db_pool)):
    try:
        username = body.username
        password = body.password
        is_service_account = body.is_service_account
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor() as cur:
                    await cur.execute(
                        """
                            SELECT id FROM users WHERE username = %s;
                        """,
                        (username,),
                    )
                    user = await cur.fetchone()
                    if user:
                        raise HTTPException(
                            status_code=400,
                            detail="Username already exists",
                        )
                    hashed_password = hash_password(password)
                    await cur.execute(
                        """
                            INSERT INTO users (username, password_hash, is_service_account, created_at, last_login)
                            VALUES (%s, %s, %s, NOW(), NOW())
                            RETURNING id;
                        """,
                        (username, hashed_password, is_service_account),
                    )
                    user_result = await cur.fetchone()
                    if not user_result:
                        raise HTTPException(
                            status_code=500,
                            detail="Error creating user",
                        )
                    await cur.execute(
                        """
                            INSERT INTO organizations (name, created_at)
                            VALUES (%s, NOW())
                            RETURNING id;
                            """,
                        (f"{username}'s Organization",),
                    )
                    org_result = await cur.fetchone()
                    if not org_result:
                        raise HTTPException(
                            status_code=500,
                            detail="Error creating organization",
                        )
                    await cur.execute(
                        """
                            INSERT INTO user_org (user_id, org_id, role, joined_at)
                            VALUES (%s, %s, %s, NOW())
                            RETURNING id;
                            """,
                        (str(user_result[0]), str(org_result[0]), "owner"),
                    )
                    user_org_result = await cur.fetchone()
                    if not user_org_result:
                        raise HTTPException(
                            status_code=500,
                            detail="Error creating user and default organization",
                        )
                    await create_org_schema(cur, str(org_result[0]))
                    token = generate_jwt_token(user_id=str(user_result[0]))
                    # await conn.commit() # transaction commits automatically
        return UserResponse(token=token, org_ids=[org_result[0]])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during signup: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error during signup",
        )


@router.post("/create_organization")
async def create_organization(
    request: CreateOrganizationRequest,
    user_id: str = Depends(get_current_user_id),
    pool=Depends(get_db_pool),
):
    """
    Endpoint to create a new organization for the current user.
    The user must be authenticated and the request body should contain the organization name.
    """
    try:
        org_name = request.name

        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor() as cur:
                    # Create new organization
                    await cur.execute(
                        """
                        INSERT INTO organizations (name, created_at)
                        VALUES (%s, NOW())
                        RETURNING id;
                        """,
                        (org_name,),
                    )
                    org_result = await cur.fetchone()
                    if not org_result:
                        raise HTTPException(
                            status_code=500,
                            detail="Error creating organization",
                        )
                    org_id = str(org_result[0])

                    # Associate user with the new organization as 'owner'
                    await cur.execute(
                        """
                        INSERT INTO user_org (user_id, org_id, role, joined_at)
                        VALUES (%s, %s, %s, NOW())
                        RETURNING id;
                        """,
                        (user_id, org_id, "owner"),
                    )
                    user_org_result = await cur.fetchone()
                    if not user_org_result:
                        raise HTTPException(
                            status_code=500,
                            detail="Error associating user with organization",
                        )

                    # Create schema and tables for the new organization
                    await create_org_schema(cur, org_id)

        return CreateOrganizationResponse(id=org_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating organization: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error creating organization",
        )


@router.get("/organizations", response_model=list[OrganizationInfo])
async def get_organizations(
    user_id: str = Depends(get_current_user_id), pool=Depends(get_db_pool)
):
    """
    Endpoint to retrieve all organizations associated with the current user.
    The user must be authenticated.
    """
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT o.id, o.name, uo.joined_at, uo.role
                    FROM organizations o
                    JOIN user_org uo ON o.id = uo.org_id
                    WHERE uo.user_id = %s;
                    """,
                    (user_id,),
                )
                orgs = await cur.fetchall()
                return [
                    OrganizationInfo(
                        id=str(org[0]), name=org[1], joined_at=org[2], role=org[3]
                    )
                    for org in orgs
                ]
    except Exception as e:
        logger.error(f"Error fetching organizations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error fetching organizations",
        )


@router.get("/organization/{org_id}", response_model=OrganizationInfo)
async def get_organization(
    org_id: str, user_id: str = Depends(get_current_user_id), pool=Depends(get_db_pool)
):
    """
    Endpoint to retrieve details of a specific organization by its ID.
    The user must be authenticated and a member of the organization.
    """
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT o.id, o.name, uo.joined_at, uo.role
                    FROM organizations o
                    JOIN user_org uo ON o.id = uo.org_id
                    WHERE o.id = %s AND uo.user_id = %s;
                    """,
                    (org_id, user_id),
                )
                org = await cur.fetchone()
                if not org:
                    raise HTTPException(
                        status_code=404,
                        detail="Organization not found or access denied",
                    )
                return OrganizationInfo(
                    id=str(org[0]), name=org[1], joined_at=org[2], role=org[3]
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching organization: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error fetching organization",
        )


@router.get("/organization/{org_id}/users", response_model=list[OrganizationUserInfo])
async def get_organization_users(
    org_id: str, user_id: str = Depends(get_current_user_id), pool=Depends(get_db_pool)
):
    """
    Endpoint to retrieve all users associated with a specific organization.
    The user must be authenticated and a member of the organization.
    """
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT 1
                    FROM user_org
                    WHERE org_id = %s AND user_id = %s;
                    """,
                    (org_id, user_id),
                )
                is_member = await cur.fetchone()
                if not is_member:
                    raise HTTPException(
                        status_code=403,
                        detail="Access denied",
                    )

                await cur.execute(
                    """
                    SELECT u.id, u.username, uo.role, uo.joined_at
                    FROM users u
                    JOIN user_org uo ON u.id = uo.user_id
                    WHERE uo.org_id = %s AND u.is_service_account = FALSE;
                    """,
                    (org_id,),
                )
                users = await cur.fetchall()
                return [
                    OrganizationUserInfo(
                        user_id=str(user[0]),
                        username=user[1],
                        role=user[2],
                        joined_at=user[3],
                    )
                    for user in users
                ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching organization users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error fetching organization users",
        )


@router.get("/organization/{org_id}/sa", response_model=list[OrganizationUserInfo])
async def get_organization_sas(
    org_id: str, user_id: str = Depends(get_current_user_id), pool=Depends(get_db_pool)
):
    """
    Endpoint to retrieve all service account users associated with a specific organization.
    The user must be authenticated and a member of the organization.
    """
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT 1
                    FROM user_org
                    WHERE org_id = %s AND user_id = %s;
                    """,
                    (org_id, user_id),
                )
                is_member = await cur.fetchone()
                if not is_member:
                    raise HTTPException(
                        status_code=403,
                        detail="Access denied",
                    )

                await cur.execute(
                    """
                    SELECT u.id, u.username, uo.role, uo.joined_at
                    FROM users u
                    JOIN user_org uo ON u.id = uo.user_id
                    WHERE uo.org_id = %s AND u.is_service_account = TRUE;
                    """,
                    (org_id,),
                )
                users = await cur.fetchall()
                return [
                    OrganizationUserInfo(
                        user_id=str(user[0]),
                        username=user[1],
                        role=user[2],
                        joined_at=user[3],
                    )
                    for user in users
                ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching organization users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error fetching organization users",
        )


@router.post("/organization/{org_id}/add_user", response_model=OrganizationUserInfo)
async def add_user_to_organization(
    org_id: str,
    request: OrganizationUserRequest,
    user_id: str = Depends(get_current_user_id),
    pool=Depends(get_db_pool),
):
    """
    Endpoint to add a user to an organization.
    The current user must be authenticated and an 'owner' of the organization.
    The request body should contain the username of the user to add.
    """
    try:
        username = request.username
        role = request.role

        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor() as cur:
                    # check if current user is an 'owner' or 'admin' of the organization
                    await cur.execute(
                        """
                        SELECT role
                        FROM user_org
                        WHERE org_id = %s AND user_id = %s;
                        """,
                        (org_id, user_id),
                    )
                    role_result = await cur.fetchone()
                    if not role_result or role_result[0] not in ("admin", "owner"):
                        raise HTTPException(
                            status_code=403,
                            detail="Only organization owners and admins can add users or organization does not exist",
                        )

                    # get the ID of the user to add
                    await cur.execute(
                        """
                        SELECT id
                        FROM users
                        WHERE username = %s AND is_service_account = FALSE;
                        """,
                        (username,),
                    )
                    user_to_add = await cur.fetchone()
                    if not user_to_add:
                        raise HTTPException(
                            status_code=404,
                            detail="User to add not found",
                        )
                    user_to_add_id = str(user_to_add[0])

                    # check if the user is already a member of the organization
                    await cur.execute(
                        """
                        SELECT 1
                        FROM user_org
                        WHERE org_id = %s AND user_id = %s;
                        """,
                        (org_id, user_to_add_id),
                    )
                    existing_member = await cur.fetchone()
                    if existing_member:
                        raise HTTPException(
                            status_code=400,
                            detail="User is already a member of the organization",
                        )

                    # add the user to the organization
                    await cur.execute(
                        """
                        INSERT INTO user_org (user_id, org_id, role, joined_at)
                        VALUES (%s, %s, %s, NOW())
                        RETURNING id, joined_at
                        """,
                        (user_to_add_id, org_id, role),
                    )
                    user_org_result = await cur.fetchone()
                    user_org_id, user_joined_at = user_org_result
                    return OrganizationUserInfo(
                        user_id=str(user_org_id),
                        username=username,
                        role=role,
                        joined_at=user_joined_at,
                    )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding user to organization: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Error adding user to organization."
        )


@router.post("/organization/{org_id}/kick_user")
async def kick_user_from_organization(
    org_id: str,
    request: OrganizationUserKickRequest,
    user_id: str = Depends(get_current_user_id),
    pool=Depends(get_db_pool),
):
    """
    Endpoint to kick a user from an organization.
    - Owners can kick anyone (except themselves)
    - Admins can only kick members
    - Members cannot kick anyone
    """
    try:
        username_to_kick = request.username

        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor() as cur:
                    # check current user's role in the organization
                    await cur.execute(
                        """
                        SELECT role
                        FROM user_org
                        WHERE org_id = %s AND user_id = %s;
                        """,
                        (org_id, user_id),
                    )
                    role_result = await cur.fetchone()
                    if not role_result:
                        raise HTTPException(
                            status_code=403,
                            detail="You are not a member of this organization",
                        )

                    current_user_role = role_result[0]

                    if current_user_role == "member":
                        raise HTTPException(
                            status_code=403, detail="Members cannot kick users"
                        )

                    # get the user to kick and their role
                    await cur.execute(
                        """
                        SELECT u.id, uo.role
                        FROM users u
                        JOIN user_org uo ON u.id = uo.user_id
                        WHERE u.username = %s AND uo.org_id = %s;
                        """,
                        (username_to_kick, org_id),
                    )
                    user_to_kick = await cur.fetchone()
                    if not user_to_kick:
                        raise HTTPException(
                            status_code=404,
                            detail="User not found in this organization",
                        )

                    user_to_kick_id = str(user_to_kick[0])
                    user_to_kick_role = user_to_kick[1]

                    # prevent users from kicking themselves
                    if user_to_kick_id == user_id:
                        raise HTTPException(
                            status_code=400,
                            detail="You cannot kick yourself from the organization",
                        )

                    # admins can only kick members
                    if current_user_role == "admin" and user_to_kick_role != "member":
                        raise HTTPException(
                            status_code=403, detail="Admins can only kick members"
                        )

                    # delete the user from the organization
                    await cur.execute(
                        """
                        DELETE FROM user_org
                        WHERE org_id = %s AND user_id = %s;
                        """,
                        (org_id, user_to_kick_id),
                    )

                    return OrganizationUserKickResponse(username=username_to_kick)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error kicking user from organization: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Error kicking user from organization."
        )
