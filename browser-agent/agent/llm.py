from __future__ import annotations

import json
import os
import time

import anthropic
from dotenv import load_dotenv

load_dotenv()

_client: anthropic.Anthropic | None = None

MODEL = "claude-sonnet-4-6"
MAX_RETRIES = 3
BACKOFF_BASE = 2.0


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. "
                "Copy .env.example to .env and add your key."
            )
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def ask(prompt: str, system: str = "") -> str:
    """Single-turn Claude call. Returns the text response."""
    client = _get_client()
    for attempt in range(MAX_RETRIES):
        try:
            kwargs: dict = {
                "model": MODEL,
                "max_tokens": 4096,
                "messages": [{"role": "user", "content": prompt}],
            }
            if system:
                kwargs["system"] = system
            response = client.messages.create(**kwargs)
            return response.content[0].text
        except anthropic.RateLimitError:
            if attempt == MAX_RETRIES - 1:
                raise
            wait = BACKOFF_BASE ** (attempt + 1)
            time.sleep(wait)
    return ""


def ask_json(prompt: str, system: str = "") -> dict:
    """Call Claude and parse the response as JSON.

    If the first attempt returns invalid JSON, retries once with a stricter
    prompt that asks for *only* valid JSON with no surrounding text.
    """
    raw = ask(prompt, system)

    text = raw.strip()
    if text.startswith("```"):
        first_newline = text.index("\n")
        text = text[first_newline + 1:]
        if text.endswith("```"):
            text = text[:-3].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        stricter = (
            "Your previous response was not valid JSON. "
            "Return ONLY a raw JSON object — no markdown fences, no explanation, "
            "no trailing commas. Start with { and end with }.\n\n"
            f"Original request:\n{prompt}"
        )
        raw = ask(stricter, system)
        text = raw.strip()
        if text.startswith("```"):
            first_newline = text.index("\n")
            text = text[first_newline + 1:]
            if text.endswith("```"):
                text = text[:-3].strip()
        return json.loads(text)
