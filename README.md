# Kit ✦

**One window. Every tool you need. Nothing you don't.**

Kit is a desktop workspace that replaces the chaos of juggling a code editor, browser, terminal, AI assistant, email client, whiteboard, and automation tool across a dozen separate windows. It brings everything into a single, fast, keyboard-first application — built for developers, writers, researchers, and anyone who thinks in text and builds things.

Stop switching apps. Start making things.

---

## Why Kit?

Modern creative work is fragmented by design. Your editor is one app. Your browser is another. Your AI chat window is a third tab. Your terminal is a fourth. Your email is somewhere else entirely. Every time you switch, you lose a little thread — a thought, a context, a moment of focus.

Kit is built on a different idea: that your workspace should be a single, coherent place. That the tools you reach for ten times a day should be one keystroke apart, not one alt-tab away. That switching between writing code, asking an AI a question, sketching a diagram, and checking an email should feel like turning your head — not like opening a new application.

Kit is free. Kit is open source. Kit is for everyone who makes things.

---

## What's Inside

### ✏️ Code Editor

A full-featured editor powered by CodeMirror 6. Syntax highlighting for every major language. Multi-tab support so you can work across files without closing anything. Configurable font size, tab width, and line wrap. A dirty-state dot so you always know what's unsaved. Auto-save with a configurable interval. Session restore — come back to exactly where you left off.

Open files from the sidebar, drag them in, type `open <file>` in the terminal, or hit **Ctrl+K** to find anything in your project instantly.

### 🌐 Integrated Browser

A real Chromium browser built into your workspace. Not a webview wrapper — a full browser with an address bar, tab bar, bookmarks, and navigation history. Use it for documentation, research, web apps, or anything you'd normally open in a separate window.

And here's where it gets interesting: the AI assistant reads the page you're looking at. Ask the AI a question about what you're currently reading and it answers in context — no copy-pasting, no tab-switching. The browser and the AI are aware of each other.

### 💻 Terminal

A keyboard-native terminal with real shell fallback. Type any system command and it runs — `git push`, `npm install`, `python script.py`, anything. Output streams live as it arrives, line by line. Long-running commands show progress in real time.

Built-in commands so common things are instant:

```
cd <path>         Change directory
ls [path]         List files
open <file>       Open in editor
pwd               Current directory
export VAR=val    Set environment variable
clear             Clear output
help              Show all commands
```

The terminal tracks your working directory and keeps it in sync with the sidebar. Branch name, commit SHA, and git status show in the status bar automatically.

### 🔀 Git Panel

A full visual git interface. See your current branch, modified files, untracked files, and how far ahead or behind you are. Stage individual files or everything at once. Write a commit message and commit. Pull and push — all without touching the terminal. The status bar updates live as you make changes.

For everything else there's always the terminal right there.

### 🤖 Kit Agent

An autonomous AI agent you give tasks to in plain English. Not a chat window. Not a code autocomplete. An actual agent that thinks, plans, and acts.

Tell it: *"Scaffold a REST API with authentication in Express"* — it creates the files, writes the code, installs dependencies, and tells you what it did.

Tell it: *"Find all the TODO comments in this project and summarise them"* — it reads your files, finds them, and reports back.

Tell it: *"Fix the bug in auth.js where the token doesn't expire"* — it reads the file, understands the bug, writes the fix, and explains the change.

The agent has five tools it can use: **read files**, **write files**, **list directories**, **run shell commands**, and **search across your project**. It uses them autonomously to complete whatever you ask. Supports both OpenAI and Anthropic models — pick whichever you have a key for.

**Project rules:** Drop a `.kitrules` or `AGENT.md` file into any project folder to give the agent standing instructions — your coding conventions, the project's architecture, what not to touch. The agent reads it every time it starts a task in that folder.

### 🪜 Stairs — Workflow Automation

A visual pipeline builder for turning repetitive multi-step work into one-click automations. Chain any combination of four step types:

- **AI** — send a prompt to any model, use the output of previous steps as input with `{{prev_step.output}}`
- **Shell** — run any command, pipe outputs between steps
- **HTTP** — make API requests (GET, POST, PUT, PATCH, DELETE) with optional JSON body
- **File** — read, write, or append to files on disk

Build a workflow once. Name it. Run it again and again with a single click. Each step shows its output inline. Stop mid-run if something looks wrong. Outputs from one step flow into the next — the whole pipeline is connected.

Example workflows: fetch data from an API → summarise with AI → write to a report file. Or: run a test suite → if failures, send yourself an email. Or: read a log file → ask the AI to find anomalies → append findings to a daily briefing.

### 🎨 Whiteboard

A freehand drawing canvas for visual thinking. When words aren't enough — when you need to sketch an architecture, map out a flow, or just think with shapes — the whiteboard is one keystroke away.

**Drawing tools:** pen, rectangle, ellipse, arrow, text, sticky notes, image upload, eraser, select and move
**Mind map mode:** create connected node trees for brainstorming
**Colour picker** for every element
**Undo / redo** (Ctrl+Z / Ctrl+Y)
**Auto-save** — your board persists across sessions
**Screenshot export** — capture your board as an image

Toggle with **Ctrl+W** and go straight back to the editor when you're done.

### 📧 Email Client

A full IMAP/SMTP email client. Configure your inbox once — works with Gmail, Fastmail, Outlook, or any standard provider. Read, reply, compose, send, mark as read, move to trash. Your inbox without leaving your workspace.

Why is email in a code editor? Because context-switching to check email costs more than you think. Having it one keystroke away means you check it intentionally, not reflexively.

### 📅 Calendar

A lightweight event manager for staying on top of what's happening. Create events, set dates and times, see what's coming. Events are stored locally in `~/.Kit/calendar.json` — no accounts, no sync, no cloud. Just your schedule, in your workspace.

### 🧠 Inline AI

The AI assistant is woven through the editor and terminal, not bolted on as a sidebar.

**In the editor status bar:**
- **Check for errors** — scans the current file and explains what's wrong
- **Summarise** — gives you a plain-language summary of what the file does
- **Generate tests** — writes unit tests for the current file

**In the terminal:**
- Prefix any message with `ai` to ask questions in full context
- The AI knows what file you have open, what page you're browsing, and what's in your calendar and bookmarks
- Full conversation memory — it remembers what you said earlier in the session
- Switch models mid-conversation with `--model <name>`
- Include your current file with `--file`, or files from any path with `--path <p>`

**AI commands:**
```
/ai <prompt>                 Ask anything
/ai <prompt> --file          Include current file as context
/ai code <description>       Generate code
/ai explain --file           Explain the current file
/ai fix <error> --file       Fix a bug
/ai test --file              Generate unit tests
/ai refactor --file          Improve code structure
/ai optimize --file          Optimise for performance
/ai document --file          Generate documentation
/ai review --file            Code review
/ai convert <lang> --file    Convert to another language
```

### 🔍 Project Search

**Ctrl+K** opens a fast, full-text search across your entire project. Searches both file names and file contents. Results appear as you type. Navigate with arrow keys, open with Enter — jumps directly to the matching line in the editor. No configuration, no indexing setup, no waiting.

### ⌨️ Command Palette

**Ctrl+Shift+P** opens a command palette for everything else — open files, switch modes, trigger AI actions, toggle settings. Type to filter, arrow keys to navigate, Enter to run. Keyboard-first, always.

---

## AI Models

Kit connects to OpenAI and Anthropic simultaneously. Set keys for one or both — use whatever you have.

| Provider | Models |
|---|---|
| **OpenAI** | gpt-5.4, gpt-5.4-mini, gpt-5.4-nano, gpt-4.1, gpt-4.1-mini, o3, o4-mini |
| **Anthropic** | Claude Opus 4.7, Claude Sonnet 4.6, Claude Haiku 4.5 |

Keys are stored encrypted via Electron's `safeStorage` — never in plain text, never leaving your machine.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| **Ctrl+K** | Project search |
| **Ctrl+S** | Save file |
| **Ctrl+D** | Toggle dark / light theme |
| **Ctrl+E** | Toggle sidebar |
| **Ctrl+B** | Browser |
| **Ctrl+W** | Whiteboard |
| **Ctrl+M** | Email |
| **Ctrl+0** | Back to editor |
| **Ctrl+Shift+A** | Kit Agent |
| **Ctrl+Shift+R** | Stairs |
| **Ctrl+Shift+P** | Command palette |
| **F12** | Jump to definition |
| **Ctrl+Z** | Undo (whiteboard) |
| **Ctrl+Y** | Redo (whiteboard) |

---

## Getting Started

```bash
git clone https://github.com/raiyanyahya/Kit.git
cd Kit
npm install
npm start
```

On first launch, click the key icon in the status bar and add your OpenAI or Anthropic API key. That's it. Everything else is already there.

---

## Workspace

Kit keeps its data in `~/.Kit/`:

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

## Settings

Open the settings panel from the toolbar to configure:

- Font size and tab width
- Line wrap on or off
- Auto-save interval (off by default)
- AI context — choose what the AI can see: browser page, calendar, bookmarks, web search

---

## For Writers

Kit isn't just for code. The editor handles Markdown beautifully with live preview. The whiteboard is a thinking tool, not just a diagram tool. The AI assistant works as a writing partner — ask it to expand a section, tighten a paragraph, check your tone, or continue a thought. The calendar keeps your deadlines in the same window as your work. The terminal runs `pandoc` when you need to export.

If you write and build things — code, essays, systems, ideas — Kit was made for you.

---

*Kit is for people who want their tools to get out of the way.*

*If Kit helps your work, give it a ⭐ — it helps more people find it.*
