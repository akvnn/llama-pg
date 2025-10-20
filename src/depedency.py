from fastapi import Request


async def settings_provider(request: Request):
    yield request.app.settings


async def get_db_pool(request: Request):
    return request.app.pool


async def get_worker_client(request: Request):
    return request.app.worker_client


async def get_pgai_client(request: Request):
    return request.app.pgai_client


async def get_parser_client(request: Request):
    return request.app.parser_client
