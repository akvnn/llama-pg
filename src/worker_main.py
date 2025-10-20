import asyncio
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
    organizations_ids = await worker_client.get_organizations_ids()  # get all orgs
    new_documents_to_process = await worker_client.check_new_documents(
        organizations_ids
    )
    logger.debug(len(new_documents_to_process))
    if len(new_documents_to_process) > 0:
        parsed_documents, documents_organizations_ids = await worker_client.parse_documents(new_documents_to_process)
        logger.debug(parsed_documents)
        logger.debug(documents_organizations_ids)
        await worker_client.upload_parsed_documents(
            parsed_documents, documents_organizations_ids
        )
    else:
        logger.info("Found no new documents to parse")


async def parser_runner(ctx):
    await watch_target_tables()
