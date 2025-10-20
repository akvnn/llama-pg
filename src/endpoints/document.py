from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from loguru import logger
from src.auth import get_current_user_id
from src.depedency import get_worker_client
from src.models.document import DocumentDetail, DocumentParamsRequest
from src.models.pagination import (
    PaginationParams,
    PaginationResponse,
    ParamRequest,
    get_pagination_params,
)
from src.worker_client import WorkerClient

router = APIRouter()


@router.post("/upload_document")
async def upload_document(
    user_id: str = Depends(get_current_user_id),
    document: UploadFile = File(..., description="Uploaded document file"),
    organization_id: str = Form(..., description="Organization id"), 
    project_id: str = Form(..., description="Project id"),
    document_name: Annotated[str | None, Form(description="Document title")] = None,
    metadata: Annotated[dict | None, Form(description="Additional metadata")] = None,
    worker_client: WorkerClient = Depends(get_worker_client),
):
    try:
        # Validate if the user has access to the organization and project
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
        document_bytes = await document.read()
        document_uploaded_name = document_name or getattr(
            document, "filename", "uploaded_document"
        )
        document_metadata = metadata or getattr(document, "metadata", {})

        insert_object = {
            "document_uploaded_name": document_uploaded_name,
            "metadata": metadata or document_metadata,
            "document_bytes": document_bytes,
        }

        document_id = await worker_client.insert_into_table(
            organization_id=organization_id,
            project_id=project_id,
            user_id=user_id,
            insert_object=insert_object,
        )
        return JSONResponse(
            status_code=200,
            content={
                "message": "Document uploaded successfully",
                "document_id": document_id,
            },
        )
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": "Error uploading document to project"},
        )


@router.get("/recent_documents_info", response_model=PaginationResponse)
async def get_recent_documents_info(
    user_id: str = Depends(get_current_user_id),
    pagination: PaginationParams = Depends(get_pagination_params),
    params: ParamRequest = Depends(),
    worker_client: WorkerClient = Depends(get_worker_client),
):
    """
    Endpoint to retrieve information about the most recent documents for a project (or all).
    """
    try:
        project_id = params.project_id
        organization_id = params.organization_id
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
        else:
            # TODO: check user has access to organization
            all_projects = await worker_client.get_all_projects(
                organization_id=organization_id
            )  # No pagination for projects, either one or all. PaginationParams are for the documents below.
            projects = all_projects

        skip = pagination.skip
        limit = pagination.limit
        resp = await worker_client.get_recent_documents_info(
            organization_id=organization_id, projects=projects, skip=skip, limit=limit
        )
        return resp
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving recent documents info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error retrieving recent documents info",
        )


@router.get("/document", response_model=DocumentDetail)
async def get_document(
    user_id: str = Depends(get_current_user_id),
    params: DocumentParamsRequest = Depends(),
    worker_client: WorkerClient = Depends(get_worker_client),
):
    """Endpoint to retrieve a specific document by ID for a project"""
    try:
        project_id = params.project_id
        organization_id = params.organization_id
        document_id = params.document_id
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
        resp = await worker_client.get_document_by_id(
            organization_id=organization_id, document_id=document_id
        )
        return resp
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving a specific document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error retrieving a specific document",
        )
