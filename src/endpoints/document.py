from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from fastapi.responses import JSONResponse
from src.models.document import DocumentDetail, DocumentParamsRequest
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


@router.post("/upload_document")
async def upload_document(
    document: UploadFile = File(..., description="Uploaded document file"),
    project_name: str = Form(..., description="Project name"),
    table_name: Optional[str] = Form("wiki", description="Table name"),
):
    try:
        document_bytes = await document.read()
        document_path = getattr(document, "filename", "uploaded_document")
        document_title = getattr(
            document, "title", document_path
        )  # TODO: -> make metadata customizable as title will always resolve TODO:cument_path right now.
        insert_object = {
            "file_path": document_path,
            "url": document_path,
            "title": document_title,
            "file_bytes": document_bytes,
        }
        await worker_client.insert_into_table(
            schema_name=project_name, table_name=table_name, insert_object=insert_object
        )
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Document '{document_title}' uploaded successfully to project '{project_name}'"
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "message": f"Error uploading document to project '{project_name}': {str(e)}"
            },
        )


@router.get("/recent_documents_info", response_model=PaginationResponse)
async def get_recent_documents_info(
    pagination: PaginationParams = Depends(get_pagination_params),
    params: ParamRequest = Depends(),
):
    """
    Endpoint to retrieve information about the most recent documents for a project (or all).
    """
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
            all_projects = await worker_client.get_all_projects()  # No pagination for projects, either one or all. PaginationParams are for the documents below.
            projects = all_projects

        skip = pagination.skip
        limit = pagination.limit
        resp = await worker_client.get_recent_documents_info(
            projects=projects, skip=skip, limit=limit
        )
        return resp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving recent documents info: {str(e)}",
        )


@router.get("/document", response_model=DocumentDetail)
async def get_document(params: DocumentParamsRequest = Depends()):
    """Endpoint to retrieve a specific document by ID for a project"""
    try:
        project_name = params.project_name
        document_id = params.document_id
        project_exists = await worker_client.check_project_exists(
            schema_name=project_name
        )
        if not project_exists:
            return JSONResponse(
                status_code=404,
                content={"message": f"Project '{project_name}' does not exist."},
            )
        resp = await worker_client.get_document_by_id(
            project_name=project_name, document_id=document_id
        )
        return resp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving a specific document: {str(e)}",
        )
