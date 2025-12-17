"""Logging configuration for ArchiMate MCP server."""

import sys
from typing import Optional

from loguru import logger


def setup_logging(
    level: str = "INFO",
    format_string: Optional[str] = None,
    file_path: Optional[str] = None,
) -> None:
    """Setup logg