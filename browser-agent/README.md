# Browser Automation Agent

A local Python-based browser automation agent that **records** your browser actions, **decomposes** them into reusable steps with an LLM, and **replays** them on demand — in a separate browser window — while you work on other things.

## Quick Start

### 1. Install dependencies

```bash
cd browser-agent
pip install -r requirements.txt
playwright install chromium
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Record your first task

```bash
python cli.py record --name "weekly_report"
```

A Chromium window opens. Do whatever you normally do (log in, click around, fill forms). When you're done, **close the browser window**. The agent will:

1. Save the raw action log
2. Send it to Claude to decompose into named steps
3. Save the structured task to `tasks/weekly_report.json`

### 4. Run a task

```bash
python cli.py run weekly_report
```

A new browser opens and replays your recorded steps automatically.

### 5. Run with variables

If Claude detected variable placeholders during decomposition (e.g. a search term), you can override them at runtime:

```bash
python cli.py run weekly_report --var search_term="Q4 2025" --var date="2025-12-01"
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `python cli.py record --name "task_name"` | Record a new task |
| `python cli.py run "task_name"` | Execute a saved task |
| `python cli.py run "task_name" --var key=value` | Execute with variable substitution |
| `python cli.py run "task_name" --dry-run` | Preview steps without executing |
| `python cli.py list` | List all saved tasks |
| `python cli.py show "task_name"` | Show task steps in detail |
| `python cli.py edit "task_name"` | Re-decompose from raw recording |
| `python cli.py delete "task_name"` | Delete a task |

## How Variables Work

During decomposition, Claude identifies values that might change between runs — search terms, dates, filenames — and replaces them with `{{variable_name}}` placeholders.

When you run a task, pass `--var name=value` for each variable. Any `{{name}}` in selectors or action values is replaced with `value` at execution time.

Unset variables trigger a warning but don't block execution — the raw placeholder stays in place.

## Project Structure

```
browser-agent/
├── .env                  # API keys (not committed)
├── .env.example          # Template
├── requirements.txt
├── README.md
├── agent/
│   ├── models.py         # Pydantic data models (Action, Step, Task)
│   ├── recorder.py       # Playwright-based browser recording
│   ├── decomposer.py     # Claude-powered step decomposition
│   ├── executor.py       # Browser task execution engine
│   ├── task_store.py     # JSON file persistence
│   └── llm.py            # Anthropic Claude API wrapper
├── tasks/                # Saved task JSON files
│   └── logs/             # Execution logs
├── cli.py                # Typer CLI
└── server.py             # FastAPI server (for future use)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Your Anthropic API key (required) |
| `DEFAULT_BROWSER` | `chromium` | Browser engine: `chromium`, `firefox`, or `webkit` |
| `HEADLESS` | `false` | Run browser in headless mode |
| `SLOW_MO` | `50` | Delay in ms between actions (helps stability) |

## API Server (optional)

For programmatic access or future UI integration:

```bash
python server.py
# Runs on http://127.0.0.1:8000
```

Endpoints:

- `GET /tasks` — list all tasks
- `GET /tasks/{name}` — get task details
- `POST /run/{name}` — trigger a task (accepts `{"variables": {...}}`)
