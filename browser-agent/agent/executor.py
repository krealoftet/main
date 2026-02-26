"""Execute a structured Task in a headed Playwright browser."""
from __future__ import annotations

import logging
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path

from playwright.async_api import async_playwright, Page
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from agent.models import Task, Step, Action

console = Console()

TASKS_DIR = Path(__file__).resolve().parent.parent / "tasks"
SELECTOR_TIMEOUT = 10_000  # 10 seconds


def _setup_logger(task_name: str) -> logging.Logger:
    log_dir = TASKS_DIR / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    handler = logging.FileHandler(log_dir / f"{task_name}_{ts}.log")
    handler.setFormatter(logging.Formatter("%(asctime)s  %(levelname)s  %(message)s"))
    logger = logging.getLogger(f"executor.{task_name}")
    logger.setLevel(logging.DEBUG)
    logger.addHandler(handler)
    return logger


def _substitute_variables(text: str | None, variables: dict[str, str]) -> str | None:
    """Replace ``{{var}}`` placeholders with runtime values."""
    if text is None:
        return None
    def _replacer(m: re.Match) -> str:
        name = m.group(1)
        return variables.get(name, m.group(0))
    return re.sub(r"\{\{(\w+)\}\}", _replacer, text)


async def execute(
    task: Task,
    variables: dict[str, str] | None = None,
    dry_run: bool = False,
) -> None:
    """Run every step of *task* in a fresh browser window."""
    variables = variables or {}
    logger = _setup_logger(task.task_name)
    results: list[dict] = []

    missing = [v for v in task.variables if v not in variables]
    if missing:
        console.print(
            f"[bold yellow]Warning:[/] No values supplied for variables: "
            f"{', '.join(missing)}"
        )

    if dry_run:
        _print_dry_run(task, variables)
        return

    console.print(
        Panel(
            f"[bold cyan]Executing task:[/] {task.task_name}\n"
            f"[dim]{task.description}[/]\n"
            f"Steps: {len(task.steps)}  |  Variables: {variables or '(none)'}",
            title="Executor",
            border_style="cyan",
        )
    )

    async with async_playwright() as pw:
        browser_type = getattr(pw, os.getenv("DEFAULT_BROWSER", "chromium"))
        browser = await browser_type.launch(
            headless=os.getenv("HEADLESS", "false").lower() == "true",
            slow_mo=int(os.getenv("SLOW_MO", "50")),
        )
        page: Page = await browser.new_page()

        for step_idx, step in enumerate(task.steps, 1):
            console.print(
                f"\n[bold white on blue] STEP {step_idx}/{len(task.steps)}: "
                f"{step.step_name} [/]"
            )
            console.print(f"  [dim]{step.description}[/]")
            logger.info("Step %d/%d: %s", step_idx, len(task.steps), step.step_name)

            step_ok = True
            for action in step.actions:
                ok = await _run_action(page, action, variables, logger)
                if not ok:
                    step_ok = False
                    if not _ask_continue(step.step_name):
                        console.print("[bold red]Execution aborted by user.[/]")
                        logger.error("Aborted by user at step %s", step.step_name)
                        await browser.close()
                        _print_summary(results)
                        return
                    break  # skip rest of this step

            results.append({"step": step.step_name, "ok": step_ok})

        await browser.close()

    _print_summary(results)


async def _run_action(
    page: Page,
    action: Action,
    variables: dict[str, str],
    logger: logging.Logger,
    retries: int = 1,
) -> bool:
    """Execute a single action. Returns True on success."""
    selector = _substitute_variables(action.selector, variables) or ""
    value = _substitute_variables(action.value, variables)
    a_type = action.type

    for attempt in range(1 + retries):
        try:
            if a_type == "navigate":
                url = value or action.url
                logger.debug("navigate → %s", url)
                await page.goto(url, wait_until="domcontentloaded")
                await page.wait_for_load_state("networkidle", timeout=15_000)

            elif a_type == "click":
                logger.debug("click → %s", selector)
                loc = page.locator(selector).first
                await loc.wait_for(state="visible", timeout=SELECTOR_TIMEOUT)
                await loc.click()

            elif a_type == "type":
                logger.debug("type → %s = %s", selector, value)
                loc = page.locator(selector).first
                await loc.wait_for(state="visible", timeout=SELECTOR_TIMEOUT)
                await loc.fill(value or "")

            elif a_type == "select":
                logger.debug("select → %s = %s", selector, value)
                await page.select_option(selector, value or "")

            elif a_type == "scroll":
                logger.debug("scroll → %s", value)
                if value:
                    x, y = value.split(",")
                    await page.evaluate(f"window.scrollTo({x}, {y})")

            elif a_type == "wait":
                secs = float(value) if value else 1.0
                logger.debug("wait %.1fs", secs)
                time.sleep(secs)

            else:
                logger.warning("Unknown action type: %s", a_type)

            await page.wait_for_load_state("domcontentloaded", timeout=5_000)
            return True

        except Exception as exc:
            logger.warning(
                "Action %s failed (attempt %d): %s", a_type, attempt + 1, exc
            )
            if attempt < retries:
                console.print(f"  [yellow]Retrying {a_type}…[/]")
            else:
                console.print(f"  [bold red]Action failed:[/] {a_type} → {selector}")
                console.print(f"    [red]{exc}[/]")
                return False
    return False


def _ask_continue(step_name: str) -> bool:
    """Prompt the user to skip or abort after a failure."""
    console.print(
        f"\n[bold yellow]Step '{step_name}' had a failure.[/]  "
        "Type [bold]s[/] to skip this step, or [bold]a[/] to abort: ",
        end="",
    )
    try:
        choice = input().strip().lower()
    except (EOFError, KeyboardInterrupt):
        return False
    return choice == "s"


def _print_dry_run(task: Task, variables: dict[str, str]) -> None:
    console.print(Panel("[bold yellow]DRY RUN[/] — no browser will be opened.", border_style="yellow"))
    for i, step in enumerate(task.steps, 1):
        console.print(f"\n[bold]Step {i}: {step.step_name}[/]  [dim]{step.description}[/]")
        for action in step.actions:
            val = _substitute_variables(action.value, variables)
            sel = _substitute_variables(action.selector, variables)
            console.print(f"    {action.type:10s}  {sel or ''}  {val or ''}")


def _print_summary(results: list[dict]) -> None:
    table = Table(title="Execution Summary")
    table.add_column("Step", style="bold")
    table.add_column("Status")
    for r in results:
        status = "[green]OK[/]" if r["ok"] else "[red]FAILED[/]"
        table.add_row(r["step"], status)
    console.print()
    console.print(table)
