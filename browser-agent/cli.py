"""Browser Automation Agent — CLI entry point."""
from __future__ import annotations

import asyncio
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from agent.decomposer import decompose
from agent.executor import execute
from agent.recorder import record
from agent.task_store import (
    delete_task,
    list_tasks,
    load_raw_recording,
    load_task,
    save_task,
    update_task,
)

app = typer.Typer(
    name="browser-agent",
    help="Record, decompose, and replay browser automation tasks.",
    add_completion=False,
)
console = Console()


@app.command()
def record_task(
    name: str = typer.Option(..., "--name", "-n", help="Name for the new task"),
    description: str = typer.Option("", "--desc", "-d", help="Short description of the task"),
):
    """Launch a browser, record your actions, decompose with Claude, and save."""
    console.print(Panel(f"[bold]Recording task:[/] {name}", border_style="green"))

    raw_actions = asyncio.run(record(name))
    if not raw_actions:
        console.print("[yellow]No actions recorded. Aborting.[/]")
        raise typer.Exit(1)

    task = decompose(raw_actions, task_name=name, description=description)
    path = save_task(task)
    console.print(f"\n[bold green]Task saved to {path}[/]")


@app.command()
def run(
    name: str = typer.Argument(help="Name of the task to run"),
    var: Optional[list[str]] = typer.Option(None, "--var", "-v", help="key=value variable overrides"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Print steps without executing"),
):
    """Execute a saved task in a new browser window."""
    variables: dict[str, str] = {}
    for v in var or []:
        if "=" not in v:
            console.print(f"[red]Invalid variable format:[/] {v}  (expected key=value)")
            raise typer.Exit(1)
        key, val = v.split("=", 1)
        variables[key] = val

    task = load_task(name)
    asyncio.run(execute(task, variables=variables, dry_run=dry_run))


@app.command("list")
def list_cmd():
    """List all saved tasks."""
    names = list_tasks()
    if not names:
        console.print("[dim]No tasks found.[/]")
        return

    table = Table(title="Saved Tasks")
    table.add_column("Task Name", style="bold cyan")
    table.add_column("Description")
    table.add_column("Steps", justify="right")
    table.add_column("Variables")

    for n in names:
        try:
            t = load_task(n)
            table.add_row(
                t.task_name,
                t.description[:80],
                str(len(t.steps)),
                ", ".join(t.variables) if t.variables else "—",
            )
        except Exception:
            table.add_row(n, "[red]error loading[/]", "?", "?")

    console.print(table)


@app.command()
def show(name: str = typer.Argument(help="Name of the task to display")):
    """Print the structured steps of a task."""
    task = load_task(name)

    console.print(
        Panel(
            f"[bold]{task.task_name}[/]\n{task.description}\n\n"
            f"Created: {task.created_at}\n"
            f"Variables: {', '.join(task.variables) or '(none)'}",
            title="Task Details",
            border_style="cyan",
        )
    )

    for i, step in enumerate(task.steps, 1):
        console.print(f"\n[bold white on blue] Step {i}: {step.step_name} [/]")
        console.print(f"  {step.description}")
        if step.variables:
            console.print(f"  [dim]Variables: {', '.join(step.variables)}[/]")
        for action in step.actions:
            val = f" = {action.value}" if action.value else ""
            console.print(f"    [dim]{action.type:10s}[/] {action.selector}{val}")


@app.command()
def edit(name: str = typer.Argument(help="Name of the task to re-decompose")):
    """Re-run Claude decomposition on an existing raw recording."""
    raw_actions = load_raw_recording(name)
    old_task = load_task(name)

    console.print(f"[cyan]Re-decomposing '{name}' ({len(raw_actions)} raw actions)…[/]")
    new_task = decompose(raw_actions, task_name=name, description=old_task.description)
    update_task(name, new_task)
    console.print(f"[bold green]Task '{name}' updated.[/]")


@app.command()
def delete(name: str = typer.Argument(help="Name of the task to delete")):
    """Delete a saved task and its raw recording."""
    delete_task(name)
    console.print(f"[bold green]Task '{name}' deleted.[/]")


if __name__ == "__main__":
    app()
