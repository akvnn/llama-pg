# import uvicorn
from fastapi import FastAPI
from src.main import create_app

# from src.configuration import config
app: FastAPI = create_app()

# if __name__ == "__main__":
#     uvicorn.run("src.server:app", host="0.0.0.0", port=config.API_PORT, reload=True)
