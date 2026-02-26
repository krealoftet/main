"""Lightweight FastAPI server — scaffold for future UI / webhook triggers."""
from __future__ import annotations

import asyncio

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from agent.executor import execute
from agent.task_store import list_tasks, load_task

app = FastAPI(title="Browser Automation Agent", version="0.1.0")


class RunRequest(BaseModel):
    variables: dict[str, str] = {}


@app.get("/tasks")
async def get_tasks():
    """List all saved tasks."""
    names = list_tasks()
    return {"tasks": names}


@app.get("/tasks/{task_name}")
async def get_task(task_name: str):
    """Return the full JSON definition of a task."""
    try:
        task = load_task(task_name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Task '{task_name}' not found")
    return task.model_dump()


@app.post("/run/{task_name}")
async def run_task(task_name: str, body: RunRequest | None = None):
    """Trigger execution of a task.

    This is a fire-and-forget endpoint — Playwright opens a headed browser
    so the result isn't returned synchronously.
    """
    try:
        task = load_task(task_name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Task '{task_name}' not found")

    variables = body.variables if body else {}

    loop = asyncio.get_event_loop()
    loop.create_task(_run_in_background(task, variables))

    return {
        "status": "started",
        "task": task_name,
        "variables": variables,
    }


async def _run_in_background(task, variables):
    try:
        await execute(task, variables=variables)
    except Exception as exc:
        print(f"[server] Task '{task.task_name}' failed: {exc}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
