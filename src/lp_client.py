from llama_parse import LlamaParse
from loguru import logger
from src.configuration import config


class LlamaParseClient:
    def __init__(self, auto_mode=True):
        self.api_key = config.LLAMA_CLOUD_API_KEY
        self.client = LlamaParse(
            api_key=self.api_key, auto_mode=auto_mode, split_by_page=False
        )

    def process_document(self, file_path, extra_info):
        """Process one document using LlamaParse"""
        doc = None
        logger.info(f"Processing {file_path}")
        doc = self.client.load_data(file_path, extra_info=extra_info)
        logger.info(f"Processed {file_path}")
        return doc

    def process_documents(self, file_paths, extra_infos):
        """Process multiple documents using LlamaParse"""
        documents = []
        logger.info("Processing documents")
        for file_path, extra_info in zip(file_paths, extra_infos):
            logger.info(f"Processing {file_path}")
            doc = self.client.load_data(file_path, extra_info=extra_info)
            logger.info(f"Processed {file_path}")
            documents.extend(doc)
        return documents
