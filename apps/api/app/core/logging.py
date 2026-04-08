import sys

from loguru import logger


def setup_logging():
    logger.remove()
    logger.add(sys.stderr, format="{time} {level} {message}", level="INFO")
    logger.add("logs/api.log", rotation="10 MB", retention="7 days")
