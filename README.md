# Kit 🏵️

![Electron](https://img.shields.io/badge/Electron-40%2B-47848F?style=flat-square&logo=electron&logoColor=white) ![Node](https://img.shields.io/badge/Node.js-20%2B-brightgreen?style=flat-square&logo=node.js&logoColor=white) [![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE) ![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux-lightgrey?style=flat-square) [![Build & Release](https://github.com/raiyanyahya/Kit/actions/workflows/build.yml/badge.svg)](https://github.com/raiyanyahya/Kit/actions/workflows/build.yml)

**Your entire dev environment. One window. AI woven through everything.**

Kit is not another Electron wrapper with a chat sidebar. It's a ground-up rethink of what a developer workspace looks like when AI is not a feature you reach for — it's the nervous system connecting every tool you already use. The editor, browser, terminal, git, email, calendar, whiteboard, and an autonomous agent all share context. Nothing is siloed. Everything talks to everything.

Built by a developer who got tired of alt-tabbing between twelve apps to do one thing.

![Kit workspace](MediaAssets/KitLanding.png)

---

## Why Kit?

Every developer workflow is secretly the same: you write code in one window, look up docs in another, run commands in a third, manage git in a fourth, and your AI assistant lives in a fifth tab that knows nothing about any of the others. The context switching is relentless and the cost is invisible — until you add it up.

Kit is built on one idea: **the workspace should think with you, not just sit there.** When you open a file, the AI knows. When you browse a doc, the AI can read it. When you give the agent a task, it uses your actual project — not a blank slate. The tools aren't just co-located. They're connected.

And it's built to be extended. The agent tool system is explicit and composable. The pipeline runner is modular. The project rules system lets any codebase teach Kit how to behave. Fork it, extend it, wire in whatever you need — the architecture stays out of your way.

---

## 🔩 What's inside

### ✏️ Code Editor

A full editor built on CodeMirror 6 — the same engine powering CodeSandbox, Replit, and the next generation of browser-based IDEs. Syntax highlighting for every major language out of the box. Multi-tab support so you work across files without closing anything. Configurable font size, tab width, and line wrap. A dirty-state dot on each tab so you always know what's unsaved.

**Auto-save** with a configurable interval. **Session restore** — reopen Kit and pick up exactly where you left off, same files, same tabs. **Markdown live preview** with a draggable split-pane that hot-reloads as you type. **F12 jump to definition** — press it on any symbol and Kit finds where it's defined and jumps there. **Ctrl+Shift+P command palette** for everything else — open files, trigger AI actions, toggle settings, all from the keyboard.

The status bar runs three AI actions on the current file without leaving the editor:
- **Summarise** — explains what the file does in plain English, key functions, inputs, outputs, dependencies
- **Check for errors** — a strict code review pass: bugs, edge cases, security pitfalls, style issues, with line numbers
- **Generate tests** — writes comprehensive unit tests with setup, teardown, edge cases, mocks, and the right framework for the language

---

### 🌐 Browser

A real Chromium browser inside the workspace. Not a webview wrapper — a full browser with an address bar, tab bar, navigation history, and bookmarks. Use it for docs, research, localhost, web apps, anything you'd normally open Chrome for.

The browser toolbar carries four AI-powered actions:

- **Summarise page** — reads the full text of the current page and opens a summary in a detached result window. Works on any page, any length
- **Extract text** — pulls the raw readable text from the page into a result window, useful for copying, processing, or feeding to other tools
- **Screenshot** — captures the current page as an image and opens it in a result window
- **Bookmark** — saves the current tab to your bookmarks, visible in the sidebar and available as AI context

The AI assistant in the terminal reads the page you're currently browsing as live context. Ask it a question about the docs you have open — no copy-pasting, no tab-switching. The browser and the AI are genuinely aware of each other.

---

### 💻 Terminal

A full terminal. Every system command runs — `git push`, `npm install`, `docker compose up`, `python train.py`, anything your shell can do. Output streams line by line as it arrives. Long-running processes show progress in real time. `Ctrl+C` kills any running process, including nested ones.

Type `help` to see everything available:

**Navigation & files**
```
pwd                     Show current directory
cd <path>               Change directory
ls [path]               List files
open <file>             Open file in editor  (also: e, edit, vi)
close                   Close current file
```

**Environment**
```
export VAR=value        Set environment variable
unset VAR               Remove environment variable
env VAR                 View environment variable
```

**AI — full capabilities, live context**
```
/ai <prompt>                    Ask anything — AI sees your open file, browser page, calendar, bookmarks
/ai <prompt> --file             Include the current file as context
/ai <prompt> --path <p>         Include files from a specific path
/ai <prompt> --model <name>     Use a specific model for this request
```

**Code generation & review**
```
/ai code <description>          Generate code from a description
/ai complete --file             Complete the current function or class
/ai explain --file              Plain-English explanation of the current file
/ai fix <error> --file          Fix a specific bug or error
/ai test --file                 Generate unit tests
/ai refactor --file             Improve structure without changing behaviour
/ai optimize --file             Optimise for performance
/ai document --file             Generate documentation
/ai review --file               Full code review with suggestions
/ai convert <language> --file   Convert the file to another language
```

The AI in the terminal has full conversation memory for the session. It remembers what you said earlier, what file you had open, what you were browsing. Switch models mid-conversation with `--model`. Every request is context-aware by default — the AI knows your current working directory, open file, browser URL, calendar events, and saved bookmarks without you having to mention any of it.

Models update automatically when new versions are released.

---

### 🔀 Git Panel

A full visual git interface — no terminal required for the common path. See your current branch, commit SHA, modified files, untracked files, and how far ahead or behind the remote you are. Stage individual files or everything at once with a checkbox. Write your commit message and commit. Pull. Push. All from a modal that opens with `Ctrl+Shift+G` or a click on the git badge in the status bar.

The status bar git badge updates every 3 seconds and reflects real state — branch name, short SHA, ahead/behind count, modified file count, untracked file count. It only runs when you're in a git repository, so there's no background noise in non-git directories.

For anything outside the common path, the terminal is always right there.

---

### 🤖 Kit Agent

An autonomous AI agent you give tasks to in plain English. Not a chat window. Not autocomplete. An actual agent that thinks, plans, and acts — in a loop, with tools, until the task is done.

**What it can do:**

Tell it: *"Scaffold a REST API with authentication in Express, add rate limiting, and write tests"* — it creates every file, installs the dependencies, writes the code, and reports what it built.

Tell it: *"Find all the TODO comments across this project, group them by urgency, and write a summary"* — it searches every file, reads the results, and gives you a structured report.

Tell it: *"The auth token isn't expiring correctly in auth.js — read it, find the bug, and fix it"* — it reads the file, locates the issue, writes the fix, and explains the change.

**Five tools the agent uses autonomously:**

| Tool | What it does |
|---|---|
| `read_file` | Read any file — always runs silently |
| `write_file` | Write or overwrite a file — asks permission first |
| `list_dir` | List directory contents — always runs silently |
| `run_command` | Execute any shell command — asks permission first |
| `search_project` | Full-text grep across the project — always runs silently |

**Permission model** — before any file write or shell command executes, Kit shows you exactly what the agent is about to do and asks:
- **Allow once** — run this specific action, ask again next time
- **Allow all** — blanket-approve this type of action for the rest of the session
- **Deny** — skip it, the agent adapts

Permissions reset at the start of each new task. You're always in control.

**Project rules** — drop a `.kitrules` or `AGENT.md` file into any project folder. The agent reads it at the start of every task: your coding conventions, architecture decisions, what not to touch, preferred libraries. The agent follows them strictly without being told twice.

Works with both OpenAI and Anthropic. Pick the model that fits the task. Models update automatically when new versions are released.

---

### 🪜 Stairs — Workflow Automation

A visual pipeline builder for turning repetitive multi-step work into one-click automations. Build a workflow once, name it, run it forever.

Chain four step types in any order:

- **⚡ AI** — send a prompt to any model; reference previous step output with `{{prev_step.output}}`
- **🖥 Shell** — run any command, pipe outputs between steps
- **🌐 HTTP** — GET, POST, PUT, PATCH, DELETE with optional JSON body and headers
- **📄 File** — read, write, or append to any file on disk

Each step shows its output inline as it runs. Stop mid-run if something looks wrong. Every step output feeds the next — the whole pipeline is connected.

**Example workflows:**
- Fetch data from an API → summarise with Claude → write to a daily report file
- Run your test suite → if failures exist, draft an incident summary → write to a log
- Read a log file → ask the AI to find anomalies → append findings to a briefing
- Call a webhook → transform the response with a shell command → write the result to disk

---

### 🎨 Whiteboard

A freehand drawing canvas for thinking in shapes. When words aren't enough — when you need to sketch an architecture, map out a flow, or just think visually — it's one keystroke away (`Ctrl+W`) and one keystroke back.

**Tools:** pen, rectangle, ellipse, arrow, text, sticky notes, image upload, eraser, select and move
**Mind map mode** for connected node trees and brainstorming
**Colour picker** for every element
**Undo / redo** with `Ctrl+Z` / `Ctrl+Y`
**Auto-save** — your board persists across sessions without doing anything
**Screenshot export** — capture the board as an image

---

### 📁 Sidebar & Starred Folders

The sidebar shows your project file tree and updates live as files change. Hover any folder in the tree and star it — that folder becomes your **default landing directory**. The next time you open Kit, the terminal, sidebar, and git panel all open there automatically. One click on the star button in the toolbar jumps back to it at any time.

Bookmarks from the browser live in the sidebar too — saved URLs with favicons, accessible without switching modes.

---

### 🔍 Project Search

`Ctrl+K` opens full-text search across your entire project — file names and file contents simultaneously. Results appear as you type. Arrow keys to navigate, Enter to open — jumps directly to the matching line in the editor. No configuration, no indexing, no waiting.

---

### 📧 Email

A full IMAP/SMTP email client. Configure once — works with Gmail, Fastmail, Outlook, or any standard provider. Read threads, reply, compose, send, mark as read, move to trash. Your inbox without leaving your workspace.

---

### 📅 Calendar

A local event manager. Create events, set dates and times, see what's coming. Everything stored in `~/.Kit/calendar.json` — no accounts, no sync, no cloud. Your schedule in the same window as your work, and available as context to the AI.

---

## 🔌 Built to be extended

Kit is designed to grow. The agent tool system is a small, explicit set of composable functions — adding a new tool means writing one case in a switch and registering it. The Stairs step runner is modular by design. Project rules mean the agent adapts to any codebase without touching the source.

The surface area is intentionally small. Fork it. Add a tool. Wire in a new AI provider. Build a new step type for Stairs. The architecture gets out of your way.

---

## ⌨️ Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Project search |
| `Ctrl+S` | Save file |
| `Ctrl+D` | Toggle dark / light theme |
| `Ctrl+E` | Toggle sidebar |
| `Ctrl+B` | Browser |
| `Ctrl+W` | Whiteboard |
| `Ctrl+M` | Email |
| `Ctrl+0` | Back to editor |
| `Ctrl+Shift+A` | Kit Agent |
| `Ctrl+Shift+R` | Stairs |
| `Ctrl+Shift+P` | Command palette |
| `F12` | Jump to definition |
| `Ctrl+Z` | Undo (whiteboard) |
| `Ctrl+Y` | Redo (whiteboard) |

---

## 🚀 Install

Download the latest release for your platform from the [Releases](https://github.com/raiyanyahya/Kit/releases) page.

**macOS** — download the `.dmg`, open it, drag Kit to Applications, run it.

**Linux** — download the `.AppImage`, make it executable, run it:
```bash
chmod +x Kit-*.AppImage
./Kit-*.AppImage
```

On first launch, click the key icon in the status bar and add your OpenAI or Anthropic API key. Everything else is already there.

---

## 🛠 Build from source

```bash
git clone https://github.com/raiyanyahya/Kit.git
cd Kit
npm install
npm start
```

---

## 🗂️ Workspace

```
~/.Kit/
├── projects/        agent-created projects
├── notes/           text notes and documents
├── data/            data files and datasets
├── scratch/         quick experiments
├── boards/          whiteboard saves
├── stairs/          saved workflows
└── calendar.json    calendar events
```

---

*Kit is for developers who want their tools to think with them.*

*If Kit is useful to you, a ⭐ goes a long way — it helps more people find it.*

---

<a target="_blank" href="https://icons8.com/icon/uSfbRTf3kxH4/seed-of-life">mandala</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
