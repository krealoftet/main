"""Decompose a raw action log into structured, named steps via Claude."""
from __future__ import annotations

import json

from rich.console import Console

from agent.llm import ask_json
from agent.models import Action, Step, Task

console = Console()

SYSTEM_PROMPT = """\
You are a browser automation expert. You will receive a raw log of browser \
actions recorded from a user.
Your job is to:
1. Group the actions into logical, named steps
2. Give each step a clear snake_case name and a plain-English description
3. Identify any values that might change between runs (search terms, dates, \
filenames) and replace them with {{variable_name}} placeholders
4. Return ONLY valid JSON matching the schema provided. No explanation text."""

TASK_SCHEMA = """\
{
  "task_name": "<string>",
  "description": "<string>",
  "steps": [
    {
      "step_name": "<snake_case string>",
      "description": "<plain english>",
      "actions": [
        {
          "type": "click|type|navigate|select|wait|scroll",
          "selector": "<CSS or aria selector>",
          "value": "<string or null>",
          "url": "<page URL>",
          "timestamp": 0
        }
      ],
      "variables": ["<variable_name>"]
    }
  ],
  "variables": ["<all unique variable names>"]
}"""


def decompose(
    raw_actions: list[dict],
    task_name: str,
    description: str = "",
) -> Task:
    """Send *raw_actions* to Claude and return a structured :class:`Task`."""
    console.print("[bold cyan]Decomposing recording with Claude…[/]")

    prompt = (
        f"Task name: {task_name}\n"
        f"User description: {description or '(none provided)'}\n\n"
        f"Raw action log ({len(raw_actions)} actions):\n"
        f"```json\n{json.dumps(raw_actions, indent=2)}\n```\n\n"
        f"Return a JSON object matching this schema:\n{TASK_SCHEMA}"
    )

    data = ask_json(prompt, system=SYSTEM_PROMPT)

    steps: list[Step] = []
    for s in data.get("steps", []):
        actions = [Action(**a) for a in s.get("actions", [])]
        steps.append(
            Step(
                step_name=s["step_name"],
                description=s.get("description", ""),
                actions=actions,
                variables=s.get("variables", []),
            )
        )

    all_vars = sorted(set(data.get("variables", [])))

    task = Task(
        task_name=task_name,
        description=data.get("description", description),
        steps=steps,
        variables=all_vars,
        raw_recording_path=f"tasks/raw_{task_name}.json",
    )

    console.print(
        f"[bold green]Decomposition complete.[/] "
        f"{len(steps)} steps, {len(all_vars)} variable(s) detected."
    )
    return task
