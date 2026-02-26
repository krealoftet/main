"""Record browser actions via a headed Playwright session.

Launches a Chromium window and tracks every user interaction (navigation,
clicks, typing, selects, scrolls).  When the user closes the browser the
raw action list is returned and persisted.
"""
from __future__ import annotations

import os
import time

from playwright.async_api import async_playwright, Page, BrowserContext
from rich.console import Console
from rich.panel import Panel

from agent.models import Action
from agent.task_store import save_raw_recording

console = Console()


def _browser_type_name() -> str:
    return os.getenv("DEFAULT_BROWSER", "chromium")


def _slow_mo() -> int:
    return int(os.getenv("SLOW_MO", "50"))


async def record(task_name: str) -> list[dict]:
    """Open a browser window, record all user actions, and return them.

    The function blocks until the user closes the browser.
    """
    actions: list[dict] = []

    console.print(
        Panel(
            "[bold cyan]Recording started![/]\n\n"
            "Interact with the browser normally.\n"
            "[bold yellow]Close the browser window when you are done.[/]",
            title="Browser Recorder",
            border_style="cyan",
        )
    )

    async with async_playwright() as pw:
        browser_type = getattr(pw, _browser_type_name())
        browser = await browser_type.launch(headless=False, slow_mo=_slow_mo())
        context: BrowserContext = await browser.new_context()
        page: Page = await context.new_page()

        await page.goto("about:blank")

        def _make_action(action_type: str, page: Page, **kwargs: str | None) -> dict:
            a = Action(
                type=action_type,
                selector=kwargs.get("selector", ""),
                value=kwargs.get("value"),
                url=page.url,
                timestamp=time.time(),
            )
            return a.model_dump()

        async def _on_navigation(frame):
            if frame == page.main_frame:
                entry = _make_action("navigate", page, value=page.url)
                actions.append(entry)
                console.print(f"  [dim]navigate → {page.url}[/]")

        page.on("framenavigated", _on_navigation)

        await _install_interaction_hooks(page, actions)

        # Re-install hooks on every new page opened in the context
        context.on("page", lambda p: _setup_new_page(p, actions))

        try:
            await page.wait_for_event("close", timeout=0)
        except Exception:
            pass

        # Collect actions from any remaining pages
        for p in context.pages:
            try:
                await p.close()
            except Exception:
                pass
        await browser.close()

    console.print(
        f"\n[bold green]Recording complete.[/] Captured [bold]{len(actions)}[/] actions."
    )

    save_raw_recording(task_name, actions)
    return actions


async def _install_interaction_hooks(page: Page, actions: list[dict]) -> None:
    """Inject a JS listener that posts messages back for clicks / input / select."""
    await page.expose_function(
        "__ba_report",
        lambda data: _js_event_callback(data, page, actions),
    )

    await page.add_init_script("""
        (() => {
            function bestSelector(el) {
                if (el.id) return '#' + el.id;
                if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
                if (el.getAttribute('aria-label')) return `[aria-label="${el.getAttribute('aria-label')}"]`;
                if (el.name) return `[name="${el.name}"]`;
                const tag = el.tagName.toLowerCase();
                const text = el.textContent?.trim().slice(0, 40);
                if (text) return `${tag}:has-text("${text}")`;
                return tag;
            }

            document.addEventListener('click', (e) => {
                window.__ba_report({type: 'click', selector: bestSelector(e.target), value: null});
            }, true);

            document.addEventListener('change', (e) => {
                const el = e.target;
                const sel = bestSelector(el);
                if (el.tagName === 'SELECT') {
                    window.__ba_report({type: 'select', selector: sel, value: el.value});
                } else if (el.type === 'checkbox' || el.type === 'radio') {
                    window.__ba_report({type: 'click', selector: sel, value: String(el.checked)});
                } else {
                    window.__ba_report({type: 'type', selector: sel, value: el.value});
                }
            }, true);

            let _scrollTimer = null;
            document.addEventListener('scroll', () => {
                clearTimeout(_scrollTimer);
                _scrollTimer = setTimeout(() => {
                    window.__ba_report({
                        type: 'scroll',
                        selector: 'window',
                        value: `${window.scrollX},${window.scrollY}`
                    });
                }, 300);
            }, true);
        })();
    """)


def _js_event_callback(data: dict, page: Page, actions: list[dict]) -> None:
    a = Action(
        type=data.get("type", "click"),
        selector=data.get("selector", ""),
        value=data.get("value"),
        url=page.url,
        timestamp=time.time(),
    )
    actions.append(a.model_dump())
    label = data.get("type", "?")
    sel = data.get("selector", "")[:60]
    console.print(f"  [dim]{label} → {sel}[/]")


async def _setup_new_page(page: Page, actions: list[dict]) -> None:
    """Hook events on dynamically opened pages (popups, new tabs)."""
    try:
        await _install_interaction_hooks(page, actions)
    except Exception:
        pass
