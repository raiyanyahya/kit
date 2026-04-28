# Contributing to Kit

Thanks for taking the time to contribute. Kit is a small, focused project and every improvement matters — bug fixes, new features, documentation, and ideas are all welcome.

---

## Before you start

- Check [open issues](https://github.com/raiyanyahya/Kit/issues) to see if what you want to work on is already being tracked
- For significant changes, open an issue first to discuss the approach — this avoids wasted effort if the direction doesn't fit
- For small fixes (typos, minor bugs, documentation), go straight to a PR

---

## Setup

```bash
git clone https://github.com/raiyanyahya/Kit.git
cd Kit
npm install
npm start
```

To work with the bundled renderer (as it runs in production):

```bash
npm run build   # development build with sourcemaps
npm run dev     # build + launch
```

---

## Project structure

```
src/
├── main.js          Electron main process — IPC handlers, file system, AI, terminal
├── renderer.js      All UI logic — editor, terminal, agent, browser, email, etc.
├── preload.cjs      Context bridge — exposes main process APIs to renderer
├── index.html       App shell
├── styles.css       All styles
└── WELCOME.md       In-app welcome screen (loaded on first launch)

icons/               App icons
MediaAssets/         Screenshots and media for documentation
.github/workflows/   CI/CD — builds macOS DMG and Linux AppImage on release
```

The entire UI lives in `renderer.js`. It's a single file by design — easy to grep, easy to navigate, no build complexity beyond the esbuild bundle step. If you're adding a feature, that's where most of the work happens. IPC handlers for anything that needs Node.js or system access go in `main.js`, with the bridge registered in `preload.cjs`.

---

## Ways to contribute

### 🐛 Bug fixes
Open an issue describing what's broken and how to reproduce it, or go straight to a PR if the fix is clear.

### ✨ New features
Kit is designed to be extended — the agent tool system, Stairs step types, and AI integrations are all good places to add capability. Open an issue first for anything non-trivial so we can align on scope.

### 🪜 Stairs step types
Stairs currently supports AI, Shell, HTTP, and File steps. New step types are welcome — each one is a self-contained handler. Look at the existing step implementations in `renderer.js` for the pattern.

### 🤖 Agent tools
The Kit Agent uses five tools today (`read_file`, `write_file`, `list_dir`, `run_command`, `search_project`). Adding a new tool means registering it in `AGENT_TOOLS` and handling it in `agentExecuteTool`. Keep the permission model in mind — destructive or side-effectful tools should ask before running.

### 📝 Documentation
The README is the front door. If something is unclear, missing, or wrong — fix it.

---

## Pull request guidelines

- Keep PRs focused — one thing per PR
- Match the existing code style (no linter enforced, just be consistent)
- Test your change manually before submitting — run `npm start` and exercise the affected feature
- Write a clear PR description: what changed, why, and how to test it

---

## Reporting bugs

Open a [GitHub issue](https://github.com/raiyanyahya/Kit/issues) with:
- What you did
- What you expected
- What actually happened
- Your OS and Kit version

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
