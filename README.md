# 🦙 llama-pg

A production-ready RAG as a Service (RaaS) orchestrator built on top of [**pgai**](https://github.com/timescale/pgai) for intelligent document parsing, vector embeddings generation, and RAG.

## 🚀 Features

- **PDF Processing**: Automatic PDF parsing using LlamaParse (or any supported parser) with configurable auto-mode
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

Include the required `.env` variables:
```env
OPENAI_API_KEY=<your_openai_key>
LLAMA_CLOUD_API_KEY=<your_llamaparse_api_key_here>
```

Additionally, all possible `.env` variables (including optional ones) are listed here:
```env
# PostgreSQL Configuration
DB_URL=<postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DBNAME}>
DB_POOL_MIN_SIZE=5
DB_POOL_MAX_SIZE=10
DB_POOL_IDLE_TIMEOUT=300
DB_POOL_LIFETIME_TIMEOUT=1800

# Security Configuration
JWT_EXPIRES_IN=3600
JWT_SECRET_KEY=some_dummy_key

# vLLM/OpenAI Configuration
OPENAI_API_KEY=<your_openai_key>
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_MODEL=gpt-5
USE_VLLM=False
OPENAI_HOST=https://api.openai.com/v1
# Note: to use vLLM, set USE_VLLM to True, OPENAI_HOST to <host_ip:host_port>, and change the OPENAI_EMBEDDING_MODEL and OPENAI_MODEL accordingly

# Parser Configuration
LLAMA_CLOUD_API_KEY=<your_llamaparse_api_key_here>
USE_LLAMA_PARSE=true
LLAMA_PARSE_AUTO_MODE=true

# API Configuration
API_PORT=8000

# Redis Configuration
REDIS_ARQ_HOST=redis
REDIS_ARQ_PORT=6379
REDIS_ARQ_DATABASE=1
REDIS_ARQ_MAX_JOBS=10
```

### 3. Run the stack

**Using Docker:**

```bash
docker-compose up --build -d
```

This will start:
- **PostgreSQL** (TimescaleDB with pgai): `localhost:5432`
- **Redis**: `localhost:6379`
- **Parser Worker**: Background PDF processing
- **Vectorizer Worker**: pgai vector processing
- **API and Admin Panel**: API and admin panel to manage all services

For local development instructions, see the [Development](#-development) section below (using `uv`).

## 📚 Usage

### API Endpoints

Simply navigate to `http://localhost:8000/docs` in your browser to access the full API documentation.

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
uv sync
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