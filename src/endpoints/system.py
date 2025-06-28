from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from src.models.pagination import ParamRequest
from src.models.system import StatInfo, SystemResponse
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


@router.get("/errors", response_model=SystemResponse)
async def get_errors():
    """Endpoint to retrieve errors for a project (or all)"""
    try:
        resp = await worker_client.get_errors()
        return resp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retreiving errors: {str(e)}",
        )


@router.get("/stats", response_model=StatInfo)
async def get_stats(params: ParamRequest = Depends()):
    """Endpoint to retrieve system stats for a project (or all)"""
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
            all_projects = await worker_client.get_all_projects()
            projects = all_projects

        resp = await worker_client.get_stats(projects=projects)
        return resp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retreiving stats: {str(e)}",
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
