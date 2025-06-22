# 🦙 llama-pg

A production-ready RAG as a Service (RaaS) orchestrator that integrates **LlamaParse**, **pgai**, and **vLLM** _(the best of all worlds)_ for intelligent document parsing, vector embeddings generation, and RAG.

## 🚀 Features

- **PDF Processing**: Automatic PDF parsing using LlamaParse with configurable auto-mode
- **Vector Embeddings**: Built-in support for vLLM embeddings (e.g., BAAI/bge-m3) or OpenAI embeddings
- **Admin Interface**: Easy-to-use admin panel for document management
- **REST API**: Simple API endpoints for document insertion and retrieval
- **Worker Architecture**: Scalable background processing with ARQ workers
- **pgai Integration**: Leverages TimescaleDB's pgai extension for vector operations

## 🏗️ Architecture

```
┌─────────────────┐
│   Admin UI      │
└─────────┬───────┘
          │  (uses REST API)
          ▼
┌─────────────────┐
│   REST API      │◄─────────────┐
└─────────┬───────┘              │
          │                      │
          │                      │
          │                      │
          ▼                      │
                    ┌─────────────▼───────────────┐
                    │        Redis Queue          │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │     Parser Worker           │
                    │    (LlamaParse)             │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   TimescaleDB + pgai        │
                    │   (Parsed Content)          │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   pgai Vectorizer Worker    │
                    │   (vLLM/OpenAI Embeddings)  │
                    └─────────────▲───────────────┘
                                  │
                    ┌─────────────────────────────┐
                    │   TimescaleDB + pgai        │
                    │   (Vector Storage)          │
                    └─────────────────────────────┘
```
### Pipeline: PDF → Embeddings

```
📄 PDF Upload
    ↓
🔄 QUEUED (Redis)
    ↓
📝 PARSING (Parser Worker)
    ↓
💾 PARSED (PostgreSQL - documents table)
    ↓
🤖 VECTORIZING (pgai Worker)
    ↓
🔍 READY (PostgreSQL - pgai vector tables)
```

## 🛠️ Quick Start

### Prerequisites

- Docker & Docker Compose
- LlamaParse API key (get from [LlamaIndex](https://cloud.llamaindex.ai/))
- vLLM or OpenAI API key for embeddings with a deployed embedding model

### vLLM Prerequisites (optional)

If using vLLM, we recommend using an embedding model that supports matryoshka dimensions. We personally tested `BAAI/bge-m3` using the following command:
```
vllm serve BAAI/bge-m3 \
  --task embed \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.8 \
  --no-enable-prefix-caching \
  --trust-remote-code \
  --enforce-eager \
  --host 0.0.0.0 \
  --port 8000 \
  --max-model-len 2048 \
  --override-pooler-config '{"normalize": true}' \
  --hf_overrides '{"is_matryoshka": true, "matryoshka_dimensions": [768,1024]}'

```
### 1. Clone the Repository

```bash
git clone https://github.com/akvnn/llama-pg.git
cd llama-pg
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Required
LLAMA_CLOUD_API_KEY=your_llamaparse_api_key_here
DB_URL=postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DBNAME}

# vLLM Configuration
VLLM_API_KEY=some_dummy_key
VLLM_EMBEDDING_MODEL=BAAI/bge-m3
VLLM_EMBEDDING_HOST=host_ip:host_port

# OpenAI Alternative
OPENAI_API_KEY=your_openai_key
# Set VLLM_EMBEDDING_HOST to empty to use OpenAI
VLLM_EMBEDDING_HOST=

# Redis Configuration
REDIS_ARQ_HOST=redis
REDIS_ARQ_PORT=6379
REDIS_ARQ_DATABASE=0
REDIS_ARQ_MAX_JOBS=10

# Processing Configuration
USE_LLAMA_PARSE=true
LLAMA_PARSE_AUTO_MODE=true
```

### 3. Run the stack

**Using Docker:**

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** (TimescaleDB with pgai): `localhost:5432`
- **Redis**: `localhost:6379`
- **Parser Worker**: Background PDF processing
- **Vectorizer Worker**: pgai vector processing
- **API and Admin Panel**: API and admin panel to manage all services

For local development instructions, see the [Development](#-development) section below (using either `uv` or `pip`).

## 📚 Usage

### Main API Endpoints

---

#### `POST /create_project`
Create a new project and associated table.

**Request Body:**
```json
{
  "project_name": "string",
  "table_name": "string"
}
```
**Response:**
- `200 OK`:  
  ```json
  { "message": "Project '<project_name>' created successfully." }
  ```
- `500 Internal Server Error`:  
  ```json
  { "message": "Error creating project '<project_name>': <error_message>" }
  ```

---

#### `POST /upload_document`
Upload a document to a specific project.

**Form Data:**
- `document`: File (required)
- `project_name`: string (required)
- `table_name`: string (optional, default: "wiki")

**Response:**
- `200 OK`:  
  ```json
  { "message": "Document '<document_title>' uploaded successfully to project '<project_name>'" }
  ```
- `500 Internal Server Error`:  
  ```json
  { "message": "Error uploading document to project '<project_name>': <error_message>" }
  ```

---

#### `GET /get_projects`
Retrieve all projects.

**Response:**
- `200 OK`:  
  ```json
  { "projects": [ "project1", "project2", ... ] }
  ```

---

#### `POST /search`
Find relevant chunks from a query

**Request Body:**
```json
{
  "project_name": "string",
  "query": "string",
  "limit": int,
  "table_name": "string"
}
```
**Response:**
- `200 OK`:  
  ```json
  { "data": [ ...results... ] }
  ```
- `404 Not Found`:  
  ```json
  { "message": "Project '<project_name>' does not exist." }
  ```
- `500 Internal Server Error`:  
  ```json
  { "message": "Error performing search: <error_message>" }
  ```

---

#### `GET /health`
Health check endpoint.

**Response:**
- `200 OK`:  
  ```json
  { "status": "healthy" }
  ```

---

**Notes:**
- All endpoints return JSON responses.
- Adjust CORS and authentication as needed for your deployment.
- Replace placeholder values (e.g., `<project_name>`, `<error_message>`) with actual values from your requests/responses.

### Admin Interface

Access the admin panel at `http://localhost:8000/admin` to:
- Manage parsing and vectorizer tables for all projects
- Upload and manage documents
- Monitor processing status
- Configure parsing settings
- View vector embeddings

## 🔧 Development

### Local Development Setup

**Using uv (recommended):**
```bash
uv init
uv sync
```

**OR Using pip:**
```bash
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git switch -c feature/amazing-feature`) or a bug fix   branch (`git switch -c bugfix/your-bug-description`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party License

This project uses pgai, which is licensed under the PostgreSQL License.
Copyright (c) Timescale, Inc.