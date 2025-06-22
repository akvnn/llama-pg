from loguru import logger
from src.configuration import config
from src.lp_client import LlamaParseClient
from src.worker_client import WorkerClient


async def watch_target_tables():
    if config.USE_LLAMA_PARSE:
        parser_client = LlamaParseClient(auto_mode=config.LLAMA_PARSE_AUTO_MODE)
    else:
        logger.error(
            "LlamaParseClient is the only one that has been implemented as of now. Please set `USE_LLAMA_PARSE` to True."
        )
        return
    worker_client = WorkerClient(
        parser_client, client_type=parser_client.__class__.__name__
    )
    await worker_client.create_table_if_not_exists()
    target_tables = await worker_client.fetch_target_tables()
    new_documents_to_process = await worker_client.check_new_documents(target_tables)
    if len(new_documents_to_process) > 0:
        parsed_documents, schemas_tables = await worker_client.parse_documents(
            new_documents_to_process
        )
        await worker_client.upload_parsed_documents(parsed_documents, schemas_tables)
    else:
        logger.info("Found no new documents to parse")


async def parser_runner(ctx):
    await watch_target_tables()
