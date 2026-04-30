
// Kit alias without mutating window.kit
const KIT = (window.kit || window.kitBridge);
import { EditorView, highlightActiveLine, lineNumbers, keymap } from '@codemirror/view'
import { EditorState, EditorSelection } from '@codemirror/state'
import { syntaxHighlighting, defaultHighlightStyle, StreamLanguage, indentUnit } from '@codemirror/language'
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { highlightSelectionMatches, openSearchPanel } from '@codemirror/search'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { html as htmlLang } from '@codemirror/lang-html'
import { css as cssLang } from '@codemirror/lang-css'
import { json as jsonLang } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { yaml } from '@codemirror/lang-yaml'
import { sql } from '@codemirror/lang-sql'
import { xml } from '@codemirror/lang-xml'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { php } from '@codemirror/lang-php'
import { rust } from '@codemirror/lang-rust'
import { shell as shellLegacy } from '@codemirror/legacy-modes/mode/shell'
import { go as goLegacy } from '@codemirror/legacy-modes/mode/go'
import { ruby as rubyLegacy } from '@codemirror/legacy-modes/mode/ruby'
import { swift as swiftLegacy } from '@codemirror/legacy-modes/mode/swift'
import { toml as tomlLegacy } from '@codemirror/legacy-modes/mode/toml'
import { oneDark } from '@codemirror/theme-one-dark'
import { _termEsc, _termColorize, _termColorizeAnsi, fuzzyMatch, normPath, getTabName, toUrl, _providerFor, parseMarkdown } from './utils.js'

// Lucide icon factory — all icons share Lucide's 24×24 coordinate space
// so they look identical to Cursor, VS Code and every modern dev tool.
const $ = s => document.querySelector(s)
const _ico = (w, h, inner, cls = '') =>
  `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

// Lucide path definitions
const _L = {
  folder:   `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`,
  file:     `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>`,
  fileText: `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>`,
  fileCode: `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>`,
  database: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>`,
  star:     `<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>`,
  bookmark: `<path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/>`,
  settings2:`<path d="M14 17H5"/><path d="M19 7h-9"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>`,
  gitBranch:`<path d="M15 6a9 9 0 0 0-9 9V3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>`,
}

const ICON = {
  // ─── file tree (15×15) ───────────────────────────────────────────
  dir:      _ico(15, 15, _L.folder,   'ft-icon ft-dir'),
  file:     _ico(15, 15, _L.file,     'ft-icon'),
  fileText: _ico(15, 15, _L.fileText, 'ft-icon'),
  fileCode: _ico(15, 15, _L.fileCode, 'ft-icon'),
  database: _ico(15, 15, _L.database, 'ft-icon ft-sql'),
  // ─── UI icons ────────────────────────────────────────────────────
  starFilled:  _ico(15, 15, _L.star.replace('/>', ' fill="currentColor" stroke="none"/>')),
  starOutline: _ico(15, 15, _L.star),
  gear:     _ico(14, 14, _L.settings2),
  folder:   _ico(14, 14, _L.folder),
  bookmark: _ico(14, 14, _L.bookmark),
  gitBranch:_ico(12, 12, _L.gitBranch),
}

// ── Brand icons (fill-based, 24×24 viewBox) ──────────────────────────────────
const _BRAND = {
  openai: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.911 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .511 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.041l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.41 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.497v2.999l-2.597 1.5-2.607-1.5z"/></svg>`,
  anthropic: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" fill-rule="evenodd"><path d="M12 2L3 22h18L12 2zM12 7.5l5.6 11.5H6.4z"/></svg>`,
};

// ── Model groups ──────────────────────────────────────────────────────────────
const _MODEL_GROUPS = [
  { provider: 'openai', label: 'OpenAI', models: [
    { v: 'gpt-5.4',              l: 'gpt-5.4' },
    { v: 'gpt-5.4-mini',         l: 'gpt-5.4-mini' },
    { v: 'gpt-5.4-nano',         l: 'gpt-5.4-nano' },
    { v: 'gpt-4.1',              l: 'gpt-4.1' },
    { v: 'gpt-4.1-mini',         l: 'gpt-4.1-mini' },
    { v: 'o3',                   l: 'o3' },
    { v: 'o4-mini',              l: 'o4-mini' },
  ]},
  { provider: 'anthropic', label: 'Claude', models: [
    { v: 'claude-opus-4-7',           l: 'Claude Opus 4.7' },
    { v: 'claude-sonnet-4-6',         l: 'Claude Sonnet 4.6' },
    { v: 'claude-haiku-4-5-20251001', l: 'Claude Haiku 4.5' },
  ]},
];


// ── Custom model picker ───────────────────────────────────────────────────────
function _buildModelPicker(selectEl) {
  if (!selectEl) return;
  const saved = localStorage.getItem('kitSelectedModel');
  if (saved) selectEl.value = saved;
  const init = selectEl.value || 'gpt-5.4';
  selectEl.style.cssText = 'display:none!important';
  const compact = selectEl.classList.contains('agent-model-select');
  const wrap = document.createElement('div');
  wrap.className = compact ? 'mpk mpk-compact' : 'mpk';
  const trigger = document.createElement('button');
  trigger.type = 'button'; trigger.className = 'mpk-trigger';
  const _chevron = `<svg class="mpk-caret" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
  const _check   = `<svg class="mpk-check" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
  const _setTrigger = (val) => {
    const p = _providerFor(val);
    const grp = _MODEL_GROUPS.find(g => g.provider === p);
    const lbl = grp?.models.find(m => m.v === val)?.l || val;
    trigger.innerHTML = `<span class="mpk-icon">${_BRAND[p]}</span><span class="mpk-name">${lbl}</span>${_chevron}`;
  };
  _setTrigger(init);
  const menu = document.createElement('div');
  menu.className = 'mpk-menu hidden';
  _MODEL_GROUPS.forEach((grp, gi) => {
    if (gi > 0) { const sep = document.createElement('div'); sep.className = 'mpk-sep'; menu.appendChild(sep); }
    const hdr = document.createElement('div');
    hdr.className = 'mpk-group-header';
    hdr.innerHTML = `<span class="mpk-icon">${_BRAND[grp.provider]}</span><span>${grp.label}</span>`;
    menu.appendChild(hdr);
    grp.models.forEach(m => {
      const item = document.createElement('button');
      item.type = 'button'; item.className = 'mpk-item'; item.dataset.value = m.v;
      const active = m.v === init;
      item.innerHTML = `<span>${m.l}</span>${active ? _check : _check.replace('class="mpk-check"', 'class="mpk-check hidden"')}`;
      if (active) item.classList.add('active');
      item.addEventListener('click', () => {
        selectEl.value = m.v;
        try { localStorage.setItem('kitSelectedModel', m.v); } catch (_) {}
        selectEl.dispatchEvent(new Event('change'));
        _setTrigger(m.v);
        menu.querySelectorAll('.mpk-item').forEach(it => {
          it.classList.remove('active');
          it.querySelector('.mpk-check')?.classList.add('hidden');
        });
        item.classList.add('active');
        item.querySelector('.mpk-check')?.classList.remove('hidden');
        menu.classList.add('hidden'); wrap.classList.remove('mpk-open');
      });
      menu.appendChild(item);
    });
  });
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const open = !menu.classList.contains('hidden');
    document.querySelectorAll('.mpk-menu').forEach(m => m.classList.add('hidden'));
    document.querySelectorAll('.mpk').forEach(w => w.classList.remove('mpk-open'));
    if (!open) { menu.classList.remove('hidden'); wrap.classList.add('mpk-open'); }
  });
  wrap.appendChild(trigger); wrap.appendChild(menu);
  selectEl.parentNode.insertBefore(wrap, selectEl);
  wrap.appendChild(selectEl);
  return wrap;
}

document.addEventListener('click', () => {
  document.querySelectorAll('.mpk-menu').forEach(m => m.classList.add('hidden'));
  document.querySelectorAll('.mpk').forEach(w => w.classList.remove('mpk-open'));
});

// Spinner control for terminal AI activity
const termSpinner = document.getElementById('termSpinner');

function selectedModel() {
  const el = document.getElementById('aiModelSelect');
  const model = (el && el.value) ? el.value : 'gpt-5.4';
  return model;
}
function showSpinner() { if (termSpinner) { termSpinner.classList.remove('hidden'); } }
function hideSpinner() { if (termSpinner) { termSpinner.classList.add('hidden'); } }

// Auto-scroll terminal when content changes (debounced via rAF)
(function () {
  const out = document.getElementById('termOut');
  if (!out) return;
  let scrollPending = false;
  const scrollToBottom = () => {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => {
      out.scrollTop = out.scrollHeight;
      scrollPending = false;
    });
  };
  const mo = new MutationObserver(scrollToBottom);
  mo.observe(out, { childList: true, characterData: true, subtree: true });
})();

// Update sidebar header to show current folder name
function updateSideHeaderToCwd() {
  try {
    const el = document.querySelector('#sidebar .sidebar-header .title');
    if (!el) { return; }
    const dir = termCwd || '';
    if (dir) {
      const name = (dir.split(/[/\\]/).filter(Boolean).pop()) || 'Current';
      el.replaceChildren();
      el.insertAdjacentHTML('beforeend', ICON.folder);
      const textNode = document.createTextNode(' ' + name);
      el.appendChild(textNode);
    } else {
      el.innerHTML = '';
      el.insertAdjacentHTML('beforeend', ICON.folder);
      const span = document.createElement('span');
      span.textContent = 'Current';
      el.appendChild(span);
    }
  } catch (_) { }
  checkAgentRules(termCwd);
}

const fileInfo = $('#fileInfo'), pathInfo = $('#pathInfo'), toggleSidebarBtn = $('#toggleSidebar')
const sidebar = $('#sidebar'), treeEl = $('#tree'), themeToggle = $('#themeToggle')
const aiToggle = $('#aiToggle'), aiSummarize = $('#aiSummarize'), aiCheck = $('#aiCheck'), aiTests = $('#aiTests')
const dirtyDot = $('#dirtyDot'), gitInfo = $('#gitInfo')
const aiKeyModal = $('#aiKeyModal'), aiKeyInput = $('#aiKeyInput'), aiKeySave = $('#aiKeySave'), aiKeyCancel = $('#aiKeyCancel')
const browserToggle = $('#browserToggle'), browserNewTab = $('#browserNewTab')
const browserWrap = $('#browserWrap'), browserInput = $('#browserUrlInput')
const browserUrlBar = $('#browserUrlBar')
const sideHeaderTitle = document.querySelector('#sidebar .sidebar-header .title')

let currentFile = null, editor = null, dirty = false, termCwd = null, darkMode = false, currentLangExt = null, lastCmd = ''
let _appReadmePath = null
// Keep window.termCwd in sync so project-search.js always reads the live directory
Object.defineProperty(window, 'termCwd', { get: () => termCwd, set: v => { termCwd = v; }, configurable: true, enumerable: true })
let aiInFlight = false
let termAiPreviousId = null
let emailMessages = [], emailSelectedIdx = -1, emailOpenUid = null, emailComposeReplyData = null
let autoSaveTimer = null
let editorSettings = { fontSize: 14, tabSize: 2, lineWrap: false, autoSave: 0, aiContext: { calendar: true, bookmarks: true, browserPage: true, webSearch: true } }


// ===== Recent Commands (command palette) =====
let recentCommands = [];
try { recentCommands = JSON.parse(localStorage.getItem('kitRecentCmds') || '[]'); } catch(_) {}

function addRecentCommand(id) {
  recentCommands = [id, ...recentCommands.filter(x => x !== id)].slice(0, 5);
  try { localStorage.setItem('kitRecentCmds', JSON.stringify(recentCommands)); } catch(_) {}
}

// ===== Tab Management System =====
let openTabs = []; // Array of { filePath, content, dirty, langExt, scrollPos }
let activeTabIndex = -1;

function createTab(filePath, content = '', langExt = null) {
  const tab = {
    filePath,
    content,
    dirty: false,
    langExt: langExt || pickLanguage(filePath ? filePath.split(/[\\/]/).pop() : ''),
    scrollPos: 0
  };
  return tab;
}

function renderTabs() {
  const tabList = document.getElementById('tabList');
  const tabBar = document.getElementById('tabBar');
  if (!tabList) return;

  tabList.innerHTML = '';

  // Hide tab bar when no tabs are open
  if (openTabs.length === 0) {
    if (tabBar) tabBar.style.display = 'none';
  } else {
    if (tabBar) tabBar.style.display = 'flex';
  }

  openTabs.forEach((tab, index) => {
    const tabEl = document.createElement('div');
    tabEl.className = 'tab' + (index === activeTabIndex ? ' active' : '');
    tabEl.title = tab.filePath || 'untitled.txt';

    const nameEl = document.createElement('span');
    nameEl.className = 'tab-name';
    nameEl.textContent = getTabName(tab.filePath);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Close';

    tabEl.appendChild(nameEl);

    if (tab.dirty) {
      const dirtyDot = document.createElement('span');
      dirtyDot.className = 'tab-dirty';
      tabEl.appendChild(dirtyDot);
    }

    tabEl.appendChild(closeBtn);

    // Click tab to switch
    tabEl.addEventListener('click', (e) => {
      if (e.target === closeBtn) return;
      switchToTab(index);
    });

    // Close button
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeEditorTab(index);
    });

    tabList.appendChild(tabEl);
  });
}

function saveCurrentTabState() {
  if (activeTabIndex >= 0 && activeTabIndex < openTabs.length && editor) {
    const tab = openTabs[activeTabIndex];
    tab.content = editor.state.doc.toString();
    tab.dirty = dirty;
    tab.scrollPos = editor.scrollDOM.scrollTop;
  }
}

function switchToTab(index) {
  if (index < 0 || index >= openTabs.length || index === activeTabIndex) return;

  // Save current tab state
  saveCurrentTabState();

  // Switch to new tab
  activeTabIndex = index;
  const tab = openTabs[index];

  currentFile = tab.filePath;
  currentLangExt = tab.langExt;
  dirty = tab.dirty;

  rebuildEditor(tab.content);

  // Restore scroll position
  if (tab.scrollPos && editor) {
    setTimeout(() => {
      editor.scrollDOM.scrollTop = tab.scrollPos;
    }, 0);
  }

  updateStatus();
  renderTabs();

  if (dirty) {
    dirtyDot.classList.add('on');
  } else {
    dirtyDot.classList.remove('on');
  }
}

function openFileInTab(filePath, content) {
  // Check if file is already open
  const existingIndex = openTabs.findIndex(tab => tab.filePath === filePath);

  if (existingIndex >= 0) {
    // Switch to existing tab
    switchToTab(existingIndex);
    return;
  }

  // Save current tab state before opening new one
  saveCurrentTabState();

  // Create new tab
  const langExt = pickLanguage(filePath.split(/[\\/]/).pop());
  const newTab = createTab(filePath, content, langExt);

  openTabs.push(newTab);
  activeTabIndex = openTabs.length - 1;

  currentFile = filePath;
  currentLangExt = langExt;
  dirty = false;

  rebuildEditor(content);
  updateStatus();
  renderTabs();
  dirtyDot.classList.remove('on');
}

async function closeEditorTab(index) {
  if (index < 0 || index >= openTabs.length) return;

  const tab = openTabs[index];

  // Check if tab has unsaved changes
  if (tab.dirty) {
    const shouldClose = confirm(`${getTabName(tab.filePath)} has unsaved changes. Close anyway?`);
    if (!shouldClose) return;
  }

  // Remove tab
  openTabs.splice(index, 1);

  // Adjust active tab index
  if (openTabs.length === 0) {
    // No tabs left, create empty tab
    activeTabIndex = -1;
    currentFile = null;
    currentLangExt = null;
    dirty = false;
    rebuildEditor('');
    updateStatus();
    renderTabs();
    dirtyDot.classList.remove('on');
    try { localStorage.removeItem('kitSession'); } catch(_) {}
  } else {
    // Switch to adjacent tab
    if (index === activeTabIndex) {
      // Closing active tab, switch to previous or next
      const newIndex = Math.min(index, openTabs.length - 1);
      activeTabIndex = -1; // Reset to force switch
      switchToTab(newIndex);
    } else if (index < activeTabIndex) {
      // Closed tab before active, adjust index
      activeTabIndex--;
      renderTabs();
    } else {
      // Closed tab after active, no adjustment needed
      renderTabs();
    }
  }
}

function markCurrentTabDirty() {
  if (activeTabIndex >= 0 && activeTabIndex < openTabs.length) {
    openTabs[activeTabIndex].dirty = true;
    renderTabs();
  }
}

function markCurrentTabClean() {
  if (activeTabIndex >= 0 && activeTabIndex < openTabs.length) {
    openTabs[activeTabIndex].dirty = false;
    renderTabs();
  }
}

function setTitle(n) { document.title = 'Kit — ' + (n || 'untitled.txt') + (dirty ? ' •' : '') }
function sanitizeDisplayPath(p) {
  if (!p) return '';
  const m = p.match(/^\/tmp\/\.mount_[^/]+\/resources\/app\.asar\/(.*)/);
  if (m) return 'Kit App » ' + m[1];
  const asar = p.match(/\/app\.asar\/(.*)/);
  if (asar) return 'App » ' + asar[1];
  return p;
}
function updateStatus() {
  const name = currentFile ? currentFile.split(/[\\/]/).pop() : 'untitled.txt'
  const rawDir = currentFile ? currentFile.slice(0, currentFile.length - name.length - 1) : (termCwd || '')
  fileInfo.textContent = name
  pathInfo.textContent = sanitizeDisplayPath(rawDir)
  setTitle(name)

  // Show/hide markdown preview button (only in editor mode)
  const previewBtn = document.getElementById('markdownPreview');
  if (previewBtn) {
    const isMarkdownFile = name.toLowerCase().endsWith('.md');
    const isEditorMode = !document.body.classList.contains('browser-mode') &&
      !document.body.classList.contains('email-mode') &&
      !document.body.classList.contains('agent-mode') &&
      !document.body.classList.contains('whiteboard-mode') &&
      !document.body.classList.contains('stairs-mode') &&
      !document.body.classList.contains('calendar-mode');

    if (isMarkdownFile && isEditorMode) {
      previewBtn.classList.add('show');
      // Ensure listeners are set up
      ensureMarkdownPreviewSetup();
    } else {
      previewBtn.classList.remove('show');
      // Hide preview pane if it's open
      const previewPane = document.getElementById('markdownPreviewPane');
      if (previewPane && !previewPane.classList.contains('hidden')) {
        previewPane.classList.add('hidden');
      }
    }
  }
}
const extOf = (name) => (name || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || ''
function pickLanguage(name) {
  switch (extOf(name)) {
    // JavaScript/TypeScript
    case 'js': case 'mjs': case 'cjs': return javascript()
    case 'jsx': return javascript({ jsx: true })
    case 'ts': case 'mts': case 'cts': return javascript({ typescript: true })
    case 'tsx': return javascript({ jsx: true, typescript: true })

    // Python
    case 'py': case 'pyw': return python()

    // Web
    case 'html': case 'htm': return htmlLang()
    case 'css': case 'scss': case 'sass': case 'less': return cssLang()
    case 'xml': case 'svg': return xml()

    // Data formats
    case 'json': case 'jsonc': return jsonLang()
    case 'yml': case 'yaml': return yaml()
    case 'toml': return StreamLanguage.define(tomlLegacy)

    // Documentation
    case 'md': case 'markdown': case 'mdown': return markdown()

    // Systems languages
    case 'c': case 'h': case 'cpp': case 'cc': case 'cxx': case 'hpp': case 'hxx': return cpp()
    case 'rs': return rust()
    case 'go': return StreamLanguage.define(goLegacy)

    // JVM languages
    case 'java': return java()
    case 'kt': case 'kts': return java() // Kotlin uses similar syntax

    // Other popular languages
    case 'php': case 'phtml': return php()
    case 'rb': case 'ruby': return StreamLanguage.define(rubyLegacy)
    case 'swift': return StreamLanguage.define(swiftLegacy)
    case 'dart': return java() // Dart uses C-style syntax

    // Shell/Scripts
    case 'sh': case 'bash': case 'zsh': case 'fish': return StreamLanguage.define(shellLegacy)

    // Database
    case 'sql': case 'mysql': case 'pgsql': return sql()

    default: return []
  }
}
function insertText(view, text) {
  const tr = view.state.changeByRange(range => ({ changes: { from: range.from, to: range.to, insert: text }, range: EditorSelection.cursor(range.from + text.length) }))
  view.dispatch(tr); return true
}
function smartTab(view) {
  const sel = view.state.selection
  if (sel.main.empty) return insertText(view, '  ')
  return indentWithTab(view)
}
function buildExtensions() {
  const base = [
    history(),
    keymap.of([{ key: 'Tab', run: smartTab }, ...historyKeymap, ...defaultKeymap]),
    lineNumbers(),
    highlightActiveLine(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    highlightSelectionMatches(),
    indentUnit.of(' '.repeat(editorSettings.tabSize || 2))
  ]
  if (editorSettings.lineWrap) base.push(EditorView.lineWrapping)
  if (darkMode) base.push(oneDark)
  if (currentLangExt) base.push(currentLangExt)
  return base
}
function rebuildEditor(keepDoc) {
  const doc = keepDoc !== undefined ? keepDoc : (editor ? editor.state.doc.toString() : '')
  if (editor) { editor.destroy() }
  const state = EditorState.create({ doc, extensions: buildExtensions() })
  editor = new EditorView({ state, parent: document.getElementById('editor') })
  const markDirty = () => {
    dirty = true;
    dirtyDot.classList.add('on');
    setTitle(currentFile ? currentFile.split(/[\\/]/).pop() : 'untitled.txt');
    markCurrentTabDirty();
  }
  editor.contentDOM.addEventListener('input', markDirty)
  editor.contentDOM.addEventListener('paste', markDirty)
  editor.contentDOM.addEventListener('drop', markDirty)
  editor.contentDOM.addEventListener('keydown', (e) => { const k = e.key; if (k === 'Enter' || k === 'Backspace' || k === 'Delete' || k === ' ' || (k.length === 1 && !e.metaKey && !e.ctrlKey)) markDirty() })
}
rebuildEditor('');
updateStatus();

// Initialize with one empty tab
openTabs.push(createTab(null, '', null));
activeTabIndex = 0;
renderTabs();

function applyTheme(mode) {
  darkMode = (mode === 'dark');
  document.body.classList.toggle('dark', darkMode);
  document.body.classList.toggle('light', !darkMode);
  window.kit?.setTheme(darkMode ? 'dark' : 'light');
  rebuildEditor();
  localStorage.setItem('kit.theme', darkMode ? 'dark' : 'light');
}
; (function initTheme() { const saved = localStorage.getItem('kit.theme'); const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; applyTheme(saved || (prefersDark ? 'dark' : 'light')) })()

async function saveFlow() {
  const getDoc = () => editor.state.doc.toString()
  if (currentFile) {
    const r = await window.kit.writeFile(currentFile, getDoc());
    if (!r.ok) {
      alert('Save failed: ' + r.error);
      return;
    }
    dirty = false;
    dirtyDot.classList.remove('on');
    markCurrentTabClean();
    updateStatus();
    updateGitInfo();
  } else {
    const fp = await window.kit.saveAs('untitled.txt');
    if (!fp) return;
    currentFile = fp;
    const r = await window.kit.writeFile(fp, getDoc());
    if (!r.ok) {
      alert('Save failed: ' + r.error);
      return;
    }

    // Update current tab with new file path
    if (activeTabIndex >= 0 && activeTabIndex < openTabs.length) {
      openTabs[activeTabIndex].filePath = fp;
      openTabs[activeTabIndex].langExt = pickLanguage(fp.split(/[\\/]/).pop());
    }

    dirty = false;
    dirtyDot.classList.remove('on');
    markCurrentTabClean();
    updateStatus();
    updateGitInfo();
  }
}
window.addEventListener('keydown', (e) => {
  const mac = /Mac/i.test(navigator.platform);
  const meta = mac ? e.metaKey : e.ctrlKey;

  // Save file
  if (meta && e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveFlow();
  }

  // Find in file (editor) or find in page (browser)
  if (meta && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    if (document.body.classList.contains('browser-mode')) {
      browserOpenFind();
    } else {
      openSearchPanel(editor);
      editor.focus();
    }
  }

  // Whiteboard Mode (Cmd+W / Ctrl+W) - only in editor mode, no shift
  if (meta && e.key.toLowerCase() === 'w' && !e.shiftKey) {
    const isEditorMode = !document.body.classList.contains('browser-mode') &&
      !document.body.classList.contains('email-mode') &&
      !document.body.classList.contains('agent-mode') &&
      !document.body.classList.contains('whiteboard-mode') &&
      !document.body.classList.contains('stairs-mode') &&
      !document.body.classList.contains('calendar-mode');
    if (isEditorMode) {
      e.preventDefault();
      if (activeTabIndex >= 0 && openTabs.length > 1) {
        closeEditorTab(activeTabIndex);
      } else {
        setWhiteboardMode(true);
      }
    }
  }

  // Next tab (Cmd+Shift+] / Ctrl+Shift+])
  if (meta && e.shiftKey && e.key === ']') {
    e.preventDefault();
    if (openTabs.length > 1) {
      const nextIndex = (activeTabIndex + 1) % openTabs.length;
      switchToTab(nextIndex);
    }
  }

  // Previous tab (Cmd+Shift+[ / Ctrl+Shift+[)
  if (meta && e.shiftKey && e.key === '[') {
    e.preventDefault();
    if (openTabs.length > 1) {
      const prevIndex = (activeTabIndex - 1 + openTabs.length) % openTabs.length;
      switchToTab(prevIndex);
    }
  }

  // Email mode (Ctrl+M / Cmd+M)
  if (meta && e.key.toLowerCase() === 'm') {
    e.preventDefault();
    setEmailMode(!document.body.classList.contains('email-mode'));
  }
})
themeToggle?.addEventListener('click', () => applyTheme(darkMode ? 'light' : 'dark'))

// ===== Input & Confirm Dialog Helpers =====
const inputModal = $('#inputModal'), inputModalTitle = $('#inputModalTitle'), inputModalInput = $('#inputModalInput'), inputModalCancel = $('#inputModalCancel'), inputModalOk = $('#inputModalOk')
const confirmModal = $('#confirmModal'), confirmModalTitle = $('#confirmModalTitle'), confirmModalMsg = $('#confirmModalMsg'), confirmCancel = $('#confirmCancel'), confirmOk = $('#confirmOk')

function inputDialog({ title = 'Input', placeholder = '', value = '' } = {}) {
  return new Promise(resolve => {
    inputModalTitle.textContent = title
    inputModalInput.value = value || ''
    inputModalInput.placeholder = placeholder || ''
    inputModal.classList.remove('hidden')
    setTimeout(() => inputModalInput.focus(), 0)
    function done(v) { cleanup(); resolve(v) }
    function onKey(e) { if (e.key === 'Enter') { done(inputModalInput.value.trim() || null) } if (e.key === 'Escape') { done(null) } }
    function onCancel() { done(null) }
    function onOk() { done(inputModalInput.value.trim() || null) }
    function cleanup() {
      inputModal.classList.add('hidden')
      inputModalInput.removeEventListener('keydown', onKey)
      inputModalCancel.removeEventListener('click', onCancel)
      inputModalOk.removeEventListener('click', onOk)
    }
    inputModalInput.addEventListener('keydown', onKey)
    inputModalCancel.addEventListener('click', onCancel)
    inputModalOk.addEventListener('click', onOk)
  })
}
function confirmDialog({ title = 'Confirm', message = 'Are you sure?' } = {}) {
  return new Promise(resolve => {
    confirmModalTitle.textContent = title
    confirmModalMsg.textContent = message
    confirmModal.classList.remove('hidden')
    function done(v) { cleanup(); resolve(v) }
    function onKey(e) { if (e.key === 'Escape') { done(false) } if (e.key === 'Enter') { done(true) } }
    function onCancel() { done(false) }
    function onOk() { done(true) }
    function cleanup() {
      confirmModal.classList.add('hidden')
      document.removeEventListener('keydown', onKey)
      confirmCancel.removeEventListener('click', onCancel)
      confirmOk.removeEventListener('click', onOk)
    }
    document.addEventListener('keydown', onKey)
    confirmCancel.addEventListener('click', onCancel)
    confirmOk.addEventListener('click', onOk)
  })
}

// ===== AI modal =====
let activeKeyProvider = 'openai';

function openAiKeyModal() {
  aiKeyInput.value = '';
  aiKeyInput.type = 'password';
  const eyeIcon = document.getElementById('aiKeyEyeIcon');
  if (eyeIcon) eyeIcon.innerHTML = `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>`;
  // Inject brand icons into provider cards
  const oaiSlot = document.getElementById('apiIconOpenAI');
  const antSlot = document.getElementById('apiIconAnthropic');
  if (oaiSlot && !oaiSlot.hasChildNodes()) oaiSlot.innerHTML = _BRAND.openai;
  if (antSlot && !antSlot.hasChildNodes()) antSlot.innerHTML = _BRAND.anthropic;
  activeKeyProvider = 'openai';
  _updateKeyModalTab('openai');
  _updateKeyDots();
  aiKeyModal.classList.remove('hidden');
  setTimeout(() => aiKeyInput.focus(), 0);
}
function closeAiKeyModal() { aiKeyModal.classList.add('hidden') }

function _updateKeyModalTab(provider) {
  activeKeyProvider = provider;
  document.querySelectorAll('.api-tab').forEach(t => t.classList.toggle('active', t.dataset.provider === provider));
  const hint = document.getElementById('aiKeyHint');
  if (provider === 'openai') {
    aiKeyInput.placeholder = 'sk-...';
    if (hint) hint.textContent = 'OpenAI key — starts with sk-';
  } else {
    aiKeyInput.placeholder = 'sk-ant-...';
    if (hint) hint.textContent = 'Anthropic key — starts with sk-ant-';
  }
}

async function _updateKeyDots() {
  const openaiDot = document.getElementById('openaiKeyDot');
  const anthropicDot = document.getElementById('anthropicKeyDot');
  try {
    const [hasOAI, hasAnt] = await Promise.all([window.kit.hasKey('openai'), window.kit.hasKey('anthropic')]);
    if (openaiDot) openaiDot.style.display = hasOAI ? '' : 'none';
    if (anthropicDot) anthropicDot.style.display = hasAnt ? '' : 'none';
  } catch (_) {}
}

// Check if AI key is already set on startup
async function checkAIKeyStatus() {
  try {
    const [hasOAI, hasAnt] = await Promise.all([window.kit.hasKey('openai'), window.kit.hasKey('anthropic')]);
    if (hasOAI || hasAnt) {
      aiToggle?.classList.add('ai-on');
    } else {
      aiToggle?.classList.remove('ai-on');
    }
  } catch (e) {
    aiToggle?.classList.remove('ai-on');
  }
}

// Check AI status on load
setTimeout(checkAIKeyStatus, 1000);

aiToggle?.addEventListener('click', () => { openAiKeyModal(); })

document.querySelectorAll('.api-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    _updateKeyModalTab(tab.dataset.provider);
    aiKeyInput.value = '';
    aiKeyInput.focus();
  });
});

aiKeyCancel?.addEventListener('click', () => { closeAiKeyModal() })

document.getElementById('aiKeyRemove')?.addEventListener('click', async () => {
  await window.kit.clearKey(activeKeyProvider);
  aiKeyInput.value = '';
  await checkAIKeyStatus();
  await _updateKeyDots();
});

aiKeySave?.addEventListener('click', async () => {
  const k = (aiKeyInput.value || '').trim();
  if (!k) return;
  const ok = await KIT.setApiKey(k, activeKeyProvider);
  if (ok) {
    await checkAIKeyStatus();
    await _updateKeyDots();
    closeAiKeyModal();
  } else {
    alert('Failed to set API key');
  }
})

aiKeyInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') aiKeySave.click(); if (e.key === 'Escape') aiKeyCancel.click() })

document.getElementById('aiKeyEye')?.addEventListener('click', () => {
  if (!aiKeyInput) return;
  const show = aiKeyInput.type === 'password';
  aiKeyInput.type = show ? 'text' : 'password';
  const icon = document.getElementById('aiKeyEyeIcon');
  if (icon) icon.innerHTML = show
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>`;
})

async function aiTask(prompt) {
  if (aiInFlight) return;
  aiInFlight = true;
  const name = currentFile ? currentFile.split(/[\\/]/).pop() : 'untitled.txt'
  const content = editor?.state?.doc?.toString() || ''
  const input = `${prompt}\n\n<file name="${name}">\n${content}\n</file>`
  const model = selectedModel();
  const rules = await loadProjectRules(termCwd);
  const system = rules ? `PROJECT RULES (follow strictly):\n${rules}` : undefined;
  try {
    showSpinner();
    const resp = await window.kit.aiRequest({ model, input, system })
    let aiOut = resp.ok ? (resp.text || '') : '! AI error: ' + (resp.error || 'unknown');
    if (resp.ok && resp.citations?.length) {
      aiOut += '\n\nSources:\n' + resp.citations.map(c => `  ${c.title}\n  ${c.url}`).join('\n');
    }
    termOut.textContent += aiOut + "\n";
    termOut.scrollTop = termOut.scrollHeight
  } finally {
    aiInFlight = false;
    hideSpinner();
  }
}

async function aiTaskWindow(prompt, title = 'AI Result') {
  if (aiInFlight) return;
  aiInFlight = true;
  const name = currentFile ? currentFile.split(/[\\/]/).pop() : 'untitled.txt'
  const content = editor?.state?.doc?.toString() || ''
  const input = `${prompt}\n\n<file name="${name}">\n${content}\n</file>`
  const model = selectedModel();
  const rules = await loadProjectRules(termCwd);
  const system = rules ? `PROJECT RULES (follow strictly):\n${rules}` : undefined;
  try {
    showSpinner();
    const resp = await window.kit.aiRequest({ model, input, system })
    if (resp.ok) {
      // Detect language from current file
      const ext = extOf(name);
      let language = 'javascript'; // default
      if (['py', 'pyw'].includes(ext)) language = 'python';
      else if (['ts', 'tsx'].includes(ext)) language = 'typescript';
      else if (['go'].includes(ext)) language = 'go';
      else if (['rs'].includes(ext)) language = 'rust';
      else if (['java'].includes(ext)) language = 'java';
      else if (['cpp', 'cc', 'cxx', 'c', 'h'].includes(ext)) language = 'cpp';
      else if (['rb', 'ruby'].includes(ext)) language = 'ruby';
      else if (['php'].includes(ext)) language = 'php';
      // Format the response as HTML
      const htmlContent = `<pre style="white-space:pre-wrap;word-wrap:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;line-height:1.6;margin:0;">${escapeHtml(resp.text)}</pre>`;
      window.kit.openResultWindow({ html: htmlContent, title: title, language: language });
    } else {
      termOut.textContent += '! AI error: ' + (resp.error || 'unknown') + "\n";
      termOut.scrollTop = termOut.scrollHeight;
    }
  } finally {
    aiInFlight = false;
    hideSpinner();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

aiSummarize?.addEventListener('click', () => aiTaskWindow("Summarize the following source file. Include purpose, key functions/classes, inputs/outputs, dependencies, and notable side effects. Keep it ≤200 words.", "Code Summary"))
aiCheck?.addEventListener('click', () => aiTaskWindow("You are a strict code reviewer. Identify bugs, runtime errors, edge cases, security pitfalls, and style/lint issues with line numbers and concise fixes.", "Error Check"))
aiTests?.addEventListener('click', () => aiTaskWindow("Generate comprehensive unit tests for this code. Include:\n- Test setup/teardown if needed\n- Tests for main functionality\n- Edge cases and error handling\n- Mock external dependencies\n- Use appropriate testing framework (Jest for JS/TS, pytest for Python, etc.)\n- Include clear test descriptions\n- Aim for high code coverage\n\nProvide complete, runnable test code.", "Generated Tests"))

// ===== File tree (editor mode) =====
function iconFor(name, isDir) {
  if (isDir) return ICON.dir
  const ext = (name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]) || ''
  const fc = (cls) => _ico(15, 15, _L.fileCode, `ft-icon${cls ? ' ' + cls : ''}`)
  const ft = (cls) => _ico(15, 15, _L.fileText, `ft-icon${cls ? ' ' + cls : ''}`)
  if (['png','jpg','jpeg','gif','webp','bmp','svg'].includes(ext)) return ICON.file
  if (['zip','tar','gz','bz2','xz','7z','rar'].includes(ext))       return ICON.file
  if (['md','markdown'].includes(ext))                               return ft('ft-md')
  if (['json'].includes(ext))                                        return ft('ft-json')
  if (['yaml','yml'].includes(ext))                                  return ft()
  if (['css','scss','sass','less'].includes(ext))                    return fc('ft-css')
  if (['html','htm'].includes(ext))                                  return fc('ft-html')
  if (['sql'].includes(ext))                                         return ICON.database
  if (['xml'].includes(ext))                                         return fc()
  if (['py'].includes(ext))                                          return fc('ft-py')
  if (['js','mjs','cjs','jsx'].includes(ext))                        return fc('ft-js')
  if (['ts','tsx'].includes(ext))                                    return fc('ft-ts')
  if (['sh','bash','zsh'].includes(ext))                             return fc('ft-sh')
  if (['toml','ini','cfg','conf','env'].includes(ext))               return ft()
  return ICON.file
}
function renderTree(nodes, depth = 0, basePath = '') {
  const frag = document.createDocumentFragment()
  for (const n of nodes) {
    const el = document.createElement('div'); el.className = `item ${n.dir ? 'dir' : 'file'}`; el.style.paddingLeft = `${6 + depth * 12}px`
    el.innerHTML = `<span class="ico">${iconFor(n.name, !!n.dir)}</span><span class="name"></span>`
    el.querySelector('.name').textContent = n.name
    const full = (basePath.endsWith('/') ? basePath : basePath + '/') + n.name
    el.title = full
    if (n.dir) {
      const isStarred = localStorage.getItem('kitStarredFolder') === full
      const starBtn = document.createElement('button')
      starBtn.className = 'tree-star-btn' + (isStarred ? ' starred' : '')
      starBtn.innerHTML = isStarred ? ICON.starFilled : ICON.starOutline
      starBtn.title = isStarred ? 'Unstar folder' : 'Star as default folder'
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        const current = localStorage.getItem('kitStarredFolder')
        if (current === full) {
          localStorage.removeItem('kitStarredFolder')
        } else {
          localStorage.setItem('kitStarredFolder', full)
        }
        updateStarredFolderBtn()
        refreshSidebar()
      })
      el.appendChild(starBtn)
      let expanded = false, block = null
      el.addEventListener('click', async () => { if (!expanded) { const listed = await window.kit.list(full); if (listed.ok) { block = document.createElement('div'); block.appendChild(renderTree(listed.items, depth + 1, full)); el.after(block); expanded = true } } else { block?.remove(); block = null; expanded = false } })
    } else {
      el.addEventListener('click', async () => {
        const res = await window.kit.readFile(full);
        if (res.ok) {
          openFileInTab(full, res.data);
        } else {
          alert('Read failed: ' + (res.error || 'unknown'));
        }
      })
    }
    frag.appendChild(el)
  }
  return frag
}

function updateStarredFolderBtn() {
  const btn = document.getElementById('starredFolderBtn')
  if (!btn) return
  const sf = localStorage.getItem('kitStarredFolder')
  btn.classList.toggle('active', !!sf)
  btn.style.opacity = sf ? '1' : '0.4'
  btn.title = sf ? `Go to starred: ${sf.split('/').pop()}` : 'No starred folder yet — hover a folder and click the star'
}
// Persistent toggle for sidebar
toggleSidebarBtn?.addEventListener('click', () => {
  const body = document.body;
  if (body.classList.contains('agent-mode')) {
    const opening = body.classList.toggle('agent-sidebar-open');
    if (opening) { agentLoadProjects(); agentUpdateWorkspacePath(); }
  } else if (body.classList.contains('stairs-mode')) {
    body.classList.toggle('stairs-sidebar-open');
  } else if (body.classList.contains('email-mode')) {
    body.classList.toggle('email-sidebar-open');
  } else if (body.classList.contains('calendar-mode')) {
    body.classList.toggle('cal-sidebar-open');
  } else {
    const open = body.classList.toggle('sidebar-open');
    if (open) refreshSidebar();
  }
})

// Close sidebar when clicking outside it
document.addEventListener('click', (e) => {
  if (!document.body.classList.contains('sidebar-open')) return;
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  if (sb.contains(e.target) || toggleSidebarBtn?.contains(e.target)) return;
  document.body.classList.remove('sidebar-open');
})



// Writing mode toolbar buttons
document.getElementById('exportMarkdownToolbar')?.addEventListener('click', () => {
  document.getElementById('exportMarkdown')?.click();
})

document.getElementById('importMarkdownToolbar')?.addEventListener('click', () => {
  document.getElementById('importMarkdown')?.click();
})

// Writing mode formatting buttons
document.getElementById('headerToolbar')?.addEventListener('click', () => {
  insertWritingText('# ');
})

document.getElementById('listToolbar')?.addEventListener('click', () => {
  insertWritingText('- ');
})

document.getElementById('checklistToolbar')?.addEventListener('click', () => {
  insertWritingText('- [ ] ');
})

document.getElementById('quoteToolbar')?.addEventListener('click', () => {
  insertWritingText('> ');
})

document.getElementById('codeToolbar')?.addEventListener('click', () => {
  insertWritingText('```\n\n```');
})

document.getElementById('hashtagToolbar')?.addEventListener('click', () => {
  insertWritingText('#hashtag ');
})

document.getElementById('dividerToolbar')?.addEventListener('click', () => {
  insertWritingText('\n---\n\n');
})

document.getElementById('paragraphToolbar')?.addEventListener('click', () => {
  insertWritingText('\n\n');
})

document.getElementById('inlineCodeToolbar')?.addEventListener('click', () => {
  insertWritingText('`inline code`');
})

document.getElementById('highlightToolbar')?.addEventListener('click', () => {
  insertWritingText('==highlighted text==');
})

let _writingEditorView = null;
function setWritingEditorView(view) { _writingEditorView = view; }

function insertWritingText(text) {
  if (_writingEditorView) {
    const pos = _writingEditorView.state.selection.main.head;
    _writingEditorView.dispatch({
      changes: { from: pos, insert: text }
    });
    _writingEditorView.focus();
  }
}


// Markdown Preview functionality
// Optimized markdown parser with caching
function updateMarkdownPreview() {
  const previewContent = document.getElementById('previewContent');
  const previewPane = document.getElementById('markdownPreviewPane');


  if (!previewContent || !previewPane) {
    return;
  }

  // Don't skip if hidden - we want to update when opening

  if (editor && editor.state) {
    const content = editor.state.doc.toString();

    // Always update when preview is first opened


    // Show loading state for large documents
    if (content.length > 10000) {
      previewContent.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">Rendering preview...</div>';

      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        const html = parseMarkdown(content);
        previewContent.innerHTML = html;
        previewContent.dataset.lastContent = content;
      });
    } else {
      if (!content || content.trim() === '') {
        previewContent.innerHTML = '<p style="color: #666; font-style: italic; padding: 20px;">No content to preview</p>';
        return;
      }

      const html = parseMarkdown(content);
      previewContent.innerHTML = html;
      previewContent.dataset.lastContent = content;
    }
  } else {
  }
}

// Markdown preview event listeners - simplified approach
function setupMarkdownPreviewListeners() {

  // Remove any existing event listeners by cloning
  const previewBtn = document.getElementById('markdownPreview');
  if (!previewBtn) {
    return;
  }


  // Create a new button to replace the old one (removes all event listeners)
  const newBtn = previewBtn.cloneNode(true);
  previewBtn.parentNode.replaceChild(newBtn, previewBtn);

  // Add click event listener
  newBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const previewPane = document.getElementById('markdownPreviewPane');

    if (previewPane) {
      const wasHidden = previewPane.classList.contains('hidden');
      previewPane.classList.toggle('hidden');

      if (!previewPane.classList.contains('hidden')) {
        // Force update by clearing the last content cache
        const previewContent = document.getElementById('previewContent');
        if (previewContent) {
          delete previewContent.dataset.lastContent;
          previewContent.innerHTML = ''; // Clear existing content
        }

        // Setup dragging and hot reload
        setTimeout(() => {
          setupPreviewDragging();
          startPreviewHotReload();
        }, 100);

        // Force immediate update with longer delay to ensure DOM is ready
        setTimeout(() => {
          updateMarkdownPreview();

          // Double-check the content was set
          setTimeout(() => {
            const content = document.getElementById('previewContent');
          }, 100);
        }, 50);
      } else {
        // Stop hot reload when closing
        stopPreviewHotReload();
      }
    } else {
    }
  });

}

document.addEventListener('DOMContentLoaded', () => {
  setupMarkdownPreviewListeners();
});

// Also set up when a markdown file is opened
function ensureMarkdownPreviewSetup() {
  setTimeout(setupMarkdownPreviewListeners, 100);
}

function setupClosePreviewListener() {
  const closeBtn = document.getElementById('closePreview');

  if (closeBtn) {
    // Remove any existing listeners
    const newBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newBtn, closeBtn);

    // Add fresh listener
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const previewPane = document.getElementById('markdownPreviewPane');
      if (previewPane) {
        previewPane.classList.add('hidden');
      }
    });
  }
}

// Make preview window draggable
function setupPreviewDragging() {
  const previewPane = document.getElementById('markdownPreviewPane');
  const previewHeader = document.getElementById('previewHeader');

  if (!previewPane || !previewHeader) {
    return;
  }


  let isDragging = false;
  let startX, startY, startLeft, startTop;

  // Remove any existing listeners first
  const newHeader = previewHeader.cloneNode(true);
  previewHeader.parentNode.replaceChild(newHeader, previewHeader);

  newHeader.addEventListener('mousedown', (e) => {

    // Only drag if clicking on header, not buttons
    if (e.target.closest('.preview-controls') || e.target.closest('.preview-control-btn')) {
      return;
    }

    isDragging = true;
    previewPane.classList.add('dragging');

    startX = e.clientX;
    startY = e.clientY;

    const rect = previewPane.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;


    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const newLeft = Math.max(0, Math.min(window.innerWidth - previewPane.offsetWidth, startLeft + deltaX));
    const newTop = Math.max(0, Math.min(window.innerHeight - previewPane.offsetHeight, startTop + deltaY));

    previewPane.style.left = newLeft + 'px';
    previewPane.style.top = newTop + 'px';
    previewPane.style.right = 'auto';

  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      previewPane.classList.remove('dragging');
    }
  });

  // Re-setup button listeners after cloning
  setupClosePreviewListener();
}

// Hot reload functionality
let previewUpdateInterval;

function startPreviewHotReload() {
  if (previewUpdateInterval) {
    clearInterval(previewUpdateInterval);
  }

  previewUpdateInterval = setInterval(() => {
    const previewPane = document.getElementById('markdownPreviewPane');
    if (previewPane && !previewPane.classList.contains('hidden')) {
      const previewContent = document.getElementById('previewContent');
      if (previewContent && editor && editor.state) {
        const currentContent = editor.state.doc.toString();
        const lastContent = previewContent.dataset.lastContent;

        if (currentContent !== lastContent) {
          updateMarkdownPreview();
        }
      }
    }
  }, 500); // Check every 500ms
}

function stopPreviewHotReload() {
  if (previewUpdateInterval) {
    clearInterval(previewUpdateInterval);
    previewUpdateInterval = null;
  }
}

document.addEventListener('DOMContentLoaded', setupClosePreviewListener);

// Update preview when editor content changes
let previewUpdateTimeout;
function schedulePreviewUpdate() {
  clearTimeout(previewUpdateTimeout);
  previewUpdateTimeout = setTimeout(updateMarkdownPreview, 300); // Reduced from 500ms to 300ms
}

// Hook into editor changes (this will need to be called when editor is created)
function setupMarkdownPreview() {
  if (editor && editor.state) {
    // Add change listener to editor
    const updateListener = () => {
      schedulePreviewUpdate();
    };

    // This is a simplified approach - you might need to adjust based on your editor setup
    if (editor.contentDOM) {
      editor.contentDOM.addEventListener('input', updateListener);
    }
  }
}

// Sidebar up button — navigate to parent directory
document.getElementById('sidebarUpBtn')?.addEventListener('click', () => {
  if (!termCwd || termCwd === '/') return
  const parent = termCwd.replace(/\/[^/]+\/?$/, '') || '/'
  termCwd = parent
  updateSideHeaderToCwd()
  refreshSidebar()
})

// Starred folder button
document.getElementById('starredFolderBtn')?.addEventListener('click', () => {
  const sf = localStorage.getItem('kitStarredFolder')
  if (!sf) return
  termCwd = sf
  updateSideHeaderToCwd()
  refreshSidebar()
})

// Quick-create buttons
const addFileBtn = document.getElementById('addFileBtn')
const addFolderBtn = document.getElementById('addFolderBtn')
addFileBtn?.addEventListener('click', async () => {
  if (document.body.classList.contains('browser-mode')) return
  if (!termCwd) return
  const name = await inputDialog({ title: 'New file', placeholder: 'name.ext' })
  if (!name) return
  const p = (termCwd.endsWith('/') ? termCwd : termCwd + '/') + name
  const r = await window.kit.writeFile(p, '')
  if (!r.ok) alert('Failed: ' + r.error)
  else refreshSidebar()
})
addFolderBtn?.addEventListener('click', async () => {
  if (document.body.classList.contains('browser-mode')) return
  if (!termCwd) return
  const name = await inputDialog({ title: 'New folder', placeholder: 'folder-name' })
  if (!name) return
  const p = (termCwd.endsWith('/') ? termCwd : termCwd + '/') + name
  const r = await window.kit.mkdir(p)
  if (!r.ok) alert('Failed: ' + r.error)
  else refreshSidebar()
})

// ===== Git status =====
let _isGitRepo = false;

async function updateGitInfo() {
  if (!termCwd || !gitInfo) return;
  try {
    const branchRes = await window.kit.exec(termCwd, 'git rev-parse --abbrev-ref HEAD 2>/dev/null');
    if (!branchRes.ok || !branchRes.output.trim()) { _isGitRepo = false; gitInfo.textContent = ''; return; }
    const branch = branchRes.output.trim().split('\n')[0];
    if (branch === 'HEAD') { _isGitRepo = false; gitInfo.textContent = ''; return; } // detached HEAD — skip
    _isGitRepo = true;

    const sha = (await window.kit.exec(termCwd, 'git rev-parse --short HEAD 2>/dev/null')).output.trim().split('\n')[0];

    // ahead/behind via rev-list — works on all git versions, no parsing ambiguity
    const aheadOut  = (await window.kit.exec(termCwd, 'git rev-list --count @{u}..HEAD 2>/dev/null')).output.trim();
    const behindOut = (await window.kit.exec(termCwd, 'git rev-list --count HEAD..@{u} 2>/dev/null')).output.trim();
    const ahead  = /^\d+$/.test(aheadOut)  ? +aheadOut  : 0;
    const behind = /^\d+$/.test(behindOut) ? +behindOut : 0;

    // modified/untracked via plain --porcelain (no version flag)
    const statusLines = (await window.kit.exec(termCwd, 'git status --porcelain 2>/dev/null')).output
      .split('\n').filter(Boolean);
    let modified = 0, untracked = 0;
    for (const l of statusLines) { if (l.startsWith('??')) untracked++; else modified++; }

    const branchEsc = escapeHtml(branch);
    const shaEsc = escapeHtml(sha);
    gitInfo.innerHTML = `<span style="vertical-align:-2px;margin-right:3px;opacity:.7">${ICON.gitBranch}</span>${branchEsc} @ ${shaEsc}${ahead || behind ? ` • ↑${ahead} ↓${behind}` : ''}${modified || untracked ? ` • Δ${modified} +${untracked}` : ''}`;
  } catch (_) { /* keep existing badge on transient errors */ }
}

// ===== Terminal =====
const term = document.getElementById('terminal'), termOut = document.getElementById('termOut'), termIn = document.getElementById('termIn')

// ===== Terminal color engine =====

// Patch termOut so every textContent write is colorized with no call-site changes
;(function patchTermOut() {
  const el = termOut
  if (!el) return
  let _raw = ''
  Object.defineProperty(el, 'textContent', {
    configurable: true,
    get() { return _raw },
    set(v) {
      if (!v) { _raw = ''; el.innerHTML = ''; return }
      if (typeof v === 'string' && v.startsWith(_raw)) {
        const newPart = v.slice(_raw.length)
        _raw = v
        if (newPart) { const s = document.createElement('span'); s.innerHTML = _termColorize(newPart); el.appendChild(s) }
      } else {
        _raw = v
        el.innerHTML = _termColorize(v)
      }
    }
  })
})()

async function initCwd() {
  try {
    const home = await window.kit.homeDir();
    // Only set termCwd if DOMContentLoaded hasn't set it yet (starred folder / session)
    const didSet = !termCwd;
    if (didSet) termCwd = home || '/';
    const outEl = document.getElementById('termOut');
    if (outEl) {
      outEl.textContent = (outEl.textContent || '') + "Type 'help' for built-ins.\n";
    }
    updateStatus();
    if (didSet) { refreshSidebar(); updateGitInfo(); updateSideHeaderToCwd(); }
  } catch (_) {}
}
initCwd()
updateSideHeaderToCwd()

// Stream terminal output chunks from main process in real time
// Normalize \r\n → \n and bare \r → \n so git progress lines render correctly
if (window.kit?.onTermOutput) {
  window.kit.onTermOutput((chunk) => {
    termOut.textContent += chunk.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    termOut.scrollTop = termOut.scrollHeight;
  });
}

// Ctrl+C kills the running process from anywhere in the terminal area
document.addEventListener('keydown', (e) => {
  if (e.key === 'c' && (e.ctrlKey || e.metaKey) && window._termRunning) {
    e.preventDefault();
    termOut.textContent += '^C\n';
    termOut.scrollTop = termOut.scrollHeight;
    window.kit?.killTerm?.();
  }
});

async function openFileFromTerminal(pathLike) {
  const p = pathLike.trim(); if (!p) return
  let full = p
  if (p.startsWith('~')) { const home = await window.kit.homeDir(); full = home + '/' + p.slice(1) }
  else if (!p.startsWith('/')) { const base = termCwd.endsWith('/') ? termCwd.slice(0, -1) : termCwd; full = base + '/' + p }
  full = normPath(full)
  const st = await window.kit.stat(full)
  if (!st.ok) { termOut.textContent += "! Not found: " + full + "\n"; return }
  if (st.isDir) { termOut.textContent += "! " + full + " is a directory.\n"; return }
  const res = await window.kit.readFile(full)
  if (!res.ok) { termOut.textContent += "! Read failed: " + res.error + "\n"; return }
  openFileInTab(full, res.data)
}
function commonPrefix(strings) { if (!strings.length) return ''; let p = strings[0]; for (let s of strings) { let i = 0; while (i < p.length && i < s.length && p[i] === s[i]) i++; p = p.slice(0, i); if (!p) break } return p }
async function completePath(input) {
  const raw = input
  const m = raw.match(/^(\S+)\s+(.*)$/)
  let head = null, pathPart = null
  if (m) { head = m[1]; pathPart = m[2] } else { head = null; pathPart = raw }
  const needsPath = !head || ['cd', 'open', 'e', 'edit', 'vi'].includes(head)
  if (!needsPath) return { newInput: raw, printed: '' }
  let baseDirPart = '', prefix = pathPart
  const slashIdx = pathPart.lastIndexOf('/')
  if (slashIdx >= 0) { baseDirPart = pathPart.slice(0, slashIdx + 1); prefix = pathPart.slice(slashIdx + 1) }
  const stripTrailingSlash = s => (typeof s === 'string' && s.endsWith('/')) ? s.slice(0, -1) : s
  let baseAbs = ''
  if (baseDirPart.startsWith('~') || pathPart.startsWith('~')) {
    const home = await window.kit.homeDir()
    let rest = baseDirPart || ''
    if (rest.startsWith('~/')) rest = rest.slice(2)
    else if (rest.startsWith('~')) rest = rest.slice(1)
    baseAbs = rest ? (stripTrailingSlash(home) + '/' + rest) : (home + '/')
  } else if (baseDirPart.startsWith('/')) {
    baseAbs = baseDirPart
  } else {
    baseAbs = stripTrailingSlash(termCwd) + '/' + baseDirPart
  }
  const st = await window.kit.stat(baseAbs || termCwd)
  if (!st.ok || !st.isDir) return { newInput: raw, printed: '' }
  const listed = await window.kit.list(baseAbs || termCwd)
  if (!listed.ok) return { newInput: raw, printed: '' }
  const names = listed.items.map(x => x.name).filter(n => n && n.startsWith(prefix))
  if (!names.length) return { newInput: raw, printed: '' }
  if (names.length === 1) {
    const only = names[0]
    const isDir = listed.items.find(x => x.name === only)?.dir
    const completed = baseDirPart + only + (isDir ? '/' : '')
    const headPart = head ? (head + ' ') : ''
    return { newInput: headPart + completed, printed: '' }
  }
  const pref = commonPrefix(names)
  if (pref && pref.length > prefix.length) {
    const headPart = head ? (head + ' ') : ''
    return { newInput: headPart + baseDirPart + pref, printed: '' }
  }
  return { newInput: raw, printed: names.join('  ') + '\n' }
}

termIn?.addEventListener('keydown', async (e) => {
  // Recall last command
  if (e.key === 'ArrowUp') { e.preventDefault(); if (lastCmd) { termIn.value = lastCmd; termIn.setSelectionRange(termIn.value.length, termIn.value.length); } return }
  // Tab completion behavior stays as-is (no-op here to avoid breaking typing)
  if (e.key === 'Tab') {
    e.preventDefault();
    try {
      const { newInput, printed } = await completePath(termIn.value || '');
      termIn.value = newInput;
      if (printed) { termOut.textContent += printed; termOut.scrollTop = termOut.scrollHeight; }
    } catch (_) { /* ignore */ }
    return
  }

  if (e.key !== 'Enter') return;

  let cmd = termIn.value.trim();
  if (cmd.startsWith('$')) cmd = cmd.replace(/^\$\s*/, '');
  termIn.value = '';
  if (!cmd) return;

  lastCmd = cmd;
  termOut.textContent += ('$ ' + cmd + '\n');

  const parts = cmd.split(' ');
  const head = parts[0];
  const rest = parts.slice(1);
  const arg = rest.join(' ').trim();

  try {
    // Built-ins
    if (head === 'help') {
      termOut.textContent += `Kit Terminal Commands:

Basic:
  help                    Show this help
  clear                   Clear terminal
  pwd                     Show current directory
  cd <path>               Change directory
  ls [path]               List files
  open <file>             Open file in editor
  e <file>                Alias for open
  edit <file>             Alias for open
  vi <file>               Alias for open
  close                   Close current file
  export VAR=value        Set environment variable
  unset VAR               Remove environment variable
  env VAR                 View environment variable
  exit                    Exit terminal

AI Commands:
  /ai <prompt>            Ask AI with full capabilities
  /ai <prompt> --file     Include current file in prompt
  /ai <prompt> --path <p> Include files from path
  /ai <prompt> --model <m> Use specific model
  ai-key set <key>        Set OpenAI API key
  ai-key clear            Clear API key

Code Generation:
  /ai code <description>  Generate code from description
  /ai complete --file     Complete current function/class
  /ai explain --file      Explain what the code does
  /ai fix <error> --file  Fix bugs or errors in code
  /ai test --file         Generate unit tests
  /ai convert <lang> --file Convert to another language
  /ai refactor --file     Improve code structure
  /ai optimize --file     Optimize for performance
  /ai document --file     Generate documentation
  /ai review --file       Code review and suggestions

Available Models:
  gpt-5.4                Latest flagship (default)
  gpt-5.4-mini           Fast & cost-effective
  gpt-5.4-nano           Fastest / cheapest
  gpt-4.1                Previous generation
  gpt-4.1-mini           Previous gen mini
  o3                     Advanced reasoning
  o4-mini                Fast reasoning
  claude-opus-4-7        Claude Opus 4.7
  claude-sonnet-4-6      Claude Sonnet 4.6
  claude-haiku-4-5-20251001 Claude Haiku 4.5

Examples:
  AI with Tools (Full capabilities):
    /ai what is the weather in New York right now?
    /ai search for latest JavaScript frameworks
    /ai read the package.json file and explain it
    /ai list files in the src directory
    /ai code a React component for user login
    /ai complete --file
    /ai explain --file
    /ai fix "undefined variable" --file --model o3
Keyboard Shortcuts:
  ⌘K (Ctrl+K)           Project search
  ⌘D (Ctrl+D)           Toggle dark/light mode
  ⌘W (Ctrl+W)           Whiteboard
  ⌘B (Ctrl+B)           Browser mode
  ⌘M (Ctrl+M)           Email
  ⌘E (Ctrl+E)           Toggle sidebar
  ⌘0 (Ctrl+0)           Return to main editor
  ⌘⇧A (Ctrl+Shift+A)   Kit Agent
  ⌘⇧R (Ctrl+Shift+R)   Stairs
  ⌘⇧P (Ctrl+Shift+P)   Command palette

`;
      return;
    }
    if (head === 'clear') { termOut.textContent = ''; return; }
    if (head === 'exit') { await window.kit.exit(); return; }
    if (head === 'pwd') { termOut.textContent += (termCwd || '') + '\n'; return; }

    if (['open', 'e', 'edit', 'vi'].includes(head)) {
      if (!arg) { termOut.textContent += '! usage: open <file>\n'; return; }
      await openFileFromTerminal(arg);
      return;
    }

    if (head === 'close') {
      const nameArg = (arg || '').trim();
      if (!currentFile) {
        termOut.textContent += '! no file is open\n';
        return;
      }
      const activeName = currentFile.split(/[\\/]/).pop();
      if (nameArg && nameArg !== activeName && nameArg !== currentFile) {
        termOut.textContent += '! ' + nameArg + ' is not the active file (' + activeName + ')\n';
        return;
      }
      currentFile = null;
      currentLangExt = null;
      dirty = false;
      try { dirtyDot.classList.remove('on'); } catch (_) { }
      rebuildEditor('');
      updateStatus();
      termOut.textContent += '✓ closed current file\n';
      return;
    }

    if (head === 'cd') {
      const target = arg || '~';
      let full = target;
      if (target.startsWith('~')) { const home = await window.kit.homeDir(); full = home + '/' + target.slice(1); }
      else if (!target.startsWith('/')) { const base = termCwd && termCwd.endsWith('/') ? termCwd.slice(0, -1) : (termCwd || ''); full = base + '/' + target; }
      try { full = normPath(full); } catch (_) { }
      const st = await window.kit.stat(full);
      if (!st.ok || !st.isDir) { termOut.textContent += '! Not a directory: ' + full + '\n'; return; }
      termCwd = full;
      updateSideHeaderToCwd();
      termOut.textContent += '→ ' + termCwd + '\n';
      refreshSidebar(); updateGitInfo(); if (!currentFile) updateStatus();
      return;
    }

    if (head === 'export') {
      if (!arg || !arg.includes('=')) {
        termOut.textContent += '! usage: export VAR=value\n';
        return;
      }
      const eqIdx = arg.indexOf('=');
      const key = arg.substring(0, eqIdx).trim();
      const value = arg.substring(eqIdx + 1).trim();
      await window.kit.setEnv(key, value);
      termOut.textContent += `✓ ${key}=${value}\n`;
      return;
    }

    if (head === 'unset') {
      if (!arg) {
        termOut.textContent += '! usage: unset VAR\n';
        return;
      }
      await window.kit.setEnv(arg.trim(), null);
      termOut.textContent += `✓ unset ${arg.trim()}\n`;
      return;
    }

    if (head === 'env') {
      if (arg) {
        const result = await window.kit.getEnv(arg.trim());
        termOut.textContent += result.value ? `${arg.trim()}=${result.value}\n` : `${arg.trim()} not set\n`;
      } else {
        termOut.textContent += '! usage: env VAR (to view a specific variable)\n';
      }
      return;
    }

    if (head === 'ai-key') {
      const sub = (arg.split(/\s+/)[0] || '').toLowerCase();
      if (sub === 'clear') { const ok = await (KIT?.setKey || window.kit.setKey)(''); termOut.textContent += (ok ? '✓ cleared AI key\n' : '! Failed to clear\n'); return; }
      if (sub === 'set') { const key = arg.replace(/^set\s+/, ''); const ok = await (KIT?.setKey || window.kit.setKey)(key); termOut.textContent += (ok ? '✓ AI key set\n' : '! Failed to set key\n'); return; }
      termOut.textContent += '! usage: ai-key set <sk-...> | ai-key clear\n'; return;
    }

    if (head === '/ai') {
      await processAiCommand(arg);
      return;
    }



    // Fallback to shell — output is streamed live via onTermOutput
    const prevPlaceholder = termIn.placeholder;
    termIn.disabled = true;
    termIn.placeholder = 'Ctrl+C to stop…';
    window._termRunning = true;
    try {
      const res = await window.kit.run(termCwd, cmd);
      if (res.output) { termOut.textContent += res.output; termOut.scrollTop = termOut.scrollHeight; }
      else { termOut.textContent += '\n'; termOut.scrollTop = termOut.scrollHeight; }
    } finally {
      window._termRunning = false;
      termIn.disabled = false;
      termIn.placeholder = prevPlaceholder;
      termIn.focus();
    }
  } catch (err) {
    termIn.disabled = false;
    termIn.focus();
    termOut.textContent += ('! ' + (err?.message || String(err)) + '\n');
    termOut.scrollTop = termOut.scrollHeight;
  }
})

// ===== Browser Mode =====
let browserTabs = JSON.parse(localStorage.getItem('kit.tabs') || '[]')
let activeTabId = localStorage.getItem('kit.activeTab') || null
let bookmarks = JSON.parse(localStorage.getItem('kit.bookmarks') || '[]')
function persistTabs() { localStorage.setItem('kit.tabs', JSON.stringify(browserTabs)); localStorage.setItem('kit.activeTab', activeTabId || '') }
function persistBookmarks() { localStorage.setItem('kit.bookmarks', JSON.stringify(bookmarks)) }

function getFaviconUrl(u) { try { const url = new URL(u); return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`; } catch (_) { return ''; } }

function openInWebview(target) {
  const wv = document.getElementById('webview');
  const view = document.getElementById('browserView');
  if (!wv || !view) return;
  const url = toUrl(target);
  if (!url) return;
  view.classList.remove('hidden'); omniClear();
  wv.setAttribute('src', url);
  try {
    wv.addEventListener('dom-ready', () => { try { wv.setZoomFactor(0.85); } catch (_) {} }, { once: true });
    wv.addEventListener('page-title-updated', (e) => {
      const title = e.title || url;
      let cur = '';
      try { cur = (wv.getURL && typeof wv.getURL === 'function') ? wv.getURL() : (wv.getAttribute ? wv.getAttribute('src') : '') } catch (_) { }
      cur = cur || url;
      if (activeTabId) {
        const t = browserTabs.find(x => x.id === activeTabId);
        if (t) { t.title = title; t.url = cur; t.favicon = getFaviconUrl(cur); persistTabs(); refreshSidebar(); }
      }
    });
    try {
      wv.addEventListener('did-navigate', () => {
        try {
          const curUrl = (wv.getURL && typeof wv.getURL === 'function') ? wv.getURL() : (wv.getAttribute ? wv.getAttribute('src') : '');
          const t = findTab(activeTabId); if (t) { t.favicon = getFaviconUrl(curUrl); persistTabs(); refreshSidebar(); }
        } catch (_) { }
      });
      wv.addEventListener('did-navigate-in-page', () => {
        try {
          const curUrl = (wv.getURL && typeof wv.getURL === 'function') ? wv.getURL() : (wv.getAttribute ? wv.getAttribute('src') : '');
          const t = findTab(activeTabId); if (t) { t.favicon = getFaviconUrl(curUrl); persistTabs(); refreshSidebar(); }
        } catch (_) { }
      });
    } catch (_) { }
  } catch (_) { }
}
function newTab(url = '', useDefault = false) {
  const id = 't_' + Date.now() + '_' + Math.random().toString(16).slice(2);
  const defaultUrl = url || (useDefault ? 'https://duckduckgo.com' : '');
  const tab = { id, title: defaultUrl === 'https://duckduckgo.com' ? 'DuckDuckGo' : (defaultUrl || 'New Tab'), url: defaultUrl };
  tab.favicon = getFaviconUrl(tab.url);
  browserTabs.unshift(tab);
  activeTabId = id;
  persistTabs();
  showTab(tab);
  refreshSidebar();
}
function findTab(id) { return browserTabs.find(t => t.id === id) }
function setActiveTab(id) { const t = findTab(id); if (!t) return; activeTabId = id; persistTabs(); showTab(t) }
function closeTab(id) {
  const idx = browserTabs.findIndex(t => t.id === id);
  if (idx >= 0) {
    const wasActive = browserTabs[idx].id === activeTabId;
    browserTabs.splice(idx, 1);
    if (wasActive) {
      activeTabId = browserTabs[0]?.id || null;
      if (activeTabId) { showTab(findTab(activeTabId)) } else { clearWebview() }
    }
    persistTabs(); refreshSidebar();
  }
}
function clearWebview() {
  const wv = document.getElementById('webview');
  const view = document.getElementById('browserView');
  if (wv) { wv.removeAttribute('src') }
  if (view) { view.classList.add('hidden') };
  if (browserInput) browserInput.focus();
}
function showTab(tab) {
  if (!tab) { clearWebview(); return }
  if (!tab.url) { clearWebview(); browserInput.value = ''; setTimeout(() => browserInput?.focus(), 0); return }
  const wv = document.getElementById('webview');
  const view = document.getElementById('browserView');
  if (!wv || !view) { return }
  const current = (wv.getAttribute ? wv.getAttribute('src') : '') || '';
  if (current !== tab.url) {
    openInWebview(tab.url);
  } else {
    view.classList.remove('hidden');
  }
  browserInput.value = tab.url;
}
function addBookmark(url, title = '') {
  const u = (url || '').trim(); if (!u) return;
  bookmarks.unshift({ url: u, title: title || u });
  persistBookmarks(); refreshSidebar();
}

function renderBrowserSidebar() {
  try {
    if (!treeEl) return;
    treeEl.innerHTML = '';
    const container = document.createDocumentFragment();

    // Tabs section
    const tabsSec = document.createElement('div');
    tabsSec.className = 'section';
    tabsSec.textContent = 'Tabs';
    container.appendChild(tabsSec);

    const tabsList = document.createElement('div');
    tabsList.className = 'list';
    const tabsArr = Array.isArray(browserTabs) ? browserTabs : [];
    if (!tabsArr.length) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<span class="ico"><svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="2" width="12" height="10" rx="1.5"/><line x1="1" y1="6" x2="13" y2="6"/><line x1="5" y1="2" x2="5" y2="6"/></svg></span><span class="title">No tabs yet</span><span class="cta" style="margin-left:auto;">New Tab</span>`;
      row.addEventListener('click', () => newTab(''));
      tabsList.appendChild(row);
    } else {
      for (const t of tabsArr) {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `<img class="tab-fav" src="${t.favicon || ''}" alt="" /><span class="title"></span><button class="star" title="Bookmark"><svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 1l1.56 4H13l-3.56 2.6 1.36 4.18L7 9.32l-3.8 2.28 1.36-4.18L.98 5H5.44L7 1z"/></svg></button><button class="close" title="Close">✕</button>`;
        row.querySelector('.title').textContent = t.title || t.url || 'New Tab';
        row.title = t.url || t.title || '';
        const starBtn = row.querySelector('.star');
        const setStar = () => { starBtn.innerHTML = isBookmarked(t.url) ? `<svg viewBox="0 0 14 14" width="12" height="12" fill="currentColor"><path d="M7 1l1.56 4H13l-3.56 2.6 1.36 4.18L7 9.32l-3.8 2.28 1.36-4.18L.98 5H5.44L7 1z"/></svg>` : `<svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 1l1.56 4H13l-3.56 2.6 1.36 4.18L7 9.32l-3.8 2.28 1.36-4.18L.98 5H5.44L7 1z"/></svg>` };
        setStar();
        row.addEventListener('click', (e) => { if (e.target && (e.target.classList.contains('close') || e.target.classList.contains('star'))) return; setActiveTab(t.id) });
        row.querySelector('.close').addEventListener('click', (e) => { e.stopPropagation(); closeTab(t.id) });
        starBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const u = t.url || ''; if (!u) return;
          if (isBookmarked(u)) { bookmarks = bookmarks.filter(b => b.url !== u) }
          else { bookmarks.unshift({ url: u, title: t.title || u }) }
          persistBookmarks(); setStar(); refreshSidebar();
        });
        tabsList.appendChild(row);
      }
    }
    container.appendChild(tabsList);

    // Bookmarks section
    const bmSec = document.createElement('div');
    bmSec.className = 'section';
    bmSec.textContent = 'Bookmarks';
    container.appendChild(bmSec);

    const bmList = document.createElement('div');
    bmList.className = 'list';
    const bmArr = Array.isArray(bookmarks) ? bookmarks : [];
    if (!bmArr.length) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<span class="ico"><svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1.5h8a1 1 0 0 1 1 1v10l-4.5-2.5L3 12.5v-10a1 1 0 0 1 1-1z"/></svg></span><span class="title">No bookmarks yet</span>`;
      bmList.appendChild(row);
    } else {
      for (const b of bmArr) {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `<span class="ico"><svg viewBox="0 0 14 14" width="13" height="13" fill="currentColor" style="color:#f59e0b"><path d="M3 1.5h8a1 1 0 0 1 1 1v10l-4.5-2.5L3 12.5v-10a1 1 0 0 1 1-1z"/></svg></span><span class="title"></span><span class="sub"></span>`;
        row.querySelector('.title').textContent = b.title || b.url;
        row.querySelector('.sub').textContent = b.url;
        row.addEventListener('click', () => openInWebview(b.url));
        bmList.appendChild(row);
      }
    }
    container.appendChild(bmList);

    treeEl.appendChild(container);
  } catch (_) { /* swallow */ }
}

function setBrowserMode(on) {
  document.body.classList.toggle('browser-mode', !!on);
  if (on) {
    document.body.classList.remove('calendar-mode', 'email-mode', 'whiteboard-mode', 'agent-mode', 'stairs-mode', 'stairs-sidebar-open');
    document.getElementById('markdownPreview')?.classList.remove('show');
    // Don't manually set sidebar display - let CSS handle it
  } else {
    browserCloseFind();
  }
  const bw = document.getElementById('browserWrap');
  if (on) {
    if (sideHeaderTitle) sideHeaderTitle.textContent = '';
    if (bw) { bw.classList.add('absolute') } // ensure fill on first paint
    bw?.classList.remove('hidden');
    if (!browserTabs.length) { newTab('', true) } else { const t = findTab(activeTabId) || browserTabs[0]; setActiveTab(t.id) }
    refreshSidebar();
    setTimeout(() => { browserInput?.focus(); setTimeout(() => bw?.classList.remove('absolute'), 250) }, 0);
  } else {
    if (sideHeaderTitle) updateSideHeaderToCwd();
    bw?.classList.add('hidden');
    refreshSidebar();
    updateStatus();
  }
}
browserToggle?.addEventListener('click', () => setBrowserMode(!document.body.classList.contains('browser-mode')));
browserNewTab?.addEventListener('click', () => newTab(''));
browserInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') openInWebview(sanitizeInput(browserInput?.value)) })

// ===== Bookmarks Modal =====
const bookmarksModal = document.getElementById('bookmarksModal');
const bookmarksSearchInput = document.getElementById('bookmarksSearchInput');
const bookmarksResults = document.getElementById('bookmarksResults');
const browserBookmarksBtn = document.getElementById('browserBookmarks');

function openBookmarksModal() {
  if (!bookmarksModal) return;
  bookmarksModal.style.display = 'flex';
  renderBookmarks();
  setTimeout(() => bookmarksSearchInput?.focus(), 100);
}

function closeBookmarksModal() {
  if (!bookmarksModal) return;
  bookmarksModal.style.display = 'none';
  if (bookmarksSearchInput) bookmarksSearchInput.value = '';
}

function renderBookmarks(filter = '') {
  if (!bookmarksResults) return;

  const filtered = bookmarks.filter(b => {
    const search = filter.toLowerCase();
    return b.title.toLowerCase().includes(search) || b.url.toLowerCase().includes(search);
  });

  if (filtered.length === 0) {
    bookmarksResults.innerHTML = `
      <div class="search-empty">
        <div class="search-empty-icon"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
        <p>${filter ? 'No bookmarks found' : 'No bookmarks yet'}</p>
        <p class="search-empty-sub">${filter ? 'Try a different search' : 'Star pages while browsing to bookmark them'}</p>
      </div>
    `;
    return;
  }

      bookmarksResults.innerHTML = filtered.map((b, idx) => `
    <div class="search-result-item" data-url="${escapeHtml(b.url)}" data-index="${idx}">
      <div class="search-result-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="color:#f59e0b"><path d="M8 1l1.8 4h4.2l-3.4 2.5 1.3 4.1L8 9.5l-3.9 2.1 1.3-4.1L2 5h4.2L8 1z"/></svg></div>
      <div class="search-result-content">
        <div class="search-result-title">${escapeHtml(b.title)}</div>
        <div class="search-result-path">${escapeHtml(b.url)}</div>
      </div>
    </div>
  `).join('');

  // Add click handlers
  bookmarksResults.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.getAttribute('data-url');
      if (url) {
        newTab(url);
        closeBookmarksModal();
      }
    });
  });
}

function toggleBookmark() {
  const wv = document.getElementById('webview');
  if (!wv) return;

  try {
    const currentUrl = (wv.getURL && typeof wv.getURL === 'function') ? wv.getURL() : (wv.getAttribute ? wv.getAttribute('src') : '');
    const tab = findTab(activeTabId);
    const title = tab ? tab.title : currentUrl;

    const existingIndex = bookmarks.findIndex(b => b.url === currentUrl);

    if (existingIndex >= 0) {
      // Remove bookmark
      bookmarks.splice(existingIndex, 1);
      persistBookmarks();
      refreshSidebar();
    } else {
      // Add bookmark
      bookmarks.push({ url: currentUrl, title, favicon: getFaviconUrl(currentUrl) });
      persistBookmarks();
      refreshSidebar();
    }
  } catch (e) {
  }
}

// Event listeners
browserBookmarksBtn?.addEventListener('click', openBookmarksModal);

bookmarksSearchInput?.addEventListener('input', (e) => {
  renderBookmarks(e.target.value);
});

bookmarksSearchInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeBookmarksModal();
  } else if (e.key === 'Enter') {
    const firstItem = bookmarksResults?.querySelector('.search-result-item');
    if (firstItem) firstItem.click();
  }
});

// Close on backdrop click
bookmarksModal?.addEventListener('click', (e) => {
  if (e.target === bookmarksModal || e.target.classList.contains('search-backdrop')) {
    closeBookmarksModal();
  }
});

// ===== Command Palette =====
const commandPalette = document.getElementById('commandPalette');
const commandPaletteInput = document.getElementById('commandPaletteInput');
const commandPaletteResults = document.getElementById('commandPaletteResults');

let selectedCommandIndex = 0;

const _CI = (d) => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const _CIcons = {
  file:     _CI('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>'),
  globe:    _CI('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'),
  moon:     _CI('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
  sidebar:  _CI('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>'),
  search:   _CI('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  plus:     _CI('<path d="M5 12h14"/><path d="M12 5v14"/>'),
  bookmark: _CI('<path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/>'),
  zap:      _CI('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  fileText: _CI('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>'),
  mail:     _CI('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'),
  monitor:  _CI('<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>'),
  terminal: _CI('<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>'),
};

// Define all available commands
const commands = [
  // File operations
  { id: 'file.new', name: 'New File', icon: _CIcons.file, category: 'File', action: () => { /* Add new file logic */ } },
  {
    id: 'file.open', name: 'Open File', icon: _CIcons.file, category: 'File', action: async () => {
      const path = await window.kit?.openFile?.();
      if (path) {
        const res = await window.kit?.readFile?.(path);
        if (res?.ok) openFileInTab(path, res.content);
      }
    }
  },
  { id: 'file.save', name: 'Save File', shortcut: 'Ctrl+S', icon: _CIcons.file, category: 'File', action: () => saveFlow() },

  // View/Mode switching
  { id: 'view.browser', name: 'Open Browser Mode', shortcut: 'Ctrl+B', icon: _CIcons.globe, category: 'View', action: () => setBrowserMode(true) },
  { id: 'view.email', name: 'Open Email Mode', shortcut: 'Ctrl+M', icon: _CIcons.mail, category: 'View', action: () => setEmailMode(true) },
  { id: 'view.whiteboard', name: 'Open Whiteboard', shortcut: 'Ctrl+W', icon: _CIcons.monitor, category: 'View', action: () => setWhiteboardMode(true) },
  {
    id: 'view.editor', name: 'Back to Editor', shortcut: 'Ctrl+0', icon: _CIcons.sidebar, category: 'View', action: () => {
      setBrowserMode(false);
      setWhiteboardMode(false);
    }
  },

  // Theme
  { id: 'theme.toggle', name: 'Toggle Dark/Light Theme', shortcut: 'Ctrl+D', icon: _CIcons.moon, category: 'Theme', action: () => applyTheme(document.body.classList.contains('dark') ? 'light' : 'dark') },

  // Sidebar
  { id: 'sidebar.toggle', name: 'Toggle Sidebar', shortcut: 'Ctrl+E', icon: _CIcons.sidebar, category: 'View', action: () => document.body.classList.toggle('sidebar-open') },

  // Search
  {
    id: 'search.project', name: 'Search in Project', shortcut: 'Ctrl+K', icon: _CIcons.search, category: 'Search', action: () => {
      closeCommandPalette();
      setTimeout(() => {
        const searchModal = document.getElementById('projectSearchModal');
        const searchInput = document.getElementById('projectSearchInput');
        if (searchModal) searchModal.style.display = 'flex';
        if (searchInput) searchInput.focus();
      }, 100);
    }
  },

  // Browser commands
  { id: 'browser.newTab', name: 'New Browser Tab', icon: _CIcons.plus, category: 'Browser', action: () => newTab('') },
  {
    id: 'browser.bookmarks', name: 'Open Bookmarks', icon: _CIcons.bookmark, category: 'Browser', action: () => {
      closeCommandPalette();
      setTimeout(() => openBookmarksModal(), 100);
    }
  },
  { id: 'browser.copyNote', name: 'Browser: Copy Selection to Note', icon: _CIcons.globe, category: 'Browser', action: () => document.getElementById('browserCopyNoteBtn')?.click() },

  // AI commands
  { id: 'ai.check', name: 'AI: Check for Errors', icon: _CIcons.zap, category: 'AI', action: () => document.getElementById('aiCheck')?.click() },
  { id: 'ai.summarize', name: 'AI: Summarize', icon: _CIcons.zap, category: 'AI', action: () => document.getElementById('aiSummarize')?.click() },
  { id: 'ai.tests', name: 'AI: Generate Tests', icon: _CIcons.zap, category: 'AI', action: () => document.getElementById('aiTests')?.click() },

  // Editor
  { id: 'editor.jumpDef', name: 'Jump to Definition', shortcut: 'F12', icon: _CIcons.terminal, category: 'Editor', action: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F12', bubbles: true })) },

  // Markdown
  { id: 'markdown.preview', name: 'Toggle Markdown Preview', icon: _CIcons.fileText, category: 'Markdown', action: () => document.getElementById('markdownPreview')?.click() },

  // Terminal
  {
    id: 'terminal.clear', name: 'Clear Terminal', icon: _CIcons.terminal, category: 'Terminal', action: () => {
      const termOut = document.getElementById('termOut');
      if (termOut) termOut.textContent = '';
    }
  },
];

function openCommandPalette() {
  if (!commandPalette) return;
  commandPalette.style.display = 'flex';
  selectedCommandIndex = 0;
  renderCommands();
  setTimeout(() => commandPaletteInput?.focus(), 100);
}

function closeCommandPalette() {
  if (!commandPalette) return;
  commandPalette.style.display = 'none';
  if (commandPaletteInput) commandPaletteInput.value = '';
  selectedCommandIndex = 0;
}

function renderCommands(filter = '') {
  if (!commandPaletteResults) return;

  let filtered;
  if (!filter) {
    // No query: show recent commands first, then all commands
    const recentCmds = recentCommands.map(id => commands.find(c => c.id === id)).filter(Boolean);
    const rest = commands.filter(c => !recentCommands.includes(c.id));
    filtered = [...recentCmds, ...rest];
  } else {
    // Fuzzy filter and sort by score
    filtered = commands
      .map(cmd => {
        const score = Math.max(
          fuzzyMatch(filter, cmd.name),
          fuzzyMatch(filter, cmd.category),
          fuzzyMatch(filter, cmd.id)
        );
        return { cmd, score };
      })
      .filter(x => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.cmd);
  }

  if (filtered.length === 0) {
    commandPaletteResults.innerHTML = `
      <div class="search-empty">
        <div class="search-empty-icon">⌘</div>
        <p>No commands found</p>
        <p class="search-empty-sub">Try a different search term</p>
      </div>
    `;
    return;
  }

  let html = '';

  if (!filter && recentCommands.length) {
    // Recent section header
    const recentIds = recentCommands.map(id => commands.find(c => c.id === id)).filter(Boolean).map(c => c.id);
    if (recentIds.length) html += `<div class="cmd-recent-label">Recent</div>`;
  }

  if (filter) {
    // Flat list when filtering
    filtered.forEach((cmd, idx) => {
      const isSelected = idx === selectedCommandIndex;
      const iconHtml = cmd.icon || '⌘';
      const shortcutHtml = cmd.shortcut ? `<kbd class="cmd-shortcut">${cmd.shortcut}</kbd>` : '';
      html += `
        <div class="search-result-item command-item ${isSelected ? 'selected' : ''}" data-index="${idx}">
          <div class="search-result-icon">${iconHtml}</div>
          <div class="search-result-content">
            <div class="search-result-title">${cmd.name}${shortcutHtml}</div>
            <div class="search-result-path">${cmd.category} · ${cmd.id}</div>
          </div>
        </div>
      `;
    });
  } else {
    // Grouped by category when no filter
    const grouped = {};
    filtered.forEach(cmd => {
      const key = recentCommands.includes(cmd.id) ? '__recent__' : cmd.category;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(cmd);
    });
    const keys = Object.keys(grouped);
    let globalIdx = 0;
    keys.forEach(cat => {
      if (cat !== '__recent__') html += `<div class="command-category">${cat}</div>`;
      grouped[cat].forEach(cmd => {
        const isSelected = globalIdx === selectedCommandIndex;
        const iconHtml = cmd.icon || '⌘';
        const shortcutHtml = cmd.shortcut ? `<kbd class="cmd-shortcut">${cmd.shortcut}</kbd>` : '';
        html += `
          <div class="search-result-item command-item ${isSelected ? 'selected' : ''}" data-index="${globalIdx}">
            <div class="search-result-icon">${iconHtml}</div>
            <div class="search-result-content">
              <div class="search-result-title">${cmd.name}${shortcutHtml}</div>
              <div class="search-result-path">${cmd.id}</div>
            </div>
          </div>
        `;
        globalIdx++;
      });
    });
  }

  commandPaletteResults.innerHTML = html;

  // Add click handlers
  commandPaletteResults.querySelectorAll('.command-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.getAttribute('data-index'));
      executeCommand(filtered[index]);
    });
  });

  // Scroll selected into view
  const selected = commandPaletteResults.querySelector('.selected');
  if (selected) {
    selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function executeCommand(command) {
  if (!command || !command.action) return;
  addRecentCommand(command.id);
  closeCommandPalette();
  setTimeout(() => {
    try {
      command.action();
    } catch (e) { }
  }, 50);
}

// Event listeners
commandPaletteInput?.addEventListener('input', (e) => {
  selectedCommandIndex = 0;
  renderCommands(e.target.value);
});

commandPaletteInput?.addEventListener('keydown', (e) => {
  const filter = commandPaletteInput.value;
  // Build same filtered list as renderCommands to keep indices consistent
  let filtered;
  if (!filter) {
    const recentCmds = recentCommands.map(id => commands.find(c => c.id === id)).filter(Boolean);
    const rest = commands.filter(c => !recentCommands.includes(c.id));
    filtered = [...recentCmds, ...rest];
  } else {
    filtered = commands
      .map(cmd => ({ cmd, score: Math.max(fuzzyMatch(filter, cmd.name), fuzzyMatch(filter, cmd.category), fuzzyMatch(filter, cmd.id)) }))
      .filter(x => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.cmd);
  }

  if (e.key === 'Escape') {
    closeCommandPalette();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (filtered[selectedCommandIndex]) {
      executeCommand(filtered[selectedCommandIndex]);
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedCommandIndex = Math.min(selectedCommandIndex + 1, filtered.length - 1);
    renderCommands(filter);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedCommandIndex = Math.max(selectedCommandIndex - 1, 0);
    renderCommands(filter);
  }
});

// Close on backdrop click
commandPalette?.addEventListener('click', (e) => {
  if (e.target === commandPalette || e.target.classList.contains('search-backdrop')) {
    closeCommandPalette();
  }
});

// Keyboard shortcut: Cmd+Shift+P or Ctrl+Shift+P
document.addEventListener('keydown', (e) => {
  const meta = e.metaKey || e.ctrlKey;
  if (meta && e.shiftKey && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    openCommandPalette();
  }
});

// Command palette button in statusbar
const commandPaletteBtn = document.getElementById('commandPaletteBtn');
commandPaletteBtn?.addEventListener('click', () => openCommandPalette());

// Browser back buttons
const browserBackBtn = document.getElementById('browserBackBtn');

browserBackBtn?.addEventListener('click', () => {
  const webview = document.querySelector('webview');
  if (webview && webview.canGoBack()) webview.goBack();
});

document.getElementById('browserForwardBtn')?.addEventListener('click', () => {
  const webview = document.querySelector('webview');
  if (webview && webview.canGoForward()) webview.goForward();
});

document.getElementById('browserReloadBtn')?.addEventListener('click', () => {
  const webview = document.querySelector('webview');
  if (webview) webview.reload();
});

// ── Find in page ────────────────────────────────────────────────────────────

const browserFindBar   = document.getElementById('browserFindBar');
const browserFindInput = document.getElementById('browserFindInput');
const browserFindCount = document.getElementById('browserFindCount');

function browserOpenFind() {
  if (!browserFindBar) return;
  browserFindBar.classList.remove('hidden');
  browserFindInput.focus();
  browserFindInput.select();
}

function browserCloseFind() {
  if (!browserFindBar) return;
  browserFindBar.classList.add('hidden');
  const wv = document.getElementById('webview');
  if (wv) wv.stopFindInPage('clearSelection');
  browserFindCount.textContent = '';
}

function browserFind(forward = true) {
  const wv = document.getElementById('webview');
  const query = browserFindInput?.value;
  if (!wv || !query) return;
  wv.findInPage(query, { forward, findNext: true });
}

document.getElementById('browserFindBtn')?.addEventListener('click', browserOpenFind);
document.getElementById('browserFindClose')?.addEventListener('click', browserCloseFind);
document.getElementById('browserFindNext')?.addEventListener('click', () => browserFind(true));
document.getElementById('browserFindPrev')?.addEventListener('click', () => browserFind(false));

browserFindInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.shiftKey ? browserFind(false) : browserFind(true); }
  if (e.key === 'Escape') browserCloseFind();
});

browserFindInput?.addEventListener('input', () => {
  const wv = document.getElementById('webview');
  const query = browserFindInput.value;
  if (!wv) return;
  if (query) wv.findInPage(query, { forward: true, findNext: false });
  else { wv.stopFindInPage('clearSelection'); browserFindCount.textContent = ''; }
});

// Listen for find results to show match count
document.getElementById('webview')?.addEventListener('found-in-page', (e) => {
  if (e.result?.matches !== undefined) {
    browserFindCount.textContent = e.result.matches ? `${e.result.activeMatchOrdinal}/${e.result.matches}` : 'No results';
  }
});

// ── Browser action buttons ──────────────────────────────────────────────────

async function getBrowserPageText(wv) {
  try { return await wv.executeJavaScript('document.body ? document.body.innerText : ""'); } catch (_) { return ''; }
}

document.getElementById('browserSummarizeBtn')?.addEventListener('click', async () => {
  if (aiInFlight) return;
  const wv = document.getElementById('webview');
  if (!wv) return;
  const url = wv.getURL();
  const title = wv.getTitle();
  const text = await getBrowserPageText(wv);
  if (!text && !url) return;
  aiInFlight = true;
  const out = document.getElementById('termOut');
  out.textContent += `Summarizing: ${title || url}\n`;
  out.scrollTop = out.scrollHeight;
  showSpinner();
  try {
    const system = 'You are a helpful assistant. Summarize the following webpage content clearly and concisely, highlighting the key points.';
    const maxLen = 32000;
    const truncated = text.length > maxLen ? text.substring(0, maxLen) + '\n\n[...content truncated]' : text;
    const input = `URL: ${url}\nTitle: ${title || ''}\n\nContent:\n${truncated}`;
    const resp = await window.kit.aiRequest({ input, system, model: selectedModel(), previousResponseId: termAiPreviousId });
    if (resp?.ok) {
      if (resp.responseId) termAiPreviousId = resp.responseId;
      await window.kit.openResultWindow({ title: `Summary: ${title || url}`, mode: 'html', html: `<pre style="white-space:pre-wrap;word-wrap:break-word">${escapeHtml(resp.text || '')}</pre>` });
    } else {
      out.textContent += '! ' + (resp?.error || 'AI error') + '\n';
      out.scrollTop = out.scrollHeight;
    }
  } catch (err) {
    out.textContent += '! ' + (err?.message || String(err)) + '\n';
    out.scrollTop = out.scrollHeight;
  } finally {
    aiInFlight = false;
    hideSpinner();
  }
});

document.getElementById('browserGetTextBtn')?.addEventListener('click', async () => {
  const wv = document.getElementById('webview');
  if (!wv) return;
  const url = wv.getURL();
  const title = wv.getTitle();
  const text = await getBrowserPageText(wv);
  const display = text || '(no text content found)';
  await window.kit.openResultWindow({ title: `Text: ${title || url}`, mode: 'html', html: `<pre style="white-space:pre-wrap;word-wrap:break-word;font-size:13px">${escapeHtml(display)}</pre>` });
});

document.getElementById('browserScreenshotBtn')?.addEventListener('click', async () => {
  const wv = document.getElementById('webview');
  if (!wv) return;
  try {
    const img = await wv.capturePage();
    const dataUrl = img.toDataURL();
    const title = wv.getTitle() || wv.getURL();
    await window.kit.openResultWindow({ title: `Screenshot: ${title}`, mode: 'html', html: `<img src="${dataUrl}" style="max-width:100%;display:block" alt="screenshot" />` });
  } catch (err) {
    const out = document.getElementById('termOut');
    out.textContent += '! Screenshot failed: ' + (err?.message || String(err)) + '\n';
    out.scrollTop = out.scrollHeight;
  }
});


// ── Copy to Note (Cn) ──────────────────────────────────────────────────────
document.getElementById('browserCopyNoteBtn')?.addEventListener('click', async () => {
  const wv = document.getElementById('webview');
  if (!wv) return;
  const out = document.getElementById('termOut');
  try {
    const selection = await wv.executeJavaScript('window.getSelection().toString()');
    if (!selection || !selection.trim()) {
      if (out) { out.textContent += 'No text selected in browser.\n'; out.scrollTop = out.scrollHeight; }
      return;
    }
    await window.kit.ensureFolder();
    const homeDir = await window.kit.homeDir();
    const clipsPath = homeDir + '/.Kit/Browser Clips.json';
    let clips = { blocks: [] };
    try {
      const r = await window.kit.readFile(clipsPath);
      if (r && r.ok) {
        const parsed = JSON.parse(r.data || r.content || '{}');
        if (parsed && Array.isArray(parsed.blocks)) clips = parsed;
      }
    } catch(_) {}
    clips.blocks.push({ type: 'paragraph', data: { text: selection.trim() } });
    clips.blocks.push({ type: 'delimiter', data: {} });
    await window.kit.writeFile(clipsPath, JSON.stringify(clips));
    if (out) { out.textContent += 'Saved to "Browser Clips" note.\n'; out.scrollTop = out.scrollHeight; }
  } catch (err) {
    if (out) { out.textContent += '! Copy to note failed: ' + (err?.message || String(err)) + '\n'; out.scrollTop = out.scrollHeight; }
  }
});

function setupModeBackButton() {
  const modeBackBtn = document.getElementById('modeBackBtn');
  if (!modeBackBtn) {
    return;
  }

  // Remove existing listeners
  const newBtn = modeBackBtn.cloneNode(true);
  modeBackBtn.parentNode.replaceChild(newBtn, modeBackBtn);

  newBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (document.body.classList.contains('browser-mode')) {
      setBrowserMode(false);
    } else if (document.body.classList.contains('calendar-mode')) {
      setCalendarMode(false);
    } else if (document.body.classList.contains('whiteboard-mode')) {
      setWhiteboardMode(false);
    } else if (document.body.classList.contains('email-mode')) {
      setEmailMode(false);
    } else if (document.body.classList.contains('agent-mode')) {
      setAgentMode(false);
    } else if (document.body.classList.contains('stairs-mode')) {
      setStairsMode(false);
    }
  });
}

document.addEventListener('DOMContentLoaded', setupModeBackButton);

function urlLooksLike(q) {
  return /^(https?:\/\/|file:\/\/|about:|chrome:\/\/)/i.test(q) || /\./.test(q)
}
function omniClear() { if (omni) { omni.innerHTML = ''; omni.classList.add('hidden'); browserUrlBar?.classList.remove('has-omni') } }
function omniSuggest(q) {
  if (!omni) return
  const query = (q || '').trim()
  if (!query) { omniClear(); return }
  omni.innerHTML = ''

  // 1) Existing tabs match
  const qlc = query.toLowerCase()
  const tabMatches = (browserTabs || []).filter(t => (t.title || '').toLowerCase().includes(qlc) || (t.url || '').toLowerCase().includes(qlc)).slice(0, 5)
  tabMatches.forEach(t => {
    const row = document.createElement('div'); row.className = 'row'; row.innerHTML = `<span class="ico">${ICON.file}</span><span class="title"></span><span class="cta">Switch to Tab →</span>`
    row.querySelector('.title').textContent = t.title || t.url || 'Tab'
    row.addEventListener('click', () => { setActiveTab(t.id); omniClear() })
    omni.appendChild(row)
  })

  // 2) Direct URL or search
  if (urlLooksLike(query)) {
    const row = document.createElement('div'); row.className = 'row'; const fav = getFaviconUrl(query); row.innerHTML = `<span class="ico"><img alt="" src="${fav}"/></span><span class="title"></span><span class="cta">Open</span>`
    row.querySelector('.title').textContent = query
    row.addEventListener('click', () => { openInWebview(query); omniClear() })
    omni.appendChild(row)
  } else {
    const row = document.createElement('div'); row.className = 'row'; row.innerHTML = `<span class=\"ico\"><svg viewBox=\"0 0 14 14\" width=\"13\" height=\"13\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\"><circle cx=\"6\" cy=\"6\" r=\"4.5\"/><line x1=\"9.5\" y1=\"9.5\" x2=\"13\" y2=\"13\"/></svg></span><span class=\"title\"></span><span class=\"cta\">Search</span>`
    row.querySelector('.title').textContent = `Search “${query}”`
    row.addEventListener('click', () => { openInWebview('https://duckduckgo.com/?q=' + encodeURIComponent(query)); omniClear() })
    omni.appendChild(row)
  }

  omni.classList.remove('hidden'); browserUrlBar?.classList.add('has-omni')
}

browserInput?.addEventListener('input', () => omniSuggest(sanitizeInput(browserInput.value)))
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') omniClear() })
document.addEventListener('mousedown', (e) => { if (omni && !omni.contains(e.target) && !browserUrlBar?.contains(e.target)) omniClear() })

function isBookmarked(u) {
  const x = (u || '').trim(); if (!x) return false;
  try { return !!(bookmarks || []).find(b => b.url === x) } catch (_) { return false }
}

function sanitizeInput(v) { return (v || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim() }



// Project Search Integration
function openProjectSearch() {
  if (window.projectSearch) {
    window.projectSearch.open();
  }
}

// Expose functions for keyboard shortcuts
window.applyTheme = applyTheme;
window.setBrowserMode = setBrowserMode;
window.setCalendarMode = setCalendarMode;
window.setWhiteboardMode = setWhiteboardMode;

// Expose openFile function for project search
window.openFile = async function (filePath) {
  try {
    let result;

    // Use existing IPC methods
    if (window.kit && window.kit.readFile) {
      result = await window.kit.readFile(filePath);
    } else if (window.kitBridge && window.kitBridge.readFile) {
      result = await window.kitBridge.readFile(filePath);
    } else {
      return false;
    }

    if (!result || !result.ok || !result.data) {
      return false;
    }

    const content = result.data;

    // Open file in tab system
    openFileInTab(filePath, content);

    return true;
  } catch (error) {
    return false;
  }
};

// ===== Floating Panel Helpers =====
const floatPanel = document.getElementById('floatPanel');
const floatTitle = document.getElementById('floatTitle');
const floatContent = document.getElementById('floatContent');
const floatClose = document.getElementById('floatClose');
const floatCopy = document.getElementById('floatCopy');

function showFloat(title, content, asHTML = false) {
  if (floatTitle) floatTitle.textContent = title || 'Output';
  if (floatContent) {
    if (asHTML) floatContent.innerHTML = content || '';
    else floatContent.textContent = content || '';
  }
  floatPanel?.classList.remove('hidden');
}
function hideFloat() { floatPanel?.classList.add('hidden'); }
floatClose?.addEventListener('click', hideFloat);
floatCopy?.addEventListener('click', () => {
  const txt = floatContent ? (floatContent.innerText || '') : '';
  navigator.clipboard?.writeText(txt);
});

// Drag support
(function () {
  const bar = document.querySelector('.float-titlebar');
  if (!bar || !floatPanel) return;
  let startX = 0, startY = 0, startL = 0, startT = 0, dragging = false;
  bar.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    dragging = true; startX = e.clientX; startY = e.clientY;
    const rect = floatPanel.getBoundingClientRect();
    startL = rect.left; startT = rect.top;
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    floatPanel.style.left = Math.max(8, startL + dx) + 'px';
    floatPanel.style.top = Math.max(8, startT + dy) + 'px';
    floatPanel.style.right = 'auto';
    floatPanel.style.bottom = 'auto';
  });
  window.addEventListener('mouseup', () => dragging = false);
})();

// ===== Summarize / Find Error → Detached detached window (post-AI) =====
(function () {
  const byIds = [
    'findErrorBtn', 'btnFindError', 'aiFindError', 'btnAIFindError'
  ];
  byIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset._aiHooked) return;
    el.dataset._aiHooked = '1';
    el.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      const action = (id.toLowerCase().includes('find') ? 'Find Error' : 'Summarize');
      let html = '';
      let title = action;
      try {
        // Gather content
        const textArea = document.querySelector('#editorWrap textarea, #editorWrap .cm-content, #editorWrap pre');
        let selection = '';
        if (window.getSelection && window.getSelection().toString()) {
          selection = window.getSelection().toString();
        }
        const content = selection || textArea?.innerText || textArea?.value || '';
        const system = action === 'Find Error'
          ? 'You are a strict code review assistant. Return concise, actionable errors and fixes.'
          : 'You are a helpful summarizer. Return a clear, structured summary with key points.';
        const input = (action === 'Find Error'
          ? `Identify likely bugs or errors and propose specific fixes. If relevant, include code snippets.

CONTENT:
${content}`
          : `Summarize the following content with key points and next steps.

CONTENT:
${content}`);
        const res = await window.kit.aiRequest({ input, system, model: selectedModel() });
        if (res && res.ok) {
          html = `<div class="result"><pre>${escapeHtml(res.text || '')}</pre></div>`;
        } else {
          title += ' (Error)';
          html = `<div class="result error"><pre>${escapeHtml(String(res?.error || 'Unknown error'))}</pre></div>`;
        }
      } catch (err) {
        try { hideSpinner(); } catch (_) { }
        try { hideSpinner(); } catch (_) { }
        title += ' (Error)';
        html = `<div class="result error"><pre>${escapeHtml(String(err?.message || err))}</pre></div>`;
      }
      await (KIT?.openResultWindow || window.kitBridge?.openResultWindow)?.({ title, html });
    });
  });

})(); window.showFloat = showFloat; window.hideFloat = hideFloat;




// ===== Guaranteed detached window for Find Error (delegated) =====
(function () {
  const KIT = (window.kit || window.kitBridge);
  async function runFindError(content) {
    const system = 'You are a strict code review assistant. Return concise, actionable errors and fixes.';
    const input = `Identify likely bugs or errors and propose specific fixes. If relevant, include code snippets.\n\nCONTENT:\n${content || ''}`;
    try {
      const res = await KIT?.aiRequest?.({ model: selectedModel(), system, input });
      const title = res?.ok ? 'Find Error' : 'Find Error (Error)';
      const html = res?.ok
        ? `<div class="result"><pre>${escapeHtml(res.text || '')}</pre></div>`
        : `<div class="result error"><pre>${escapeHtml(String(res?.error || 'Unknown error'))}</pre></div>`;
      await KIT?.openResultWindow?.({ title, html });
    } catch (err) {
      try { hideSpinner(); } catch (_) { }
      await KIT?.openResultWindow?.({ title: 'Find Error (Error)', html: `<div class="result error"><pre>${escapeHtml(String(err?.message || err))}</pre></div>` });
    }
  }
  function getEditorContent() {
    const textArea = document.querySelector('#editorWrap textarea, #editorWrap .cm-content, #editorWrap pre');
    let selection = '';
    if (window.getSelection && window.getSelection().toString()) {
      selection = window.getSelection().toString();
    }
    return selection || textArea?.innerText || textArea?.value || '';
  }
  // 1) Direct known IDs
  const ids = ['findErrorBtn', 'btnFindError', 'aiFindError', 'btnAIFindError', 'findError'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset._findHooked) {
      el.dataset._findHooked = '1';
      el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); runFindError(getEditorContent()); });
    }
  });

  // 2) Programmatic hook (other code can dispatch this to trigger a detached window)
  window.addEventListener('ai:findError', (ev) => {
    const d = ev.detail || {};
    runFindError(d.content || getEditorContent());
  });
})();



// Build a concise calendar context string for AI system prompts
function buildCalendarContext() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const lines = [];

    // Today's journal entry
    const todayEntry = (calendarData?.entries || {})[todayStr];
    if (todayEntry) {
      const text = Array.isArray(todayEntry) ? todayEntry.join(' ') : String(todayEntry);
      if (text.trim()) lines.push(`Today's note (${todayStr}): ${text.trim().slice(0, 400)}`);
    }

    // Upcoming events (next 60 days)
    const events = (calendarData?.events || []).filter(ev => {
      if (!ev.start) return false;
      const d = new Date(ev.start);
      const diff = (d - today) / 86400000;
      return diff >= -1 && diff <= 60;
    }).sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 20);

    if (events.length) {
      lines.push('Upcoming calendar events:');
      for (const ev of events) {
        const start = ev.start.slice(0, 10);
        const end = ev.end && ev.end !== ev.start ? ` → ${ev.end.slice(0, 10)}` : '';
        lines.push(`  • ${ev.title} (${start}${end})`);
      }
    }

    if (!lines.length) return null;
    return 'USER CALENDAR:\n' + lines.join('\n');
  } catch (_) { return null; }
}

// Build a concise bookmarks context string for AI system prompts
function buildBookmarksContext() {
  try {
    if (!Array.isArray(bookmarks) || !bookmarks.length) return null;
    const list = bookmarks.slice(0, 30).map(b => `  • ${b.title || b.url}  <${b.url}>`).join('\n');
    return `USER BOOKMARKS (${bookmarks.length} total, showing up to 30):\n${list}`;
  } catch (_) { return null; }
}

// Clean AI command processor (used by terminal)
async function processAiCommand(arg) {
  if (aiInFlight) return;
  const out = document.getElementById('termOut');
  // Handle conversation management commands first (no inflight needed)
  const trimmed = (arg || '').trim();
  if (trimmed === 'clear' || trimmed === 'new') {
    termAiPreviousId = null;
    out.textContent += 'Conversation cleared.\n';
    out.scrollTop = out.scrollHeight;
    return;
  }
  aiInFlight = true;
  try {
    if (!arg) {
      out.textContent += `! usage: /ai <prompt> [--file] [--path <p>] [--model <m>]

Code Generation:
  /ai code <description>  - Generate code from description
  /ai complete --file     - Complete current function/class
  /ai explain --file      - Explain what the code does
  /ai fix <error> --file  - Fix bugs or errors in code
  /ai test --file         - Generate unit tests
  /ai convert <lang> --file - Convert to another language
  /ai refactor --file     - Improve code structure
  /ai optimize --file     - Optimize for performance
  /ai document --file     - Generate documentation
  /ai review --file       - Code review and suggestions

Web Search:
  /ai search <query>      - Search the web
  /ai what is <topic>     - Get information about topic
  /ai weather today       - Get current weather

Examples:
  /ai code a REST API for users
  /ai complete --file
  /ai fix "syntax error" --file
  /ai search React hooks tutorial

`;
      return;
    }
    let promptText = arg;
    let attachFile = false, attachPath = null, model = selectedModel();
    const mFile = arg.match(/--file(\b)/);
    const mPath = arg.match(/--path\s+([^\s].*?)(?=\s--|$)/);
    const mModel = arg.match(/--model\s+(\S+)/);
    const useSelection = arg.includes('--selection');
    if (mFile) { attachFile = true; promptText = promptText.replace(/--file\b/, '').trim(); }
    if (mPath) { attachPath = mPath[1].trim(); promptText = promptText.replace(mPath[0], '').trim(); }
    if (mModel) { model = mModel[1]; promptText = promptText.replace(mModel[0], '').trim(); }
    if (useSelection) { promptText = promptText.replace('--selection', '').trim(); }
    // Handle --selection flag
    if (useSelection) {
      if (editor) {
        const selText = editor.state.sliceDoc(editor.state.selection.main.from, editor.state.selection.main.to);
        if (!selText.trim()) {
          out.textContent += '! No text selected in editor.\n';
          out.scrollTop = out.scrollHeight;
          aiInFlight = false;
          return;
        }
        promptText = `[Selected text]\n${selText}\n[/Selected text]\n\n${promptText}`;
      }
    }
    let input = promptText;
    const blocks = [];
    if (attachFile && currentFile && editor) {
      const name = currentFile.split(/[\\/]/).pop();
      blocks.push(`<file name="${name}">\n${editor.state.doc.toString()}\n</file>`);
    }
    if (attachPath) {
      try {
        const st2 = await window.kit.stat(attachPath);
        if (st2 && st2.ok) {
          if (st2.isDir) {
            const ls = await window.kit.exec(attachPath, 'ls -1');
            const names = (ls.output || '').split('\n').filter(Boolean);
            for (const nm of names) {
              const p = (attachPath.replace(/\/+$/, '') + '/' + nm);
              const rf = await window.kit.readFile(p);
              if (rf.ok) {
                blocks.push(`<file name="${nm}">\n${rf.data}\n</file>`);
              }
            }
          } else {
            const rf = await window.kit.readFile(attachPath);
            if (rf.ok) {
              const n = attachPath.split(/[\\/]/).pop();
              blocks.push(`<file name="${n}">\n${rf.data}\n</file>`);
            }
          }
        }
      } catch (_) { /* ignore attach errors */ }
    }
    input = input + blocks.join('');

    // Inject browser page context when browsing
    const aiCtx = editorSettings.aiContext || {};
    let system = undefined;
    if (document.body.classList.contains('browser-mode') && aiCtx.browserPage !== false) {
      const wv = document.getElementById('webview');
      if (wv) {
        try {
          const url = wv.getURL();
          const title = wv.getTitle();
          let pageText = '';
          try { pageText = await wv.executeJavaScript('document.body ? document.body.innerText.substring(0, 8000) : ""'); } catch (_) {}
          if (url) {
            const canSearch = aiCtx.webSearch !== false;
            system = `You are a helpful AI assistant integrated into a browser. You have access to:
1. The current webpage the user is viewing (content provided below)${canSearch ? '\n2. A web_search tool to search the internet for additional or up-to-date information' : ''}

Current page:
URL: ${url}
Title: ${title || ''}

Page content (visible text):
${pageText || '(unavailable)'}

Use the page content to answer questions about what the user is reading.${canSearch ? ' Use web_search when you need fresher data, more detail, or to look up related topics.' : ''}`;
          }
        } catch (_) {}
      }
    }

    // Inject calendar context (upcoming events + today's entry)
    if (aiCtx.calendar !== false) {
      const calCtx = buildCalendarContext();
      if (calCtx) system = (system ? system + '\n\n' : '') + calCtx;
    }

    // Inject bookmarks context
    if (aiCtx.bookmarks !== false) {
      const bmCtx = buildBookmarksContext();
      if (bmCtx) system = (system ? system + '\n\n' : '') + bmCtx;
    }

    // Inject project rules into system prompt
    const rules = await loadProjectRules(termCwd);
    if (rules) {
      system = (system ? system + '\n\n' : '') + `PROJECT RULES (follow strictly):\n${rules}`;
    }

    // Token count estimator
    const approxTokens = Math.ceil(input.length / 4);
    const approxCost = (approxTokens / 1000 * 0.003).toFixed(4);
    out.textContent += `[AI] ~${approxTokens} tokens | ~$${approxCost} — sending…\n`;
    out.scrollTop = out.scrollHeight;
    showSpinner();
    const resp = await window.kit.aiRequest({ input, system, model, previousResponseId: termAiPreviousId, webSearch: aiCtx.webSearch !== false });
    let aiOut = resp && resp.ok ? (resp.text || '') : ('! AI error: ' + (resp?.error || 'unknown'));
    if (resp?.ok) {
      if (resp.responseId) termAiPreviousId = resp.responseId;
      if (resp.searchQueries?.length) {
        out.textContent += '[AI] Searched: ' + resp.searchQueries.map(q => `"${q}"`).join(', ') + '\n';
        out.scrollTop = out.scrollHeight;
      }
      if (resp.citations?.length) {
        aiOut += '\n\nSources:\n' + resp.citations.map(c => `  ${c.title}\n  ${c.url}`).join('\n');
      }
    }
    out.textContent += aiOut + "\n";
    out.scrollTop = out.scrollHeight;
  } catch (err) {
    out.textContent += ("! AI error: " + (err?.message || String(err)));
    out.scrollTop = out.scrollHeight;
  } finally {
    aiInFlight = false;
    hideSpinner();
  }
}



// ---- Restored sidebar functions (from previous working build) ----

async function refreshSidebar() {
  try {
    if (document.body.classList.contains('browser-mode')) { renderBrowserSidebar(); return }
    const cwd = termCwd; if (!cwd) return
    const listed = await window.kit.list(cwd)
    treeEl.innerHTML = ''
    if (listed.ok) treeEl.appendChild(renderTree(listed.items, 0, cwd))
  } catch (_) { }
}

// ---- End restored sidebar functions ----

// ═══════════════════════════════════════════════════════
// WHITEBOARD ENGINE
// ═══════════════════════════════════════════════════════

let wbCamera = { x: 0, y: 0, scale: 1 };
let wbElements = [];
// ── Constants ──────────────────────────────────────────────────────
const WB_HISTORY_LIMIT = 50;
const WB_SAVE_DEBOUNCE_MS = 1000;
const WB_DRAG_THRESHOLD_PX = 5;
const WB_MIN_W = 80, WB_MIN_H = 60;

let wbHistory = [], wbFuture = [];
let wbActiveTool = 'select';
let wbSelected = null;
let wbDragging = null;
let wbDrawing = null;
let wbSaveTimer = null;
let wbSpaceDown = false;
let wbPanStart = null;
// O(1) element lookup — kept in sync with wbElements
let wbElementsMap = new Map();
// rAF handle for pointermove throttling
let wbRafPending = false;

const wbViewport = document.getElementById('wbViewport');
const wbContainer = document.getElementById('wbContainer');
const wbSvgEl = document.getElementById('wbSvg');
const wbSvgElements = document.getElementById('wbSvgElements');
const wbSvgPreview = document.getElementById('wbSvgPreview');
const wbHtmlLayer = document.getElementById('wbHtmlLayer');
const wbSelectionLayer = document.getElementById('wbSelectionLayer');
const wbZoomLabel = document.getElementById('wbZoomReset');
const wbColorPickerEl = document.getElementById('wbColorPicker');
const wbImageInput = document.getElementById('wbImageInput');

function wbApplyCamera() {
  if (!wbViewport) return;
  wbViewport.style.transform = `translate(${wbCamera.x}px,${wbCamera.y}px) scale(${wbCamera.scale})`;
  if (wbZoomLabel) wbZoomLabel.textContent = Math.round(wbCamera.scale * 100) + '%';
  // Update dot-grid background to move/scale with camera
  if (wbContainer) {
    const size = 28 * wbCamera.scale;
    const ox = wbCamera.x % size;
    const oy = wbCamera.y % size;
    wbContainer.style.backgroundSize = `${size}px ${size}px`;
    wbContainer.style.backgroundPosition = `${ox}px ${oy}px`;
  }
}

function wbClientToCanvas(cx, cy) {
  return {
    x: (cx - wbCamera.x) / wbCamera.scale,
    y: (cy - wbCamera.y) / wbCamera.scale,
  };
}

function wbSmoothPath(pts) {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]}`;
  if (pts.length === 2) return `M${pts[0][0]} ${pts[0][1]} L${pts[1][0]} ${pts[1][1]}`;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i],
      p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6, cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6, cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x} ${cp1y},${cp2x} ${cp2y},${p2[0]} ${p2[1]}`;
  }
  return d;
}

function wbMakeId() {
  return 'wb_' + Math.random().toString(36).slice(2, 9);
}

function wbSyncMap() {
  wbElementsMap.clear();
  for (const el of wbElements) wbElementsMap.set(el.id, el);
}

function wbMapAdd(el) { wbElementsMap.set(el.id, el); }
function wbMapRemove(id) { wbElementsMap.delete(id); }

function wbRenderSvgElements() {
  wbSvgElements.innerHTML = '';
  // Render edges first (behind shapes)
  for (const el of wbElements) {
    if (el.type === 'mmedge') wbRenderMmEdge(el);
  }
  for (const el of wbElements) {
    if (el.type === 'path') wbRenderPath(el);
    else if (el.type === 'rect') wbRenderRect(el);
    else if (el.type === 'circle') wbRenderCircle(el);
    else if (el.type === 'arrow') wbRenderArrow(el);
  }
}

function wbRenderAll() {
  if (!wbSvgElements || !wbHtmlLayer) return;
  wbRenderSvgElements();
  wbHtmlLayer.innerHTML = '';
  wbSelectionLayer.innerHTML = '';

  for (const el of wbElements) {
    if (el.type === 'note') wbRenderNote(el);
    else if (el.type === 'image') wbRenderImage(el);
    else if (el.type === 'mmnode') wbRenderMmNode(el);
  }
  wbRenderSelection();
}

function wbRenderNote(el) {
  const div = document.createElement('div');
  div.className = 'wb-note' + (el.id === wbSelected ? ' selected' : '');
  div.dataset.id = el.id;
  div.style.cssText = `left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;background:${el.color || '#fef9c3'}`;

  const body = document.createElement('div');
  body.className = 'wb-note-body';
  body.contentEditable = 'true';
  body.spellcheck = false;
  body.innerHTML = el.text || '';
  body.addEventListener('input', () => { el.text = body.innerHTML; wbScheduleSave(); });
  div.appendChild(body);

  // Unified drag-or-click: use movement threshold to distinguish
  let pdStart = null, pdHasMoved = false;
  div.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (wbActiveTool === 'eraser') { wbDeleteById(el.id); return; }
    wbSelectElement(el.id);
    const c = wbClientToCanvas(e.clientX, e.clientY);
    pdStart = { mx: e.clientX, my: e.clientY };
    pdHasMoved = false;
    wbDragging = { type: 'move', id: el.id, startX: c.x - el.x, startY: c.y - el.y };
    div.setPointerCapture(e.pointerId);
    // No preventDefault — browser focuses contenteditable naturally on click
  });
  div.addEventListener('pointermove', (e) => {
    if (!pdStart || !wbDragging || wbDragging.id !== el.id) return;
    if (Math.hypot(e.clientX - pdStart.mx, e.clientY - pdStart.my) < WB_DRAG_THRESHOLD_PX) return;
    pdHasMoved = true;
    const c = wbClientToCanvas(e.clientX, e.clientY);
    el.x = c.x - wbDragging.startX;
    el.y = c.y - wbDragging.startY;
    div.style.left = el.x + 'px';
    div.style.top = el.y + 'px';
    if (document.activeElement === body) body.blur(); // blur while dragging
    wbRenderSelection();
  });
  div.addEventListener('pointerup', () => {
    if (!pdStart) return;
    const moved = pdHasMoved;
    pdStart = null;
    wbDragging = null;
    if (moved) { wbSnapshot(); wbScheduleSave(); }
    // If not moved, browser already handled focus on the contenteditable body
  });
  wbHtmlLayer.appendChild(div);
}

function wbRenderImage(el) {
  const img = document.createElement('img');
  img.className = 'wb-image' + (el.id === wbSelected ? ' selected' : '');
  img.dataset.id = el.id;
  img.src = el.src;
  img.style.cssText = `left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px`;
  img.draggable = false;
  img.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (wbActiveTool === 'eraser') { wbDeleteById(el.id); return; }
    wbSelectElement(el.id);
    const c = wbClientToCanvas(e.clientX, e.clientY);
    wbDragging = { type: 'move', id: el.id, startX: c.x - el.x, startY: c.y - el.y };
    wbContainer.setPointerCapture(e.pointerId);
  });
  wbHtmlLayer.appendChild(img);
}

function wbRenderPath(el) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', wbSmoothPath(el.points));
  path.setAttribute('stroke', el.color || '#374151');
  path.setAttribute('stroke-width', el.width || 2);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.dataset.id = el.id;
  path.style.pointerEvents = 'stroke';
  path.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (wbActiveTool === 'eraser') { wbDeleteById(el.id); return; } wbSelectElement(el.id); });
  wbSvgElements.appendChild(path);
}

function wbRenderRect(el) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', el.x); rect.setAttribute('y', el.y);
  rect.setAttribute('width', el.w); rect.setAttribute('height', el.h);
  rect.setAttribute('rx', 4);
  rect.setAttribute('fill', el.fill || 'none');
  rect.setAttribute('stroke', el.color || '#374151');
  rect.setAttribute('stroke-width', el.strokeWidth || 2);
  rect.dataset.id = el.id;
  rect.style.pointerEvents = 'all';
  rect.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (wbActiveTool === 'eraser') { wbDeleteById(el.id); return; } wbSelectElement(el.id); const c = wbClientToCanvas(e.clientX, e.clientY); wbDragging = { type: 'move', id: el.id, startX: c.x - el.x, startY: c.y - el.y }; });
  wbSvgElements.appendChild(rect);
}

function wbRenderCircle(el) {
  const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  ellipse.setAttribute('cx', el.cx); ellipse.setAttribute('cy', el.cy);
  ellipse.setAttribute('rx', el.rx); ellipse.setAttribute('ry', el.ry);
  ellipse.setAttribute('fill', el.fill || 'none');
  ellipse.setAttribute('stroke', el.color || '#374151');
  ellipse.setAttribute('stroke-width', el.strokeWidth || 2);
  ellipse.dataset.id = el.id;
  ellipse.style.pointerEvents = 'all';
  ellipse.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (wbActiveTool === 'eraser') { wbDeleteById(el.id); return; } wbSelectElement(el.id); const c = wbClientToCanvas(e.clientX, e.clientY); wbDragging = { type: 'move', id: el.id, startX: c.x - el.cx, startY: c.y - el.cy }; });
  wbSvgElements.appendChild(ellipse);
}

function wbRenderArrow(el) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', el.x1); line.setAttribute('y1', el.y1);
  line.setAttribute('x2', el.x2); line.setAttribute('y2', el.y2);
  line.setAttribute('stroke', el.color || '#374151');
  line.setAttribute('stroke-width', el.strokeWidth || 2);
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('marker-end', 'url(#wbArrowHead)');
  line.dataset.id = el.id;
  line.style.pointerEvents = 'stroke';
  line.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (wbActiveTool === 'eraser') { wbDeleteById(el.id); return; } wbSelectElement(el.id); });
  wbSvgElements.appendChild(line);
}

// ── Mind Map ──────────────────────────────────────────────────────

function wbRenderMmEdge(edge) {
  const fromEl = wbElements.find(e => e.id === edge.fromId);
  const toEl = wbElements.find(e => e.id === edge.toId);
  if (!fromEl || !toEl) return;
  const fx = fromEl.x + fromEl.w, fy = fromEl.y + fromEl.h / 2;
  const tx = toEl.x,              ty = toEl.y + toEl.h / 2;
  const mx = (fx + tx) / 2;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M${fx},${fy} C${mx},${fy} ${mx},${ty} ${tx},${ty}`);
  path.setAttribute('stroke', edge.color || '#9ca3af');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  wbSvgElements.appendChild(path);
}

function wbRenderMmNode(el) {
  const div = document.createElement('div');
  div.className = 'wb-mmnode' + (el.id === wbSelected ? ' selected' : '');
  div.dataset.id = el.id;
  div.style.cssText = `left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;background:${el.color || '#2563eb'};color:${el.textColor || '#fff'}`;

  const label = document.createElement('div');
  label.className = 'wb-mmnode-label';
  label.contentEditable = 'true';
  label.spellcheck = false;
  label.textContent = el.text || 'Idea';
  label.addEventListener('input', () => { el.text = label.textContent; wbScheduleSave(); });
  div.appendChild(label);

  // "+ child" button shown on hover
  const addBtn = document.createElement('button');
  addBtn.className = 'wb-mmnode-add';
  addBtn.title = 'Add child';
  addBtn.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  addBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); wbAddMmChild(el.id); });
  div.appendChild(addBtn);

  // Use container pointer capture (not div) to avoid conflict with contenteditable implicit capture
  div.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('.wb-mmnode-add')) return;
    e.stopPropagation();
    if (wbActiveTool === 'eraser') { wbDeleteById(el.id); return; }
    wbSelectElement(el.id);
    const c = wbClientToCanvas(e.clientX, e.clientY);
    wbDragging = { type: 'move', id: el.id, startX: c.x - el.x, startY: c.y - el.y, mmDiv: div, mmLabel: label };
    wbContainer.setPointerCapture(e.pointerId);
  });

  wbHtmlLayer.appendChild(div);
}

function wbAddMmChild(parentId) {
  const parent = wbElementsMap.get(parentId);
  if (!parent) return;
  // Stack children below each other to the right of parent
  const children = wbElements.filter(e => e.type === 'mmedge' && e.fromId === parentId)
    .map(edge => wbElementsMap.get(edge.toId)).filter(Boolean);
  const gap = 16;
  const childY = children.length > 0
    ? Math.max(...children.map(c => c.y + c.h)) + gap
    : parent.y;
  const childX = parent.x + parent.w + 100;

  wbSnapshot();
  const childId = wbMakeId();
  const MMCOLORS = ['#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#0891b2'];
  const color = MMCOLORS[(wbElements.filter(e => e.type === 'mmnode').length) % MMCOLORS.length];
  const childEl = { type: 'mmnode', id: childId, x: childX, y: childY, w: 140, h: 44, text: 'Idea', color, textColor: '#fff' };
  const edgeEl = { type: 'mmedge', id: wbMakeId(), fromId: parentId, toId: childId, color: '#9ca3af' };
  wbElements.push(childEl, edgeEl);
  wbMapAdd(childEl); wbMapAdd(edgeEl);
  wbScheduleSave();
  wbSelected = childId;
  wbRenderAll();
  // Use Selection API instead of deprecated execCommand
  requestAnimationFrame(() => {
    const nodeEl = wbHtmlLayer.querySelector(`[data-id="${childId}"] .wb-mmnode-label`);
    if (nodeEl) {
      nodeEl.focus();
      const range = document.createRange();
      range.selectNodeContents(nodeEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
}

// ── End Mind Map ───────────────────────────────────────────────────

function wbRenderSelection() {
  if (!wbSelectionLayer) return;
  wbSelectionLayer.innerHTML = '';
  if (!wbSelected) return;
  const el = wbElementsMap.get(wbSelected);
  if (!el || el.type === 'path' || el.type === 'arrow' || el.type === 'mmedge') return;

  let x, y, w, h;
  if (el.type === 'note' || el.type === 'image' || el.type === 'rect' || el.type === 'mmnode') {
    x = el.x; y = el.y; w = el.w; h = el.h;
  } else if (el.type === 'circle') {
    x = el.cx - el.rx; y = el.cy - el.ry; w = el.rx * 2; h = el.ry * 2;
  } else return;

  const handles = [
    { cls: 'nw', dx: x, dy: y },
    { cls: 'ne', dx: x + w, dy: y },
    { cls: 'sw', dx: x, dy: y + h },
    { cls: 'se', dx: x + w, dy: y + h },
  ];
  for (const h of handles) {
    const hDiv = document.createElement('div');
    hDiv.className = 'wb-handle ' + h.cls;
    hDiv.style.cssText = `left:${h.dx - 4}px;top:${h.dy - 4}px;position:absolute;`;
    hDiv.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const c = wbClientToCanvas(e.clientX, e.clientY);
      wbDragging = { type: 'resize', id: el.id, corner: h.cls, origEl: { ...el }, startX: c.x, startY: c.y };
    });
    wbSelectionLayer.appendChild(hDiv);
  }
}

function wbSelectElement(id) {
  // Remove selected class from previous in-place (no full re-render)
  if (wbSelected && wbSelected !== id) {
    wbHtmlLayer?.querySelector(`[data-id="${wbSelected}"]`)?.classList.remove('selected');
    wbSvgElements?.querySelector(`[data-id="${wbSelected}"]`)?.classList.remove('selected');
  }
  wbSelected = id;
  // Add selected class to new element in-place
  wbHtmlLayer?.querySelector(`[data-id="${id}"]`)?.classList.add('selected');
  const el = wbElementsMap.get(id);
  // Show color picker for notes and mindmap nodes
  if (wbColorPickerEl) {
    const showPicker = el && (el.type === 'note' || el.type === 'mmnode');
    wbColorPickerEl.classList.toggle('hidden', !showPicker);
    if (showPicker) {
      wbColorPickerEl.querySelectorAll('.wb-color-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.color === el.color);
      });
    }
  }
  // Only re-render selection handles, NOT the whole canvas
  wbRenderSelection();
}

function wbDeselectAll() {
  if (wbSelected) {
    wbHtmlLayer?.querySelector(`[data-id="${wbSelected}"]`)?.classList.remove('selected');
    wbSvgElements?.querySelector(`[data-id="${wbSelected}"]`)?.classList.remove('selected');
  }
  wbSelected = null;
  if (wbColorPickerEl) wbColorPickerEl.classList.add('hidden');
  if (wbSelectionLayer) wbSelectionLayer.innerHTML = '';
}

function wbAddElement(el) {
  wbSnapshot();
  el.id = el.id || wbMakeId();
  wbElements.push(el);
  wbMapAdd(el);
  wbRenderAll();
  wbScheduleSave();
  return el;
}

function wbUpdateElement(id, patch) {
  const el = wbElementsMap.get(id);
  if (!el) return;
  Object.assign(el, patch);
  wbRenderAll();
  wbScheduleSave();
}

function wbDeleteById(id) {
  wbSnapshot();
  const el = wbElementsMap.get(id);
  if (el && el.type === 'mmnode') {
    wbElements = wbElements.filter(e => e.id !== id && !(e.type === 'mmedge' && (e.fromId === id || e.toId === id)));
  } else {
    wbElements = wbElements.filter(e => e.id !== id);
  }
  wbSyncMap();
  if (wbSelected === id) { wbSelected = null; if (wbColorPickerEl) wbColorPickerEl.classList.add('hidden'); }
  wbRenderAll();
  wbScheduleSave();
}

function wbDeleteSelected() {
  if (!wbSelected) return;
  wbDeleteById(wbSelected);
}

function wbSnapshot() {
  wbHistory.push(JSON.stringify(wbElements));
  if (wbHistory.length > WB_HISTORY_LIMIT) wbHistory.shift();
  wbFuture = [];
}

function wbUndo() {
  if (!wbHistory.length) return;
  wbFuture.push(JSON.stringify(wbElements));
  wbElements = JSON.parse(wbHistory.pop());
  wbSyncMap();
  wbSelected = null;
  wbRenderAll();
  wbScheduleSave();
}

function wbRedo() {
  if (!wbFuture.length) return;
  wbHistory.push(JSON.stringify(wbElements));
  wbElements = JSON.parse(wbFuture.pop());
  wbSyncMap();
  wbSelected = null;
  wbRenderAll();
  wbScheduleSave();
}

function wbScheduleSave() {
  clearTimeout(wbSaveTimer);
  wbSaveTimer = setTimeout(async () => {
    try {
      await window.kit.saveBoard(JSON.stringify({ camera: wbCamera, elements: wbElements }));
    } catch (err) {
      console.error('[wb] save failed:', err);
    }
  }, WB_SAVE_DEBOUNCE_MS);
}

async function wbLoad() {
  try {
    const res = await window.kit.loadBoard();
    if (res?.ok && res.data) {
      const parsed = JSON.parse(res.data);
      wbElements = parsed.elements || [];
      if (parsed.camera) wbCamera = parsed.camera;
      wbSyncMap();
    }
  } catch (err) {
    console.error('[wb] load failed:', err);
  }
  wbApplyCamera();
  wbRenderAll();
}

// ── Pointer events ──

function wbGetToolFromContainer(e) {
  return wbActiveTool;
}

wbContainer?.addEventListener('pointerdown', (e) => {
  if (!document.body.classList.contains('whiteboard-mode')) return;
  const c = wbClientToCanvas(e.clientX, e.clientY);

  // Pan: middle button or space+drag
  if (e.button === 1 || (e.button === 0 && wbSpaceDown)) {
    wbPanStart = { mx: e.clientX, my: e.clientY, cx: wbCamera.x, cy: wbCamera.y };
    wbContainer.classList.add('panning');
    wbContainer.setPointerCapture(e.pointerId);
    return;
  }
  if (e.button !== 0) return;

  const tool = wbActiveTool;

  if (tool === 'select') {
    // If an element handler already set wbDragging, don't interfere
    if (!wbDragging) {
      wbDeselectAll();
      // Left-drag on empty canvas = pan
      wbPanStart = { mx: e.clientX, my: e.clientY, cx: wbCamera.x, cy: wbCamera.y };
      wbContainer.classList.add('panning');
      wbContainer.setPointerCapture(e.pointerId);
    }
  } else if (tool === 'note') {
    const el = wbAddElement({ type: 'note', x: c.x, y: c.y, w: 200, h: 150, text: '', color: '#fef9c3' });
    wbSelected = el.id;
    wbRenderAll();
    // Focus after render
    setTimeout(() => {
      const noteEl = wbHtmlLayer.querySelector(`[data-id="${el.id}"] .wb-note-body`);
      if (noteEl) noteEl.focus();
    }, 50);
  } else if (tool === 'pen') {
    wbSnapshot();
    wbDrawing = { type: 'path', id: wbMakeId(), points: [[c.x, c.y]], color: '#374151', width: 2 };
    wbContainer.setPointerCapture(e.pointerId);
  } else if (tool === 'rect') {
    wbDrawing = { type: 'rect', id: wbMakeId(), x: c.x, y: c.y, w: 0, h: 0, color: '#374151', strokeWidth: 2, fill: 'none', _startX: c.x, _startY: c.y };
    wbContainer.setPointerCapture(e.pointerId);
  } else if (tool === 'circle') {
    wbDrawing = { type: 'circle', id: wbMakeId(), cx: c.x, cy: c.y, rx: 0, ry: 0, color: '#374151', strokeWidth: 2, fill: 'none', _startX: c.x, _startY: c.y };
    wbContainer.setPointerCapture(e.pointerId);
  } else if (tool === 'arrow') {
    wbDrawing = { type: 'arrow', id: wbMakeId(), x1: c.x, y1: c.y, x2: c.x, y2: c.y, color: '#374151', strokeWidth: 2 };
    wbContainer.setPointerCapture(e.pointerId);
  } else if (tool === 'image') {
    wbImageInput?.click();
  } else if (tool === 'mindmap') {
    const el = wbAddElement({ type: 'mmnode', x: c.x - 60, y: c.y - 18, w: 120, h: 36, text: 'Topic', color: '#dbeafe', parentId: null });
    wbSelected = el.id;
    wbRenderAll();
    requestAnimationFrame(() => {
      const label = wbHtmlLayer.querySelector(`[data-id="${el.id}"] .wb-mmnode-label`);
      if (label) {
        label.focus();
        const range = document.createRange();
        range.selectNodeContents(label);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  }
});

// Cached preview SVG elements — created once, updated with setAttribute (no DOM churn)
let wbPreviewEl = null;

function wbEnsurePreview(tag) {
  if (!wbPreviewEl || wbPreviewEl.tagName.toLowerCase() !== tag) {
    wbSvgPreview.innerHTML = '';
    wbPreviewEl = document.createElementNS('http://www.w3.org/2000/svg', tag);
    wbSvgPreview.appendChild(wbPreviewEl);
  }
  return wbPreviewEl;
}

// In-place DOM updaters for move/resize — no wbRenderAll() during drag
function wbApplyMoveDOM(el) {
  if (el.type === 'note' || el.type === 'image' || el.type === 'mmnode') {
    const dom = wbHtmlLayer.querySelector(`[data-id="${el.id}"]`);
    if (dom) { dom.style.left = el.x + 'px'; dom.style.top = el.y + 'px'; }
  } else if (el.type === 'rect') {
    const dom = wbSvgElements.querySelector(`[data-id="${el.id}"]`);
    if (dom) { dom.setAttribute('x', el.x); dom.setAttribute('y', el.y); }
  } else if (el.type === 'circle') {
    const dom = wbSvgElements.querySelector(`[data-id="${el.id}"]`);
    if (dom) { dom.setAttribute('cx', el.cx); dom.setAttribute('cy', el.cy); }
  }
}

function wbApplyResizeDOM(el) {
  if (el.type === 'note' || el.type === 'image') {
    const dom = wbHtmlLayer.querySelector(`[data-id="${el.id}"]`);
    if (dom) { dom.style.left = el.x + 'px'; dom.style.top = el.y + 'px'; dom.style.width = el.w + 'px'; dom.style.height = el.h + 'px'; }
  } else if (el.type === 'rect') {
    const dom = wbSvgElements.querySelector(`[data-id="${el.id}"]`);
    if (dom) { dom.setAttribute('x', el.x); dom.setAttribute('y', el.y); dom.setAttribute('width', el.w); dom.setAttribute('height', el.h); }
  } else if (el.type === 'circle') {
    const dom = wbSvgElements.querySelector(`[data-id="${el.id}"]`);
    if (dom) { dom.setAttribute('cx', el.cx); dom.setAttribute('cy', el.cy); dom.setAttribute('rx', el.rx); dom.setAttribute('ry', el.ry); }
  } else if (el.type === 'mmnode') {
    const dom = wbHtmlLayer.querySelector(`[data-id="${el.id}"]`);
    if (dom) { dom.style.left = el.x + 'px'; dom.style.top = el.y + 'px'; dom.style.width = el.w + 'px'; dom.style.height = el.h + 'px'; }
  }
}

wbContainer?.addEventListener('pointermove', (e) => {
  if (!document.body.classList.contains('whiteboard-mode')) return;

  // Throttle to one update per animation frame
  if (wbRafPending) return;
  wbRafPending = true;
  const clientX = e.clientX, clientY = e.clientY;

  requestAnimationFrame(() => {
    wbRafPending = false;
    const c = wbClientToCanvas(clientX, clientY);

    // Panning
    if (wbPanStart) {
      wbCamera.x = wbPanStart.cx + (clientX - wbPanStart.mx);
      wbCamera.y = wbPanStart.cy + (clientY - wbPanStart.my);
      wbApplyCamera();
      return;
    }

    // Move / resize — update DOM in-place, no full re-render
    if (wbDragging) {
      const el = wbElementsMap.get(wbDragging.id);
      if (!el) return;

      if (wbDragging.type === 'move') {
        if (el.type === 'mmnode') {
          el.x = c.x - wbDragging.startX;
          el.y = c.y - wbDragging.startY;
          const d = wbDragging.mmDiv || wbHtmlLayer.querySelector(`[data-id="${el.id}"]`);
          if (d) { d.style.left = el.x + 'px'; d.style.top = el.y + 'px'; }
          if (document.activeElement === wbDragging.mmLabel) wbDragging.mmLabel?.blur();
          wbRenderSvgElements();
        } else if (el.type === 'note' || el.type === 'image' || el.type === 'rect') {
          el.x = c.x - wbDragging.startX;
          el.y = c.y - wbDragging.startY;
          wbApplyMoveDOM(el);
        } else if (el.type === 'circle') {
          el.cx = c.x - wbDragging.startX;
          el.cy = c.y - wbDragging.startY;
          wbApplyMoveDOM(el);
        }
      } else if (wbDragging.type === 'resize') {
        const orig = wbDragging.origEl;
        const dx = c.x - wbDragging.startX;
        const dy = c.y - wbDragging.startY;
        const corner = wbDragging.corner;
        if (el.type === 'note' || el.type === 'image' || el.type === 'rect' || el.type === 'mmnode') {
          if (corner === 'se') { el.w = Math.max(WB_MIN_W, orig.w + dx); el.h = Math.max(WB_MIN_H, orig.h + dy); }
          else if (corner === 'sw') { el.x = orig.x + dx; el.w = Math.max(WB_MIN_W, orig.w - dx); el.h = Math.max(WB_MIN_H, orig.h + dy); }
          else if (corner === 'ne') { el.y = orig.y + dy; el.w = Math.max(WB_MIN_W, orig.w + dx); el.h = Math.max(WB_MIN_H, orig.h - dy); }
          else if (corner === 'nw') { el.x = orig.x + dx; el.y = orig.y + dy; el.w = Math.max(WB_MIN_W, orig.w - dx); el.h = Math.max(WB_MIN_H, orig.h - dy); }
        } else if (el.type === 'circle') {
          el.rx = Math.max(20, orig.rx + dx);
          el.ry = Math.max(20, orig.ry + dy);
        }
        wbApplyResizeDOM(el);
      }
      wbRenderSelection();
      return;
    }

    // Drawing — update cached preview element, no DOM recreation
    if (wbDrawing) {
      const d = wbDrawing;
      if (d.type === 'path') {
        d.points.push([c.x, c.y]);
        const p = wbEnsurePreview('path');
        p.setAttribute('d', wbSmoothPath(d.points));
        p.setAttribute('stroke', d.color); p.setAttribute('stroke-width', d.width);
        p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round');
      } else if (d.type === 'rect') {
        d.x = Math.min(c.x, d._startX); d.y = Math.min(c.y, d._startY);
        d.w = Math.abs(c.x - d._startX); d.h = Math.abs(c.y - d._startY);
        const r = wbEnsurePreview('rect');
        r.setAttribute('x', d.x); r.setAttribute('y', d.y);
        r.setAttribute('width', d.w); r.setAttribute('height', d.h);
        r.setAttribute('rx', 4); r.setAttribute('fill', 'none');
        r.setAttribute('stroke', d.color); r.setAttribute('stroke-width', d.strokeWidth);
      } else if (d.type === 'circle') {
        d.rx = Math.abs(c.x - d._startX) / 2; d.ry = Math.abs(c.y - d._startY) / 2;
        d.cx = (c.x + d._startX) / 2; d.cy = (c.y + d._startY) / 2;
        const el = wbEnsurePreview('ellipse');
        el.setAttribute('cx', d.cx); el.setAttribute('cy', d.cy);
        el.setAttribute('rx', d.rx); el.setAttribute('ry', d.ry);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', d.color); el.setAttribute('stroke-width', d.strokeWidth);
      } else if (d.type === 'arrow') {
        d.x2 = c.x; d.y2 = c.y;
        const l = wbEnsurePreview('line');
        l.setAttribute('x1', d.x1); l.setAttribute('y1', d.y1);
        l.setAttribute('x2', d.x2); l.setAttribute('y2', d.y2);
        l.setAttribute('stroke', d.color); l.setAttribute('stroke-width', d.strokeWidth);
        l.setAttribute('stroke-linecap', 'round'); l.setAttribute('marker-end', 'url(#wbArrowHead)');
      }
    }
  });
});

wbContainer?.addEventListener('pointerup', (e) => {
  if (!document.body.classList.contains('whiteboard-mode')) return;

  if (wbPanStart) {
    wbPanStart = null;
    wbContainer.classList.remove('panning');
    wbScheduleSave();
    return;
  }

  if (wbDragging) {
    wbSnapshot();
    wbDragging = null;
    wbScheduleSave();
    return;
  }

  if (wbDrawing) {
    const d = wbDrawing;
    wbSvgPreview.innerHTML = '';
    wbPreviewEl = null;
    // Finalize: remove internal fields, add to elements
    const { _startX, _startY, ...cleanEl } = d;
    if ((d.type === 'path' && d.points.length > 1) ||
        (d.type === 'rect' && d.w > 4 && d.h > 4) ||
        (d.type === 'circle' && d.rx > 4) ||
        (d.type === 'arrow' && (Math.abs(d.x2 - d.x1) > 4 || Math.abs(d.y2 - d.y1) > 4))) {
      wbElements.push(cleanEl);
      wbMapAdd(cleanEl);
      wbScheduleSave();
      wbRenderAll();
    }
    wbDrawing = null;
  }
});

wbContainer?.addEventListener('wheel', (e) => {
  if (!document.body.classList.contains('whiteboard-mode')) return;
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.9 : (1 / 0.9);
  const newScale = Math.max(0.05, Math.min(5, wbCamera.scale * factor));
  const rect = wbContainer.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  wbCamera.x = mx - (mx - wbCamera.x) * (newScale / wbCamera.scale);
  wbCamera.y = my - (my - wbCamera.y) * (newScale / wbCamera.scale);
  wbCamera.scale = newScale;
  wbApplyCamera();
}, { passive: false });

// Space = pan mode
document.addEventListener('keydown', (e) => {
  if (!document.body.classList.contains('whiteboard-mode')) return;
  if (e.code === 'Space' && !e.target.isContentEditable && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    wbSpaceDown = true;
    if (wbContainer) wbContainer.style.cursor = 'grab';
  }
  if (e.key === 'Escape') { wbDeselectAll(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const focused = document.activeElement;
    if (focused && (focused.isContentEditable || focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) return;
    wbDeleteSelected();
    return;
  }
  const meta = e.ctrlKey || e.metaKey;
  if (meta && e.key === 'z') { e.preventDefault(); wbUndo(); return; }
  if (meta && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); wbRedo(); return; }
  // Tool shortcuts
  if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const toolKeys = { v: 'select', n: 'note', p: 'pen', r: 'rect', e: 'circle', a: 'arrow', i: 'image', m: 'mindmap', x: 'eraser' };
  const tool = toolKeys[e.key.toLowerCase()];
  if (tool) wbSetTool(tool);
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    wbSpaceDown = false;
    if (wbContainer && document.body.classList.contains('whiteboard-mode')) {
      wbContainer.style.cursor = '';
    }
  }
});

function wbSetTool(tool) {
  wbActiveTool = tool;
  document.querySelectorAll('.wb-tool-btn[data-tool]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
  document.body.classList.toggle('eraser-active', tool === 'eraser');
  if (tool !== 'select') wbDeselectAll();
}

function setWhiteboardMode(on) {
  document.body.classList.toggle('whiteboard-mode', !!on);
  if (on) {
    document.body.classList.remove('browser-mode', 'calendar-mode', 'email-mode', 'agent-mode', 'stairs-mode', 'stairs-sidebar-open');
    document.getElementById('markdownPreview')?.classList.remove('show');
    wbLoad();
  } else {
    updateStatus();
  }
}

// Wire up toolbar buttons
document.getElementById('whiteboardBtn')?.addEventListener('click', () => setWhiteboardMode(true));

document.getElementById('wbToolbar')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.wb-tool-btn[data-tool]');
  if (btn) wbSetTool(btn.dataset.tool);
});

document.getElementById('wbUndoBtn')?.addEventListener('click', wbUndo);
document.getElementById('wbRedoBtn')?.addEventListener('click', wbRedo);
document.getElementById('wbZoomIn')?.addEventListener('click', () => {
  wbCamera.scale = Math.min(5, wbCamera.scale * (1 / 0.9));
  wbApplyCamera();
});
document.getElementById('wbZoomOut')?.addEventListener('click', () => {
  wbCamera.scale = Math.max(0.05, wbCamera.scale * 0.9);
  wbApplyCamera();
});
document.getElementById('wbZoomReset')?.addEventListener('click', () => {
  wbCamera = { x: 0, y: 0, scale: 1 };
  wbApplyCamera();
});

document.getElementById('wbDownloadBtn')?.addEventListener('click', async () => {
  const r = document.getElementById('wbContainer')?.getBoundingClientRect();
  if (!r) return;
  await window.kit.captureBoard({ x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) });
});

wbColorPickerEl?.addEventListener('click', (e) => {
  const dot = e.target.closest('.wb-color-dot');
  if (!dot || !wbSelected) return;
  const el = wbElements.find(e2 => e2.id === wbSelected);
  if (el && (el.type === 'note' || el.type === 'mmnode')) {
    wbSnapshot();
    wbUpdateElement(wbSelected, { color: dot.dataset.color });
    // Update active dot
    wbColorPickerEl.querySelectorAll('.wb-color-dot').forEach(d => d.classList.toggle('active', d === dot));
  }
});

wbImageInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const c = { x: (-wbCamera.x / wbCamera.scale) + 100, y: (-wbCamera.y / wbCamera.scale) + 100 };
    wbAddElement({ type: 'image', src: ev.target.result, x: c.x, y: c.y, w: 400, h: 300 });
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

// ═══ END WHITEBOARD ENGINE ═══

// Ensure sidebar loads on startup and set default directory
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Set working directory — use starred folder if set, otherwise home dir
    const homeDir = await window.kit.homeDir();
    const starredFolder = localStorage.getItem('kitStarredFolder');
    termCwd = starredFolder || homeDir || '/';
    updateSideHeaderToCwd();
    updateStarredFolderBtn();
    refreshSidebar();

    // Ensure .Kit folder exists
    await window.kit.ensureFolder();

    // Resolve README path — bundled with the app at its root
    const readmeResult = await window.kit.getReadmePath();
    const readmePath = readmeResult?.path || '';
    _appReadmePath = readmePath;

    // Session restore — if a previous session exists, reopen that file
    let sessionRestored = false;
    try {
      const session = JSON.parse(localStorage.getItem('kitSession') || 'null');
      if (session && session.file) {
        const res = await window.kit.readFile(session.file);
        if (res && res.ok) {
          openFileInTab(session.file, res.data);
          sessionRestored = true;
          // Restore working directory only if no starred folder overrides it
          if (session.cwd && !starredFolder) { termCwd = session.cwd; updateSideHeaderToCwd(); refreshSidebar(); }
          if (session.cursor) {
            setTimeout(() => {
              if (editor) {
                const pos = Math.min(session.cursor, editor.state.doc.length);
                editor.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
                editor.focus();
              }
            }, 300);
          }
        }
      }
    } catch(_) {}

    // Open README as default tab when there is no session to restore
    if (!sessionRestored) {
      try {
        const result = await window.kit.readFile(readmePath);
        if (result && result.ok) openFileInTab(readmePath, result.data);
      } catch(_) {}
    }

    // Re-enforce starred folder as termCwd — initCwd() may have raced and overwritten it
    if (starredFolder) {
      termCwd = starredFolder;
      updateSideHeaderToCwd();
      refreshSidebar();
    }

  } catch (e) {
    refreshSidebar(); // Fallback
  }

  // Toolbar search button opens project search modal (same behavior as Cmd+K)
  try {
    const searchBtn = document.getElementById('searchToggle');
    if (searchBtn) {
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.projectSearch && typeof window.projectSearch.open === 'function') {
          window.projectSearch.open();
        } else {
          const modal = document.getElementById('projectSearchModal');
          const input = document.getElementById('projectSearchInput');
          if (modal) { modal.style.display = 'flex'; }
          if (input) { input.focus(); }
        }
      });
    }
  } catch (_) { }
});
// /*__SIDEBAR_INIT__*/

// ===== Drag-and-Drop Files onto Editor =====
(function () {
  const editorWrapEl = document.getElementById('editorWrap');
  if (!editorWrapEl) return;
  editorWrapEl.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  editorWrapEl.addEventListener('drop', async e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.path) {
      const res = await window.kit.readFile(file.path);
      if (res && res.ok) { openFileInTab(file.path, res.data); }
    }
  });
})();

// ===== LSP-lite: F12 Jump-to-Definition =====
function getWordAtCursor(view) {
  if (!view || !view.state) return null;
  const word = view.state.wordAt(view.state.selection.main.head);
  if (!word) return null;
  return view.state.sliceDoc(word.from, word.to);
}

async function showDefinitionResults(word, grepOutput) {
  const out = document.getElementById('termOut');
  if (!grepOutput || !grepOutput.trim()) {
    if (out) { out.textContent += `No definition found for '${word}'\n`; out.scrollTop = out.scrollHeight; }
    return;
  }
  const results = grepOutput.trim().split('\n').filter(Boolean).map(line => {
    const m = line.match(/^(.+):(\d+):(.*)/);
    if (!m) return null;
    return { file: m[1], line: parseInt(m[2]), text: m[3].trim() };
  }).filter(Boolean);

  if (results.length === 0) {
    if (out) { out.textContent += `No definition found for '${word}'\n`; out.scrollTop = out.scrollHeight; }
    return;
  }
  if (results.length === 1) {
    const r = results[0];
    const fileRes = await window.kit.readFile(r.file);
    if (fileRes && fileRes.ok) {
      openFileInTab(r.file, fileRes.data);
      setTimeout(() => {
        if (editor) {
          const lineCount = editor.state.doc.lines;
          const lineNum = Math.min(r.line, lineCount);
          const lineObj = editor.state.doc.line(lineNum);
          editor.dispatch({ selection: { anchor: lineObj.from }, scrollIntoView: true });
          editor.focus();
        }
      }, 200);
    }
  } else {
    if (out) {
      out.textContent += `Definitions for '${word}':\n`;
      results.slice(0, 10).forEach(r => { out.textContent += `  ${r.file}:${r.line} — ${r.text}\n`; });
      out.scrollTop = out.scrollHeight;
    }
  }
}

document.addEventListener('keydown', async (e) => {
  if (e.key === 'F12' && editor &&
      !document.body.classList.contains('browser-mode')) {
    e.preventDefault();
    const word = getWordAtCursor(editor);
    if (!word || word.length < 2) return;
    const cwd = termCwd || (currentFile ? currentFile.split('/').slice(0, -1).join('/') : '');
    if (!cwd) return;
    const pattern = `function ${word}|const ${word} =|let ${word} =|var ${word} =|class ${word}|def ${word}|export function ${word}|${word}\\s*\\(`;
    try {
      const result = await window.kit.exec(cwd, `grep -rn -E "${pattern.replace(/"/g, '\\"')}" --include="*.js" --include="*.ts" --include="*.py" --include="*.go" --include="*.java" --include="*.rb" 2>/dev/null | head -20`);
      await showDefinitionResults(word, result.output || result.stdout || '');
    } catch (err) {
      const out = document.getElementById('termOut');
      if (out) { out.textContent += `! F12 error: ${err?.message || err}\n`; out.scrollTop = out.scrollHeight; }
    }
  }
});

// ===== Session Restore =====
function saveSession() {
  if (!currentFile || currentFile === _appReadmePath) {
    try { localStorage.removeItem('kitSession'); } catch(_) {}
    return;
  }
  const cursor = editor ? editor.state.selection.main.head : 0;
  try { localStorage.setItem('kitSession', JSON.stringify({ file: currentFile, cursor, cwd: termCwd })); } catch(_) {}
}
window.addEventListener('beforeunload', saveSession);

// --- Tab handling patch (robust) ---
(function () {
  function applyTab(el) {
    if (!el) return;
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const insert = '  ';
        if (this.tagName === 'TEXTAREA' || this.tagName === 'INPUT') {
          const start = this.selectionStart, end = this.selectionEnd, val = this.value;
          this.value = val.substring(0, start) + insert + val.substring(end);
          this.selectionStart = this.selectionEnd = start + insert.length;
        } else {
          document.execCommand('insertText', false, insert);
        }
      }
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
    applyTab(document.getElementById('editor'));
    document.querySelectorAll('.editor, [contenteditable="true"]').forEach(applyTab);
  });
})();
// --- end Tab handling patch ---


// --- simple handleCommand dispatcher (patched) ---
async function handleCommand(value) {
  try {
    if (!value || !value.trim()) return;
    if (window.kit && window.kit.exec) {
      await window.kit.exec(value.trim());
    } else {
    }
  } catch (e) {
  }
}
window.addEventListener('run-command', (e) => handleCommand(e.detail.value));
// --- end dispatcher patch ---

// Sidebar toggle persistence
(function () {
  const body = document.body;
  try { if (localStorage.getItem('sidebarOpen') === '1') body.classList.add('sidebar-open'); } catch (_) {}
  const observer = new MutationObserver(() => {
    const open = body.classList.contains('sidebar-open');
    try { localStorage.setItem('sidebarOpen', open ? '1' : '0'); } catch (_) {}
  });
  observer.observe(body, { attributes: true, attributeFilter: ['class'] });
})();



// ===== Settings Panel =====
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('kitSettings') || '{}');
    const defaultAiCtx = { calendar: true, bookmarks: true, browserPage: true, webSearch: true };
    editorSettings = { fontSize: 14, tabSize: 2, lineWrap: false, autoSave: 0, aiContext: defaultAiCtx, ...saved };
    editorSettings.aiContext = { ...defaultAiCtx, ...(saved.aiContext || {}) };
  } catch (_) {
    editorSettings = { fontSize: 14, tabSize: 2, lineWrap: false, autoSave: 0, aiContext: { calendar: true, bookmarks: true, browserPage: true, webSearch: true } };
  }
  applyEditorSettings();
}

function applyEditorSettings() {
  // Font size
  const wrap = document.getElementById('editorWrap');
  if (wrap) wrap.style.fontSize = `${editorSettings.fontSize}px`;
  if (editor) editor.dom.style.fontSize = `${editorSettings.fontSize}px`;
  // Rebuild editor to apply tabSize and lineWrap
  if (editor) rebuildEditor(editor.state.doc.toString());
  // Auto-save
  if (autoSaveTimer) { clearInterval(autoSaveTimer); autoSaveTimer = null; }
  if (editorSettings.autoSave > 0) {
    autoSaveTimer = setInterval(() => {
      if (currentFile && dirty) {
        const content = editor?.state?.doc?.toString() || '';
        window.kit.writeFile(currentFile, content).then(r => { if (r.ok) { dirty = false; dirtyDot.classList.remove('on'); } }).catch(() => {});
      }
    }, editorSettings.autoSave * 1000);
  }
}

function saveSettings() {
  try { localStorage.setItem('kitSettings', JSON.stringify(editorSettings)); } catch (_) {}
}

function openSettingsPanel() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;
  // Populate current values
  const fSize = document.getElementById('settingFontSize');
  const tSize = document.getElementById('settingTabSize');
  const lWrap = document.getElementById('settingLineWrap');
  const aSave = document.getElementById('settingAutoSave');
  if (fSize) fSize.value = editorSettings.fontSize;
  if (tSize) tSize.value = editorSettings.tabSize;
  if (lWrap) lWrap.checked = editorSettings.lineWrap;
  if (aSave) aSave.value = editorSettings.autoSave;
  const ctx = editorSettings.aiContext || {};
  const aiCal = document.getElementById('settingAiCalendar');
  const aiBm = document.getElementById('settingAiBookmarks');
  const aiBp = document.getElementById('settingAiBrowserPage');
  const aiWs = document.getElementById('settingAiWebSearch');
  if (aiCal) aiCal.checked = ctx.calendar !== false;
  if (aiBm) aiBm.checked = ctx.bookmarks !== false;
  if (aiBp) aiBp.checked = ctx.browserPage !== false;
  if (aiWs) aiWs.checked = ctx.webSearch !== false;
  modal.classList.remove('hidden');
}

function closeSettingsPanel() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  document.getElementById('settingsBtn')?.addEventListener('click', openSettingsPanel);
  document.getElementById('settingsClose')?.addEventListener('click', closeSettingsPanel);
  document.getElementById('settingsModal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeSettingsPanel(); });

  document.getElementById('settingFontSize')?.addEventListener('change', e => {
    editorSettings.fontSize = Math.max(10, Math.min(24, parseInt(e.target.value) || 14));
    applyEditorSettings(); saveSettings();
  });
  document.getElementById('settingTabSize')?.addEventListener('change', e => {
    editorSettings.tabSize = parseInt(e.target.value) || 2;
    applyEditorSettings(); saveSettings();
  });
  document.getElementById('settingLineWrap')?.addEventListener('change', e => {
    editorSettings.lineWrap = e.target.checked;
    applyEditorSettings(); saveSettings();
  });
  document.getElementById('settingAutoSave')?.addEventListener('change', e => {
    editorSettings.autoSave = parseInt(e.target.value) || 0;
    applyEditorSettings(); saveSettings();
  });

  const aiCtxChange = (key) => (e) => {
    editorSettings.aiContext = { ...(editorSettings.aiContext || {}), [key]: e.target.checked };
    saveSettings();
  };
  document.getElementById('settingAiCalendar')?.addEventListener('change', aiCtxChange('calendar'));
  document.getElementById('settingAiBookmarks')?.addEventListener('change', aiCtxChange('bookmarks'));
  document.getElementById('settingAiBrowserPage')?.addEventListener('change', aiCtxChange('browserPage'));
  document.getElementById('settingAiWebSearch')?.addEventListener('change', aiCtxChange('webSearch'));
});

// Poll git status every 5 seconds, but only when in a git repo
setInterval(() => { if (_isGitRepo) updateGitInfo(); }, 3000);

// ===== Git Panel =====
function openGitPanel() {
  if (!termCwd) return;
  const modal = document.getElementById('gitModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  refreshGitPanel();
}

function closeGitPanel() {
  const modal = document.getElementById('gitModal');
  if (modal) modal.classList.add('hidden');
}

async function refreshGitPanel() {
  if (!termCwd) return;
  try {
    // Branches
    const branchRes = await window.kit.exec(termCwd, 'git branch');
    const currentBranch = (await window.kit.exec(termCwd, 'git rev-parse --abbrev-ref HEAD')).output.trim().split('\n')[0];
    const branchSelect = document.getElementById('gitBranchSelect');
    if (branchSelect && branchRes.ok) {
      const branches = branchRes.output.split('\n').map(b => b.replace(/^\*\s*/, '').trim()).filter(Boolean);
      branchSelect.innerHTML = branches.map(b => `<option value="${escapeHtml(b)}"${b === currentBranch ? ' selected' : ''}>${escapeHtml(b)}</option>`).join('');
      branchSelect.onchange = async () => {
        const log = document.getElementById('gitLogOutput');
        const r = await window.kit.exec(termCwd, `git checkout ${branchSelect.value}`);
        if (log) log.textContent = r.output;
        await refreshGitPanel();
        updateGitInfo();
      };
    }

    // Changed files
    const statusRes = await window.kit.exec(termCwd, 'git status --porcelain');
    const fileList = document.getElementById('gitFileList');
    if (fileList) {
      fileList.innerHTML = '';
      const lines = (statusRes.output || '').split('\n').filter(Boolean);
      if (!lines.length) {
        fileList.innerHTML = '<li class="git-file-empty">No changes</li>';
      } else {
        lines.forEach(line => {
          const rawStatus = line.substring(0, 2);
          const fname = line.substring(3).trim();
          const statusStr = rawStatus.trim() || 'M';
          const li = document.createElement('li');
          li.className = 'git-file-item';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.value = fname;
          cb.checked = statusStr !== '??';
          const badge = document.createElement('span');
          const badgeClass = statusStr === '??' ? 'new' : statusStr.startsWith('A') ? 'add' : statusStr.startsWith('D') ? 'del' : statusStr.startsWith('R') ? 'ren' : 'mod';
          badge.className = `git-status-badge git-status-${badgeClass}`;
          badge.textContent = statusStr === '??' ? 'NEW' : statusStr.startsWith('R') ? 'REN' : statusStr;
          const lbl = document.createElement('span');
          lbl.textContent = fname;
          lbl.className = 'git-file-name';
          lbl.title = fname;
          li.addEventListener('click', async (e) => {
            if (e.target === cb) return;
            const diff = document.getElementById('gitDiffPreview');
            if (!diff) return;
            li.classList.toggle('git-file-active');
            fileList.querySelectorAll('.git-file-item').forEach(el => { if (el !== li) el.classList.remove('git-file-active'); });
            const r = await window.kit.exec(termCwd, `git diff -- "${fname}"`);
            diff.innerHTML = '';
            const lines2 = (r.output || 'No diff').split('\n');
            lines2.forEach(dl => {
              const span = document.createElement('span');
              span.textContent = dl + '\n';
              if (dl.startsWith('+') && !dl.startsWith('+++')) span.className = 'diff-add';
              else if (dl.startsWith('-') && !dl.startsWith('---')) span.className = 'diff-del';
              else if (dl.startsWith('@@')) span.className = 'diff-meta';
              diff.appendChild(span);
            });
          });
          li.appendChild(cb);
          li.appendChild(badge);
          li.appendChild(lbl);
          fileList.appendChild(li);
        });
      }
    }

    // Clear diff preview
    const diffEl = document.getElementById('gitDiffPreview');
    if (diffEl) diffEl.textContent = '';
  } catch (err) {
    const log = document.getElementById('gitLogOutput');
    if (log) log.textContent = 'Error: ' + err.message;
  }
}

function _gitLog(text) {
  const el = document.getElementById('gitLogOutput');
  if (!el) return;
  el.textContent = text || '';
  el.classList.toggle('hidden', !text?.trim());
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('gitModal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeGitPanel(); });
  document.getElementById('gitModalClose')?.addEventListener('click', closeGitPanel);

  document.getElementById('gitCommitBtn')?.addEventListener('click', async () => {
    const msg = document.getElementById('gitCommitMsg')?.value?.trim();
    if (!msg) { alert('Enter a commit message.'); return; }
    const fileList = document.getElementById('gitFileList');
    const checked = fileList ? [...fileList.querySelectorAll('input[type=checkbox]:checked')].map(c => c.value) : [];
    if (!checked.length) { alert('No files selected.'); return; }
    const addCmd = checked.map(f => `git add -- "${f}"`).join(' && ');
    const r1 = await window.kit.exec(termCwd, addCmd);
    const r2 = await window.kit.exec(termCwd, `git commit -m "${msg.replace(/"/g, '\\"')}"`);
    _gitLog(((r1.output || '') + '\n' + (r2.output || '')).trim());
    if (document.getElementById('gitCommitMsg')) document.getElementById('gitCommitMsg').value = '';
    await refreshGitPanel();
    updateGitInfo();
  });

  document.getElementById('gitPullBtn')?.addEventListener('click', async () => {
    _gitLog('Pulling…');
    const r = await window.kit.exec(termCwd, 'git pull');
    _gitLog(r.output || 'Done');
    await refreshGitPanel();
    await updateGitInfo();
    setTimeout(() => updateGitInfo(), 1500);
  });

  document.getElementById('gitPushBtn')?.addEventListener('click', async () => {
    _gitLog('Pushing…');
    const r = await window.kit.exec(termCwd, 'git push');
    _gitLog(r.output || 'Done');
    await refreshGitPanel();
    await updateGitInfo();
    setTimeout(() => updateGitInfo(), 1500);
  });

  // Make git status bar clickable
  const gitInfoEl = document.getElementById('gitInfo');
  if (gitInfoEl) {
    gitInfoEl.style.cursor = 'pointer';
    gitInfoEl.title = 'Click to open Git panel';
    gitInfoEl.addEventListener('click', () => { if (gitInfoEl.textContent.trim()) openGitPanel(); });
  }
});

// ===== Calendar =====
let calendarData = { entries: {}, events: [] }; // { entries: { "YYYY-MM-DD": [] }, events: [{id,title,start,end,color}] }
let calViewYear = new Date().getFullYear();
let calViewMonth = new Date().getMonth(); // 0-indexed
let calSelectedKey = null;    // "YYYY-MM-DD"
let calFilePath = null;

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function calDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

async function calGetFilePath() {
  if (calFilePath) return calFilePath;
  const home = await window.kit.homeDir();
  calFilePath = home + '/.Kit/calendar.json';
  return calFilePath;
}

async function calLoad() {
  try {
    const p = await calGetFilePath();
    const r = await window.kit.readFile(p);
    if (r.ok) {
      const raw = JSON.parse(r.data || '{}');
      // Backward compat: old format was plain object with date keys
      if (raw && raw.entries !== undefined) {
        calendarData = { entries: raw.entries || {}, events: raw.events || [] };
      } else {
        calendarData = { entries: raw || {}, events: [] };
      }
    } else {
      calendarData = { entries: {}, events: [] };
    }
  } catch (_) { calendarData = { entries: {}, events: [] }; }
}

async function calSave() {
  try {
    const p = await calGetFilePath();
    await window.kit.writeFile(p, JSON.stringify(calendarData, null, 2));
  } catch (_) {}
}

function calRenderGrid() {
  const grid = document.getElementById('calGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const today = new Date();
  const todayKey = calDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const firstDay = new Date(calViewYear, calViewMonth, 1).getDay();
  const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
  const daysInPrev = new Date(calViewYear, calViewMonth, 0).getDate();
  const prevMonth = calViewMonth === 0 ? 11 : calViewMonth - 1;
  const prevYear  = calViewMonth === 0 ? calViewYear - 1 : calViewYear;
  const nextMonth = calViewMonth === 11 ? 0 : calViewMonth + 1;
  const nextYear  = calViewMonth === 11 ? calViewYear + 1 : calViewYear;
  const events = calendarData.events || [];

  // Build all cells with real date keys (including other-month cells)
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    cells.push({ dayNum: d, key: calDateKey(prevYear, prevMonth, d), cls: 'other-month', current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = calDateKey(calViewYear, calViewMonth, d);
    let cls = '';
    if (key === todayKey) cls = 'today';
    if (key === calSelectedKey) cls += ' selected';
    cells.push({ dayNum: d, key, cls: cls.trim(), current: true });
  }
  const trailing = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let i = 1; i <= trailing; i++) {
    cells.push({ dayNum: i, key: calDateKey(nextYear, nextMonth, i), cls: 'other-month', current: false });
  }

  const hdr = document.getElementById('calMonthYear');
  if (hdr) hdr.textContent = `${MONTH_NAMES[calViewMonth]} ${calViewYear}`;

  // Render week by week
  for (let w = 0; w < cells.length; w += 7) {
    const week = cells.slice(w, w + 7);
    const weekStart = week[0].key;
    const weekEnd   = week[6].key;

    const weekEl = document.createElement('div');
    weekEl.className = 'cal-week';

    // ── Day cells ──
    const cellsRow = document.createElement('div');
    cellsRow.className = 'cal-week-cells';
    week.forEach(cell => {
      const el = document.createElement('div');
      el.className = 'cal-day ' + cell.cls;

      const numEl = document.createElement('div');
      numEl.className = 'cal-day-num';
      numEl.textContent = cell.dayNum;
      el.appendChild(numEl);

      // Quick-note chips (entries)
      const notes = (calendarData.entries || {})[cell.key] || [];
      if (notes.length > 0) {
        const wrap = document.createElement('div');
        wrap.className = 'cal-day-entries';
        notes.slice(0, 2).forEach(txt => {
          const chip = document.createElement('div');
          chip.className = 'cal-day-entry-chip';
          chip.textContent = txt;
          wrap.appendChild(chip);
        });
        if (notes.length > 2) {
          const more = document.createElement('div');
          more.className = 'cal-day-more';
          more.textContent = `+${notes.length - 2} more`;
          wrap.appendChild(more);
        }
        el.appendChild(wrap);
      }

      if (cell.current) el.addEventListener('click', () => calSelectDay(cell.key, cell.dayNum));
      cellsRow.appendChild(el);
    });
    weekEl.appendChild(cellsRow);

    // ── Multi-day event bars ──
    const weekEvents = events
      .filter(ev => ev.start <= weekEnd && ev.end >= weekStart)
      .map(ev => ({ ...ev }));

    if (weekEvents.length > 0) {
      // Greedy lane assignment
      weekEvents.sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
      const laneEnds = [];
      weekEvents.forEach(ev => {
        const visStart = ev.start < weekStart ? weekStart : ev.start;
        let lane = laneEnds.findIndex(end => end < visStart);
        if (lane === -1) { lane = laneEnds.length; }
        const visEnd = ev.end > weekEnd ? weekEnd : ev.end;
        laneEnds[lane] = visEnd;
        ev._lane = lane;
      });

      const numLanes = laneEnds.length;
      const evLayer = document.createElement('div');
      evLayer.className = 'cal-week-events';
      evLayer.style.height = `${numLanes * 22 + 4}px`;

      weekEvents.forEach(ev => {
        const visStart = ev.start < weekStart ? weekStart : ev.start;
        const visEnd   = ev.end   > weekEnd   ? weekEnd   : ev.end;
        const startCol = week.findIndex(c => c.key === visStart);
        const endCol   = week.findIndex(c => c.key === visEnd);
        if (startCol < 0 || endCol < 0) return;

        const colW  = 100 / 7;
        const bar   = document.createElement('div');
        bar.className = 'cal-event-bar';
        const isStart = ev.start >= weekStart;
        const isEnd   = ev.end   <= weekEnd;
        if (isStart) bar.classList.add('ev-start');
        if (isEnd)   bar.classList.add('ev-end');
        bar.style.cssText = [
          `left:${startCol * colW + 0.4}%`,
          `width:${(endCol - startCol + 1) * colW - 0.8}%`,
          `top:${ev._lane * 22 + 2}px`,
          `background:${ev.color || '#2563eb'}`
        ].join(';');
        if (isStart) bar.textContent = ev.title;
        bar.title = ev.title;
        bar.addEventListener('click', e => { e.stopPropagation(); calOpenEventModal(ev); });
        evLayer.appendChild(bar);
      });
      weekEl.appendChild(evLayer);
    }

    grid.appendChild(weekEl);
  }
}

function calSelectDay(key, dayNum) {
  calSelectedKey = key;
  calRenderGrid(); calRenderMiniMonth();

  const side = document.getElementById('calSidePanel');
  const dateLabel = document.getElementById('calEntryDate');
  if (!side) return;

  side.classList.remove('hidden');
  if (dateLabel) {
    const [y, m, d] = key.split('-');
    dateLabel.textContent = `${MONTH_NAMES[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  }
  calRenderEntries();
  setTimeout(() => document.getElementById('calEntryInput')?.focus(), 50);
}

function calRenderEntries() {
  // Render day events (multi-day events that include this date)
  const evList = document.getElementById('calDayEvents');
  if (evList && calSelectedKey) {
    evList.innerHTML = '';
    const dayEvs = (calendarData.events || []).filter(ev => ev.start <= calSelectedKey && ev.end >= calSelectedKey);
    dayEvs.forEach(ev => {
      const item = document.createElement('div');
      item.className = 'cal-day-event-item';
      const dot = document.createElement('span');
      dot.className = 'cal-day-event-dot';
      dot.style.background = ev.color || '#2563eb';
      const info = document.createElement('div');
      info.className = 'cal-day-event-info';
      const title = document.createElement('div');
      title.className = 'cal-day-event-title';
      title.textContent = ev.title;
      const range = document.createElement('div');
      range.className = 'cal-day-event-range';
      range.textContent = ev.start === ev.end ? ev.start : `${ev.start} → ${ev.end}`;
      info.appendChild(title);
      info.appendChild(range);
      item.appendChild(dot);
      item.appendChild(info);
      item.addEventListener('click', () => calOpenEventModal(ev));
      evList.appendChild(item);
    });
  }

  // Render quick notes
  const list = document.getElementById('calEntryList');
  if (!list) return;
  list.innerHTML = '';
  const entries = (calendarData.entries || {})[calSelectedKey] || [];
  entries.forEach((text, idx) => {
    const li = document.createElement('li');
    li.className = 'cal-entry-item';
    const span = document.createElement('span');
    span.className = 'cal-entry-text';
    span.textContent = text;
    const del = document.createElement('button');
    del.className = 'cal-entry-del';
    del.textContent = '×';
    del.title = 'Delete note';
    del.addEventListener('click', () => calDeleteEntry(idx));
    li.appendChild(span);
    li.appendChild(del);
    list.appendChild(li);
  });
}

async function calAddEntry() {
  const input = document.getElementById('calEntryInput');
  const text = (input?.value || '').trim();
  if (!text || !calSelectedKey) return;
  if (!calendarData.entries) calendarData.entries = {};
  if (!calendarData.entries[calSelectedKey]) calendarData.entries[calSelectedKey] = [];
  calendarData.entries[calSelectedKey].push(text);
  await calSave();
  input.value = '';
  calRenderEntries();
  calRenderGrid(); calRenderSidebar();
}

async function calDeleteEntry(idx) {
  if (!calSelectedKey || !calendarData.entries?.[calSelectedKey]) return;
  calendarData.entries[calSelectedKey].splice(idx, 1);
  if (calendarData.entries[calSelectedKey].length === 0) delete calendarData.entries[calSelectedKey];
  await calSave();
  calRenderEntries();
  calRenderGrid(); calRenderSidebar();
}

function calRenderSidebar() {
  calRenderMiniMonth();
  calRenderUpcoming();
}

function calRenderMiniMonth() {
  const label = document.getElementById('calMiniLabel');
  const grid = document.getElementById('calMiniGrid');
  if (!label || !grid) return;

  label.textContent = MONTH_NAMES[calViewMonth].slice(0, 3) + ' ' + calViewYear;
  grid.innerHTML = '';

  // Day name headers
  DAY_NAMES.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-mini-day-name';
    el.textContent = d[0];
    grid.appendChild(el);
  });

  const today = new Date();
  const todayKey = calDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const firstDay = new Date(calViewYear, calViewMonth, 1).getDay();
  const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
  const daysInPrev = new Date(calViewYear, calViewMonth, 0).getDate();

  // Leading cells from prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    const el = document.createElement('div');
    el.className = 'cal-mini-cell other-month';
    el.textContent = daysInPrev - i;
    grid.appendChild(el);
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const key = calDateKey(calViewYear, calViewMonth, d);
    const el = document.createElement('div');
    el.className = 'cal-mini-cell';
    if (key === todayKey) el.classList.add('is-today');
    if (key === calSelectedKey) el.classList.add('is-selected');
    const hasNote = (calendarData.entries || {})[key]?.length > 0;
    const hasEv   = (calendarData.events  || []).some(ev => ev.start <= key && ev.end >= key);
    if (hasNote || hasEv) el.classList.add('has-events');
    el.textContent = d;
    el.addEventListener('click', () => calSelectDay(key, d));
    grid.appendChild(el);
  }

  // Trailing cells
  const totalCells = firstDay + daysInMonth;
  const trailing = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= trailing; i++) {
    const el = document.createElement('div');
    el.className = 'cal-mini-cell other-month';
    el.textContent = i;
    grid.appendChild(el);
  }
}

function calRenderUpcoming() {
  const container = document.getElementById('calUpcoming');
  if (!container) return;
  container.innerHTML = '';

  const today = new Date();
  const todayStr = calDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const futureStr = calDateKey(today.getFullYear(), today.getMonth(), today.getDate() + 14);
  const items = [];

  // Notes (entries)
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = calDateKey(d.getFullYear(), d.getMonth(), d.getDate());
    ((calendarData.entries || {})[key] || []).forEach(txt => items.push({ key, date: d, txt, color: null }));
  }
  // Events
  (calendarData.events || []).forEach(ev => {
    if (ev.start > futureStr || ev.end < todayStr) return;
    const startDate = new Date(ev.start + 'T00:00:00');
    const key = ev.start;
    items.push({ key, date: startDate, txt: ev.title, color: ev.color || '#2563eb', ev });
  });

  // Sort by date
  items.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'cal-upcoming-empty';
    empty.textContent = 'No events in the next 2 weeks';
    container.appendChild(empty);
    return;
  }

  items.slice(0, 10).forEach(({ key, date, txt, color, ev }) => {
    const el = document.createElement('div');
    el.className = 'cal-upcoming-item';
    const isToday = key === todayStr;
    const tomorrowStr = calDateKey(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const dateLabel = isToday ? 'Today' : key === tomorrowStr ? 'Tomorrow'
      : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const dotHtml = color ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:5px;vertical-align:middle"></span>` : '';
    el.innerHTML = `<div class="cal-upcoming-date">${dateLabel}</div><div class="cal-upcoming-text">${dotHtml}${escapeHtml(txt)}</div>`;
    el.addEventListener('click', () => {
      calViewYear = date.getFullYear();
      calViewMonth = date.getMonth();
      calRenderGrid();
      calSelectDay(ev ? ev.start : key, date.getDate());
      if (ev) setTimeout(() => calOpenEventModal(ev), 100);
    });
    container.appendChild(el);
  });
}

async function setCalendarMode(on) {
  document.body.classList.toggle('calendar-mode', !!on);
  if (on) {
    document.body.classList.remove('browser-mode', 'email-mode', 'whiteboard-mode', 'agent-mode', 'stairs-mode', 'cal-sidebar-open', 'stairs-sidebar-open');
    document.getElementById('markdownPreview')?.classList.remove('show');
    await calLoad();
    calViewYear = new Date().getFullYear();
    calViewMonth = new Date().getMonth();
    calSelectedKey = null;
    const side = document.getElementById('calSidePanel');
    if (side) side.classList.add('hidden');
    calRenderDayHeader();
    calRenderGrid();
    calRenderSidebar();
  } else {
    updateStatus();
  }
}

function calRenderDayHeader() {
  const hdr = document.getElementById('calDayHeader');
  if (!hdr) return;
  hdr.innerHTML = '';
  DAY_NAMES.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-name';
    el.textContent = d;
    hdr.appendChild(el);
  });
}

// ── Event Modal ────────────────────────────────────────────
let calEventModalEditId = null;
let calEventSelectedColor = '#2563eb';

function calOpenEventModal(event = null, defaultDate = null) {
  const modal = document.getElementById('calEventModal');
  if (!modal) return;
  calEventModalEditId = event?.id || null;
  calEventSelectedColor = event?.color || '#2563eb';

  document.getElementById('calEventTitleInput').value = event?.title || '';
  const start = event?.start || defaultDate || calSelectedKey || '';
  const end   = event?.end   || event?.start || defaultDate || calSelectedKey || '';
  document.getElementById('calEventStartInput').value = start;
  document.getElementById('calEventEndInput').value   = end;
  document.getElementById('calEventModalTitle').textContent = event ? 'Edit Event' : 'New Event';

  const delBtn = document.getElementById('calEventDeleteBtn');
  if (delBtn) delBtn.style.display = event ? 'inline-flex' : 'none';

  document.querySelectorAll('#calEventModal .cal-color-dot').forEach(d =>
    d.classList.toggle('selected', d.dataset.color === calEventSelectedColor));

  modal.classList.remove('hidden');
  setTimeout(() => document.getElementById('calEventTitleInput')?.focus(), 50);
}

function calCloseEventModal() {
  document.getElementById('calEventModal')?.classList.add('hidden');
  calEventModalEditId = null;
}

async function calSaveEventFromModal() {
  const title = (document.getElementById('calEventTitleInput')?.value || '').trim();
  const start = document.getElementById('calEventStartInput')?.value;
  let   end   = document.getElementById('calEventEndInput')?.value;
  if (!title || !start) return;
  if (!end || end < start) end = start;

  if (!calendarData.events) calendarData.events = [];
  if (calEventModalEditId) {
    const idx = calendarData.events.findIndex(ev => ev.id === calEventModalEditId);
    if (idx >= 0) calendarData.events[idx] = { ...calendarData.events[idx], title, start, end, color: calEventSelectedColor };
  } else {
    calendarData.events.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title, start, end, color: calEventSelectedColor
    });
  }
  await calSave();
  calCloseEventModal();
  calRenderGrid();
  calRenderSidebar();
  if (calSelectedKey) calRenderEntries();
}

async function calDeleteEventFromModal() {
  if (!calEventModalEditId) return;
  calendarData.events = (calendarData.events || []).filter(ev => ev.id !== calEventModalEditId);
  await calSave();
  calCloseEventModal();
  calRenderGrid();
  calRenderSidebar();
  if (calSelectedKey) calRenderEntries();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('calendarBtn')?.addEventListener('click', () => setCalendarMode(true));

  document.getElementById('calPrev')?.addEventListener('click', () => {
    calViewMonth--;
    if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
    calSelectedKey = null;
    document.getElementById('calSidePanel')?.classList.add('hidden');
    calRenderGrid(); calRenderSidebar();
  });

  document.getElementById('calNext')?.addEventListener('click', () => {
    calViewMonth++;
    if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
    calSelectedKey = null;
    document.getElementById('calSidePanel')?.classList.add('hidden');
    calRenderGrid(); calRenderSidebar();
  });

  document.getElementById('calTodayBtn')?.addEventListener('click', () => {
    calViewYear = new Date().getFullYear();
    calViewMonth = new Date().getMonth();
    calSelectedKey = null;
    document.getElementById('calSidePanel')?.classList.add('hidden');
    calRenderGrid(); calRenderSidebar();
  });

  document.getElementById('calSideClose')?.addEventListener('click', () => {
    calSelectedKey = null;
    document.getElementById('calSidePanel')?.classList.add('hidden');
    calRenderGrid(); calRenderSidebar();
  });

  // Mini month prev/next navigate the main calendar view
  document.getElementById('calMiniPrev')?.addEventListener('click', () => {
    calViewMonth--;
    if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
    calSelectedKey = null;
    document.getElementById('calSidePanel')?.classList.add('hidden');
    calRenderGrid(); calRenderSidebar();
  });

  document.getElementById('calMiniNext')?.addEventListener('click', () => {
    calViewMonth++;
    if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
    calSelectedKey = null;
    document.getElementById('calSidePanel')?.classList.add('hidden');
    calRenderGrid(); calRenderSidebar();
  });

  document.getElementById('calEntryAddBtn')?.addEventListener('click', calAddEntry);
  document.getElementById('calEntryInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') calAddEntry();
  });

  // New Event buttons
  document.getElementById('calNewEventBtn')?.addEventListener('click', () => calOpenEventModal(null, calSelectedKey));
  document.getElementById('calSidePanelNewEvent')?.addEventListener('click', () => calOpenEventModal(null, calSelectedKey));

  // Event modal color dots
  document.getElementById('calEventModal')?.addEventListener('click', e => {
    const dot = e.target.closest('.cal-color-dot');
    if (!dot) return;
    calEventSelectedColor = dot.dataset.color;
    document.querySelectorAll('#calEventModal .cal-color-dot').forEach(d => d.classList.toggle('selected', d === dot));
  });
  document.getElementById('calEventSaveBtn')?.addEventListener('click', calSaveEventFromModal);
  document.getElementById('calEventCancelBtn')?.addEventListener('click', calCloseEventModal);
  document.getElementById('calEventDeleteBtn')?.addEventListener('click', calDeleteEventFromModal);
  document.getElementById('calEventModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('calEventModal')) calCloseEventModal();
  });
  document.getElementById('calEventTitleInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') calSaveEventFromModal();
    if (e.key === 'Escape') calCloseEventModal();
  });
});

// ===== Email Mode =====

function setEmailMode(on) {
  document.body.classList.toggle('email-mode', !!on);
  if (on) {
    document.body.classList.remove('browser-mode', 'calendar-mode', 'whiteboard-mode', 'agent-mode', 'stairs-mode', 'email-sidebar-open', 'stairs-sidebar-open');
    document.getElementById('markdownPreview')?.classList.remove('show');
    document.getElementById('emailListView')?.classList.remove('hidden');
    document.getElementById('emailMessageView')?.classList.add('hidden');
    emailOpenUid = null;
    setTimeout(emailBootstrap, 0);
  } else {
    updateStatus();
  }
}
document.getElementById('emailToggle')?.addEventListener('click', () =>
  setEmailMode(!document.body.classList.contains('email-mode')));
window.setEmailMode = setEmailMode;

async function openEmailSetupModal() {
  // Pre-fill with existing config (password excluded for security)
  const existing = await KIT.email.getConfig().catch(() => null);
  document.getElementById('emailImapPort').value = existing?.imap?.port ?? '993';
  document.getElementById('emailImapSsl').checked = existing?.imap?.secure ?? true;
  document.getElementById('emailUser').value = existing?.imap?.user ?? '';
  document.getElementById('emailPass').value = '';
  document.getElementById('emailImapHost').value = existing?.imap?.host ?? '';
  document.getElementById('emailSmtpHost').value = existing?.smtp?.host ?? '';
  document.getElementById('emailSmtpPort').value = existing?.smtp?.port ?? '465';
  document.getElementById('emailSmtpSsl').checked = existing?.smtp?.secure ?? true;
  document.getElementById('emailSetupStatus').textContent = '';
  document.getElementById('emailSetupModal').classList.remove('hidden');
}

async function emailBootstrap() {
  const hasConfig = await KIT.email.hasConfig().catch(() => false);
  if (!hasConfig) {
    openEmailSetupModal();
  } else {
    emailFetchInbox();
  }
}

function emailSaveCache(messages) {
  try { localStorage.setItem('kitEmailCache', JSON.stringify({ messages, ts: Date.now() })); } catch (_) {}
}
function emailLoadCache() {
  try { const r = localStorage.getItem('kitEmailCache'); return r ? JSON.parse(r) : null; } catch (_) { return null; }
}

let emailCurrentFolder = 'INBOX';

async function emailFetchInbox(folder = emailCurrentFolder) {
  emailCurrentFolder = folder;

  // Update sidebar active state and folder title
  document.querySelectorAll('.email-folder-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.folder === folder);
  });
  const folderLabel = { INBOX: 'Inbox', Sent: 'Sent', Drafts: 'Drafts', Trash: 'Trash' };
  const titleEl = document.getElementById('emailFolderName');
  if (titleEl) titleEl.textContent = folderLabel[folder] || folder;

  const inner = document.getElementById('emailListInner');

  // Only use cache for INBOX
  const cached = folder === 'INBOX' ? emailLoadCache() : null;
  if (cached?.messages?.length) {
    emailMessages = cached.messages;
    renderEmailList(emailMessages);
    updateEmailUnreadBadge();
    if (inner) {
      const bar = document.createElement('div');
      bar.className = 'email-cache-bar';
      bar.id = 'emailRefreshBar';
      bar.textContent = 'Refreshing…';
      inner.prepend(bar);
    }
  } else {
    if (inner) inner.innerHTML = '<div style="padding:40px 0;text-align:center;color:#383838;font-size:13px">Loading…</div>';
  }

  const result = await KIT.email.fetchInbox(folder).catch(e => ({ ok: false, error: e.message }));
  document.getElementById('emailRefreshBar')?.remove();

  if (!result.ok) {
    if (!cached?.messages?.length) {
      if (inner) inner.innerHTML = `<div style="padding:20px;color:#c0392b;font-size:13px">
        <div style="margin-bottom:10px">Error: ${escapeHtml(result.error || 'Unknown error')}</div>
        <button id="emailErrorReconfigure" style="padding:5px 12px;background:#333;color:#ccc;border:1px solid #444;border-radius:5px;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;gap:5px">${ICON.gear} Reconfigure</button>
      </div>`;
      document.getElementById('emailErrorReconfigure')?.addEventListener('click', openEmailSetupModal);
    }
    return;
  }
  emailMessages = result.messages || [];
  if (folder === 'INBOX') emailSaveCache(emailMessages);
  renderEmailList(emailMessages);
  updateEmailUnreadBadge();
  // Update inbox unread count in sidebar
  if (folder === 'INBOX') {
    const countEl = document.getElementById('emailSidebarInboxCount');
    if (countEl) {
      const unread = emailMessages.filter(m => !m.seen).length;
      countEl.textContent = unread > 0 ? String(unread) : '';
    }
  }
}

function updateEmailUnreadBadge() {
  const badge = document.getElementById('emailUnreadCount');
  if (!badge) return;
  const unread = emailMessages.filter(m => !m.seen).length;
  badge.textContent = unread > 0 ? String(unread) : '';
}

function emailAvatarColor(str) {
  const palette = [
    '#E85D47','#E0792E','#C99B23','#4FA85C','#3A9E8C',
    '#4A88C4','#7A6FBB','#B75FA8','#C35C7A','#5E8E4A'
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

function emailAvatarInitials(from) {
  const name = emailFromName(from);
  if (!name) return '?';
  const w = name.trim().split(/\s+/);
  if (w.length >= 2) return (w[0][0] + w[w.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function emailRelativeTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function emailFromName(from) {
  if (!from) return '';
  const m = from.match(/^(.+?)\s*<[^>]+>/);
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : from.split('@')[0].replace(/^<+/, '');
}

function renderEmailList(messages) {
  const inner = document.getElementById('emailListInner');
  if (!inner) return;
  if (!messages.length) {
    inner.innerHTML = '<div style="padding:32px 20px;text-align:center;color:#B8B2AB;font-size:13px">No messages</div>';
    return;
  }

  const unreadMsgs = messages.filter(m => !m.seen);
  const readMsgs   = messages.filter(m =>  m.seen);

  function renderItem(msg, idx) {
    const fromStr  = msg.from || '';
    const color    = emailAvatarColor(fromStr || String(idx));
    const initials = escapeHtml(emailAvatarInitials(fromStr));
    const fromName = escapeHtml(emailFromName(fromStr));
    const subject  = escapeHtml(msg.subject || '(no subject)');
    const snippet  = escapeHtml((msg.snippet || '').trim());
    const time     = emailRelativeTime(msg.date);
    const unread   = !msg.seen;
    const sub      = fromName ? `${fromName}${snippet ? ` — ${snippet}` : ''}` : snippet;
    return `<div class="email-item${unread ? ' email-item-unread' : ''}" data-idx="${idx}" data-uid="${msg.uid}">
      <div class="email-avatar" style="background:${color}">${initials}</div>
      <div class="email-item-body">
        <div class="email-item-top">
          <span class="email-item-subject">${subject}</span>
          <span class="email-item-time">${time}</span>
        </div>
        <div class="email-item-sub">${sub}</div>
      </div>
    </div>`;
  }

  let html = '';
  let domIdx = 0;

  if (unreadMsgs.length) {
    html += `<div class="email-section-divider">
      <span class="email-section-label">NEW FOR YOU</span>
      <div class="email-section-line"></div>
    </div>`;
    html += unreadMsgs.map(msg => renderItem(msg, domIdx++)).join('');
  }

  if (readMsgs.length) {
    html += `<div class="email-section-divider email-section-divider-read">
      <span class="email-section-label">PREVIOUSLY READ</span>
      <div class="email-section-line"></div>
    </div>`;
    html += readMsgs.map(msg => renderItem(msg, domIdx++)).join('');
  }

  inner.innerHTML = html;
  inner.querySelectorAll('.email-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx, 10);
      const uid = parseInt(el.dataset.uid, 10);
      emailSelectMessage(idx);
      emailOpenMessage(uid);
    });
  });
}

function emailSelectMessage(idx) {
  emailSelectedIdx = idx;
  document.querySelectorAll('.email-item').forEach((el, i) => {
    el.classList.toggle('email-item-active', i === idx);
  });
  const active = document.querySelector('.email-item-active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

async function emailOpenMessage(uid) {
  emailOpenUid = uid;
  const msgView = document.getElementById('emailMessageView');
  const listView = document.getElementById('emailListView');
  if (listView) listView.classList.add('hidden');
  if (msgView) {
    msgView.classList.remove('hidden');
    document.getElementById('emailMsgSubject').textContent = 'Loading…';
    document.getElementById('emailMsgFrom').textContent = '';
    document.getElementById('emailMsgTo').textContent = '';
    document.getElementById('emailMsgDate').textContent = '';
    const heroAvatar = document.getElementById('emailMsgHeroAvatar');
    if (heroAvatar) { heroAvatar.style.background = '#C8C3BC'; heroAvatar.textContent = '…'; }
  }
  const result = await KIT.email.fetchMessage(uid).catch(e => ({ ok: false, error: e.message }));
  if (!result.ok) {
    document.getElementById('emailMsgSubject').textContent = 'Error: ' + (result.error || 'Failed to load');
    return;
  }
  renderEmailContent(result.message);
  // Mark as read (fire and forget)
  KIT.email.markRead(uid).catch(() => {});
  // Update local seen state
  const msg = emailMessages.find(m => m.uid === uid);
  if (msg) {
    msg.seen = true;
    // Remove unread styling
    const el = document.querySelector(`.email-item[data-uid="${uid}"]`);
    if (el) {
      el.classList.remove('email-item-unread');
      el.querySelector('.email-unread-dot')?.remove();
    }
    updateEmailUnreadBadge();
  }
}

function renderEmailContent(msg) {
  document.getElementById('emailMsgSubject').textContent = msg.subject || '(no subject)';
  // Show display name only (strip the <email> part) for a cleaner look
  document.getElementById('emailMsgFrom').textContent = emailFromName(msg.from) || msg.from || '';
  document.getElementById('emailMsgTo').textContent = emailFromName(msg.to) || msg.to || '';
  document.getElementById('emailMsgDate').textContent = msg.date ? new Date(msg.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
  // Hero avatar
  const heroAvatar = document.getElementById('emailMsgHeroAvatar');
  if (heroAvatar) {
    heroAvatar.style.background = emailAvatarColor(msg.from || '');
    heroAvatar.textContent = emailAvatarInitials(msg.from || '');
  }

  const frame = document.getElementById('emailBodyFrame');
  if (!frame) return;

  // Measure iframe content height and update frame size (only grow)
  const setHeight = () => {
    try {
      const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
      if (!doc || !doc.body) return;
      const h = Math.max(
        doc.documentElement ? doc.documentElement.scrollHeight : 0,
        doc.body.scrollHeight,
        doc.body.offsetHeight
      );
      if (h > 50) {
        const cur = parseInt(frame.style.height) || 0;
        if (h + 20 > cur) frame.style.height = (h + 20) + 'px';
      }
    } catch (_) {}
  };

  frame.onload = () => {
    setHeight();
    setTimeout(setHeight, 200);
    setTimeout(setHeight, 600);
    setTimeout(setHeight, 1500);
    // Watch for content reflow (e.g., images loading)
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (doc && doc.body && window.ResizeObserver) {
        new ResizeObserver(setHeight).observe(doc.body);
      }
    } catch (_) {}
  };

  const baseStyle = `background:#ffffff;color:#111111;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;line-height:1.6;padding:20px 24px;margin:0;word-wrap:break-word;max-width:100%;box-sizing:border-box;`;
  const noHScroll = `html,body{overflow-x:hidden!important;max-width:100%!important}table{max-width:100%!important}img{max-width:100%!important;height:auto}`;
  let safeHtml;
  if (msg.html) {
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data: cid:;">`;
    safeHtml = `<!DOCTYPE html><html><head><base target="_blank">${cspMeta}<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><style>${noHScroll}body{${baseStyle}}a{color:#2563eb}</style></head><body>${msg.html}</body></html>`;
  } else {
    const text = msg.text || '(no content)';
    const monoStyle = `background:#ffffff;color:#111111;font-family:monospace;font-size:13px;line-height:1.5;padding:24px 32px;margin:0;white-space:pre-wrap;word-wrap:break-word;`;
    safeHtml = `<!DOCTYPE html><html><head><base target="_blank"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><style>${noHScroll}body{${monoStyle}}</style></head><body>${escapeHtml(text)}</body></html>`;
  }
  frame.style.height = '300px'; // reset height before new content
  frame.srcdoc = safeHtml;
}

function emailReadFormConfig() {
  return {
    imap: {
      host: document.getElementById('emailImapHost')?.value.trim() || '',
      port: parseInt(document.getElementById('emailImapPort')?.value || '993', 10),
      secure: document.getElementById('emailImapSsl')?.checked ?? true,
      user: document.getElementById('emailUser')?.value.trim() || '',
      pass: document.getElementById('emailPass')?.value || '',
    },
    smtp: {
      host: document.getElementById('emailSmtpHost')?.value.trim() || '',
      port: parseInt(document.getElementById('emailSmtpPort')?.value || '465', 10),
      secure: document.getElementById('emailSmtpSsl')?.checked ?? true,
    }
  };
}

function emailConnectionHint(error) {
  const e = error.toLowerCase();
  if (e.includes('greeting') || e.includes('timeout') || e.includes('timed out')) {
    return 'Port 993 + SSL on is correct for Gmail. Make sure IMAP is enabled in Gmail Settings → See all settings → Forwarding and POP/IMAP';
  }
  if (e.includes('authenticationfailed') || e.includes('auth') || e.includes('credentials') || e.includes('login') || e.includes('invalid')) {
    return 'Wrong credentials — use a Gmail App Password (16 chars, remove spaces), not your Google account password';
  }
  if (e.includes('certificate') || e.includes('cert') || e.includes('self signed')) {
    return 'SSL certificate error — try toggling SSL off';
  }
  if (e.includes('econnrefused') || e.includes('refused')) {
    return 'Connection refused — wrong port?';
  }
  if (e.includes('enotfound') || e.includes('dns') || e.includes('getaddrinfo')) {
    return 'Host not found — check the IMAP hostname';
  }
  return '';
}

function emailCompose(opts = {}) {
  const compose = document.getElementById('emailCompose');
  if (!compose) return;
  emailComposeReplyData = opts.replyData || null;
  compose.classList.remove('hidden');

  const title = document.getElementById('emailComposeTitle');
  const to = document.getElementById('emailComposeTo');
  const subject = document.getElementById('emailComposeSubject');
  const body = document.getElementById('emailComposeBody');
  const status = document.getElementById('emailComposeSendStatus');
  if (status) status.textContent = '';

  if (opts.type === 'reply' && opts.msg) {
    if (title) title.textContent = 'Reply';
    if (to) to.value = opts.msg.from || '';
    if (subject) subject.value = opts.msg.subject?.startsWith('Re:') ? opts.msg.subject : `Re: ${opts.msg.subject || ''}`;
    const quote = `\n\n---\nOn ${opts.msg.date ? new Date(opts.msg.date).toLocaleString() : 'a previous date'}, ${opts.msg.from} wrote:\n${(opts.msg.text || '').split('\n').map(l => '> ' + l).join('\n')}`;
    if (body) body.value = quote;
    emailComposeReplyData = { inReplyTo: opts.msg.messageId, references: opts.msg.messageId };
  } else if (opts.type === 'forward' && opts.msg) {
    if (title) title.textContent = 'Forward';
    if (to) to.value = '';
    if (subject) subject.value = opts.msg.subject?.startsWith('Fwd:') ? opts.msg.subject : `Fwd: ${opts.msg.subject || ''}`;
    const fwd = `\n\n------- Forwarded Message -------\nFrom: ${opts.msg.from}\nDate: ${opts.msg.date ? new Date(opts.msg.date).toLocaleString() : ''}\nSubject: ${opts.msg.subject}\nTo: ${opts.msg.to}\n\n${opts.msg.text || ''}`;
    if (body) body.value = fwd;
    emailComposeReplyData = null;
  } else {
    if (title) title.textContent = 'New Message';
    if (to) to.value = opts.to || '';
    if (subject) subject.value = '';
    if (body) body.value = '';
    emailComposeReplyData = null;
  }
  setTimeout(() => (opts.type ? body?.focus() : to?.focus()), 0);
}

async function emailSend() {
  const to = document.getElementById('emailComposeTo')?.value.trim();
  const subject = document.getElementById('emailComposeSubject')?.value.trim();
  const text = document.getElementById('emailComposeBody')?.value.trim();
  const status = document.getElementById('emailComposeSendStatus');
  if (!to) { if (status) status.textContent = 'Recipient required'; return; }
  if (status) status.textContent = 'Sending…';
  const opts = { to, subject, text, ...(emailComposeReplyData || {}) };
  const result = await KIT.email.send(opts).catch(e => ({ ok: false, error: e.message }));
  if (result.ok) {
    if (status) status.textContent = 'Sent!';
    setTimeout(() => {
      document.getElementById('emailCompose')?.classList.add('hidden');
      if (status) status.textContent = '';
    }, 1500);
  } else {
    if (status) status.textContent = 'Error: ' + (result.error || 'Send failed');
  }
}

// Button wiring (runs after DOM ready)
document.addEventListener('DOMContentLoaded', () => {
  // Back button (message → list)
  document.getElementById('emailBackBtn')?.addEventListener('click', () => {
    document.getElementById('emailMessageView')?.classList.add('hidden');
    document.getElementById('emailListView')?.classList.remove('hidden');
    emailOpenUid = null;
    // Re-render to restore click handlers and fresh state
    renderEmailList(emailMessages);
  });

  // Refresh button
  document.getElementById('emailRefreshBtn')?.addEventListener('click', () => emailFetchInbox());

  // Configure button
  document.getElementById('emailSettingsBtn')?.addEventListener('click', openEmailSetupModal);

  // Compose button (topbar + sidebar)
  document.getElementById('emailComposeBtn')?.addEventListener('click', () => emailCompose({ type: 'new' }));
  document.getElementById('emailSidebarComposeBtn')?.addEventListener('click', () => emailCompose({ type: 'new' }));

  // Folder buttons in sidebar
  document.querySelectorAll('.email-folder-btn').forEach(btn => {
    btn.addEventListener('click', () => emailFetchInbox(btn.dataset.folder));
  });

  // Compose close
  document.getElementById('emailComposeClose')?.addEventListener('click', () => {
    document.getElementById('emailCompose')?.classList.add('hidden');
  });

  // Compose send
  document.getElementById('emailComposeSend')?.addEventListener('click', emailSend);

  // Reply
  document.getElementById('emailReplyBtn')?.addEventListener('click', async () => {
    if (emailOpenUid == null) return;
    const result = await KIT.email.fetchMessage(emailOpenUid).catch(() => null);
    if (result?.ok) emailCompose({ type: 'reply', msg: result.message });
  });

  // Forward
  document.getElementById('emailForwardBtn')?.addEventListener('click', async () => {
    if (emailOpenUid == null) return;
    const result = await KIT.email.fetchMessage(emailOpenUid).catch(() => null);
    if (result?.ok) emailCompose({ type: 'forward', msg: result.message });
  });

  // Archive
  document.getElementById('emailArchiveBtn')?.addEventListener('click', async () => {
    if (emailOpenUid == null) return;
    await KIT.email.moveToTrash(emailOpenUid).catch(() => {});
    // Remove from local list
    const idx = emailMessages.findIndex(m => m.uid === emailOpenUid);
    if (idx !== -1) emailMessages.splice(idx, 1);
    emailOpenUid = null;
    emailSelectedIdx = -1;
    document.getElementById('emailMessageView')?.classList.add('hidden');
    document.getElementById('emailListView')?.classList.remove('hidden');
    renderEmailList(emailMessages);
    updateEmailUnreadBadge();
  });

  // Setup modal: close
  document.getElementById('emailSetupClose')?.addEventListener('click', () => {
    document.getElementById('emailSetupModal')?.classList.add('hidden');
  });

  // Setup modal: auto-fill server settings based on email domain
  document.getElementById('emailUser')?.addEventListener('blur', () => {
    const user = document.getElementById('emailUser')?.value.trim();
    if (!user || !user.includes('@')) return;
    const domain = user.split('@')[1].toLowerCase();
    const providers = {
      'gmail.com':      { imapHost:'imap.gmail.com',          imapPort:993,  imapSsl:true,  smtpHost:'smtp.gmail.com',           smtpPort:465, smtpSsl:true  },
      'googlemail.com': { imapHost:'imap.gmail.com',          imapPort:993,  imapSsl:true,  smtpHost:'smtp.gmail.com',           smtpPort:465, smtpSsl:true  },
      'outlook.com':    { imapHost:'outlook.office365.com',   imapPort:993,  imapSsl:true,  smtpHost:'smtp.office365.com',       smtpPort:587, smtpSsl:false },
      'hotmail.com':    { imapHost:'outlook.office365.com',   imapPort:993,  imapSsl:true,  smtpHost:'smtp.office365.com',       smtpPort:587, smtpSsl:false },
      'live.com':       { imapHost:'outlook.office365.com',   imapPort:993,  imapSsl:true,  smtpHost:'smtp.office365.com',       smtpPort:587, smtpSsl:false },
      'fastmail.com':   { imapHost:'imap.fastmail.com',       imapPort:993,  imapSsl:true,  smtpHost:'smtp.fastmail.com',        smtpPort:465, smtpSsl:true  },
      'fastmail.fm':    { imapHost:'imap.fastmail.com',       imapPort:993,  imapSsl:true,  smtpHost:'smtp.fastmail.com',        smtpPort:465, smtpSsl:true  },
      'yahoo.com':      { imapHost:'imap.mail.yahoo.com',     imapPort:993,  imapSsl:true,  smtpHost:'smtp.mail.yahoo.com',      smtpPort:465, smtpSsl:true  },
      'icloud.com':     { imapHost:'imap.mail.me.com',        imapPort:993,  imapSsl:true,  smtpHost:'smtp.mail.me.com',         smtpPort:587, smtpSsl:false },
      'me.com':         { imapHost:'imap.mail.me.com',        imapPort:993,  imapSsl:true,  smtpHost:'smtp.mail.me.com',         smtpPort:587, smtpSsl:false },
      'proton.me':      { imapHost:'127.0.0.1',               imapPort:1143, imapSsl:false, smtpHost:'127.0.0.1',                smtpPort:1025,smtpSsl:false },
      'protonmail.com': { imapHost:'127.0.0.1',               imapPort:1143, imapSsl:false, smtpHost:'127.0.0.1',                smtpPort:1025,smtpSsl:false },
    };
    const p = providers[domain];
    if (!p) return;
    const imapHostEl = document.getElementById('emailImapHost');
    if (!imapHostEl?.value) {
      imapHostEl.value = p.imapHost;
      document.getElementById('emailImapPort').value = p.imapPort;
      document.getElementById('emailImapSsl').checked = p.imapSsl;
      document.getElementById('emailSmtpHost').value = p.smtpHost;
      document.getElementById('emailSmtpPort').value = p.smtpPort;
      document.getElementById('emailSmtpSsl').checked = p.smtpSsl;
      const status = document.getElementById('emailSetupStatus');
      if (status) { status.style.color = '#4ade80'; status.textContent = `Auto-filled settings for ${domain}`; }
    }
  });

  // Setup modal: test connection
  document.getElementById('emailSetupTest')?.addEventListener('click', async () => {
    const status = document.getElementById('emailSetupStatus');
    const config = emailReadFormConfig();
    if (!config.imap.host || !config.imap.user || !config.imap.pass) {
      if (status) { status.style.color = '#ef4444'; status.textContent = 'Fill in host, email, and password first'; }
      return;
    }
    if (status) { status.style.color = ''; status.textContent = 'Testing IMAP connection…'; }
    const result = await KIT.email.testConnection(config).catch(e => ({ ok: false, error: e.message }));
    if (result.ok) {
      if (status) { status.style.color = '#4ade80'; status.textContent = '✓ Connection successful'; }
    } else {
      const hint = emailConnectionHint(result.error || '');
      if (status) { status.style.color = '#ef4444'; status.textContent = `✗ ${result.error}${hint ? ' — ' + hint : ''}`; }
    }
  });

  // Setup modal: save & connect (tests first, only saves on success)
  document.getElementById('emailSetupSave')?.addEventListener('click', async () => {
    const status = document.getElementById('emailSetupStatus');
    const config = emailReadFormConfig();
    if (!config.imap.host || !config.imap.user || !config.imap.pass) {
      if (status) { status.style.color = '#ef4444'; status.textContent = 'Fill in all required fields'; }
      return;
    }
    if (status) { status.style.color = ''; status.textContent = 'Testing connection…'; }
    const testResult = await KIT.email.testConnection(config).catch(e => ({ ok: false, error: e.message }));
    if (!testResult.ok) {
      const hint = emailConnectionHint(testResult.error || '');
      if (status) { status.style.color = '#ef4444'; status.textContent = `✗ ${testResult.error}${hint ? ' — ' + hint : ''}`; }
      return;
    }
    if (status) { status.style.color = ''; status.textContent = 'Saving…'; }
    const saveResult = await KIT.email.saveConfig(config).catch(e => ({ ok: false, error: e.message }));
    if (!saveResult.ok) {
      if (status) { status.style.color = '#ef4444'; status.textContent = 'Save error: ' + (saveResult.error || ''); }
      return;
    }
    localStorage.removeItem('kitEmailCache'); // clear stale cache on account change
    document.getElementById('emailSetupModal')?.classList.add('hidden');
    emailFetchInbox();
  });
});

// Keyboard handler for email mode
document.addEventListener('keydown', (e) => {
  if (!document.body.classList.contains('email-mode')) return;
  const tag = document.activeElement?.tagName;

  // Compose overlay keyboard shortcuts
  if (!document.getElementById('emailCompose')?.classList.contains('hidden')) {
    if (e.key === 'Escape') {
      document.getElementById('emailCompose')?.classList.add('hidden');
      e.preventDefault();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      emailSend();
      e.preventDefault();
    }
    return; // don't handle other keys when compose is open
  }

  // Skip if typing in an input
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  switch (e.key) {
    case 'j': {
      e.preventDefault();
      const jItems = document.querySelectorAll('.email-item');
      if (!jItems.length) break;
      const next = emailSelectedIdx < 0 ? 0 : Math.min(emailSelectedIdx + 1, jItems.length - 1);
      emailSelectMessage(next);
      break;
    }
    case 'k': {
      e.preventDefault();
      const kItems = document.querySelectorAll('.email-item');
      if (!kItems.length) break;
      const prev = emailSelectedIdx <= 0 ? 0 : emailSelectedIdx - 1;
      emailSelectMessage(prev);
      break;
    }
    case 'Enter': {
      e.preventDefault();
      const active = document.querySelector('.email-item-active');
      if (active) emailOpenMessage(parseInt(active.dataset.uid, 10));
      break;
    }
    case 'r': {
      e.preventDefault();
      if (emailOpenUid != null) {
        KIT.email.fetchMessage(emailOpenUid).then(result => {
          if (result?.ok) emailCompose({ type: 'reply', msg: result.message });
        }).catch(() => {});
      }
      break;
    }
    case 'f': {
      e.preventDefault();
      if (emailOpenUid != null) {
        KIT.email.fetchMessage(emailOpenUid).then(result => {
          if (result?.ok) emailCompose({ type: 'forward', msg: result.message });
        }).catch(() => {});
      }
      break;
    }
    case 'c':
      e.preventDefault();
      emailCompose({ type: 'new' });
      break;
    case 'e': {
      e.preventDefault();
      if (emailOpenUid != null) {
        document.getElementById('emailArchiveBtn')?.click();
      }
      break;
    }
    case 'Escape':
      e.preventDefault();
      if (!document.getElementById('emailMessageView')?.classList.contains('hidden')) {
        // Back to list
        document.getElementById('emailMessageView')?.classList.add('hidden');
        document.getElementById('emailListView')?.classList.remove('hidden');
        emailOpenUid = null;
      } else {
        setEmailMode(false);
      }
      break;
  }
});

// ═══════════════════════════════════════════════════════════
//  KIT AGENT — autonomous tool-calling loop
// ═══════════════════════════════════════════════════════════

let agentInFlight = false;
let agentCancelled = false;
let agentPreviousId = null;
let agentCwd = null; // folder set via "Open Folder" picker

// Permission state: tracks which tool categories the user has blanket-approved this session
const agentPermissions = { write_file: false, run_command: false };

// Show an inline permission card and return a promise resolving to 'allow' | 'allowAll' | 'deny'
function agentAskPermission(toolName, detail) {
  return new Promise((resolve) => {
    const log = document.getElementById('agentLog');
    if (!log) { resolve('deny'); return; }

    const labels = { write_file: 'Write File', run_command: 'Run Command' };
    const card = document.createElement('div');
    card.className = 'agent-perm';
    card.innerHTML = `
      <div class="agent-perm-title">Permission required — ${labels[toolName] || toolName}</div>
      <div class="agent-perm-detail">${detail.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      <div class="agent-perm-btns">
        <button class="agent-perm-btn allow">Allow once</button>
        <button class="agent-perm-btn allow-all">Allow all ${labels[toolName] || toolName}s</button>
        <button class="agent-perm-btn deny">Deny</button>
      </div>`;
    log.appendChild(card);
    log.scrollTop = log.scrollHeight;

    const cleanup = (result) => { card.remove(); resolve(result); };
    card.querySelector('.allow').addEventListener('click', () => cleanup('allow'));
    card.querySelector('.allow-all').addEventListener('click', () => { agentPermissions[toolName] = true; cleanup('allowAll'); });
    card.querySelector('.deny').addEventListener('click', () => cleanup('deny'));
  });
}

// ── Project Rules ──────────────────────────────────────────
// Reads .kitrules or AGENT.md from the given directory.
// Returns the rules text, or '' if none found.
async function loadProjectRules(dir) {
  if (!dir) return '';
  for (const name of ['.kitrules', 'AGENT.md']) {
    try {
      const res = await window.kit.readFile(dir.replace(/\/$/, '') + '/' + name);
      if (res?.ok && res.data?.trim()) return res.data.trim();
    } catch (_) {}
  }
  return '';
}

const AGENT_TOOLS = [
  {
    type: 'function',
    name: 'read_file',
    description: 'Read the text content of a file at the given absolute or relative path.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute or relative path of the file to read.' }
      },
      required: ['path']
    }
  },
  {
    type: 'function',
    name: 'write_file',
    description: 'Write or overwrite a file with the given content.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute or relative path to write to.' },
        content: { type: 'string', description: 'Text content to write.' }
      },
      required: ['path', 'content']
    }
  },
  {
    type: 'function',
    name: 'list_dir',
    description: 'List files and folders inside a directory.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute or relative directory path.' }
      },
      required: ['path']
    }
  },
  {
    type: 'function',
    name: 'run_command',
    description: 'Run a shell command in the current working directory and return its output.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute.' }
      },
      required: ['command']
    }
  },
  {
    type: 'function',
    name: 'search_project',
    description: 'Search for a text pattern across all files in the current project directory using grep.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text or regex pattern to search for.' }
      },
      required: ['query']
    }
  }
];

async function agentExecuteTool(name, argsObj) {
  try {
    // write_file and run_command require explicit user permission
    if (name === 'write_file' && !agentPermissions.write_file) {
      const decision = await agentAskPermission('write_file', `${argsObj.path}\n\n${(argsObj.content || '').slice(0, 300)}${(argsObj.content || '').length > 300 ? '…' : ''}`);
      if (decision === 'deny') return 'Denied by user.';
    }
    if (name === 'run_command' && !agentPermissions.run_command) {
      const decision = await agentAskPermission('run_command', argsObj.command || '');
      if (decision === 'deny') return 'Denied by user.';
    }

    switch (name) {
      case 'read_file': {
        const res = await window.kit.readFile(argsObj.path);
        if (!res.ok) return `Error: ${res.error}`;
        return res.data;
      }
      case 'write_file': {
        const res = await window.kit.writeFile(argsObj.path, argsObj.content);
        if (!res.ok) return `Error: ${res.error}`;
        return `Written ${argsObj.path}`;
      }
      case 'list_dir': {
        const res = await window.kit.list(argsObj.path);
        if (!res.ok) return `Error: ${res.error}`;
        return res.items.map(i => (i.dir ? '[dir] ' : '      ') + i.name).join('\n') || '(empty)';
      }
      case 'run_command': {
        const cmd = String(argsObj.command || '').trim();
        const DANGEROUS = /\b(?:sudo|mkfs|fdisk|dd\s+if=|:(){|chmod\s+777|rm\s+-rf\s+\/|>[\s]*\/dev\/[hs]d|mkfifo|mknod|wget\s+\S+\s*-O|curl\s+\S+\s*\|?\s*(?:ba)?sh)\b/i;
        if (DANGEROUS.test(cmd)) return 'Blocked: command matches dangerous pattern. Use a safer approach.';
        if (cmd.includes('/dev/') || cmd.includes('/etc/passwd') || cmd.includes('/etc/shadow'))
          return 'Blocked: access to system files is not allowed.';
        const cwd = termCwd || '/';
        const res = await window.kit.exec(cwd, cmd);
        return res.output || '(no output)';
      }
      case 'search_project': {
        const cwd = termCwd || '/';
        const rawQuery = String(argsObj.query || '');
        const safeQuery = rawQuery.replace(/[.^$*+?()[{\\|]/g, '\\$&');
        const q = safeQuery.replace(/'/g, "'\\''");
        const excludes = '--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=coverage --exclude-dir=.next --exclude-dir=__pycache__ --exclude-dir=target --exclude-dir=vendor --exclude-dir=.cache';
        const includes = '--include=*.js --include=*.jsx --include=*.ts --include=*.tsx --include=*.py --include=*.rb --include=*.php --include=*.java --include=*.go --include=*.rs --include=*.c --include=*.cpp --include=*.h --include=*.hpp --include=*.cs --include=*.swift --include=*.kt --include=*.scala --include=*.html --include=*.css --include=*.scss --include=*.json --include=*.xml --include=*.yaml --include=*.yml --include=*.toml --include=*.md --include=*.txt --include=*.sh --include=*.bash --include=*.sql --include=*.graphql --include=*.vue --include=*.svelte';
        const res = await window.kit.exec(cwd, `grep -rnI ${excludes} ${includes} -e '${q}' . 2>/dev/null | head -60`);
        return res.output || '(no matches)';
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Exception: ${String(err)}`;
  }
}

// ── UI helpers ────────────────────────────────────────────

function agentLogBubble(text, role) {
  const log = document.getElementById('agentLog');
  if (!log) return;
  const el = document.createElement('div');
  el.className = `agent-bubble agent-bubble-${role}`;
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  agentUpdateWelcome();
}

function agentLogStep(toolName, argsStr, result) {
  const log = document.getElementById('agentLog');
  if (!log) return;
  const trunc = (s, n) => s.length > n ? s.slice(0, n) + '\u2026' : s;
  const step = document.createElement('div');
  step.className = 'agent-step';
  const header = document.createElement('div');
  header.className = 'agent-step-header';
  header.innerHTML = `<span class="agent-step-icon">${ICON.gear}</span><span class="agent-step-label">${toolName}(${trunc(argsStr, 60)})</span><span class="agent-step-toggle">▶</span>`;
  const body = document.createElement('div');
  body.className = 'agent-step-body';
  body.textContent = result ? trunc(result, 800) : '';
  step.appendChild(header);
  step.appendChild(body);
  header.addEventListener('click', () => step.classList.toggle('open'));
  log.appendChild(step);
  log.scrollTop = log.scrollHeight;
  agentUpdateWelcome();
}

function agentShowThinking() {
  const log = document.getElementById('agentLog');
  if (!log) return null;
  const el = document.createElement('div');
  el.className = 'agent-thinking';
  el.innerHTML = '<span>Thinking</span><span class="agent-thinking-dots"><span></span><span></span><span></span></span>';
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  agentUpdateWelcome();
  return el;
}

function agentSetStatus(msg) {
  const el = document.getElementById('agentStatus');
  if (el) el.textContent = msg;
}

function agentSetRunning(running) {
  const runBtn = document.getElementById('agentRun');
  const stopBtn = document.getElementById('agentStop');
  if (runBtn) runBtn.disabled = running;
  if (stopBtn) stopBtn.classList.toggle('hidden', !running);
}

// ── Main agent loop ───────────────────────────────────────

async function agentRun() {
  if (agentInFlight) return;
  const inputEl = document.getElementById('agentInput');
  const goal = inputEl?.value.trim();
  if (!goal) return;

  const model = document.getElementById('agentModelSelect')?.value || 'gpt-5.4';
  const provider = /^claude-/.test(model) ? 'anthropic' : 'openai';
  const hasKey = await window.kit.hasKey(provider);
  if (!hasKey) {
    agentLogBubble(`No ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key set. Open AI Keys from the toolbar to add one.`, 'ai');
    return;
  }

  agentInFlight = true;
  agentCancelled = false;
  agentPermissions.write_file = false;
  agentPermissions.run_command = false;
  agentSetRunning(true);
  agentSetStatus('Starting\u2026');
  const kitHome = (await window.kit.homeDir().catch(() => '~')) + '/.Kit';
  const activeCwd = agentCwd || termCwd;
  const projectRules = await loadProjectRules(activeCwd);
  const systemPrompt = `You are Kit Agent, an autonomous coding assistant embedded in the Kit editor.
Current open file: ${currentFile || '(none)'}
${agentCwd ? `Workspace directory: ${agentCwd}` : `Current working directory: ${termCwd || '(unknown)'}`}
Kit home directory: ${kitHome}
${projectRules ? `\nPROJECT RULES (from .kitrules / AGENT.md — follow strictly):\n${projectRules}\n` : ''}

FILE STORAGE RULES (important — follow these strictly):
- All files you create must go inside ${kitHome}/ in a meaningful subfolder.
- Use ${kitHome}/projects/<project-name>/ for code projects and scripts.
- Use ${kitHome}/notes/ for text notes or documents.
- Use ${kitHome}/data/ for data files, CSVs, JSON datasets.
- Use ${kitHome}/scratch/ for quick one-off experiments.
- Always create the target directory first using run_command("mkdir -p <path>") before writing files into it.
- Never write files to the Kit app source directory or any system directory.

EFFICIENCY RULES (strictly follow):
- Never call the same tool with the same arguments twice. Trust the result from the first call.
- Prefer writing files manually (write_file) over running scaffolders like create-next-app — it's faster and avoids network issues.
- If you must use npm: Next.js → "npx create-next-app@latest <name> --tailwind --no-git --yes" (never --example).
- Never run blocking servers (npm run dev, python -m http.server, etc.) — write the files and tell the user the run command.
- Be decisive: complete the task in as few steps as possible. Don't verify work you just did unless it failed.

Use the provided tools to complete the user's task. Give a short final summary.`;

  agentLogBubble(goal, 'user');
  if (inputEl) inputEl.value = '';

  let currentInput = goal;
  let prevId = agentPreviousId;
  const MAX_ITERATIONS = 20;

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      if (agentCancelled) {
        agentLogBubble('Stopped.', 'ai');
        break;
      }

      const thinkEl = agentShowThinking();
      agentSetStatus(`Step ${i + 1}\u2026`);

      const res = await window.kit.agentRequest({
        model,
        system: systemPrompt,
        input: currentInput,
        tools: AGENT_TOOLS,
        previousResponseId: prevId || undefined
      });

      thinkEl?.remove();

      if (!res.ok) {
        agentLogBubble(`Error: ${res.error}`, 'ai');
        break;
      }

      prevId = res.responseId;
      agentPreviousId = prevId;

      if (!res.functionCalls || res.functionCalls.length === 0) {
        agentLogBubble(res.text || '(done)', 'ai');
        agentSetStatus('Done.');
        break;
      }

      // Execute tool calls, collect results
      const toolResults = [];
      for (const call of res.functionCalls) {
        if (agentCancelled) break;
        let args;
        try { args = JSON.parse(call.arguments || '{}'); } catch { args = {}; }
        const argsStr = Object.entries(args).map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 40)}`).join(', ');
        agentSetStatus(`Running ${call.name}\u2026`);
        const result = await agentExecuteTool(call.name, args);
        agentLogStep(call.name, argsStr, result);
        toolResults.push({ type: 'function_call_output', call_id: call.callId, output: result });
      }

      if (i === MAX_ITERATIONS - 1) {
        agentLogBubble('Reached maximum iterations.', 'ai');
        break;
      }

      currentInput = toolResults;
    }
  } finally {
    agentInFlight = false;
    agentCancelled = false;
    agentSetRunning(false);
    agentSetStatus('');
  }
}

// ── Projects sidebar ──────────────────────────────────────

async function agentLoadProjects() {
  const list = document.getElementById('agentProjectList');
  if (!list) return;
  list.innerHTML = '<div class="agent-proj-empty">Loading…</div>';
  try {
    const home = await window.kit.homeDir();
    const projectsPath = home + '/.Kit/projects';
    const res = await window.kit.list(projectsPath);
    if (!res.ok || !res.items?.length) {
      list.innerHTML = '<div class="agent-proj-empty">No projects yet</div>';
      return;
    }
    list.innerHTML = '';
    for (const item of res.items.filter(i => i.dir)) {
      const row = document.createElement('div');
      row.className = 'agent-proj-row';
      row.textContent = item.name;
      row.addEventListener('click', () => agentExpandProject(projectsPath + '/' + item.name, row));
      list.appendChild(row);
    }
  } catch (e) {
    list.innerHTML = '<div class="agent-proj-empty">Error loading projects</div>';
  }
}

async function agentExpandProject(path, rowEl) {
  const existing = rowEl.nextElementSibling;
  if (existing?.classList.contains('agent-proj-files')) {
    existing.remove(); rowEl.classList.remove('active'); return;
  }
  rowEl.classList.add('active');
  const res = await window.kit.list(path);
  const fileList = document.createElement('div');
  fileList.className = 'agent-proj-files';
  if (!res.ok || !res.items?.length) {
    fileList.innerHTML = '<div class="agent-proj-empty">(empty)</div>';
  } else {
    for (const f of res.items) {
      const frow = document.createElement('div');
      frow.className = 'agent-proj-file';
      if (f.dir) { frow.innerHTML = ICON.folder + ' '; frow.append(f.name); } else { frow.textContent = f.name; }
      if (!f.dir) {
        frow.addEventListener('click', async () => {
          setAgentMode(false);
          const fullPath = path + '/' + f.name;
          if (typeof openFile === 'function') await openFile(fullPath);
        });
      }
      fileList.appendChild(frow);
    }
  }
  rowEl.after(fileList);
}

function agentUpdateWorkspacePath() {
  const label = document.getElementById('agentWorkspacePath');
  const openBtn = document.getElementById('agentOpenFolderBtn');
  const clearBtn = document.getElementById('agentClearFolderBtn');
  if (!label) return;
  if (agentCwd) {
    label.textContent = agentCwd.split('/').pop() || agentCwd;
    openBtn?.setAttribute('title', agentCwd);
    openBtn?.classList.add('active');
    clearBtn?.classList.remove('hidden');
  } else {
    label.textContent = 'workspace';
    openBtn?.setAttribute('title', 'Set workspace folder');
    openBtn?.classList.remove('active');
    clearBtn?.classList.add('hidden');
  }
}

async function checkAgentRules(dir) {
  const els = document.querySelectorAll('.agent-rules-indicator');
  if (!els.length) return;
  let found = false;
  if (dir) {
    for (const name of ['.kitrules', 'AGENT.md']) {
      try {
        const r = await window.kit.stat(dir.replace(/\/$/, '') + '/' + name);
        if (r?.ok) { found = true; break; }
      } catch (_) {}
    }
  }
  const title = found ? `Agent rules found in ${dir}` : 'No agent rules in current folder';
  els.forEach(el => { el.classList.toggle('active', found); el.title = title; });
}

document.getElementById('agentOpenFolderBtn')?.addEventListener('click', async () => {
  const folder = await window.kit.openFolder();
  if (!folder) return;
  agentCwd = folder;
  agentUpdateWorkspacePath();
});

document.getElementById('agentClearFolderBtn')?.addEventListener('click', () => {
  agentCwd = null;
  agentUpdateWorkspacePath();
});

document.getElementById('agentSidebarRefresh')?.addEventListener('click', agentLoadProjects);

// Init Rules: create .kitrules + AGENT.md in current folder
document.getElementById('initRulesBtn')?.addEventListener('click', async () => {
  const dir = termCwd;
  if (!dir) { alert('No working directory set.'); return; }

  const kitrulesPath = dir + '/.kitrules';
  const agentMdPath = dir + '/AGENT.md';

  const agentMdTemplate = `# Agent Rules

## Project Overview
<!-- Describe what this project does in 1-2 sentences -->

## Tech Stack
<!-- List languages, frameworks, and key dependencies -->
-

## Coding Conventions
<!-- e.g. "Use 2-space indent", "Prefer async/await", "No default exports" -->
-

## File Layout
<!-- Key directories and what they contain -->
-

## Do / Don't
<!-- Rules the agent must always follow or always avoid -->
- DO:
- DON'T:

## Notes
<!-- Anything else the agent should know -->
`;

  const r1 = await window.kit.writeFile(kitrulesPath, '# Project-specific rules for Kit Agent\n');
  const r2 = await window.kit.writeFile(agentMdPath, agentMdTemplate);
  if (!r1?.ok || !r2?.ok) {
    const failed = [!r1?.ok && '.kitrules', !r2?.ok && 'AGENT.md'].filter(Boolean).join(', ');
    alert(`Failed to create: ${failed}. Check permissions.`);
    return;
  }
  // Open AGENT.md in editor
  await openFileInTab(agentMdPath);
});
document.getElementById('agentNewBtn')?.addEventListener('click', () => {
  const log = document.getElementById('agentLog');
  if (log) log.innerHTML = '';
  agentPreviousId = null;
  agentSetStatus('');
  agentUpdateWelcome();
  document.getElementById('agentInput')?.focus();
});

// ── Event listeners ───────────────────────────────────────

function agentUpdateWelcome() {
  const log = document.getElementById('agentLog');
  const welcome = document.getElementById('agentWelcome');
  if (!log || !welcome) return;
  welcome.style.display = log.children.length === 0 ? 'flex' : 'none';
}

async function agentUpdateKeyIndicator() {
  const el = document.getElementById('agentKeyIndicator');
  if (!el) return;
  try {
    const model = document.getElementById('agentModelSelect')?.value || 'gpt-5.4';
    const provider = /^claude-/.test(model) ? 'anthropic' : 'openai';
    const has = await window.kit.hasKey(provider);
    el.classList.toggle('connected', !!has);
    el.classList.toggle('disconnected', !has);
    el.title = has ? `${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} key connected` : `No ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} key set`;
  } catch { /* ignore */ }
}

function setAgentMode(on) {
  document.body.classList.toggle('agent-mode', !!on);
  if (on) {
    document.body.classList.remove('browser-mode', 'calendar-mode', 'email-mode', 'whiteboard-mode', 'stairs-mode',
      'email-sidebar-open', 'cal-sidebar-open', 'agent-sidebar-open', 'stairs-sidebar-open');
    document.getElementById('markdownPreview')?.classList.remove('show');
    agentUpdateWelcome();
    agentUpdateKeyIndicator();
    setTimeout(() => document.getElementById('agentInput')?.focus(), 150);
  } else {
    updateStatus();
  }
}

document.getElementById('agentToggle')?.addEventListener('click', () => {
  setAgentMode(!document.body.classList.contains('agent-mode'));
});

// Tip clicks — populate textarea and focus
document.getElementById('agentWelcome')?.addEventListener('click', (e) => {
  const tip = e.target.closest('.agent-tip');
  if (!tip) return;
  const input = document.getElementById('agentInput');
  if (!input) return;
  input.value = tip.dataset.prompt || '';
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
});

// Attach current file as context
document.getElementById('agentAttachFile')?.addEventListener('click', async () => {
  if (!currentFile) return;
  try {
    const content = await window.kit.readFile(currentFile);
    const input = document.getElementById('agentInput');
    if (!input) return;
    const header = `[File: ${currentFile}]\n\`\`\`\n${content}\n\`\`\`\n\n`;
    input.value = header + input.value;
    input.focus();
  } catch (err) {
    agentSetStatus('Could not read file');
  }
});

document.getElementById('agentRun')?.addEventListener('click', agentRun);
document.getElementById('agentModelSelect')?.addEventListener('change', agentUpdateKeyIndicator);

// Initialize custom model pickers (replaces native <select> with branded dropdowns)
_buildModelPicker(document.getElementById('aiModelSelect'));
_buildModelPicker(document.getElementById('agentModelSelect'));

document.getElementById('agentStop')?.addEventListener('click', () => {
  agentCancelled = true;
  agentInFlight = false;
  agentSetRunning(false);
  agentSetStatus('');
  document.querySelectorAll('.agent-thinking').forEach(el => el.remove());
  agentLogBubble('Stopped.', 'ai');
});

document.getElementById('agentInput')?.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    agentRun();
  }
});

// Ctrl+Shift+A global shortcut to toggle agent panel
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    setAgentMode(!document.body.classList.contains('agent-mode'));
  }
});

// ── Command palette entries ───────────────────────────────

commands.push(
  {
    id: 'agent.open',
    name: 'Open Kit Agent',
    category: 'Agent',
    action: () => setAgentMode(true)
  },
  {
    id: 'agent.new',
    name: 'Agent: New Task',
    category: 'Agent',
    action: () => { setAgentMode(true); document.getElementById('agentNewBtn')?.click(); }
  }
);

// ══════════════════════════════════════════════════════════════
// STAIRS — Workflow Automation Engine
// ══════════════════════════════════════════════════════════════

let stairsCurrent = null;   // staircase being edited
let stairsRunning = false;  // run in progress
let stairsStop    = false;  // stop requested
let stairsOutputs = {};     // { stepId: { ok, output } } from last run

// ── Helpers ───────────────────────────────────────────────────
const stEl = id => document.getElementById(id);
const stUid = () => Math.random().toString(36).slice(2, 10);
const stFmt = d => new Date(d).toLocaleTimeString();
const stTplVars = () => ({
  date: new Date().toISOString().slice(0, 10),
  timestamp: Date.now().toString(),
});

function stResolve(str, outputs) {
  if (!str) return str;
  const vars = stTplVars();
  let s = str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
  s = s.replace(/\{\{(\w+)\.output\}\}/g, (_, id) => {
    const o = outputs[id];
    return o ? o.output : `{{${id}.output}}`;
  });
  return s;
}

// ── Log panel ─────────────────────────────────────────────────
function stLog(msg, cls = 'log-info') {
  const body = stEl('stLogBody');
  if (!body) return;
  const empty = body.querySelector('.st-log-empty');
  if (empty) empty.remove();
  const line = document.createElement('span');
  line.className = `st-log-line ${cls}`;
  line.textContent = msg;
  body.appendChild(line);
  body.appendChild(document.createElement('br'));
  body.scrollTop = body.scrollHeight;
}

// ── Mode toggle ───────────────────────────────────────────────
function setStairsMode(on) {
  document.body.classList.toggle('stairs-mode', on);
  if (on) {
    document.body.classList.remove('browser-mode', 'calendar-mode', 'email-mode', 'whiteboard-mode', 'agent-mode',
      'email-sidebar-open', 'cal-sidebar-open', 'agent-sidebar-open');
    document.getElementById('markdownPreview')?.classList.remove('show');
    stLoadAll();
  } else {
    document.body.classList.remove('stairs-sidebar-open');
    updateStatus();
  }
}

// ── Sample staircase seed ─────────────────────────────────────
const ST_SAMPLE = {
  id: 'sample-morning-briefing',
  name: 'Morning Dev Briefing',
  version: 3,
  status: 'published',
  steps: [
    {
      id: 'fetch_repos',
      type: 'http',
      label: 'Fetch trending GitHub repos',
      collapsed: false,
      config: {
        method: 'GET',
        url: 'https://api.github.com/search/repositories?q=stars:>10000&sort=updated&per_page=5',
        body: ''
      }
    },
    {
      id: 'sys_info',
      type: 'code',
      label: 'Collect system snapshot',
      collapsed: false,
      config: {
        command: 'printf "Date: $(date +\"%A %B %d %Y\")\nHost: $(hostname)\nUptime:$(uptime | sed \'s/.*up//;s/,.*load.*//\')\nOS: $(uname -srm)"'
      }
    },
    {
      id: 'ai_summary',
      type: 'ai',
      label: 'Generate dev briefing',
      collapsed: false,
      config: {
        prompt: 'Write a crisp 100-word morning briefing for a developer.\n\nTrending GitHub repos (JSON):\n{{fetch_repos.output}}\n\nSystem info:\n{{sys_info.output}}\n\nCover: #1 trending repo and why it\'s hot, one pattern you notice across the list, and a one-line motivational sign-off.',
        system: 'You are a sharp, no-fluff tech analyst. Be specific about repo names and star counts.'
      }
    },
    {
      id: 'save_briefing',
      type: 'file',
      label: 'Save briefing to ~/.Kit/briefing.md',
      collapsed: false,
      config: {
        operation: 'write',
        path: '~/.Kit/briefing.md',
        content: '# Dev Briefing — {{date}}\n\n{{ai_summary.output}}\n\n---\n_Generated by Stairs on {{date}}_'
      }
    }
  ]
};

// ── Load all staircases ───────────────────────────────────────
async function stLoadAll() {
  let all = await window.kit.stairs.list();
  // Seed or refresh the built-in sample staircase
  const hasSample = all.find(s => s.id === ST_SAMPLE.id);
  if (!hasSample || (hasSample.version || 0) < ST_SAMPLE.version) {
    await window.kit.stairs.save(ST_SAMPLE);
    all = await window.kit.stairs.list();
  }
  const list = stEl('stProjectList');
  if (!list) return;
  list.innerHTML = '';
  if (!all.length) {
    list.innerHTML = '<div style="padding:16px 14px;font-size:12px;opacity:0.35;">No staircases yet</div>';
    return;
  }
  for (const sc of all) {
    const el = document.createElement('div');
    el.className = `st-project-item${sc.status === 'published' ? ' published' : ''}`;
    el.dataset.id = sc.id;
    el.innerHTML = `<span class="st-proj-dot"></span><span class="st-project-name-text">${sc.name || 'Untitled'}</span>`;
    el.addEventListener('click', () => stOpen(sc));
    list.appendChild(el);
  }
  // Auto-open if only one staircase and nothing already open
  if (all.length === 1 && !stairsCurrent) stOpen(all[0]);
}

// ── Open a staircase ──────────────────────────────────────────
function stOpen(sc) {
  stairsCurrent = JSON.parse(JSON.stringify(sc)); // deep copy
  stairsOutputs = {};
  stEl('stName').value = sc.name || '';
  const published = sc.status === 'published';
  stEl('stDraftBadge').classList.toggle('hidden', published);
  stEl('stPublishedBadge').classList.toggle('hidden', !published);
  // highlight sidebar
  document.querySelectorAll('.st-project-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === sc.id);
  });
  stRenderCanvas();
}

// ── Save current staircase ────────────────────────────────────
async function stSave() {
  if (!stairsCurrent) return;
  stairsCurrent.name = stEl('stName').value.trim() || 'Untitled';
  await window.kit.stairs.save(stairsCurrent);
  stLoadAll();
}

// ── Render step canvas ────────────────────────────────────────
function stRenderCanvas() {
  const canvas = stEl('stCanvas');
  if (!canvas) return;
  canvas.innerHTML = '';
  const steps = stairsCurrent?.steps || [];

  if (!steps.length) {
    canvas.innerHTML = `<div id="stEmpty" class="st-empty">
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25">
        <polyline points="6,38 6,28 16,28 16,18 26,18 26,10 36,10 36,6"/>
        <polyline points="36,6 42,6 42,42 6,42"/>
      </svg>
      <p>No steps yet</p>
      <p class="st-empty-sub">Use <strong>✦ Build</strong> to generate from a description, or <strong>+ Add step</strong></p>
    </div>`;
    return;
  }

  steps.forEach((step, i) => {
    if (i > 0) {
      const conn = document.createElement('div');
      conn.className = 'st-connector';
      conn.innerHTML = '<div class="st-connector-dot"></div>';
      canvas.appendChild(conn);
    }
    canvas.appendChild(stBuildCard(step));
  });

  // Restore outputs from last run
  for (const [id, res] of Object.entries(stairsOutputs)) {
    stApplyStepOutput(id, res);
  }
}

// ── Build a step card element ─────────────────────────────────
function stBuildCard(step) {
  const el = document.createElement('div');
  el.className = 'st-step';
  el.dataset.id = step.id;
  el.dataset.type = step.type;

  const typeLabel = { code: 'CODE', ai: 'AI', http: 'HTTP', file: 'FILE' }[step.type] || step.type.toUpperCase();
  const typeCls   = { code: 'st-type-code', ai: 'st-type-ai', http: 'st-type-http', file: 'st-type-file' }[step.type] || '';

  el.innerHTML = `
    <div class="st-step-header">
      <span class="st-step-indicator"></span>
      <span class="st-step-type-badge ${typeCls}">${typeLabel}</span>
      <span class="st-step-label" contenteditable="true" data-id="${step.id}">${step.label || 'Untitled step'}</span>
      <span class="st-step-duration" data-dur="${step.id}"></span>
      <div class="st-step-actions">
        <button class="st-step-action-btn" data-rerun="${step.id}" title="Re-run from here">↺</button>
        <button class="st-step-action-btn del" data-del="${step.id}" title="Delete step">×</button>
      </div>
    </div>
    <div class="st-step-body" data-body="${step.id}">
      ${stBuildConfigFields(step)}
    </div>
    <div class="st-step-output-wrap hidden" data-out-wrap="${step.id}">
      <div class="st-step-output-header">
        <span class="st-step-output-label">Output</span>
        <button class="st-step-output-copy" data-copy="${step.id}">⎘ Copy</button>
      </div>
      <pre class="st-step-output" data-out="${step.id}"></pre>
    </div>`;

  // Label editing
  el.querySelector('[contenteditable]').addEventListener('blur', e => {
    const s = stairsCurrent.steps.find(s => s.id === step.id);
    if (s) { s.label = e.target.textContent.trim(); stSave(); }
  });

  // Toggle body on header click
  el.querySelector('.st-step-header').addEventListener('click', e => {
    if (e.target.closest('[data-rerun],[data-del],[contenteditable]')) return;
    el.querySelector(`[data-body="${step.id}"]`).classList.toggle('collapsed');
  });

  // Delete step
  el.querySelector(`[data-del="${step.id}"]`).addEventListener('click', e => {
    e.stopPropagation();
    stairsCurrent.steps = stairsCurrent.steps.filter(s => s.id !== step.id);
    stSave();
    stRenderCanvas();
  });

  // Re-run from this step
  el.querySelector(`[data-rerun="${step.id}"]`).addEventListener('click', e => {
    e.stopPropagation();
    const idx = stairsCurrent.steps.findIndex(s => s.id === step.id);
    stRunFrom(idx);
  });

  // Copy output
  el.querySelector(`[data-copy="${step.id}"]`).addEventListener('click', () => {
    const out = stairsOutputs[step.id];
    if (out) navigator.clipboard.writeText(out.output).catch(() => {});
  });

  // Config field auto-save
  el.querySelectorAll('.st-field-input,.st-field-textarea,.st-field-select').forEach(input => {
    input.addEventListener('change', () => stSyncStepConfig(step.id, el));
    input.addEventListener('input',  () => stSyncStepConfig(step.id, el));
  });

  return el;
}

// ── Build config fields HTML per step type ────────────────────
function stBuildConfigFields(step) {
  const c = step.config || {};
  const tip = '<span style="font-size:10px;opacity:0.4;display:block;margin-top:3px;">Use <code style="background:rgba(128,128,128,0.15);padding:1px 4px;border-radius:3px;">{{step_id.output}}</code> to reference previous steps</span>';
  switch (step.type) {
    case 'code':
      return `<div class="st-field-label">Shell command</div>
              <textarea class="st-field-textarea" data-key="command" placeholder="curl https://api.github.com/events | head -20">${c.command || ''}</textarea>${tip}`;
    case 'ai':
      return `<div class="st-field-label">Prompt</div>
              <textarea class="st-field-textarea" data-key="prompt" placeholder="Summarise this: {{prev_step.output}}" style="min-height:96px">${c.prompt || ''}</textarea>${tip}
              <div class="st-field-label" style="margin-top:6px">System prompt (optional)</div>
              <textarea class="st-field-textarea" data-key="system" placeholder="You are a helpful assistant" style="min-height:48px">${c.system || ''}</textarea>`;
    case 'http':
      return `<div class="st-field-row">
                <div><div class="st-field-label">Method</div>
                <select class="st-field-select" data-key="method">
                  ${['GET','POST','PUT','PATCH','DELETE'].map(m => `<option${c.method === m ? ' selected' : ''}>${m}</option>`).join('')}
                </select></div>
                <div><div class="st-field-label">URL</div>
                <input class="st-field-input" data-key="url" value="${c.url || ''}" placeholder="https://api.example.com/data" /></div>
              </div>
              <div class="st-field-label" style="margin-top:6px">Body JSON (optional)</div>
              <textarea class="st-field-textarea" data-key="body" placeholder='{"key":"value"}' style="min-height:56px">${c.body || ''}</textarea>`;
    case 'file':
      return `<div class="st-field-row">
                <div><div class="st-field-label">Operation</div>
                <select class="st-field-select" data-key="operation">
                  <option${c.operation === 'read' ? ' selected' : ''}>read</option>
                  <option${c.operation === 'write' ? ' selected' : ''}>write</option>
                  <option${c.operation === 'append' ? ' selected' : ''}>append</option>
                </select></div>
                <div><div class="st-field-label">Path</div>
                <input class="st-field-input" data-key="path" value="${c.path || ''}" placeholder="~/.Kit/output.md" /></div>
              </div>
              <div class="st-field-label" style="margin-top:6px">Content (write/append only)</div>
              <textarea class="st-field-textarea" data-key="content" placeholder="{{prev_step.output}}">${c.content || ''}</textarea>${tip}`;
    default:
      return '';
  }
}

// ── Sync config fields → stairsCurrent ───────────────────────
function stSyncStepConfig(stepId, cardEl) {
  const step = stairsCurrent?.steps.find(s => s.id === stepId);
  if (!step) return;
  step.config = step.config || {};
  cardEl.querySelectorAll('[data-key]').forEach(input => {
    step.config[input.dataset.key] = input.value;
  });
  stSave();
}

// ── Apply run output to a card ────────────────────────────────
function stApplyStepOutput(stepId, res) {
  const card = document.querySelector(`.st-step[data-id="${stepId}"]`);
  if (!card) return;
  card.classList.remove('st-running', 'st-done', 'st-error');
  card.classList.add(res.ok ? 'st-done' : 'st-error');
  const outWrap = card.querySelector(`[data-out-wrap="${stepId}"]`);
  const outEl   = card.querySelector(`[data-out="${stepId}"]`);
  if (outWrap && outEl) {
    outWrap.classList.remove('hidden');
    outEl.textContent = res.output?.slice(0, 4000) || '(no output)';
    outEl.className = `st-step-output${res.ok ? '' : ' error'}`;
  }
}

// ── Run engine ────────────────────────────────────────────────
async function stRun() {
  if (!stairsCurrent || stairsRunning) return;
  await stSave();
  stRunFrom(0);
}

async function stRunFrom(startIndex) {
  if (!stairsCurrent || stairsRunning) return;
  stairsRunning = true;
  stairsStop    = false;

  stEl('stRunBtn').classList.add('hidden');
  stEl('stStopBtn').classList.remove('hidden');

  // Clear state for steps from startIndex onward
  stairsCurrent.steps.slice(startIndex).forEach(s => {
    const card = document.querySelector(`.st-step[data-id="${s.id}"]`);
    if (!card) return;
    card.classList.remove('st-running', 'st-done', 'st-error');
    const ow = card.querySelector(`[data-out-wrap="${s.id}"]`);
    if (ow) ow.classList.add('hidden');
    delete stairsOutputs[s.id];
  });

  stLog(`─── Run started at ${stFmt(Date.now())} ───`, 'log-dim');

  for (let i = startIndex; i < stairsCurrent.steps.length; i++) {
    if (stairsStop) { stLog('● Stopped', 'log-error'); break; }

    const step = stairsCurrent.steps[i];
    const card = document.querySelector(`.st-step[data-id="${step.id}"]`);
    card?.classList.add('st-running');
    card?.classList.remove('st-done', 'st-error');

    stLog(`▶ [${i + 1}/${stairsCurrent.steps.length}] ${step.label || step.type}`, 'log-info');
    const t0 = Date.now();

    let res;
    try {
      res = await stRunStep(step, stairsOutputs);
    } catch (e) {
      res = { ok: false, output: e.message };
    }

    const dur = ((Date.now() - t0) / 1000).toFixed(1);
    stairsOutputs[step.id] = res;
    stApplyStepOutput(step.id, res);

    // Duration label
    const durEl = card?.querySelector(`[data-dur="${step.id}"]`);
    if (durEl) durEl.textContent = `${dur}s`;

    if (res.ok) {
      stLog(`✓ Done (${dur}s)`, 'log-ok');
      if (res.output) stLog(res.output.slice(0, 300), 'log-dim');
    } else {
      stLog(`✕ Error: ${res.output}`, 'log-error');
      break;
    }
  }

  stairsCurrent.lastRun = new Date().toISOString();
  await window.kit.stairs.save(stairsCurrent);

  stairsRunning = false;
  stEl('stRunBtn').classList.remove('hidden');
  stEl('stStopBtn').classList.add('hidden');
}

// ── Execute a single step ─────────────────────────────────────
async function stRunStep(step, outputs) {
  const c = step.config || {};
  switch (step.type) {
    case 'code': {
      const cmd = stResolve(c.command, outputs);
      return await window.kit.stairs.runCode(cmd);
    }
    case 'ai': {
      const input  = stResolve(c.prompt, outputs);
      const system = c.system ? stResolve(c.system, outputs) : 'You are a helpful assistant.';
      const res = await window.kit.aiRequest({ input, system, model: 'gpt-5.4-mini' });
      if (!res?.ok) return { ok: false, output: res?.error || 'AI request failed' };
      return { ok: true, output: res.text || '' };
    }
    case 'http': {
      const url    = stResolve(c.url,    outputs);
      const body   = c.body ? stResolve(c.body, outputs) : undefined;
      return await window.kit.stairs.runHttp({ url, method: c.method || 'GET', body });
    }
    case 'file': {
      const p = stResolve(c.path, outputs);
      if (c.operation === 'read') {
        return await window.kit.stairs.fileRead(p);
      } else {
        let content = stResolve(c.content, outputs);
        if (c.operation === 'append') {
          const existing = await window.kit.stairs.fileRead(p);
          content = (existing.ok ? existing.output : '') + '\n' + content;
        }
        return await window.kit.stairs.fileWrite(p, content);
      }
    }
    default:
      return { ok: false, output: `Unknown step type: ${step.type}` };
  }
}

// ── AI Build ──────────────────────────────────────────────────
async function stAiBuild(description) {
  if (!description.trim()) return;
  stLog('✦ Generating staircase from description…', 'log-ai');

  const systemPrompt = `You are a workflow automation assistant for a developer tool called Stairs.
Return ONLY valid JSON — no explanation, no markdown fences.
JSON shape:
{
  "name": "Short descriptive name",
  "steps": [
    { "id": "s1", "type": "code|ai|http|file", "label": "Step label", "config": { ...see below } }
  ]
}
Config shapes:
- code: { "command": "shell command string" }
- ai:   { "prompt": "prompt text — use {{step_id.output}} for previous step output", "system": "optional system prompt" }
- http: { "url": "https://...", "method": "GET|POST", "body": "optional JSON string" }
- file: { "operation": "read|write|append", "path": "~/path/to/file.ext", "content": "{{step_id.output}} or literal" }
Use {{step_id.output}} to chain steps. Keep steps focused and lean.`;

  try {
    const res = await window.kit.aiRequest({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: `Create a staircase automation for: ${description}` }
      ]
    });
    const text = res?.output_text || res?.choices?.[0]?.message?.content || '';
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(jsonStr);

    if (!stairsCurrent) {
      stairsCurrent = { id: stUid(), name: data.name || 'Untitled', steps: [], status: 'draft', created: new Date().toISOString() };
    }
    stairsCurrent.name    = data.name || stairsCurrent.name;
    stairsCurrent.steps   = (data.steps || []).map(s => ({ ...s, id: s.id || stUid() }));
    stEl('stName').value  = stairsCurrent.name;

    await window.kit.stairs.save(stairsCurrent);
    stLoadAll();
    stRenderCanvas();
    stLog(`✦ Generated ${stairsCurrent.steps.length} steps`, 'log-ai');
    stEl('stAiBuildBar').classList.add('hidden');
    stEl('stAiDescInput').value = '';
  } catch (e) {
    stLog(`✕ AI build failed: ${e.message}`, 'log-error');
  }
}

// ── Add step ──────────────────────────────────────────────────
function stAddStep(type) {
  if (!stairsCurrent) {
    stairsCurrent = { id: stUid(), name: stEl('stName').value.trim() || 'Untitled', steps: [], status: 'draft', created: new Date().toISOString() };
  }
  const defaults = {
    code: { command: '' },
    ai:   { prompt: '', system: '' },
    http: { url: '', method: 'GET', body: '' },
    file: { operation: 'read', path: '', content: '' },
  };
  stairsCurrent.steps.push({
    id: stUid(), type, label: `${type.charAt(0).toUpperCase() + type.slice(1)} step`,
    config: defaults[type] || {}
  });
  stSave();
  stRenderCanvas();
  // Scroll to new step
  const canvas = stEl('stCanvas');
  if (canvas) setTimeout(() => canvas.scrollTop = canvas.scrollHeight, 50);
}

// ── Event wiring ──────────────────────────────────────────────
stEl('stNewBtn')?.addEventListener('click', () => {
  stairsCurrent = { id: stUid(), name: 'Untitled', steps: [], status: 'draft', created: new Date().toISOString() };
  stairsOutputs = {};
  stEl('stName').value = '';
  stEl('stDraftBadge').classList.remove('hidden');
  stEl('stPublishedBadge').classList.add('hidden');
  window.kit.stairs.save(stairsCurrent).then(() => { stLoadAll(); stRenderCanvas(); });
});

stEl('stName')?.addEventListener('change', () => stSave());

stEl('stRunBtn')?.addEventListener('click', stRun);
stEl('stStopBtn')?.addEventListener('click', () => { stairsStop = true; });

stEl('stPublishBtn')?.addEventListener('click', async () => {
  if (!stairsCurrent) return;
  const isPublished = stairsCurrent.status === 'published';
  stairsCurrent.status = isPublished ? 'draft' : 'published';
  await stSave();
  stEl('stDraftBadge').classList.toggle('hidden', !isPublished);
  stEl('stPublishedBadge').classList.toggle('hidden', isPublished);
  stEl('stPublishBtn').textContent = isPublished ? 'Publish' : 'Unpublish';
  stLog(isPublished ? '○ Unpublished — back to draft' : '✓ Published!', isPublished ? 'log-info' : 'log-ok');
});

stEl('stDeleteStaircaseBtn')?.addEventListener('click', async () => {
  if (!stairsCurrent) return;
  if (!confirm(`Delete "${stairsCurrent.name}"?`)) return;
  await window.kit.stairs.delete(stairsCurrent.id);
  stairsCurrent = null;
  stairsOutputs = {};
  stEl('stName').value = '';
  stEl('stCanvas').innerHTML = '';
  stEl('stEmpty').style.display = '';
  stLoadAll();
});

stEl('stAiBuildBtn')?.addEventListener('click', () => {
  stEl('stAiBuildBar').classList.toggle('hidden');
  if (!stEl('stAiBuildBar').classList.contains('hidden')) stEl('stAiDescInput').focus();
});
stEl('stAiBuildClose')?.addEventListener('click', () => stEl('stAiBuildBar').classList.add('hidden'));
stEl('stAiGenBtn')?.addEventListener('click', () => stAiBuild(stEl('stAiDescInput').value));
stEl('stAiDescInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') stAiBuild(e.target.value); });

stEl('stAddStep')?.addEventListener('click', () => {
  stEl('stStepTypeMenu').classList.toggle('hidden');
});
stEl('stStepTypeMenu')?.querySelectorAll('[data-type]').forEach(btn => {
  btn.addEventListener('click', () => {
    stAddStep(btn.dataset.type);
    stEl('stStepTypeMenu').classList.add('hidden');
  });
});

stEl('stClearLog')?.addEventListener('click', () => {
  const body = stEl('stLogBody');
  if (body) body.innerHTML = '<div class="st-log-empty">Run a staircase to see output here</div>';
});

stEl('stairsBtn')?.addEventListener('click', () => setStairsMode(!document.body.classList.contains('stairs-mode')));

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    setStairsMode(!document.body.classList.contains('stairs-mode'));
  }
});

commands.push(
  { id: 'stairs.open',    name: 'Open Stairs', category: 'Stairs', action: () => setStairsMode(true) },
  { id: 'stairs.new',     name: 'Stairs: New Staircase', category: 'Stairs', action: () => { setStairsMode(true); stEl('stNewBtn')?.click(); } },
  { id: 'stairs.run',     name: 'Stairs: Run Current', category: 'Stairs', action: stRun },
  { id: 'stairs.publish', name: 'Stairs: Publish Current', category: 'Stairs', action: () => stEl('stPublishBtn')?.click() }
);
