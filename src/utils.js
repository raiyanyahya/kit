// Pure utility functions extracted for testability

export function _termEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function _termColorizeAnsi(raw) {
  const C = { '30': '#555', '31': '#f87171', '32': '#4ade80', '33': '#fbbf24', '34': '#60a5fa', '35': '#c084fc', '36': '#34d399', '37': '#d1d5db', '90': '#6b7280', '91': '#fca5a5', '92': '#86efac', '93': '#fde68a', '94': '#93c5fd', '95': '#d8b4fe', '96': '#6ee7b7', '97': '#f9fafb' };
  let out = '', depth = 0;
  for (const part of raw.split(/(\x1b\[[0-9;]*m)/)) {
    const m = part.match(/^\x1b\[([0-9;]*)m$/);
    if (m) {
      for (const code of (m[1] || '0').split(';')) {
        if (!code || code === '0') { while (depth-- > 0) out += '</span>'; depth = 0; }
        else if (code === '1') { out += '<span style="font-weight:bold">'; depth++; }
        else if (C[code]) { out += `<span style="color:${C[code]}">`;  depth++; }
      }
    } else { out += _termEsc(part); }
  }
  while (depth-- > 0) out += '</span>';
  return out;
}

export function _termColorize(raw) {
  if (!raw) return '';
  if (/\x1b\[/.test(raw)) return _termColorizeAnsi(raw);
  return raw.split('\n').map(line => {
    if (line.startsWith('$ '))              return `<span class="tc-cmd">${_termEsc(line)}</span>`;
    if (line.startsWith('! '))              return `<span class="tc-err">${_termEsc(line)}</span>`;
    if (line.startsWith('✓ '))             return `<span class="tc-ok">${_termEsc(line)}</span>`;
    if (line.startsWith('→ '))              return `<span class="tc-nav">${_termEsc(line)}</span>`;
    if (line.startsWith('[AI]'))            return `<span class="tc-ai">${_termEsc(line)}</span>`;
    if (line.startsWith('Definitions for')) return `<span class="tc-nav">${_termEsc(line)}</span>`;
    if (line.startsWith('Conversation cleared')) return `<span class="tc-dim">${_termEsc(line)}</span>`;
    if (/^(Saved to|Summarizing:|No text|No definition)/.test(line)) return `<span class="tc-dim">${_termEsc(line)}</span>`;
    return _termEsc(line);
  }).join('\n');
}

export function fuzzyMatch(query, str) {
  let qi = 0, score = 0;
  str = str.toLowerCase(); query = query.toLowerCase();
  for (let i = 0; i < str.length && qi < query.length; i++) {
    if (str[i] === query[qi]) { score++; qi++; }
  }
  return qi === query.length ? score : -1;
}

export function normPath(p) {
  const parts = [];
  for (const seg of p.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') { parts.pop(); continue; }
    parts.push(seg);
  }
  const root = p.startsWith('/') ? '/' : '';
  return root + parts.join('/');
}

export function getTabName(filePath) {
  if (!filePath) return 'untitled.txt';
  return filePath.split(/[\\/]/).pop();
}

export function toUrl(q) {
  if (!q) return '';
  let url = q.trim();
  const looks = /^(https?:\/\/|file:\/\/|about:|chrome:\/\/|\w+\.[\w.-]+(?:\/|$))/i.test(url);
  if (looks) {
    if (!/^https?:\/\//i.test(url) && !/^file:|about:|chrome:/.test(url)) {
      url = 'https://' + url;
    }
    return url;
  }
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(url);
}

export function _providerFor(model) {
  return /^claude-/.test(model) ? 'anthropic' : 'openai';
}

const markdownCache = new Map();
const MARKDOWN_CACHE_MAX = 80;

function _markdownCacheSet(key, value) {
  if (markdownCache.size >= MARKDOWN_CACHE_MAX) {
    markdownCache.delete(markdownCache.keys().next().value);
  }
  markdownCache.set(key, value);
}

export function parseMarkdown(text) {
  if (markdownCache.has(text)) return markdownCache.get(text);
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  let html = escaped
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    .replace(/`([^`\n]+)`/gim, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (_, t, u) => {
      const safe = /^https?:|^#|^\//i.test(u) ? u : '#';
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${t}</a>`;
    })
    .replace(/^\* (.+)$/gim, '<li>$1</li>')
    .replace(/^- (.+)$/gim, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gim, '<li>$2</li>')
    .replace(/(<li>[\s\S]*?<\/li>)(\s*<li>[\s\S]*?<\/li>)*/gim, '<ul>$&</ul>')
    .replace(/^&gt; (.+)$/gim, '<blockquote>$1</blockquote>')
    .replace(/^---$/gim, '<hr>')
    .replace(/\n\n/gim, '\n<PSEP>\n')
    .replace(/\n/gim, '<br>')
    .replace(/\n<PSEP>\n/g, '</p><p>');

  html = '<p>' + html + '</p>';
  html = html.replace(/<p>\s*(<\/(?:h[1-6]|pre|blockquote|hr|ul|ol|table)[^>]*>)/gi, '$1</p>');
  html = html.replace(/(<(?:h[1-6]|pre|blockquote|hr|ul|ol|table)[^>]*>)\s*<\/p>/gi, '<p>$1');
  html = html.replace(/<p><\/p>/gim, '').replace(/<p>\s*<br>\s*<\/p>/gim, '');
  _markdownCacheSet(text, html);
  return html;
}
