# Kit

*Your complete workspace for developers, writers, and curious minds.*

---

## Welcome

Kit brings together a code editor, browser, AI assistant, agentic AI, terminal, git panel, calendar, email client, whiteboard, and workflow automation — all in one quiet, keyboard-first application. No context-switching. No clutter. Just flow.

---

## Getting Started

1. **Explore the sidebar** — toggle it with **Ctrl+E**
2. **Try the modes** — click the toolbar icons or use the shortcuts below
3. **Set your AI keys** — click the key icon in the status bar (OpenAI and/or Anthropic)
4. **Press Ctrl+K** — the fastest way to find any file or run any command

---

## Modes

| Mode | Shortcut | What it's for |
|------|----------|---------------|
| **Editor** | **Ctrl+0** | Code, config, markdown — the main workspace |
| **Browser** | **Ctrl+B** | Integrated Chromium browser with AI page analysis |
| **Whiteboard** | **Ctrl+W** | Freehand drawing and visual thinking |
| **Kit Agent** | **Ctrl+Shift+A** | Autonomous AI agent with file & shell access |
| **Stairs** | **Ctrl+Shift+R** | Visual step-by-step workflow automation |
| **Email** | **Ctrl+M** | Built-in IMAP/SMTP email client |
| **Calendar** | toolbar | Event management, saved to `~/.Kit/calendar.json` |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+K** | Project search — find any file instantly |
| **Ctrl+D** | Toggle light / dark theme |
| **Ctrl+B** | Browser mode |
| **Ctrl+W** | Whiteboard |
| **Ctrl+M** | Email |
| **Ctrl+E** | Toggle sidebar |
| **Ctrl+0** | Return to editor |
| **Ctrl+Shift+A** | Kit Agent |
| **Ctrl+Shift+R** | Stairs |
| **Ctrl+Shift+P** | Command palette |

---

## AI Features

Kit connects to **OpenAI** and **Anthropic** simultaneously. Set your keys from the status bar — they are stored encrypted via Electron's `safeStorage`.

**Inline AI (status bar):**
- Check for errors, summarise, generate tests — one click on the current file
- Prefix your terminal input with `ai` to ask anything in context

**Kit Agent:**
- Give it a task in plain English — it breaks work into steps, reads and writes files, runs shell commands, and reports results
- Supports both OpenAI (gpt-5.4, o3, o4-mini) and Anthropic (Claude Sonnet / Opus) models
- Add a `.kitrules` or `AGENT.md` file to any project folder to give the agent project-specific instructions

**Stairs (workflow automation):**
- Chain AI prompts, shell commands, HTTP requests, and file operations into reusable pipelines
- Build workflows visually, run with one click

---

## Workspace

```
~/.Kit/
├── projects/        ← agent-created projects
├── notes/           ← text notes and documents
├── data/            ← data files and datasets
├── scratch/         ← quick experiments
├── boards/          ← whiteboard saves
├── stairs/          ← saved workflows
└── calendar.json    ← calendar events
```

---

## Themes

**Ctrl+D** toggles light and dark. Kit respects your system preference on first launch.

---

*Welcome to Kit — where every tool you need is one keystroke away.*
