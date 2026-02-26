from __future__ import annotations

from datetime import datetime, timezone
from pydantic import BaseModel, Field


class Action(BaseModel):
    type: str = Field(description="click, type, navigate, select, wait, scroll")
    selector: str = Field(default="", description="CSS selector or aria label")
    value: str | None = Field(default=None, description="Text to type, URL to navigate to, etc.")
    url: str = Field(default="", description="Page URL when the action happened")
    timestamp: float = Field(default_factory=lambda: datetime.now(timezone.utc).timestamp())


class Step(BaseModel):
    step_name: str
    description: str
    actions: list[Action] = Field(default_factory=list)
    variables: list[str] = Field(default_factory=list)


class Task(BaseModel):
    task_name: str
    description: str
    steps: list[Step] = Field(default_factory=list)
    variables: list[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    raw_recording_path: str = ""
