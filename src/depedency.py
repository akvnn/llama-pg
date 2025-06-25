from fastapi import Request


async def settings_provider(request: Request):
    yield request.app.settings
