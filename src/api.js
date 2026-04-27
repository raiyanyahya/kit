// API Testing Mode - Postman-like functionality

class APITester {
  constructor() {
    this.history = JSON.parse(localStorage.getItem('api-history') || '[]');
    this.collections = JSON.parse(localStorage.getItem('api-collections') || '[]');
    this.currentRequest = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadHistory();
    this.loadCollections();
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.api-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Response tab switching
    document.querySelectorAll('.api-response-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchResponseTab(e.target.dataset.tab);
      });
    });

    // Sidebar tab switching
    document.querySelectorAll('.api-sidebar-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchSidebarTab(e.target.dataset.tab);
      });
    });

    // Send request
    document.getElementById('apiSend').addEventListener('click', () => {
      this.sendRequest();
    });

    // Enter key in URL input
    document.getElementById('apiUrl').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.sendRequest();
      }
    });

    // Body type switching
    document.querySelectorAll('input[name="bodyType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.switchBodyType(e.target.value);
      });
    });

    // Auth type switching
    document.querySelectorAll('input[name="authType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.switchAuthType(e.target.value);
      });
    });

    // Add row buttons
    document.querySelectorAll('.api-add-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.addKeyValueRow(e.target.dataset.target);
      });
    });

    // Collection actions
    document.getElementById('newCollectionBtn')?.addEventListener('click', () => {
      this.createCollection();
    });

    document.getElementById('newRequestBtn')?.addEventListener('click', () => {
      this.createRequest();
    });

    // Collection toggle
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('api-collection-toggle')) {
        this.toggleCollection(e.target.closest('.api-collection'));
      }
    });

    // Remove key-value rows
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('api-kv-remove')) {
        e.target.closest('.api-kv-row').remove();
      }
    });

    // Request item clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('.api-request-item')) {
        this.loadRequest(e.target.closest('.api-request-item'));
      }
      if (e.target.closest('.api-history-item')) {
        this.loadHistoryItem(e.target.closest('.api-history-item'));
      }
    });
  }

  switchTab(tabName) {
    // Remove active from all tabs and panels
    document.querySelectorAll('.api-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.api-tab-panel').forEach(panel => panel.classList.remove('active'));

    // Add active to selected tab and panel
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`api-${tabName}`).classList.add('active');
  }

  switchResponseTab(tabName) {
    // Remove active from all response tabs and panels
    document.querySelectorAll('.api-response-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.api-response-panel-content').forEach(panel => panel.classList.remove('active'));

    // Add active to selected tab and panel
    document.querySelector(`.api-response-tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`api-response-${tabName}`).classList.add('active');
  }

  switchSidebarTab(tabName) {
    // Remove active from all sidebar tabs and panels
    document.querySelectorAll('.api-sidebar-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.api-sidebar-panel').forEach(panel => panel.classList.remove('active'));

    // Add active to selected tab and panel
    document.querySelector(`.api-sidebar-tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`api-${tabName}`).classList.add('active');
  }

  switchBodyType(type) {
    // Hide all body content
    document.getElementById('api-body-json').style.display = 'none';
    document.getElementById('api-body-form').style.display = 'none';
    document.getElementById('api-body-raw').style.display = 'none';

    // Show selected body type
    if (type === 'json') {
      document.getElementById('api-body-json').style.display = 'block';
    } else if (type === 'form') {
      document.getElementById('api-body-form').style.display = 'block';
    } else if (type === 'raw') {
      document.getElementById('api-body-raw').style.display = 'block';
    }
  }

  switchAuthType(type) {
    // Hide all auth content
    document.getElementById('api-auth-bearer').style.display = 'none';
    document.getElementById('api-auth-basic').style.display = 'none';
    document.getElementById('api-auth-apikey').style.display = 'none';

    // Show selected auth type
    if (type === 'bearer') {
      document.getElementById('api-auth-bearer').style.display = 'block';
    } else if (type === 'basic') {
      document.getElementById('api-auth-basic').style.display = 'block';
    } else if (type === 'apikey') {
      document.getElementById('api-auth-apikey').style.display = 'block';
    }
  }

  addKeyValueRow(target) {
    const container = document.getElementById(`api-${target}-list`);
    const row = document.createElement('div');
    row.className = 'api-kv-row';
    row.innerHTML = `
      <input type="text" placeholder="Key" class="api-kv-key" />
      <input type="text" placeholder="Value" class="api-kv-value" />
      <input type="text" placeholder="Description" class="api-kv-desc" />
      <button class="api-kv-remove">×</button>
    `;
    container.appendChild(row);
  }

  getKeyValuePairs(target) {
    const rows = document.querySelectorAll(`#api-${target}-list .api-kv-row`);
    const pairs = {};
    rows.forEach(row => {
      const key = row.querySelector('.api-kv-key').value.trim();
      const value = row.querySelector('.api-kv-value').value.trim();
      if (key && value) {
        pairs[key] = value;
      }
    });
    return pairs;
  }

  async sendRequest() {
    const method = document.getElementById('apiMethod').value;
    const url = document.getElementById('apiUrl').value.trim();

    if (!url) {
      alert('Please enter a URL');
      return;
    }

    // Show response panel
    const responsePanel = document.querySelector('.api-response-panel');
    if (responsePanel) {
      responsePanel.classList.add('show');
      // Adjust request panel width
      const requestPanel = document.querySelector('.api-request-panel');
      if (requestPanel) {
        requestPanel.style.flex = '0.6';
        requestPanel.style.maxWidth = '600px';
      }
    }

    // Disable send button
    const sendBtn = document.getElementById('apiSend');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    const startTime = Date.now();
    let finalUrl = url; // Move this outside try block for catch block access

    try {
      // Build request options
      const options = {
        method: method,
        headers: {}
      };

      // Add headers
      const headers = this.getKeyValuePairs('headers');
      Object.assign(options.headers, headers);

      // Add authentication
      const authType = document.querySelector('input[name="authType"]:checked').value;
      if (authType === 'bearer') {
        const token = document.getElementById('api-bearer-token').value.trim();
        if (token) {
          options.headers['Authorization'] = `Bearer ${token}`;
        }
      } else if (authType === 'basic') {
        const username = document.getElementById('api-basic-username').value.trim();
        const password = document.getElementById('api-basic-password').value.trim();
        if (username && password) {
          options.headers['Authorization'] = `Basic ${btoa(username + ':' + password)}`;
        }
      } else if (authType === 'apikey') {
        const keyName = document.getElementById('api-key-name').value.trim();
        const keyValue = document.getElementById('api-key-value').value.trim();
        const keyLocation = document.getElementById('api-key-location').value;
        if (keyName && keyValue) {
          if (keyLocation === 'header') {
            options.headers[keyName] = keyValue;
          }
          // Query params will be handled when building URL
        }
      }

      // Build URL with params
      const params = this.getKeyValuePairs('params');
      
      // Add API key as query param if needed
      const authType2 = document.querySelector('input[name="authType"]:checked').value;
      if (authType2 === 'apikey') {
        const keyName = document.getElementById('api-key-name').value.trim();
        const keyValue = document.getElementById('api-key-value').value.trim();
        const keyLocation = document.getElementById('api-key-location').value;
        if (keyName && keyValue && keyLocation === 'query') {
          params[keyName] = keyValue;
        }
      }

      if (Object.keys(params).length > 0) {
        const urlObj = new URL(finalUrl);
        Object.entries(params).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value);
        });
        finalUrl = urlObj.toString();
      }

      // Add body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const bodyType = document.querySelector('input[name="bodyType"]:checked').value;
        
        if (bodyType === 'json') {
          const jsonBody = document.getElementById('api-body-json').value.trim();
          if (jsonBody) {
            try {
              JSON.parse(jsonBody); // Validate JSON
              options.body = jsonBody;
              options.headers['Content-Type'] = 'application/json';
            } catch (e) {
              throw new Error('Invalid JSON in request body');
            }
          }
        } else if (bodyType === 'form') {
          const formData = new FormData();
          const formPairs = this.getKeyValuePairs('form');
          Object.entries(formPairs).forEach(([key, value]) => {
            formData.append(key, value);
          });
          options.body = formData;
        } else if (bodyType === 'raw') {
          const rawBody = document.getElementById('api-body-raw').value.trim();
          if (rawBody) {
            options.body = rawBody;
            if (!options.headers['Content-Type']) {
              options.headers['Content-Type'] = 'text/plain';
            }
          }
        }
      }

      // Make the request
      const response = await fetch(finalUrl, options);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Get response data
      const responseText = await response.text();
      let responseData = responseText;
      let isJson = false;

      try {
        responseData = JSON.parse(responseText);
        isJson = true;
      } catch (e) {
        // Not JSON, keep as text
      }

      // Display response
      this.displayResponse(response, responseData, duration, isJson);

      // Add to history
      this.addToHistory({
        method,
        url: finalUrl,
        status: response.status,
        statusText: response.statusText,
        duration,
        timestamp: new Date().toISOString(),
        response: responseData
      });

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.displayError(error.message, duration);
      
      // Add error to history
      this.addToHistory({
        method,
        url: finalUrl || url,
        status: 0,
        statusText: 'Error',
        duration,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    } finally {
      // Re-enable send button
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
    }
  }

  displayResponse(response, data, duration, isJson) {
    // Hide empty state
    document.querySelector('.api-response-empty').style.display = 'none';
    document.getElementById('api-response-body-content').style.display = 'block';

    // Update status info
    const statusEl = document.getElementById('api-response-status');
    statusEl.textContent = `${response.status} ${response.statusText}`;
    statusEl.className = `api-status ${response.ok ? 'success' : 'error'}`;

    document.getElementById('api-response-time').textContent = `${duration}ms`;
    
    // Calculate response size
    const size = new Blob([JSON.stringify(data)]).size;
    document.getElementById('api-response-size').textContent = `${this.formatBytes(size)}`;

    // Display response body
    const bodyContent = document.getElementById('api-response-body-content');
    if (isJson) {
      bodyContent.textContent = JSON.stringify(data, null, 2);
    } else {
      bodyContent.textContent = data;
    }

    // Display response headers
    const headersContent = document.getElementById('api-response-headers-content');
    const headersText = Array.from(response.headers.entries())
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    headersContent.textContent = headersText;
  }

  displayError(message, duration) {
    // Hide empty state
    document.querySelector('.api-response-empty').style.display = 'none';
    document.getElementById('api-response-body-content').style.display = 'block';

    // Update status info
    const statusEl = document.getElementById('api-response-status');
    statusEl.textContent = 'Error';
    statusEl.className = 'api-status error';

    document.getElementById('api-response-time').textContent = `${duration}ms`;
    document.getElementById('api-response-size').textContent = '0 B';

    // Display error
    document.getElementById('api-response-body-content').textContent = message;
    document.getElementById('api-response-headers-content').textContent = '';
  }

  addToHistory(request) {
    this.history.unshift(request);
    
    // Keep only last 50 requests
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }
    
    localStorage.setItem('api-history', JSON.stringify(this.history));
    this.loadHistory();
  }

  loadHistory() {
    const historyContainer = document.getElementById('api-history-list');
    const emptyState = document.querySelector('.api-history-empty');

    if (this.history.length === 0) {
      emptyState.style.display = 'flex';
      historyContainer.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    historyContainer.style.display = 'block';

    historyContainer.innerHTML = this.history.map((item, index) => `
      <div class="api-history-item" data-index="${index}">
        <span class="api-history-method ${item.method.toLowerCase()}">${item.method}</span>
        <span class="api-history-url" title="${item.url}">${this.truncateUrl(item.url)}</span>
        <span class="api-history-time">${this.formatTime(item.timestamp)}</span>
        <div class="api-history-status ${item.status >= 200 && item.status < 300 ? 'success' : 'error'}"></div>
      </div>
    `).join('');
  }

  loadHistoryItem(element) {
    const index = parseInt(element.dataset.index);
    const item = this.history[index];
    
    if (!item) return;

    // Load request data
    document.getElementById('apiMethod').value = item.method;
    document.getElementById('apiUrl').value = item.url;

    // Switch to collections tab to show the loaded request
    this.switchSidebarTab('collections');
  }

  loadCollections() {
    // For now, just show the default collection
    // In a real implementation, this would load from localStorage
  }

  async createCollection() {
    // Use a simple input dialog instead of prompt
    const name = await this.showInputDialog('Collection name:', 'New Collection');
    if (!name) return;

    // Add collection logic here
  }

  async createRequest() {
    // Use a simple input dialog instead of prompt
    const name = await this.showInputDialog('Request name:', 'New Request');
    if (!name) return;

    // Create new request object
    const request = {
      id: Date.now().toString(),
      name: name,
      method: 'GET',
      url: '',
      timestamp: new Date().toISOString()
    };

    // Add to collections
    this.addRequestToCollection(request);
    
  }

  addRequestToCollection(request) {
    // Find the active collection or create default
    const collectionsPanel = document.getElementById('api-collections');
    if (!collectionsPanel) return;

    // Find the default collection
    let collection = collectionsPanel.querySelector('.api-collection');
    if (!collection) {
      // Create default collection if it doesn't exist
      collection = this.createDefaultCollection();
      collectionsPanel.appendChild(collection);
    }

    // Find or create the requests list
    let requestsList = collection.querySelector('.api-collection-requests');
    if (!requestsList) {
      requestsList = document.createElement('div');
      requestsList.className = 'api-collection-requests';
      collection.appendChild(requestsList);
    }

    // Create request item
    const requestItem = document.createElement('div');
    requestItem.className = 'api-request-item';
    requestItem.innerHTML = `
      <span class="api-request-method">${request.method}</span>
      <span class="api-request-name">${request.name}</span>
    `;
    
    // Add click handler to load request
    requestItem.addEventListener('click', () => {
      this.loadRequest(request);
    });

    requestsList.appendChild(requestItem);
  }

  createDefaultCollection() {
    const collection = document.createElement('div');
    collection.className = 'api-collection';
    collection.innerHTML = `
      <div class="api-collection-header">
        <span class="api-collection-icon">📁</span>
        <span class="api-collection-name">My Workspace</span>
        <button class="api-collection-toggle">▼</button>
      </div>
    `;
    return collection;
  }

  loadRequest(request) {
    // Load request into the main panel
    document.getElementById('apiMethod').value = request.method;
    document.getElementById('apiUrl').value = request.url;
  }

  showInputDialog(message, defaultValue = '') {
    // Simple synchronous input using a temporary input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.placeholder = message;
    input.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      padding: 8px 12px;
      border: 2px solid #6366f1;
      border-radius: 6px;
      font-size: 14px;
      background: var(--paper-bg);
      color: var(--toolbar-fg);
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    `;
    
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(input);
    input.focus();
    input.select();
    
    return new Promise((resolve) => {
      const cleanup = () => {
        document.body.removeChild(backdrop);
        document.body.removeChild(input);
      };
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const value = input.value.trim();
          cleanup();
          resolve(value || null);
        } else if (e.key === 'Escape') {
          cleanup();
          resolve(null);
        }
      });
      
      backdrop.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });
    });
  }

  toggleCollection(collection) {
    collection.classList.toggle('collapsed');
  }

  loadRequest(element) {
    // Load saved request logic here
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
    return Math.floor(diff / 86400000) + 'd';
  }

  truncateUrl(url) {
    if (url.length <= 40) return url;
    return url.substring(0, 37) + '...';
  }
}

// Initialize API tester when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.apiTester = new APITester();
});
