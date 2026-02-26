from __future__ import annotations

import json
from pathlib import Path

from agent.models import Task

TASKS_DIR = Path(__file__).resolve().parent.parent / "tasks"


def _ensure_dirs() -> None:
    TASKS_DIR.mkdir(parents=True, exist_ok=True)
    (TASKS_DIR / "logs").mkdir(exist_ok=True)


def save_task(task: Task) -> Path:
    """Persist a Task to ``tasks/{task_name}.json``."""
    _ensure_dirs()
    path = TASKS_DIR / f"{task.task_name}.json"
    path.write_text(task.model_dump_json(indent=2), encoding="utf-8")
    return path


def load_task(task_name: str) -> Task:
    """Load a Task from disk by name."""
    path = TASKS_DIR / f"{task_name}.json"
    if not path.exists():
        raise FileNotFoundError(f"Task '{task_name}' not found at {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    return Task(**data)


def list_tasks() -> list[str]:
    """Return the names of all saved tasks."""
    _ensure_dirs()
    return sorted(
        p.stem for p in TASKS_DIR.glob("*.json") if not p.stem.startswith("raw_")
    )


def delete_task(task_name: str) -> None:
    """Delete a task file (and its raw recording if present)."""
    task_path = TASKS_DIR / f"{task_name}.json"
    raw_path = TASKS_DIR / f"raw_{task_name}.json"
    if not task_path.exists():
        raise FileNotFoundError(f"Task '{task_name}' not found")
    task_path.unlink()
    if raw_path.exists():
        raw_path.unlink()


def update_task(task_name: str, task: Task) -> Path:
    """Overwrite an existing task. Raises if the task doesn't exist."""
    path = TASKS_DIR / f"{task_name}.json"
    if not path.exists():
        raise FileNotFoundError(f"Task '{task_name}' not found")
    path.write_text(task.model_dump_json(indent=2), encoding="utf-8")
    return path


def save_raw_recording(task_name: str, actions: list[dict]) -> Path:
    """Save the raw action log from a recording session."""
    _ensure_dirs()
    path = TASKS_DIR / f"raw_{task_name}.json"
    path.write_text(json.dumps(actions, indent=2), encoding="utf-8")
    return path


def load_raw_recording(task_name: str) -> list[dict]:
    """Load a previously saved raw recording."""
    path = TASKS_DIR / f"raw_{task_name}.json"
    if not path.exists():
        raise FileNotFoundError(f"Raw recording for '{task_name}' not found at {path}")
    return json.loads(path.read_text(encoding="utf-8"))
