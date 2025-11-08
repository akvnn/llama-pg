from typing import Annotated
from pydantic import BaseModel, Field, field_validator
import re


class RAGRequest(BaseModel):
    project_id: str
    organization_id: str
    query: str
    system_prompt: str | None = None
    limit: Annotated[
        int, Field(default=3, ge=1, description="Number of results to return")
    ]

    @field_validator("system_prompt")
    @classmethod
    def sanitize_system_prompt(cls, v: str) -> str:
        max_length = 5000
        if len(v) > max_length:
            raise ValueError(
                f"System prompt exceeds maximum length of {max_length} characters"
            )

        sanitized = cls._remove_dangerous_patterns(v)

        sanitized = cls._remove_html_tags(sanitized)

        return sanitized.strip()

    @staticmethod
    def _remove_dangerous_patterns(text: str) -> str:
        """Remove potentially dangerous instruction patterns"""
        dangerous_patterns = [
            # Prompt injection attempts
            r"ignore\s+(all\s+)?(previous|above|prior)\s+instructions?",
            r"disregard\s+(all\s+)?(previous|above|prior)",
            r"forget\s+(all\s+)?(previous|above|prior)",
            r"new\s+instructions?:",
            r"system\s*:\s*you\s+are",
            # Role manipulation
            r"you\s+are\s+now",
            r"act\s+as\s+if",
            r"pretend\s+(you\s+are|to\s+be)",
            # Information disclosure attempts
            r"show\s+me\s+(your|the)\s+(system\s+)?prompt",
            r"what\s+(is|are)\s+your\s+instructions",
            r"reveal\s+your",
            # XML/special tags that might interfere
            r"<\s*/?system\s*>",
            r"<\s*/?user\s*>",
            r"<\s*/?assistant\s*>",
        ]

        result = text
        for pattern in dangerous_patterns:
            result = re.sub(pattern, "", result, flags=re.IGNORECASE)

        return result

    @staticmethod
    def _remove_html_tags(text: str) -> str:
        """Remove HTML tags and script content"""
        # Remove script tags and content
        text = re.sub(
            r"<script[^>]*>.*?</script>", "", text, flags=re.DOTALL | re.IGNORECASE
        )
        # Remove other HTML tags
        text = re.sub(r"<[^>]+>", "", text)
        return text
