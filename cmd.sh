#!/bin/bash

uvicorn src.server:app --host 0.0.0.0 --port ${API_PORT:-8000}