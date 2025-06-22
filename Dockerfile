FROM python:3.12-slim AS base

WORKDIR /opt

FROM base AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

ENV UV_LINK_MODE=copy

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --no-dev --frozen --no-install-project --no-editable

COPY ./pyproject.toml ./uv.lock ./README.md ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev --frozen --no-editable

FROM base AS runtime

ARG VERSION
ENV VERSION=${VERSION}

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl dos2unix && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/.venv /opt/.venv

COPY ./src ./src
COPY ./entrypoint.sh /entrypoint.sh
COPY ./cmd.sh /cmd.sh

RUN dos2unix /entrypoint.sh /cmd.sh 
RUN chmod +x /entrypoint.sh /cmd.sh 

ENV PATH=/opt:/opt/.venv/bin:${PATH}

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/cmd.sh"]