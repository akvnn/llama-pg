from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from src.depedency import get_worker_client
from src.models.pagination import ParamRequest
from src.models.system import StatInfo, SystemResponse
from src.worker_client import WorkerClient
from src.auth import get_current_user_id
from loguru import logger

router = APIRouter()


@router.get("/errors", response_model=SystemResponse)
async def get_errors(
    user_id: str = Depends(get_current_user_id),
    params: ParamRequest = Depends(),
    worker_client: WorkerClient = Depends(get_worker_client),
):
    """Endpoint to retrieve errors for a project (or all)"""
    try:
        user_has_access = await worker_client.check_user_access_to_organization(
            organization_id=params.organization_id,
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
        # TODO: integrate organization_id and project_id into this function
        resp = await worker_client.get_errors()
        return resp
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retreiving errors: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error retreiving errors",
        )


@router.get("/stats", response_model=StatInfo)
async def get_stats(
    user_id: str = Depends(get_current_user_id),
    params: ParamRequest = Depends(),
    worker_client: WorkerClient = Depends(get_worker_client),
):
    """Endpoint to retrieve system stats for a project (or all)"""
    try:
        organization_id = params.organization_id
        if params.project_id:
            project_id = params.project_id
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
                        "message": "Project does not exist or user does not have access."
                    },
                )
            projects = [project_id]
        else:
            user_has_access = await worker_client.check_user_access_to_organization(
                organization_id=organization_id,
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
            all_projects = await worker_client.get_all_projects(
                organization_id=organization_id
            )
            projects = all_projects

        resp = await worker_client.get_stats(
            organization_id=organization_id, projects=projects
        )
        return resp
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retreiving stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error retreiving stats",
        )


@router.get("/health")
@router.get("/healthz")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
