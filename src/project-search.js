// Project Search - Raycast-inspired search functionality

class ProjectSearch {
  constructor() {
    this.modal = document.getElementById('projectSearchModal');
    this.input = document.getElementById('projectSearchInput');
    this.results = document.getElementById('projectSearchResults');
    this.selectedIndex = -1;
    this.searchResults = [];
    this.searchTimeout = null;
    this.fileCache = new Map();
    this.isIndexing = false;
    this.lastIndexedCwd = null;
    
    // Folders to ignore during search
    this.ignoredFolders = [
      'node_modules',
      '.git',
      '.next',
      '.nuxt',
      'dist',
      'build',
      'out',
      'coverage',
      '.nyc_output',
      'tmp',
      'temp',
      '.cache',
      '.parcel-cache',
      '.vscode',
      '.idea',
      'vendor',
      '__pycache__',
      '.pytest_cache',
      'target',
      'bin',
      'obj'
    ];

    // File extensions to search
    this.searchableExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
      '.html', '.htm', '.css', '.scss', '.sass', '.less',
      '.json', '.xml', '.yaml', '.yml', '.toml',
      '.md', '.mdx', '.txt', '.py', '.rb', '.php',
      '.java', '.c', '.cpp', '.h', '.hpp', '.cs',
      '.go', '.rs', '.swift', '.kt', '.scala',
      '.sh', '.bash', '.zsh', '.fish', '.ps1',
      '.sql', '.graphql', '.gql', '.proto'
    ];

    this.init();
  }

  init() {
    this.bindEvents();
    this.indexProject();
  }

  bindEvents() {
    // Modal backdrop click to close
    this.modal.querySelector('.search-backdrop').addEventListener('click', () => {
      this.close();
    });

    // Input events
    this.input.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    this.input.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Project Search (Cmd+K / Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.open();
        return;
      }
      
      // Dark/Light Mode Toggle (Cmd+D / Ctrl+D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        if (window.applyTheme) {
          const isDark = document.body.classList.contains('dark');
          window.applyTheme(isDark ? 'light' : 'dark');
        }
        return;
      }
      
      // Writer Mode (Cmd+W / Ctrl+W)
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        const writingBtn = document.getElementById('writingModeBtn');
        if (writingBtn) {
          writingBtn.click();
        }
        return;
      }
      
      // Browser Mode (Cmd+B / Ctrl+B)
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        if (window.setBrowserMode) {
          const isBrowser = document.body.classList.contains('browser-mode');
          window.setBrowserMode(!isBrowser);
        }
        return;
      }
      
    // API Mode (Cmd+R / Ctrl+R)
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
      e.preventDefault();
      if (window.setApiMode) {
        const isApi = document.body.classList.contains('api-mode');
        window.setApiMode(!isApi);
      }
      return;
    }
      
      // Sidebar Toggle (Cmd+E / Ctrl+E)
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          sidebar.classList.toggle('hidden');
        }
        return;
      }
      
      // Home/Start Screen (Cmd+0 / Ctrl+0)
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        // Close all modes and return to editor
        if (document.body.classList.contains('browser-mode') && window.setBrowserMode) {
          window.setBrowserMode(false);
        }

        if (document.body.classList.contains('api-mode') && window.setApiMode) {
          window.setApiMode(false);
        }
        if (document.body.classList.contains('writing-mode')) {
          const writingOverlay = document.getElementById('writingOverlay');
          if (writingOverlay) {
            writingOverlay.classList.add('hidden');
            document.body.classList.remove('writing-mode');
          }
        }
        return;
      }
    });

    // Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  async indexProject() {
    if (this.isIndexing) return;
    this.isIndexing = true;

    try {
      const cwd = await this.getCurrentWorkingDirectory();
      if (!cwd) return;

      this.fileCache.clear();
      this.lastIndexedCwd = cwd;
      await this.indexDirectory(cwd);
    } catch (error) {
    } finally {
      this.isIndexing = false;
    }
  }

  async getCurrentWorkingDirectory() {
    if (window.termCwd) {
      return window.termCwd;
    }

    const bridge = window.jack || window.jackBridge;
    if (bridge && bridge.getCwd) {
      try {
        return await bridge.getCwd();
      } catch (e) {}
    }

    return null;
  }

  async indexDirectory(dirPath) {
    try {
      const bridge = window.jack || window.jackBridge;
      if (!bridge || !bridge.list) return;
      let result = await bridge.list(dirPath);
      
      if (!result || !result.ok || !result.items) {
        return;
      }
      
      const entries = result.items;
      
      for (const entry of entries) {
        const fullPath = this.joinPath(dirPath, entry.name);
        
        if (entry.dir) {
          // Skip ignored folders
          if (this.ignoredFolders.includes(entry.name)) {
            continue;
          }
          
          // Recursively index subdirectories
          await this.indexDirectory(fullPath);
        } else {
          // Check if file extension is searchable
          const ext = this.getFileExtension(entry.name);
          if (this.searchableExtensions.includes('.' + ext)) {
            await this.indexFile(fullPath);
          }
        }
      }
    } catch (error) {
    }
  }

  async indexFile(filePath) {
    try {
      const bridge = window.jack || window.jackBridge;
      if (!bridge || !bridge.readFile) return;
      let result = await bridge.readFile(filePath);
      
      if (!result || !result.ok || !result.data) {
        return;
      }
      
      const content = result.data;
      
      // Store file content in cache
      this.fileCache.set(filePath, {
        content: content,
        lines: content.split('\n'),
        lastModified: Date.now()
      });
    } catch (error) {
    }
  }

  joinPath(dir, file) {
    // Simple path joining that works cross-platform
    return dir.replace(/[\/\\]$/, '') + '/' + file;
  }

  handleSearch(query) {
    clearTimeout(this.searchTimeout);
    
    if (!query.trim()) {
      this.showEmptyState();
      return;
    }

    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query.trim());
    }, 150);
  }

  performSearch(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    const queryRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    // Search through cached files
    for (const [filePath, fileData] of this.fileCache) {
      const matches = this.searchInFile(filePath, fileData, queryLower, queryRegex);
      results.push(...matches);
    }

    // Sort results by relevance
    results.sort((a, b) => {
      // Prioritize exact matches
      if (a.exactMatch && !b.exactMatch) return -1;
      if (!a.exactMatch && b.exactMatch) return 1;
      
      // Then by file name matches
      if (a.fileNameMatch && !b.fileNameMatch) return -1;
      if (!a.fileNameMatch && b.fileNameMatch) return 1;
      
      // Then by line number (earlier matches first)
      return a.line - b.line;
    });

    // Limit results to prevent performance issues
    this.searchResults = results.slice(0, 50);
    this.selectedIndex = this.searchResults.length > 0 ? 0 : -1;
    this.renderResults(query);
  }

  searchInFile(filePath, fileData, queryLower, queryRegex) {
    const results = [];
    const fileName = this.getFileName(filePath);
    const fileNameLower = fileName.toLowerCase();
    const fileNameMatch = fileNameLower.includes(queryLower);

    fileData.lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      if (lineLower.includes(queryLower)) {
        const match = {
          filePath,
          fileName,
          line: index + 1,
          content: line.trim(),
          preview: this.generatePreview(line, queryRegex),
          exactMatch: line.trim().toLowerCase() === queryLower,
          fileNameMatch
        };
        results.push(match);
      }
    });

    // If filename matches but no content matches, add a file result
    if (fileNameMatch && results.length === 0) {
      results.push({
        filePath,
        fileName,
        line: 1,
        content: '',
        preview: fileName,
        exactMatch: false,
        fileNameMatch: true
      });
    }

    return results;
  }

  generatePreview(line, queryRegex) {
    const maxLength = 80;
    let preview = line.trim();
    
    if (preview.length > maxLength) {
      // Try to center the match in the preview
      const match = queryRegex.exec(preview);
      if (match) {
        const start = Math.max(0, match.index - 20);
        const end = Math.min(preview.length, start + maxLength);
        preview = (start > 0 ? '...' : '') + 
                 preview.substring(start, end) + 
                 (end < preview.length ? '...' : '');
      } else {
        preview = preview.substring(0, maxLength) + '...';
      }
    }
    
    return preview.replace(queryRegex, '<span class="search-result-match">$&</span>');
  }

  renderResults(query) {
    if (this.searchResults.length === 0) {
      this.showNoResults(query);
      return;
    }

    const html = this.searchResults.map((result, index) => {
      const icon = this.getFileIcon(result.fileName);
      const relativePath = this.getRelativePath(result.filePath);
      
      return `
        <div class="search-result-item ${index === this.selectedIndex ? 'selected' : ''}" 
             data-index="${index}">
          <div class="search-result-icon ${this.getFileType(result.fileName)}">${icon}</div>
          <div class="search-result-content">
            <div class="search-result-title">${this.highlightMatch(result.fileName, query)}</div>
            <div class="search-result-path">${relativePath}</div>
            ${result.content ? `<div class="search-result-preview">${result.preview}</div>` : ''}
          </div>
          <div class="search-result-line">${result.line}</div>
        </div>
      `;
    }).join('');

    this.results.innerHTML = html;

    // Add click handlers
    this.results.querySelectorAll('.search-result-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.openResult(this.searchResults[index]);
      });
    });
  }

  showEmptyState() {
    this.results.innerHTML = `
      <div class="search-empty">
        <div class="search-empty-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div>
        <p>Start typing to search across your project</p>
        <p class="search-empty-sub">Files, functions, variables, and more</p>
      </div>
    `;
    this.searchResults = [];
    this.selectedIndex = -1;
  }

  showNoResults(query) {
    this.results.innerHTML = `
      <div class="search-empty">
        <div class="search-empty-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div>
        <p>No results for &ldquo;${query}&rdquo;</p>
        <p class="search-empty-sub">Try a different search term</p>
      </div>
    `;
    this.searchResults = [];
    this.selectedIndex = -1;
  }

  handleKeydown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.moveSelection(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.moveSelection(-1);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0 && this.searchResults[this.selectedIndex]) {
          this.openResult(this.searchResults[this.selectedIndex]);
        }
        break;
    }
  }

  moveSelection(direction) {
    if (this.searchResults.length === 0) return;

    this.selectedIndex += direction;
    
    if (this.selectedIndex < 0) {
      this.selectedIndex = this.searchResults.length - 1;
    } else if (this.selectedIndex >= this.searchResults.length) {
      this.selectedIndex = 0;
    }

    // Update visual selection
    this.results.querySelectorAll('.search-result-item').forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });

    // Scroll selected item into view
    const selectedItem = this.results.querySelector('.search-result-item.selected');
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }

  async openResult(result) {
    try {
      // Close the search modal
      this.close();

      // Open the file in the editor
      if (window.openFile) {
        await window.openFile(result.filePath);
      }

      // Jump to the specific line
      if (window.editor && result.line > 1) {
        setTimeout(() => {
          window.editor.setCursor(result.line - 1, 0);
          window.editor.scrollIntoView({ line: result.line - 1, ch: 0 });
        }, 100);
      }
    } catch (error) {
    }
  }

  getFileIcon(fileName) {
    const ext = this.getFileExtension(fileName);
    const fileIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const dirIcon  = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
    const codeExts = new Set(['js','jsx','ts','tsx','vue','svelte','py','rb','php','java','c','cpp','cs','go','rs','swift','kt','scala','sh','bash']);
    return codeExts.has(ext) ? fileIcon : fileIcon;
  }

  getFileType(fileName) {
    return this.getFileExtension(fileName);
  }

  getFileExtension(fileName) {
    return fileName.split('.').pop().toLowerCase();
  }

  getFileName(filePath) {
    return filePath.split('/').pop() || filePath.split('\\').pop();
  }

  getRelativePath(filePath) {
    // Try to make path relative to current working directory
    if (window.termCwd && filePath.startsWith(window.termCwd)) {
      return filePath.substring(window.termCwd.length + 1);
    }
    return filePath;
  }

  highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return text.replace(regex, '<span class="search-result-match">$&</span>');
  }

  async open() {
    this.modal.style.display = 'flex';
    this.input.focus();
    this.input.select();

    const cwd = await this.getCurrentWorkingDirectory();
    if (cwd && cwd !== this.lastIndexedCwd) {
      this.indexProject();
    } else if (this.fileCache.size === 0) {
      this.indexProject();
    }
  }

  close() {
    this.modal.style.display = 'none';
    this.input.value = '';
    this.showEmptyState();
    clearTimeout(this.searchTimeout);
  }

  isOpen() {
    return this.modal.style.display === 'flex';
  }
}

// Initialize project search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.projectSearch = new ProjectSearch();
});
