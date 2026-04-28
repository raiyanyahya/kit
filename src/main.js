import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, safeStorage, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { exec, spawn } from 'child_process'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'
import { ImapFlow } from 'imapflow'
import { createTransport } from 'nodemailer'
import { simpleParser } from 'mailparser'
// Using built-in fetch (Node.js 18+) instead of node-fetch
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// IPC handlers for project search
ipcMain.handle('readDirectory', async (event, dirPath) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile()
    }));
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('readFile', async (event, filePath) => {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('getCwd', async () => {
  return process.cwd();
});

// Kit folder management
ipcMain.handle('kit:ensureFolder', async () => {
  const homeDir = os.homedir();
  const kitDir = path.join(homeDir, '.Kit');
  const boardsDir = path.join(kitDir, 'boards');

  try {
    await fs.promises.mkdir(kitDir, { recursive: true });
    await fs.promises.mkdir(boardsDir, { recursive: true });
    return { ok: true, path: kitDir };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('kit:loadBoard', async () => {
  const homeDir = os.homedir();
  try {
    const data = await fs.promises.readFile(path.join(homeDir, '.Kit', 'boards', 'main.json'), 'utf8');
    return { ok: true, data };
  } catch {
    return { ok: true, data: null };
  }
});

ipcMain.handle('kit:saveBoard', async (_e, data) => {
  const homeDir = os.homedir();
  await fs.promises.writeFile(path.join(homeDir, '.Kit', 'boards', 'main.json'), data, 'utf8');
  return { ok: true };
});

ipcMain.handle('kit:captureBoard', async (_e, rect) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Whiteboard',
    defaultPath: 'whiteboard.png',
    filters: [{ name: 'PNG Image', extensions: ['png'] }]
  });
  if (canceled || !filePath) return { ok: false };
  const image = await win.webContents.capturePage(rect);
  await fs.promises.writeFile(filePath, image.toPNG());
  return { ok: true, filePath };
});


ipcMain.handle('kit:getReadmePath', () => {
  return { ok: true, path: path.join(app.getAppPath(), 'src', 'WELCOME.md') };
});

try { app.setName('Kit') } catch(_) {}
process.title = 'Kit'
let win

function createMenu(){
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{ label: 'Kit', submenu: [{ role: 'about', label: 'About Kit' }, { type: 'separator' }, { role: 'quit', label: 'Quit Kit' }]}] : []),
    { label: 'Edit', submenu: [
      { role: 'undo' }, { role: 'redo' }, { type:'separator' },
      { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
    ]},
    { label: 'File', submenu: [
      { label: 'Save', accelerator: 'CmdOrCtrl+S', click: ()=> win?.webContents.send('menu:save') },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]},
    { label:'View', submenu: [
      { role:'reload' }, { role:'toggleDevTools' }, { type:'separator' }, { role:'togglefullscreen' },
      { type:'separator' },
    ]}
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// Disable GPU only when relaunched after a GPU crash (see child-process-gone handler below)
if (process.argv.includes('--disable-gpu-fallback')) {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
}

// If the GPU process crashes, relaunch automatically with GPU disabled
app.on('child-process-gone', (event, details) => {
  if (details.type === 'GPU' && !process.argv.includes('--disable-gpu-fallback')) {
    app.relaunch({ args: process.argv.slice(1).concat(['--disable-gpu-fallback']) });
    app.quit();
  }
});

function createWindow(){
  win = new BrowserWindow({
    width: 1100, height: 900, minWidth: 1100, minHeight: 700,
    frame: false, transparent: false, backgroundColor: '#ffffff',
    title: 'Kit',
    webPreferences: {
      webviewTag: true,
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })
  win.loadFile(path.join(__dirname, 'index.html'))
}
app.whenReady().then(async () => {
  KEY_FILE = path.join(app.getPath('userData'), '.kitkey');
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const raw = await fs.promises.readFile(KEY_FILE);
      OPENAI_API_KEY = safeStorage.decryptString(raw);
    }
  } catch (_) { /* no saved key */ }
  ANTHROPIC_KEY_FILE = path.join(app.getPath('userData'), '.anthropickey');
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const raw = await fs.promises.readFile(ANTHROPIC_KEY_FILE);
      ANTHROPIC_API_KEY = safeStorage.decryptString(raw);
    }
  } catch (_) { /* no saved anthropic key */ }
  EMAIL_CREDS_FILE = path.join(app.getPath('userData'), '.emailcreds');
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const raw = await fs.promises.readFile(EMAIL_CREDS_FILE);
      emailConfig = JSON.parse(safeStorage.decryptString(raw));
    }
  } catch (_) { /* no saved email config */ }
  createMenu();
  createWindow();
})
app.on('window-all-closed', ()=>{ if(process.platform!=='darwin') app.quit() })

const fsP = fs.promises

ipcMain.handle('dialog:openFolder', async (_e) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Choose Project Folder',
    properties: ['openDirectory']
  })
  return canceled ? null : filePaths[0]
})

ipcMain.handle('dialog:saveAs', async (_e, suggested='untitled.txt')=>{
  const { canceled, filePath } = await dialog.showSaveDialog(win, { defaultPath: suggested, filters: [{ name:'All Files', extensions:['*'] }] })
  return canceled ? null : filePath
})

ipcMain.handle('dialog:openFile', async (_e, filters)=>{
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Open Markdown',
    properties: ['openFile'],
    filters: filters && Array.isArray(filters) ? filters : [{ name:'Markdown', extensions:['md','markdown','txt'] }]
  });
  return canceled || !filePaths || !filePaths[0] ? null : filePaths[0];
});

ipcMain.handle('fs:readFile', async (_e, p)=>{ try{ return { ok:true, data: await fsP.readFile(p,'utf8') } } catch(e){ return { ok:false, error:e.message }}})
ipcMain.handle('fs:writeFile', async (_e, p, c)=>{ try{ await fsP.writeFile(p,c,'utf8'); return { ok:true } } catch(e){ return { ok:false, error:e.message }}})
ipcMain.handle('fs:rename', async (_e, o, n)=>{ try{ await fsP.rename(o,n); return {ok:true} } catch(e){ return {ok:false, error:e.message} } })
ipcMain.handle('os:homedir', async ()=> os.homedir())
ipcMain.handle('fs:stat', async (_e, p)=>{ try{ const s = await fsP.stat(p); return { ok:true, isDir:s.isDirectory(), isFile:s.isFile() } } catch(e){ return { ok:false, error:e.message } } })

ipcMain.handle('fs:list', async (_e, p)=>{
  try {
    const entries = await fsP.readdir(p, { withFileTypes: true });
    return { ok:true, items: entries.map(e=> ({ name: e.name, dir: e.isDirectory() })) }
  } catch(e){ return { ok:false, error: e.message } }
});
ipcMain.handle('fs:copyTo', async (_e, src, destDir)=>{
  async function copyRecursive(s,d){
    const st = await fsP.stat(s)
    if(st.isDirectory()){
      await fsP.mkdir(d, { recursive:true })
      for(const entry of await fsP.readdir(s)) await copyRecursive(path.join(s,entry), path.join(d,entry))
    } else {
      await fsP.copyFile(s,d)
    }
  }
  try{ const base = path.basename(src); const dest = path.join(destDir, base); await copyRecursive(src,dest); return {ok:true} } catch(e){ return {ok:false, error:e.message} }
})
ipcMain.handle('fs:mkdir', async (_e, dir)=>{ try{ await fsP.mkdir(dir, { recursive:true }); return {ok:true} } catch(e){ return {ok:false, error:e.message} } })
ipcMain.handle('fs:delete', async (_e, p)=>{ try{ const st = await fsP.stat(p); if(st.isDirectory()) await fsP.rm(p, { recursive:true, force:true }); else await fsP.unlink(p); return {ok:true} } catch(e){ return {ok:false, error:e.message} } })
// Persistent environment variables for terminal session
const terminalEnv = { ...process.env };
let runningTermProc = null;

ipcMain.handle('term:run', async (_e, cwd, command)=>{
  return new Promise((resolve)=>{
    const win = BrowserWindow.getAllWindows()[0];
    const send = (chunk) => { try { win?.webContents.send('term:output', chunk) } catch(_){} };
    const proc = spawn(command, [], { cwd, shell: true, env: terminalEnv, detached: true });
    runningTermProc = proc;
    const killProc = () => { try { process.kill(-proc.pid, 'SIGINT'); } catch(_) { try { proc.kill(); } catch(__){} } };
    const timeout = setTimeout(()=>{ killProc(); runningTermProc = null; resolve({ ok: false, output: '! Command timed out\n' }) }, 120_000);
    proc.stdout.on('data', (d)=> send(d.toString()));
    proc.stderr.on('data', (d)=> send(d.toString()));
    proc.on('close', (code)=>{ clearTimeout(timeout); runningTermProc = null; resolve({ ok: code === 0, output: '' }); });
    proc.on('error', (e)=>{ clearTimeout(timeout); runningTermProc = null; resolve({ ok: false, output: '! ' + e.message + '\n' }); });
  });
})

ipcMain.handle('term:kill', ()=>{
  if (runningTermProc) {
    try { process.kill(-runningTermProc.pid, 'SIGINT'); } catch(_) { try { runningTermProc.kill(); } catch(__){} }
    runningTermProc = null;
    return { ok: true };
  }
  return { ok: false };
})

ipcMain.handle('term:exec', async (_e, cwd, command)=>{
  return new Promise((resolve)=>{ exec(command, { cwd, shell:true, env: terminalEnv, maxBuffer:10*1024*1024 }, (err, stdout, stderr)=>{ const out = (stdout||'') + (stderr||''); resolve({ ok: !err, output: out || (err? String(err):'') }) }) })
})

const BLOCKED_ENV_KEYS = new Set(['LD_PRELOAD','LD_LIBRARY_PATH','DYLD_INSERT_LIBRARIES','DYLD_LIBRARY_PATH','NODE_OPTIONS','NODE_PATH','ELECTRON_RUN_AS_NODE']);
ipcMain.handle('term:setEnv', async (_e, key, value)=>{
  if (!key || BLOCKED_ENV_KEYS.has(String(key).toUpperCase())) return { ok: false, error: 'Cannot modify this environment variable' };
  if (value === null || value === undefined) {
    delete terminalEnv[key];
  } else {
    terminalEnv[key] = value;
  }
  return { ok: true };
})

ipcMain.handle('term:getEnv', async (_e, key)=>{
  return { ok: true, value: terminalEnv[key] };
})
ipcMain.handle('app:exit', async ()=>{ app.quit(); return true })
ipcMain.handle('app:setTheme', (_e, mode) => { nativeTheme.themeSource = mode; })

// AI
let OPENAI_API_KEY = process.env.OPENAI_API_KEY || null
let KEY_FILE = null // set after app ready
let ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || null
let ANTHROPIC_KEY_FILE = null

// Email
let EMAIL_CREDS_FILE = null
let emailConfig = null  // { imap:{host,port,secure,user,pass}, smtp:{host,port,secure} }

ipcMain.handle('ai:setKey', async (_e, key, provider = 'openai') => {
  const trimmed = (key || '').trim() || null;
  const isAnthropic = provider === 'anthropic';
  if (isAnthropic) {
    ANTHROPIC_API_KEY = trimmed;
    try {
      if (ANTHROPIC_API_KEY && ANTHROPIC_KEY_FILE && safeStorage.isEncryptionAvailable()) {
        await fs.promises.writeFile(ANTHROPIC_KEY_FILE, safeStorage.encryptString(ANTHROPIC_API_KEY));
      } else if (ANTHROPIC_KEY_FILE) {
        await fs.promises.unlink(ANTHROPIC_KEY_FILE).catch(() => {});
      }
    } catch (_) {}
    return !!ANTHROPIC_API_KEY;
  }
  OPENAI_API_KEY = trimmed;
  try {
    if (OPENAI_API_KEY && KEY_FILE && safeStorage.isEncryptionAvailable()) {
      await fs.promises.writeFile(KEY_FILE, safeStorage.encryptString(OPENAI_API_KEY));
    } else if (KEY_FILE) {
      await fs.promises.unlink(KEY_FILE).catch(() => {});
    }
  } catch (_) {}
  return !!OPENAI_API_KEY;
})

ipcMain.handle('ai:hasKey', async (_e, provider) => {
  if (provider === 'anthropic') return !!ANTHROPIC_API_KEY;
  if (provider === 'openai') return !!OPENAI_API_KEY;
  return !!(OPENAI_API_KEY || ANTHROPIC_API_KEY);
})

ipcMain.handle('ai:clearKey', async (_e, provider) => {
  if (provider === 'anthropic') {
    ANTHROPIC_API_KEY = null;
    try { if (ANTHROPIC_KEY_FILE) await fs.promises.unlink(ANTHROPIC_KEY_FILE); } catch (_) {}
    return true;
  }
  OPENAI_API_KEY = null;
  try { if (KEY_FILE) await fs.promises.unlink(KEY_FILE); } catch (_) {}
  return true;
})

// Main AI request handler
async function handleAIRequest(payload, apiKey) {
    const model = payload?.model || 'gpt-5.4';
    const system = payload?.system || '';
  let input = String(payload?.input || '');
  
  
  const isCodeGeneration = /^(code|complete|explain|fix|test|convert|refactor|optimize|document|review)\s/i.test(input);

  let enhancedSystem = system;

  if (!enhancedSystem) {
    enhancedSystem = 'You are a helpful AI assistant.';
  }
  
  if (isCodeGeneration) {
    switch (true) {
      case input.startsWith('code '):
        enhancedSystem = 'You are an expert programmer. Generate clean, well-commented code based on the user\'s description. Include necessary imports and handle edge cases.';
        break;
      case input.startsWith('complete '):
        enhancedSystem = 'You are a code completion assistant. Complete the given code logically and efficiently. Maintain consistent style and add helpful comments.';
        break;
      case input.startsWith('explain '):
        enhancedSystem = 'You are a code explainer. Provide clear, detailed explanations of what the code does, how it works, and any important concepts involved.';
        break;
      case input.startsWith('fix '):
        enhancedSystem = 'You are a debugging expert. Identify and fix bugs in the code. Explain what was wrong and why your solution works.';
        break;
      case input.startsWith('test '):
        enhancedSystem = 'You are a testing expert. Generate comprehensive unit tests for the given code. Include edge cases and error scenarios.';
        break;
      case input.startsWith('convert '):
        enhancedSystem = 'You are a code conversion expert. Convert the code to the requested language while maintaining functionality and best practices.';
        break;
      case input.startsWith('refactor '):
        enhancedSystem = 'You are a refactoring expert. Improve code structure, readability, and maintainability while preserving functionality.';
        break;
      case input.startsWith('optimize '):
        enhancedSystem = 'You are a performance optimization expert. Improve code efficiency, reduce complexity, and enhance performance.';
        break;
      case input.startsWith('document '):
        enhancedSystem = 'You are a documentation expert. Generate clear, comprehensive documentation including usage examples and API references.';
        break;
      case input.startsWith('review '):
        enhancedSystem = 'You are a senior code reviewer. Provide constructive feedback on code quality, potential issues, and improvement suggestions.';
        break;
    }
  }

  // Build request for Responses API
  const temperature = isCodeGeneration ? 0.1 : 0.2

  // Reasoning models (o1, o3, o4-mini, etc.) don't support temperature
  const isReasoningModel = /^o\d/.test(model);

  // Only include web_search when enabled and model supports it (not o1)
  const supportsWebSearch = payload?.webSearch !== false && !/^o1/.test(model);
  const tools = supportsWebSearch ? [{ type: 'web_search_preview' }] : undefined;

  try {
    const client = new OpenAI({ apiKey })
    const response = await client.responses.create({
      model,
      instructions: enhancedSystem || undefined,
      input,
      ...(tools ? { tools } : {}),
      ...(isReasoningModel ? {} : { temperature }),
      ...(payload?.previousResponseId ? { previous_response_id: payload.previousResponseId } : {})
    })

    const text = response?.output_text || ''

    // Extract url_citation annotations (OpenAI requires these to be displayed)
    const citations = [];
    // Extract web_search_call queries to surface in UI
    const searchQueries = [];
    for (const item of response?.output || []) {
      if (item.type === 'web_search_call') {
        const q = item.action?.query || item.query;
        if (q) searchQueries.push(q);
      }
      if (item.type === 'message') {
        for (const c of item.content || []) {
          for (const ann of c.annotations || []) {
            if (ann.type === 'url_citation') {
              citations.push({ title: ann.title, url: ann.url });
            }
          }
        }
      }
    }

    return { ok: !!text, text, citations, searchQueries, responseId: response.id }
  } catch (err) {
    return { ok: false, error: err?.message || String(err) }
  }
}

// ── Claude (Anthropic) handlers ──────────────────────────

async function handleClaudeRequest(payload, apiKey) {
  if (!apiKey) return { ok: false, error: 'No Anthropic API key set. Open AI Keys from the toolbar to add one.' };
  const model = payload?.model || 'claude-sonnet-4-6';
  const system = payload?.system || 'You are a helpful AI assistant.';
  const input = String(payload?.input || '');
  const body = { model, max_tokens: 8192, system, messages: [{ role: 'user', content: input }] };
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return { ok: false, error: e?.error?.message || `HTTP ${res.status}` };
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text || '';
    return { ok: !!text, text, citations: [], searchQueries: [], responseId: data.id };
  } catch (err) { return { ok: false, error: err?.message || String(err) }; }
}

const claudeSessions = new Map(); // responseId → { messages, lastContent }

async function handleClaudeAgentRequest(payload, apiKey) {
  if (!apiKey) return { ok: false, error: 'No Anthropic API key set. Open AI Keys from the toolbar to add one.' };
  const model = payload?.model || 'claude-sonnet-4-6';
  const sessionId = payload?.previousResponseId;
  const session = sessionId ? claudeSessions.get(sessionId) : null;
  let messages;
  if (session) {
    messages = [...session.messages, { role: 'assistant', content: session.lastContent }];
    const toolResults = Array.isArray(payload.input) ? payload.input : [];
    if (toolResults.length > 0) {
      messages.push({ role: 'user', content: toolResults.map(tr => ({ type: 'tool_result', tool_use_id: tr.call_id, content: String(tr.output || '') })) });
    }
  } else {
    messages = [{ role: 'user', content: String(payload.input || '') }];
  }
  const tools = (payload?.tools || []).filter(t => t.type === 'function').map(t => ({
    name: t.function.name,
    description: t.function.description || '',
    input_schema: t.function.parameters || { type: 'object', properties: {} }
  }));
  const body = { model, max_tokens: 4096, messages, ...(payload?.system ? { system: payload.system } : {}), ...(tools.length ? { tools } : {}) };
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return { ok: false, error: e?.error?.message || `HTTP ${res.status}` };
    }
    const data = await res.json();
    const newId = `cs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    claudeSessions.set(newId, { messages, lastContent: data.content });
    if (claudeSessions.size > 20) claudeSessions.delete(claudeSessions.keys().next().value);
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('') || '';
    const functionCalls = (data.content || []).filter(b => b.type === 'tool_use').map(b => ({ name: b.name, arguments: JSON.stringify(b.input), callId: b.id }));
    return { ok: true, text, functionCalls, responseId: newId };
  } catch (err) { return { ok: false, error: err?.message || String(err) }; }
}

// ── Unified request handlers ──────────────────────────────

ipcMain.handle('ai:request', async (_e, payload) => {
  const model = payload?.model || 'gpt-5.4';
  if (/^claude-/.test(model)) {
    return handleClaudeRequest(payload, ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY);
  }
  const key = OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key?.trim()) return { ok: false, error: 'No OpenAI API key set. Open AI Keys from the toolbar to add one.' };
  return handleAIRequest(payload, key);
});

ipcMain.handle('agent:request', async (_e, payload) => {
  const model = payload?.model || 'gpt-5.4';
  if (/^claude-/.test(model)) {
    return handleClaudeAgentRequest(payload, ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY);
  }
  const key = OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key?.trim()) return { ok: false, error: 'No OpenAI API key set. Open AI Keys from the toolbar to add one.' };
  const isReasoning = /^o\d/.test(model);
  try {
    const client = new OpenAI({ apiKey: key });
    const response = await client.responses.create({
      model,
      instructions: payload?.system || undefined,
      input: payload?.input,
      tools: payload?.tools || [],
      ...(isReasoning ? {} : { temperature: 0.2 }),
      ...(payload?.previousResponseId ? { previous_response_id: payload.previousResponseId } : {})
    });
    const text = response?.output_text || '';
    const functionCalls = (response?.output || [])
      .filter(i => i.type === 'function_call')
      .map(i => ({ name: i.name, arguments: i.arguments, callId: i.call_id }));
    return { ok: true, text, functionCalls, responseId: response.id };
  } catch (err) { return { ok: false, error: err?.message || String(err) }; }
});

ipcMain.handle('win:open-result', async (_e, payload)=>{
  const html = (payload && payload.html) || '<pre>No content</pre>';
  const title = (payload && payload.title) || 'Result';
  const language = (payload && payload.language) || 'javascript';
  const mode = (payload && payload.mode) || 'code'; // 'code' | 'html'
  const child = new BrowserWindow({
    width: 900, height: 650, minWidth: 700, minHeight: 450,
    title: title,
    show: true,
    frame: false,
    backgroundColor: '#0f1116',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  const doc = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
    <style>
      * { box-sizing: border-box; }
      html, body { height: 100%; margin: 0; overflow: hidden; }
      body {
        font: 13px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #1a1d24;
        color: #e6e6e6;
        display: flex;
        flex-direction: column;
        -webkit-app-region: drag;
      }
      .titlebar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: #0f1116;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        flex-shrink: 0;
        -webkit-app-region: drag;
      }
      .title {
        font-size: 13px;
        font-weight: 600;
        color: #e6e6e6;
        opacity: 0.9;
      }
      .window-controls {
        display: flex;
        gap: 6px;
        -webkit-app-region: no-drag;
      }
      .icon-btn {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: #e6e6e6;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, opacity 0.15s;
        opacity: 0.6;
        padding: 0;
      }
      .icon-btn:hover {
        background: rgba(255,255,255,0.1);
        opacity: 1;
      }
      .icon-btn.close:hover {
        background: rgba(239,68,68,0.8);
        opacity: 1;
      }
      .icon-btn svg { display: block; }
      .actions {
        display: flex;
        gap: 8px;
        padding: 10px 16px;
        background: #0f1116;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        flex-shrink: 0;
        -webkit-app-region: no-drag;
      }
      .btn {
        padding: 5px 12px;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 6px;
        background: rgba(255,255,255,0.05);
        color: #e6e6e6;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        font-weight: 500;
        transition: background 0.15s, border-color 0.15s;
        display: flex;
        align-items: center;
        gap: 6px;
        opacity: 0.8;
      }
      .btn:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.22);
        opacity: 1;
      }
      .btn svg { display: block; flex-shrink: 0; }
      .content {
        flex: 1;
        overflow: auto;
        background: #1a1d24;
        -webkit-app-region: no-drag;
      }
      .content::-webkit-scrollbar {
        width: 8px;
      }
      .content::-webkit-scrollbar-track {
        background: #1a1d24;
      }
      .content::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.15);
        border-radius: 4px;
      }
      .content::-webkit-scrollbar-thumb:hover {
        background: rgba(255,255,255,0.25);
      }
      pre[class*="language-"] {
        margin: 0;
        padding: 20px;
        background: #1a1d24 !important;
        font-size: 13px;
        line-height: 1.6;
      }
      code[class*="language-"] {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
        font-size: 13px;
      }
      .success-msg {
        position: fixed;
        top: 60px;
        right: 20px;
        padding: 10px 16px;
        background: #10b981;
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 1000;
        font-size: 12px;
        font-weight: 500;
      }
      .success-msg.show {
        opacity: 1;
      }
    </style>
  </head>
  <body>
    <div class="titlebar">
      <div class="title">${title}</div>
      <div class="window-controls">
        <button class="icon-btn close" onclick="window.close()" title="Close">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    </div>
    <div class="actions">
      <button class="btn" onclick="copyContent()" title="Copy to clipboard">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span>Copy</span>
      </button>
      <button class="btn" onclick="saveAsFile()" title="Save as file">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        <span>Save</span>
      </button>
    </div>
    <div class="content" id="content"></div>
    <div class="success-msg" id="successMsg">Copied</div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-go.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-rust.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-java.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-cpp.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-ruby.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-php.min.js"></script>
    <script>
      const mode = '${mode}';
      const rawContent = \`${html.replace(/`/g, '\\`')}\`;
      const contentEl = document.getElementById('content');
      let codeText = '';

      if (mode === 'html') {
        // Render HTML directly (e.g. screenshots, rich content)
        contentEl.innerHTML = rawContent;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = rawContent;
        codeText = tempDiv.textContent || tempDiv.innerText;
      } else {
        // Extract plain text and syntax-highlight as code
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = rawContent;
        codeText = tempDiv.textContent || tempDiv.innerText;

        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.className = 'language-${language}';
        code.textContent = codeText;
        pre.appendChild(code);
        contentEl.appendChild(pre);
        Prism.highlightElement(code);
      }

      function copyContent() {
        navigator.clipboard.writeText(codeText).then(() => {
          showSuccess();
        }).catch(err => {
        });
      }
      
      function showSuccess() {
        const msg = document.getElementById('successMsg');
        msg.classList.add('show');
        setTimeout(() => {
          msg.classList.remove('show');
        }, 1500);
      }
      
      function saveAsFile() {
        const blob = new Blob([codeText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-tests.test.${language === 'typescript' ? 'ts' : language === 'python' ? 'py' : 'js'}';
        a.click();
        URL.revokeObjectURL(url);
      }
    </script>
  </body>
  </html>`;
  const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(doc);
  await child.loadURL(dataUrl);
  try{ child.setTitle(title); }catch(_){}
  return true;
});

// ===== Email IPC Handlers =====

function imapError(e) {
  // ImapFlow puts the real IMAP server response in e.response; e.message is just "Command failed"
  if (e.response && typeof e.response === 'string') return e.response.replace(/^\d+ (NO|BAD) /i, '').trim();
  return e.message || String(e);
}

function makeImapClient(imap) {
  return new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: imap.secure,
    auth: { user: imap.user, pass: imap.pass },
    logger: false,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
  });
}

ipcMain.handle('email:hasConfig', async () => !!(emailConfig?.imap?.user));

ipcMain.handle('email:getConfig', async () => {
  if (!emailConfig) return null;
  const { imap, smtp } = emailConfig;
  return {
    imap: { host: imap.host, port: imap.port, secure: imap.secure, user: imap.user },
    smtp: { host: smtp.host, port: smtp.port, secure: smtp.secure }
  };
});

ipcMain.handle('email:saveConfig', async (_e, config) => {
  try {
    emailConfig = config;
    const json = JSON.stringify(config);
    if (!safeStorage.isEncryptionAvailable()) return { ok: false, error: 'Secure storage unavailable on this system' };
    await fs.promises.writeFile(EMAIL_CREDS_FILE, safeStorage.encryptString(json));
    return { ok: true };
  } catch (e) { return { ok: false, error: imapError(e) }; }
});

ipcMain.handle('email:testConnection', async (_e, cfg) => {
  const imap = cfg?.imap || emailConfig?.imap;
  if (!imap?.host) return { ok: false, error: 'No IMAP config' };
  const client = makeImapClient(imap);
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    lock.release();
    await client.logout();
    return { ok: true };
  } catch (e) {
    try { await client.logout(); } catch (_) {}
    return { ok: false, error: imapError(e) };
  }
});

ipcMain.handle('email:fetchInbox', async (_e, folder = 'INBOX') => {
  if (!emailConfig?.imap) return { ok: false, error: 'No email config' };
  const { imap } = emailConfig;
  const client = makeImapClient(imap);
  try {
    await client.connect();
    const messages = [];
    const lock = await client.getMailboxLock(folder);
    try {
      for await (const msg of client.fetch('1:*', { uid: true, flags: true, envelope: true, bodyParts: ['1', 'TEXT'], size: true })) {
        let snippet = '';
        try {
          // Part '1' is the first body part (text/plain for multipart emails, or full body for simple emails).
          // Fall back to 'text' (raw MIME body) and strip MIME structure if '1' is unavailable.
          const part1 = msg.bodyParts.get('1');
          const rawText = msg.bodyParts.get('text');
          // Decode and sanitize raw MIME text into a readable preview snippet.
          // Handles quoted-printable, strips base64 blobs, HTML tags, and MIME noise.
          const extractSnippet = (raw) => {
            let s = raw
              .replace(/<style[\s\S]*?<\/style>/gi, ' ')                // strip style blocks
              .replace(/<script[\s\S]*?<\/script>/gi, ' ')              // strip script blocks
              .replace(/=\r?\n/g, '')                                   // QP soft line breaks
              .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) // QP chars
              .replace(/<[^>]*>/g, ' ')                                 // HTML tags (any length)
              .replace(/[A-Za-z0-9+/]{40,}={0,2}/g, '')                // base64 blobs
              .replace(/&[a-z]+;|&#\d+;/gi, ' ')                       // HTML entities
              .replace(/\s+/g, ' ').trim();
            return s.slice(0, 120);
          };
          if (part1) {
            snippet = extractSnippet(part1.toString('utf8'));
          } else if (rawText) {
            const t = rawText.toString('utf8');
            // Skip past MIME headers/boundaries to get at the actual content
            const afterBlank = t.includes('\r\n\r\n') ? t.split('\r\n\r\n')[1] : t.split('\n\n')[1] || t;
            const lines = (afterBlank || '').split('\n')
              .filter(l => !l.startsWith('--') && !/^Content-/i.test(l));
            snippet = extractSnippet(lines.join(' '));
          }
        } catch (_) {}
        messages.push({
          uid: msg.uid,
          subject: msg.envelope.subject || '(no subject)',
          from: msg.envelope.from?.[0] ? `${msg.envelope.from[0].name || ''} <${msg.envelope.from[0].address}>`.trim() : '',
          to: msg.envelope.to?.[0]?.address || '',
          date: msg.envelope.date,
          seen: msg.flags.has('\\Seen'),
          snippet
        });
      }
    } finally { lock.release(); }
    await client.logout();
    messages.sort((a, b) => new Date(b.date) - new Date(a.date));
    const top50 = messages.slice(0, 50);
    return { ok: true, messages: top50 };
  } catch (e) {
    try { await client.logout(); } catch (_) {}
    return { ok: false, error: imapError(e) };
  }
});

ipcMain.handle('email:fetchMessage', async (_e, uid) => {
  if (!emailConfig?.imap) return { ok: false, error: 'No email config' };
  const { imap } = emailConfig;
  const client = makeImapClient(imap);
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    let parsed;
    try {
      const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
      parsed = await simpleParser(msg.source);
    } finally { lock.release(); }
    await client.logout();
    return { ok: true, message: {
      subject: parsed.subject || '(no subject)',
      from: parsed.from?.text || '',
      to: parsed.to?.text || '',
      cc: parsed.cc?.text || '',
      date: parsed.date,
      html: parsed.html || null,
      text: parsed.text || '',
      messageId: parsed.messageId || ''
    }};
  } catch (e) {
    try { await client.logout(); } catch (_) {}
    return { ok: false, error: imapError(e) };
  }
});


ipcMain.handle('email:send', async (_e, opts) => {
  if (!emailConfig) return { ok: false, error: 'No email config' };
  const { imap, smtp } = emailConfig;
  try {
    // port 465 = direct SSL (secure:true), port 587 = STARTTLS (secure:false + requireTLS)
    const useStarttls = !smtp.secure && smtp.port !== 465;
    const transporter = createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.secure,
      ...(useStarttls ? { requireTLS: true } : {}),
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
      auth: { user: imap.user, pass: imap.pass }
    });
    await transporter.sendMail({
      from: imap.user,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      ...(opts.inReplyTo ? { inReplyTo: opts.inReplyTo } : {}),
      ...(opts.references ? { references: opts.references } : {})
    });
    return { ok: true };
  } catch (e) { return { ok: false, error: imapError(e) }; }
});

ipcMain.handle('email:markRead', async (_e, uid) => {
  if (!emailConfig?.imap) return { ok: false, error: 'No email config' };
  const { imap } = emailConfig;
  const client = makeImapClient(imap);
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
    } finally { lock.release(); }
    await client.logout();
    return { ok: true };
  } catch (e) {
    try { await client.logout(); } catch (_) {}
    return { ok: false, error: imapError(e) };
  }
});

ipcMain.handle('email:moveToTrash', async (_e, uid) => {
  if (!emailConfig?.imap) return { ok: false, error: 'No email config' };
  const { imap } = emailConfig;
  const client = makeImapClient(imap);
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const trashFolders = ['Trash', '[Gmail]/Trash', 'Deleted Items', 'Deleted Messages'];
      let moved = false;
      for (const folder of trashFolders) {
        try {
          await client.messageMove(String(uid), folder, { uid: true });
          moved = true;
          break;
        } catch (_) {}
      }
      if (!moved) {
        await client.messageFlagsAdd(String(uid), ['\\Deleted'], { uid: true });
        await client.messageExpunge(String(uid), { uid: true });
      }
    } finally { lock.release(); }
    await client.logout();
    return { ok: true };
  } catch (e) {
    try { await client.logout(); } catch (_) {}
    return { ok: false, error: imapError(e) };
  }
});
// ── STAIRS ──────────────────────────────────────────────────────────────────
const stairsDir = () => path.join(os.homedir(), '.Kit', 'stairs');

ipcMain.handle('stairs:list', async () => {
  try {
    await fs.promises.mkdir(stairsDir(), { recursive: true });
    const files = (await fs.promises.readdir(stairsDir())).filter(f => f.endsWith('.json'));
    const all = [];
    for (const f of files) {
      try { all.push(JSON.parse(await fs.promises.readFile(path.join(stairsDir(), f), 'utf8'))); } catch {}
    }
    return all.sort((a, b) => (b.created || '').localeCompare(a.created || ''));
  } catch { return []; }
});

ipcMain.handle('stairs:save', async (_e, staircase) => {
  await fs.promises.mkdir(stairsDir(), { recursive: true });
  await fs.promises.writeFile(path.join(stairsDir(), `${staircase.id}.json`), JSON.stringify(staircase, null, 2), 'utf8');
  return { ok: true };
});

ipcMain.handle('stairs:delete', async (_e, id) => {
  try { await fs.promises.unlink(path.join(stairsDir(), `${id}.json`)); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('stairs:run-code', async (_e, command) => {
  return new Promise(resolve => {
    exec(command, { timeout: 30000, shell: '/bin/bash' }, (err, stdout, stderr) => {
      if (err) resolve({ ok: false, output: (stderr || err.message).trim() });
      else resolve({ ok: true, output: stdout.trim() });
    });
  });
});

ipcMain.handle('stairs:run-http', async (_e, { url, method = 'GET', headers = {}, body }) => {
  try {
    let parsed;
    try { parsed = new URL(url); } catch { return { ok: false, output: 'Invalid URL' }; }
    if (!['http:', 'https:'].includes(parsed.protocol)) return { ok: false, output: 'Only http/https URLs are allowed' };
    const h = parsed.hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.endsWith('.local') ||
        /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h))
      return { ok: false, output: 'Requests to private/localhost addresses are not allowed' };
    const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
    if (body) opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    const res = await fetch(url, opts);
    const text = await res.text();
    return { ok: res.ok, status: res.status, output: text };
  } catch (e) { return { ok: false, output: e.message }; }
});

function stairsSafePath(filePath) {
  const home = os.homedir();
  const resolved = path.resolve(String(filePath).replace(/^~/, home));
  if (resolved !== home && !resolved.startsWith(home + path.sep))
    throw new Error('Path must be within home directory');
  return resolved;
}

ipcMain.handle('stairs:file-read', async (_e, filePath) => {
  try {
    return { ok: true, output: await fs.promises.readFile(stairsSafePath(filePath), 'utf8') };
  } catch (e) { return { ok: false, output: e.message }; }
});

ipcMain.handle('stairs:file-write', async (_e, { path: filePath, content }) => {
  try {
    const resolved = stairsSafePath(filePath);
    await fs.promises.mkdir(path.dirname(resolved), { recursive: true });
    await fs.promises.writeFile(resolved, content, 'utf8');
    return { ok: true, output: `Written to ${filePath}` };
  } catch (e) { return { ok: false, output: e.message }; }
});
