from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from loguru import logger
from src.auth import get_current_user_id
from src.depedency import get_pgai_client, get_worker_client
from src.models.models import RAGRequest
from src.pgai_client import PGAIClient
from src.worker_client import WorkerClient

router = APIRouter()


@router.post("/search")
async def find_relevant_chunks(
    request: RAGRequest,
    user_id: str = Depends(get_current_user_id),
    worker_client: WorkerClient = Depends(get_worker_client),
    pgai_client: PGAIClient = Depends(get_pgai_client),
):
    """Endpoint to find relevant chunks from a query"""
    project_id = request.project_id
    organization_id = request.organization_id
    query = request.query
    limit = request.limit
    try:
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
        results = await pgai_client.find_relevant_chunks(
            query=query,
            limit=limit,
            organization_id=organization_id,
            project_id=project_id,
        )
        # Convert to serializable format
        serializable_results = []
        for result in results:
            serializable_results.append(
                {
                    "id": result.id,
                    "title": result.title,
                    "metadata": result.metadata,
                    "text": result.text,
                    "project_id": result.project_id,
                    "chunk": result.chunk,
                    "distance": result.distance,
                }
            )
        return JSONResponse(status_code=200, content={"data": serializable_results})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing search: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error performing search",
        )


@router.post("/rag")
async def rag(
    request: RAGRequest,
    user_id: str = Depends(get_current_user_id),
    worker_client: WorkerClient = Depends(get_worker_client),
    pgai_client: PGAIClient = Depends(get_pgai_client),
):
    """
    Endpoint to perform rag from a query
    Requires an LLM
    """
    project_id = request.project_id
    organization_id = request.organization_id
    query = request.query
    limit = request.limit
    try:
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
        result = await pgai_client.rag_query(
            query=query,
            limit=limit,
            organization_id=organization_id,
            project_id=project_id,
        )
        return JSONResponse(status_code=200, content={"data": result})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing RAG: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error performing RAG",
        )
