from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from loguru import logger
from src.models.models import ProjectRequest
from src.models.pagination import (
    PaginationParams,
    PaginationResponse,
    ParamRequest,
    get_pagination_params,
)
from src.worker_client import WorkerClient
from src.auth import get_current_user_id
from src.depedency import get_worker_client

router = APIRouter()


@router.post("/create_project")
async def create_project(
    request: ProjectRequest,
    user_id: str = Depends(get_current_user_id),
    worker_client: WorkerClient = Depends(get_worker_client),
):
    try:
        project_name = request.project_name
        project_description = request.project_description
        organization_id = request.organization_id
        # Check user access to organization and project does not exist
        user_has_access = await worker_client.check_user_access_to_organization(
            organization_id=organization_id,
            user_id=user_id,
            roles_allowed=["admin", "owner"],
        )
        if not user_has_access:
            return JSONResponse(
                status_code=401,
                content={"message": "User does not have access to create a project."},
            )
        project_id = await worker_client.create_project(
            project_info={"name": project_name, "description": project_description},
            organization_id=organization_id,
            user_id=user_id,
        )
        return JSONResponse(
            status_code=200,
            content={
                "message": "Project created successfully.",
                "project_id": project_id,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating project '{project_name}': {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error creating project",
        )


@router.get("/projects")
async def get_projects(
    request: ParamRequest = Depends(),
    user_id: str = Depends(get_current_user_id),
    worker_client: WorkerClient = Depends(get_worker_client),
):
    """Endpoint to retrieve all projects"""
    try:
        user_has_access = await worker_client.check_user_access_to_organization(
            organization_id=request.organization_id,
            user_id=user_id,
            roles_allowed=["member", "admin", "owner"],
        )
        if not user_has_access:
            return JSONResponse(
                status_code=401,
                content={
                    "message": "Organization does not exist or user does not have access."
                },
            )
        projects = await worker_client.get_all_projects(
            organization_id=request.organization_id
        )
        return JSONResponse(status_code=200, content={"data": projects})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving projects: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error retrieving projects",
        )


@router.get("/projects_info", response_model=PaginationResponse)
async def get_projects_info(
    user_id: str = Depends(get_current_user_id),
    pagination: PaginationParams = Depends(get_pagination_params),
    params: ParamRequest = Depends(),
    worker_client: WorkerClient = Depends(get_worker_client),
):
    """Endpoint to retrieve one or all projects' information with pagination"""
    try:
        project_id = params.project_id
        organization_id = params.organization_id
        skip = pagination.skip
        limit = pagination.limit
        if params.project_id:
            project_exists = await worker_client.check_user_access_to_project(
                organization_id=organization_id,
                project_id=project_id,
                user_id=user_id,
                roles_allowed=["member", "admin", "owner"],
            )
            if not project_exists:
                return JSONResponse(
                    status_code=404,
                    content={
                        "message": f"Project '{project_id}' in organization '{organization_id}' does not exist or user does not have access."
                    },
                )
            projects = [project_id]
            total_projects = 1
        else:
            # TODO: check user has access to organization
            all_projects = await worker_client.get_all_projects(
                organization_id=organization_id
            )
            total_projects = len(all_projects)
            projects = all_projects[skip : skip + limit]
        resp = await worker_client.get_projects_info(
            organization_id=organization_id, projects=projects
        )

        resp.page = (skip // limit) + 1
        resp.per_page = pagination.limit
        resp.total_pages = (total_projects + limit - 1) // limit
        resp.has_next = skip + limit < total_projects
        resp.has_previous = skip > 0
        resp.total_count = total_projects

        return resp
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving projects info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error retrieving projects info",
        )
