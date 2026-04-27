# Jack

*A unified workspace for developers, writers, and curious minds.*

---

> **Jack** brings together a code editor, writing studio, browser, AI assistant, agentic AI, API tester, terminal, git panel, calendar, email client, whiteboard, and workflow automation — all in one quiet, keyboard-first application. No context-switching. No clutter. Just flow.

---

## Modes at a Glance

| Mode | How to open | What it's for |
|---|---|---|
| **Editor** | Default / `Ctrl+0` | Code, config, markdown |
| **Writing** | toolbar button | Long-form prose, notes, docs |
| **Browser** | `Ctrl+B` or toolbar | Integrated web browsing |
| **Agent** | toolbar button | Agentic AI with file & shell access |
| **Stairs** | toolbar button | Visual workflow automation |
| **Email** | toolbar button | Built-in email client |
| **Whiteboard** | toolbar button | Freeform canvas |
| **API Testing** | `Ctrl+R` | HTTP requests, collections |
| **Calendar** | toolbar button | Daily entries, scheduling |

Press `Ctrl+0` or `Esc` to return to the editor from any mode.

---

## Editor

Built on **CodeMirror 6** with full syntax highlighting, line numbers, active-line highlighting, and smart indentation across 20+ languages.

**Supported languages**
JavaScript · TypeScript · JSX/TSX · Python · HTML · CSS · JSON · YAML · TOML · Markdown · SQL · XML · C/C++ · Rust · Go · Java · PHP · Ruby · Swift · Shell

**Tab system**
Every file opens in its own tab. Switch tabs with `Ctrl+Shift+]` / `Ctrl+Shift+[`. Unsaved changes show a dot on the tab. Close with the × button.

**Drag & drop**
Drop any file from your file manager directly onto the editor to open it.

**Jump to Definition — `F12`**
Place your cursor on any symbol and press `F12`. Jack greps your project for matching definitions across `.js`, `.ts`, `.py`, `.go`, `.java`, and `.rb` files. One match jumps there directly; multiple matches appear in the terminal.

**Session restore**
Jack remembers your last open file and exact cursor position — pick up right where you left off on next launch.

**Markdown preview**
When a `.md` file is open, a preview button appears in the toolbar. The panel stays in sync as you type.

**Settings — `⚙` button in the status bar**

| Setting | Options |
|---|---|
| Font size | 10 – 24 px |
| Tab size | 2 / 4 / 8 spaces |
| Line wrap | On / Off |
| Auto-save | Off / 1s / 3s / 5s |

**AI Context** (also in Settings)

Control what context Jack automatically sends with every AI request:

| Toggle | What it sends |
|---|---|
| Send calendar | Your upcoming calendar entries |
| Send bookmarks | Your browser bookmarks |
| Send browser page | The current page you're viewing |
| Web search tool | Gives the AI a live search capability |

---

## Writing Mode

A Notion-inspired writing studio built on **EditorJS**.

**Document library**
All notes live in `~/.Jack/writing/`. The sidebar lists them — click any to open.

**Block types**
Heading · Paragraph · Bulleted list · Numbered list · Checklist · Quote · Code · Table · Divider · Inline code · Highlight

**Auto-save**
Saves automatically 2 seconds after you stop typing. A subtle `Saved ✓` flashes in the sidebar to confirm.

**Import / Export**
- **Export** → converts your note to Markdown and saves it via the system dialog
- **Import** → reads a `.md` file and converts it into blocks

**Browser Clips note**
Select text in the browser and click the clip button in the status bar. The selection is appended to a special `Browser Clips` note in your library, separated by a divider — great for research.

---

## Browser

A full Chromium browser embedded inside Jack. It follows the app's light/dark theme automatically.

**Navigation**
Type a URL or search query in the address bar (Enter to go). Anything that isn't a URL goes to DuckDuckGo.

**Tabs**
Open multiple tabs with `+`. Tabs persist across restarts.

**Bookmarks**
Star any page from the toolbar. Access all bookmarks from the bookmark panel.

**Status bar actions** (browser mode only)

| Button | What it does |
|---|---|
| Summarize | AI summarizes the current page and opens the result in a panel |
| Extract | Extracts all visible text from the page |
| Screenshot | Captures the current page as an image |
| Reading mode | Strips ads and navigation — shows just the article |
| Clip to note | Copies your selection to the Browser Clips note |

**AI + Browser**
Ask `ai` anything while browsing and Jack automatically injects the current page's URL, title, and visible text into the prompt — no copy-pasting needed.

---

## AI Assistant

Jack connects to **OpenAI** and **Anthropic** simultaneously. Set keys with the **API Keys** button in the status bar — keys are stored encrypted via Electron's `safeStorage`.

### Providers & Models

**OpenAI**
| Model | Best for |
|---|---|
| `gpt-4.1` | General work, default |
| `gpt-4.1-mini` | Fast, cost-effective |
| `gpt-4o` | Multimodal |
| `o3` | Advanced reasoning |
| `o4-mini` | Fast reasoning |

**Anthropic (Claude)**
| Model | Best for |
|---|---|
| `claude-opus-4` | Most capable, complex tasks |
| `claude-sonnet-4` | Balanced speed and quality |
| `claude-haiku-4.5` | Fastest, lightweight tasks |

The model picker shows the provider's icon and updates the key indicator to show which key is needed.

### Terminal commands

```
ai <prompt>                     Ask anything
ai <prompt> --file              Attach the current open file
ai <prompt> --selection         Use only the selected editor text
ai <prompt> --path <dir>        Attach all files in a directory
ai <prompt> --model <name>      Override the model for this request
ai clear                        Start a new conversation thread
```

### Code shortcuts

```
ai complete --file              Complete the current function/class
ai explain --file               Plain-English explanation
ai fix "error message" --file   Debug and propose fixes
ai test --file                  Generate unit tests
ai review --file                Code review with suggestions
ai refactor --file              Improve structure and readability
ai optimize --file              Performance improvements
ai document --file              Add docstrings / JSDoc
ai convert python --file        Convert to another language
```

### Toolbar AI buttons

| Button | What it does |
|---|---|
| Check | Find errors and bugs in the current file |
| Summarize | Summarize the current file |
| Tests | Generate unit tests for the current file |

### Token estimator
Before every request Jack prints an estimated token count and approximate cost:
```
[AI] ~1,240 tokens | ~$0.0037 — sending…
```

### Conversation history
Terminal AI messages are threaded automatically — each reply knows what came before. Run `ai clear` to start fresh.

---

## Agent Mode

An agentic AI panel that can autonomously read, write, and run things in your project. Open it from the toolbar.

**How it works**
Give the agent a task in plain English. It breaks the work into steps, calls tools, shows its thinking, and reports results — all without leaving Jack.

**Tools available to the agent**

| Tool | What it does |
|---|---|
| `read_file` | Read the contents of any file |
| `write_file` | Create or overwrite a file |
| `list_dir` | List files and folders in a directory |
| `run_command` | Execute a shell command and capture output |
| `search_project` | Grep the project for a pattern |

**Model picker**
Choose any OpenAI or Claude model for the agent — each model shows its provider icon and a green dot if the key is configured.

**Workspace**
Set the agent's working directory with the folder button — it defaults to the current sidebar directory.

**Example prompts**
- *Write unit tests for the current open file*
- *Scan the project for hardcoded passwords or API keys*
- *Refactor this module to use async/await throughout*

---

## Stairs — Workflow Automation

A visual pipeline builder for automating multi-step developer tasks. Open it from the toolbar.

**Staircases**
Each automation is a "staircase" — a named, ordered list of steps that run in sequence. Save multiple staircases and switch between them from the sidebar. Staircases can be in **Draft** or **Published** state.

**Step types**

| Type | What it does |
|---|---|
| **Shell** | Runs a shell command and captures stdout |
| **AI** | Sends a prompt (with optional system message) to the AI model |
| **HTTP** | Makes a GET / POST / PUT / PATCH / DELETE request to any URL |
| **File** | Reads, writes, or appends to a file |

**Chaining steps**
Reference the output of any previous step in your config using `{{step_id.output}}`. For example, an AI step can summarize what a shell step fetched.

**AI-powered build**
Describe what you want to automate in plain English and hit **Build** — Jack generates the step configuration for you.

**Controls**
- Run the entire staircase with **Run**
- Re-run from any individual step with the ↺ button on that step
- Copy any step's output to the clipboard
- Delete steps or drag to reorder

---

## Email

A full email client built into Jack. Configure it once and never leave your workspace to check mail.

**Setup**
Click the email toolbar button and enter your IMAP and SMTP details. Works with any provider — Gmail, Fastmail, Outlook, or a custom server. App Passwords are recommended for Gmail.

**Features**
- **Inbox** — browse and read messages with a two-panel layout (list + reader)
- **Compose** — write new emails with To, Subject, and body fields
- **Reply / Forward** — reply or forward any message from the reader panel
- **Folders** — switch between Inbox, Sent, and other IMAP folders
- **Delete** — move messages to trash with one click
- **Cache** — messages are cached locally so the inbox loads instantly on reopen

---

## Whiteboard

A freeform infinite canvas for diagrams, sketches, and brainstorming.

**Tools** (keyboard shortcuts in parentheses)

| Tool | Key |
|---|---|
| Select / move | `V` |
| Sticky note | `N` |
| Freehand pen | `P` |
| Rectangle | `R` |
| Circle / ellipse | `E` |
| Arrow | `A` |
| Image | `I` |
| Eraser | `X` |
| Mind map node | `M` |

**Canvas controls**
- Zoom in / out / reset with the controls in the bottom-right corner (or `+` / `-` keys)
- Pan by scrolling or middle-mouse drag
- Download the board as a **PNG** with the download button
- Board state is saved automatically to `~/.Jack/boards/main.json`

---

## Command Palette

Press `Ctrl+Shift+P` to open the command palette.

- **Fuzzy search** — partial words score intelligently (`"brow tab"` finds *New Browser Tab*)
- **Recent commands** — your most-used commands appear at the top before you type
- **Keyboard hints** — shortcuts are shown on the right of each result
- Navigate with `↑` / `↓`, execute with `Enter`, dismiss with `Esc`

---

## Project Search

Press `Ctrl+K` to search across all files in the current folder.

- Full-text search — matches file names and file contents
- Results update live as you type, with the matching text highlighted
- Ignores `node_modules/`, `.git/`, `dist/`, and other noise automatically
- Click any result to jump directly to that file at that line
- Re-indexes automatically whenever you switch to a different folder

---

## Terminal

A built-in shell at the bottom of the editor. Type `help` for the full command list.

**Navigation**
```
cd <path>           Change directory (Tab for auto-complete)
ls [path]           List files
pwd                 Show current directory
open / e / vi       Open a file in the editor
close               Close the active file
clear               Clear terminal output
exit                Quit Jack
```

**Environment**
```
export VAR=value    Set an environment variable
unset VAR           Remove a variable
env VAR             Read a variable
```

Any command not matched by a built-in is passed directly to your system shell.

---

## Git Panel

Click the branch indicator in the status bar (e.g. `main @ a1b2c3`) to open the Git panel.

**File status badges**
Each changed file shows a coloured badge:
- **M** (orange) — modified
- **A** (green) — added / new file
- **D** (red) — deleted
- **R** (blue) — renamed
- **??** (grey) — untracked

**Actions**
- **Branch switcher** — view and switch branches from the dropdown in the panel header
- **Stage files** — check individual files to stage them
- **Diff preview** — click any file to see its full diff on the right
- **Commit** — type a message and click Commit
- **Pull / Push** — one-click sync with the remote

The status bar also shows ahead/behind counts and a file-changed count at a glance.

---

## API Testing

Press `Ctrl+R` or use the command palette to open the API testing mode.

- **All HTTP methods**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Request tabs**: Params, Headers, Body (JSON / form / raw), Auth
- **Auth helpers**: Bearer token, Basic auth, API key (header or query)
- **Response panel**: status code, timing, size, pretty-printed body, response headers
- **Collections & history** in the sidebar

---

## Calendar

Click the calendar toolbar button for the full-page calendar view.

- Navigate months with `‹` / `›` or jump to today
- Click any day to open its entry panel
- Add, edit, and delete daily notes and events
- A mini calendar and upcoming events widget also appear in the sidebar
- All entries are saved to `~/.Jack/calendar.json`

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+S` | Save file |
| `Ctrl+F` | Find in file |
| `Ctrl+K` | Project search |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+B` | Browser mode |
| `Ctrl+R` | API testing mode |
| `Ctrl+D` | Toggle dark / light theme |
| `Ctrl+E` | Toggle sidebar |
| `Ctrl+0` | Back to editor |
| `Ctrl+Shift+]` | Next editor tab |
| `Ctrl+Shift+[` | Previous editor tab |
| `F12` | Jump to definition |
| `Esc` | Close any modal / palette / mode |
| `↑` in terminal | Recall last command |
| `Tab` in terminal | Path auto-complete |

---

## Workspace Layout

```
~/.Jack/
├── README.md               ← You are here
├── calendar.json           ← Calendar entries
├── boards/
│   └── main.json           ← Whiteboard state
└── writing/
    ├── Browser Clips.json
    ├── your-note.json
    └── ...
```

Your code projects live wherever you keep them — use `cd` in the terminal to navigate there and the sidebar updates automatically.

---

## Design Philosophy

**One window, everything you need.**
Jack is opinionated about what belongs together: writing and coding are complementary acts, browsers are research tools, and an AI assistant is most useful when it already knows your context.

**Keyboard-first, always.**
Every feature has a shortcut. The mouse is optional.

**Save automatically, think continuously.**
Auto-save runs silently in both the code editor and writing mode. Your ideas are safe the moment you type them.

**Your AI, your choice.**
Jack supports both OpenAI and Anthropic out of the box. Bring whichever key you have — or both.

---

*Happy creating.* ✦
