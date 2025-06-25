from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from src.models.models import ProjectRequest
from src.models.pagination import (
    PaginationParams,
    PaginationResponse,
    ParamRequest,
    get_pagination_params,
)
from src.pgai_client import PGAIClient
from src.worker_client import WorkerClient
from src.lp_client import LlamaParseClient
from src.configuration import config

router = APIRouter()

# Initialize the clients
if config.USE_LLAMA_PARSE:
    parser_client = LlamaParseClient(auto_mode=config.LLAMA_PARSE_AUTO_MODE)
else:
    parser_client = None
# Initialize the worker client with the parser client
worker_client = WorkerClient(
    parser_client, client_type=parser_client.__class__.__name__
)
pgai_client = PGAIClient()


@router.post("/create_project")
async def create_project(request: ProjectRequest):
    try:
        project_name = request.project_name
        table_name = request.table_name
        await pgai_client.define_schema(
            schema_name=project_name, table_name=table_name
        )  # TODO:, make the below 3 functions a transaction
        await worker_client.create_table_if_not_exists(
            schema_name=project_name, table_name=table_name
        )
        await pgai_client.create_vectorizer(
            schema_name=project_name, table_name=table_name
        )
        return JSONResponse(
            status_code=200,
            content={"message": f"Project '{project_name}' created successfully."},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating project '{project_name}': {str(e)}",
        )


@router.get("/projects")
async def get_projects():
    """Endpoint to retrieve all projects"""
    try:
        projects = await worker_client.get_all_projects()
        return JSONResponse(status_code=200, content={"projects": projects})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving projects: {str(e)}",
        )


@router.get("/projects_info", response_model=PaginationResponse)
async def get_projects_info(
    pagination: PaginationParams = Depends(get_pagination_params),
    params: ParamRequest = Depends(),
):
    """Endpoint to retrieve one or all projects' information with pagination"""
    try:
        project_name = params.project_name
        if params.project_name:
            project_exists = await worker_client.check_project_exists(
                schema_name=project_name
            )
            if not project_exists:
                return JSONResponse(
                    status_code=404,
                    content={"message": f"Project '{project_name}' does not exist."},
                )
            projects = [project_name]
        else:
            skip = pagination.skip
            limit = pagination.limit
            all_projects = (
                await worker_client.get_all_projects()
            )  # TODO: move pagination inside the get_all_projects
            projects = all_projects[skip : skip + limit]
        resp = await worker_client.get_projects_info(projects=projects)
        return resp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving projects info: {str(e)}",
        )
