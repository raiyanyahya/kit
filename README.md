# Kit 🏵️

![Electron](https://img.shields.io/badge/Electron-40%2B-47848F?style=flat-square&logo=electron&logoColor=white) ![Node](https://img.shields.io/badge/Node.js-20%2B-brightgreen?style=flat-square&logo=node.js&logoColor=white) [![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE) ![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux-lightgrey?style=flat-square) [![Build & Release](https://github.com/raiyanyahya/Kit/actions/workflows/build.yml/badge.svg)](https://github.com/raiyanyahya/Kit/actions/workflows/build.yml)

**Your entire dev environment. One window. AI at the core.**

Kit is not another Electron wrapper with a chat sidebar bolted on. It's a ground-up rethink of what a developer workspace looks like when AI isn't a feature — it's the backbone. Every tool in Kit is AI-aware. The editor knows what you're browsing. The agent reads your project rules. The terminal understands context. Nothing is siloed.

Built by a developer who got tired of alt-tabbing between twelve apps to do one thing.

![Kit workspace](MediaAssets/KitLanding.png)

---

## ⚡ Why Kit exists

Modern dev work is fracture by default. Your editor is one app. Docs live in the browser. The terminal is a third window. Your AI chat is a fourth tab. Every context switch costs you a thread of thought — and those add up.

Kit is built on a different premise: **the workspace should think with you, not just sit there**. When you open a file, the AI knows. When you browse a doc, the AI can read it. When you give the agent a task, it uses your actual project context — not a blank slate.

The tools aren't just co-located. They're connected.

---

## 🧠 AI is the backbone, not a feature

Most editors add AI as an afterthought — a sidebar, a shortcut, a tab. Kit is designed the other way around. AI is the connective tissue between every component.

- The **inline assistant** knows the file you have open, the page you're browsing, your calendar, your bookmarks — all as live context
- The **Kit Agent** is a real autonomous loop: it reads files, writes code, runs commands, searches your project, and reports back — no hand-holding required
- The **agent permission model** gives you explicit control: allow once, allow all, or deny — before any file write or shell command runs
- Drop a **`.kitrules`** or **`AGENT.md`** file in any project and the agent picks up your conventions, architecture notes, and off-limits areas automatically
- Supports **OpenAI and Anthropic simultaneously** — use whatever model fits the task

---

## 🔩 What's inside

### ✏️ Code Editor
Full CodeMirror 6 — syntax highlighting for every major language, multi-tab, configurable font/tab/wrap, dirty-state indicator, auto-save, session restore. `Ctrl+K` to find anything in your project instantly.

### 🌐 Browser
A real Chromium browser inside your workspace. Address bar, tabs, bookmarks, history. The AI reads the page you're looking at — ask it a question about the docs you're browsing without copy-pasting a single line.

### 💻 Terminal
Real shell. Every command streams output live as it arrives. Built-in shortcuts for the things you type twenty times a day (`cd`, `ls`, `open`, `pwd`, `export`). `Ctrl+C` kills long-running processes. The status bar tracks your branch, SHA, and git state in real time.

### 🔀 Git Panel
Stage files, commit, pull, push — all visual, all without touching the terminal. The status bar updates live. For everything else, the terminal is right there.

### 🪜 Stairs — Workflow Automation
A pipeline builder for turning repetitive work into one-click automations. Chain **AI → Shell → HTTP → File** steps in any order. Outputs flow between steps. Run once, name it, run forever.

Example: fetch an API → summarise with Claude → write to a report file. Or: run tests → on failure, draft an email. Build it once, forget it exists.

### 🎨 Whiteboard
Freehand canvas for thinking in shapes. Pen, rectangles, ellipses, arrows, text, sticky notes, image upload, eraser, select. Mind map mode for connected node trees. Auto-saves. Screenshot export. One keystroke away from the editor, one keystroke back.

### 📧 Email
Full IMAP/SMTP. Works with Gmail, Fastmail, Outlook, anything standard. Read, reply, compose, trash — without leaving the workspace. Email in a dev tool sounds wrong until you realise how much focus you lose switching apps to check it.

### 📅 Calendar
Local event manager. No accounts, no sync, no cloud. Events live in `~/.Kit/calendar.json`. Your deadlines in the same window as your work.

---

## 🔌 Built to be extended

Kit is designed to grow. The agent tool system is explicit and composable — `read_file`, `write_file`, `list_dir`, `run_command`, `search_project` are discrete, permissioned, and easy to extend. The Stairs pipeline runner supports four step types today and is built to add more. Project rules (`AGENT.md` / `.kitrules`) mean the agent adapts to any codebase without hardcoding anything.

If you want to add a tool, a step type, or wire in a new AI provider — the surface area is intentionally small. Fork it. Extend it. The architecture stays out of your way.

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

---

## 🤖 AI models

| Provider | Models |
|---|---|
| **OpenAI** | gpt-5.4, gpt-5.4-mini, gpt-5.4-nano, gpt-4.1, gpt-4.1-mini, o3, o4-mini |
| **Anthropic** | Claude Opus 4.7, Claude Sonnet 4.6, Claude Haiku 4.5 |

Keys are encrypted via Electron's `safeStorage` — never plaintext, never leave your machine.

---

## 🚀 Get started

```bash
git clone https://github.com/raiyanyahya/Kit.git
cd Kit
npm install
npm start
```

On first launch, click the key icon in the status bar and add your OpenAI or Anthropic key. Everything else is ready.

---

## 🗂️ Workspace layout

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
