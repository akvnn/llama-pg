from typing import Optional
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from src.configuration import config
from src.models.models import RAGRequest, ProjectRequest
from src.pgai_client import PGAIClient
from src.worker_client import WorkerClient
from src.lp_client import LlamaParseClient

app = FastAPI(title="llama-pg", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to restrict origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.post("/create_project")
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
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error creating project '{project_name}': {str(e)}"},
        )


@app.post("/upload_document")
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


@app.get("/get_projects")
async def get_projects():
    """Endpoint to retrieve all projects"""
    projects = await worker_client.get_all_projects()
    return JSONResponse(status_code=200, content={"projects": projects})


@app.post("/search")
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
            serializable_results.append({
                "id": result.id,
                "url": result.url,
                "title": result.title,
                "text": result.text,
                "chunk": result.chunk,
                "distance": result.distance
            })
        return JSONResponse(status_code=200, content={"data": serializable_results})
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error performing search: {str(e)}"},
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("src.api:app", host="0.0.0.0", port=config.API_PORT, reload=True)
