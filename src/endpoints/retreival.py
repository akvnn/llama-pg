from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from src.models.models import RAGRequest
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


@router.post("/search")
async def find_relevant_chunks(request: RAGRequest):
    """Endpoint to find relevant chunks from a query"""
    project_name = request.project_name
    query = request.query
    limit = request.limit
    table_name = request.table_name
    try:
        project_exists = await worker_client.check_project_exists(
            schema_name=project_name
        )
        if not project_exists:
            return JSONResponse(
                status_code=404,
                content={"message": f"Project '{project_name}' does not exist."},
            )
        results = await pgai_client.find_relevant_chunks(
            query=query,
            limit=limit,
            schema_name=project_name,
            table_name=table_name,
        )
        # Convert to serializable format
        serializable_results = []
        for result in results:
            serializable_results.append(
                {
                    "id": result.id,
                    "url": result.url,
                    "title": result.title,
                    "text": result.text,
                    "chunk": result.chunk,
                    "distance": result.distance,
                }
            )
        return JSONResponse(status_code=200, content={"data": serializable_results})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing search: {str(e)}",
        )


@router.post("/rag")
async def rag(request: RAGRequest):
    """
    Endpoint to perform rag from a query
    Requires an LLM
    """
    project_name = request.project_name
    query = request.query
    limit = request.limit
    table_name = request.table_name
    try:
        project_exists = await worker_client.check_project_exists(
            schema_name=project_name
        )
        if not project_exists:
            return JSONResponse(
                status_code=404,
                content={"message": f"Project '{project_name}' does not exist."},
            )
        result = await pgai_client.rag_query(
            query=query,
            limit=limit,
            schema_name=project_name,
            table_name=table_name,
        )
        return JSONResponse(status_code=200, content={"data": result})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing RAG: {str(e)}",
        )
