const { contextBridge, ipcRenderer } = require('electron');

const api = {
  openFile: (filters)=> ipcRenderer.invoke('dialog:openFile', filters),
  openFolder: ()=> ipcRenderer.invoke('dialog:openFolder'),
  saveAs: (name)=> ipcRenderer.invoke('dialog:saveAs', name),
  readFile: (p)=> ipcRenderer.invoke('fs:readFile', p),
  writeFile: (p,c)=> ipcRenderer.invoke('fs:writeFile', p, c),
  rename: (o,n)=> ipcRenderer.invoke('fs:rename', o, n),
  homeDir: ()=> ipcRenderer.invoke('os:homedir'),
  stat: (p)=> ipcRenderer.invoke('fs:stat', p),
  list: (p)=> ipcRenderer.invoke('fs:list', p),
  copyTo: (s,d)=> ipcRenderer.invoke('fs:copyTo', s, d),
  mkdir: (d)=> ipcRenderer.invoke('fs:mkdir', d),
  delete: (p)=> ipcRenderer.invoke('fs:delete', p),
  run: (cwd, cmd)=> ipcRenderer.invoke('term:run', cwd, cmd),
  exec: (cwd, cmd)=> ipcRenderer.invoke('term:exec', cwd, cmd),
  onTermOutput: (cb)=> ipcRenderer.on('term:output', (_e, data)=> cb(data)),
  setEnv: (key, value)=> ipcRenderer.invoke('term:setEnv', key, value),
  getEnv: (key)=> ipcRenderer.invoke('term:getEnv', key),
  exit: ()=> ipcRenderer.invoke('app:exit'),
  setTheme: (mode)=> ipcRenderer.invoke('app:setTheme', mode),
  // AI
  setApiKey: (k, provider)=> ipcRenderer.invoke('ai:setKey', k, provider || 'openai'),
  setKey: (k, provider)=> ipcRenderer.invoke('ai:setKey', k, provider || 'openai'),
  aiRequest: (payload)=> ipcRenderer.invoke('ai:request', payload),
  agentRequest: (payload)=> ipcRenderer.invoke('agent:request', payload),
  hasKey: (provider)=> ipcRenderer.invoke('ai:hasKey', provider),
  clearKey: (provider)=> ipcRenderer.invoke('ai:clearKey', provider),

  // Formatting
  formatPython: (code)=> ipcRenderer.invoke('format:python', code),
  // Detached result window
  openResultWindow: (payload)=> ipcRenderer.invoke('win:open-result', payload),
  // --- Project Search ---
  readDirectory: (dirPath)=> ipcRenderer.invoke('readDirectory', dirPath),
  getCwd: ()=> ipcRenderer.invoke('getCwd'),
  // --- Folder / Board Management ---
  ensureFolder: ()=> ipcRenderer.invoke('kit:ensureFolder'),
  loadBoard: ()=> ipcRenderer.invoke('kit:loadBoard'),
  saveBoard: (data)=> ipcRenderer.invoke('kit:saveBoard', data),
  captureBoard: (rect)=> ipcRenderer.invoke('kit:captureBoard', rect),
  getReadmePath: ()=> ipcRenderer.invoke('kit:getReadmePath'),
  stairs: {
    list:      ()         => ipcRenderer.invoke('stairs:list'),
    save:      (s)        => ipcRenderer.invoke('stairs:save', s),
    delete:    (id)       => ipcRenderer.invoke('stairs:delete', id),
    runCode:   (cmd)      => ipcRenderer.invoke('stairs:run-code', cmd),
    runHttp:   (opts)     => ipcRenderer.invoke('stairs:run-http', opts),
    fileRead:  (p)        => ipcRenderer.invoke('stairs:file-read', p),
    fileWrite: (p, c)     => ipcRenderer.invoke('stairs:file-write', { path: p, content: c }),
  },
  email: {
    hasConfig:      () => ipcRenderer.invoke('email:hasConfig'),
    getConfig:      () => ipcRenderer.invoke('email:getConfig'),
    saveConfig:     (cfg) => ipcRenderer.invoke('email:saveConfig', cfg),
    testConnection: (cfg) => ipcRenderer.invoke('email:testConnection', cfg),
    fetchInbox:     (folder) => ipcRenderer.invoke('email:fetchInbox', folder),
    fetchMessage:   (uid) => ipcRenderer.invoke('email:fetchMessage', uid),
    send:           (opts) => ipcRenderer.invoke('email:send', opts),
    markRead:       (uid) => ipcRenderer.invoke('email:markRead', uid),
    moveToTrash:    (uid) => ipcRenderer.invoke('email:moveToTrash', uid),
  },

};

try {
  contextBridge.exposeInMainWorld('kit', api);
} catch (err) {
  try {
    contextBridge.exposeInMainWorld('kitBridge', api);
  } catch(_){}
}