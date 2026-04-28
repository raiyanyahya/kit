import { _termEsc, _termColorize, _termColorizeAnsi, fuzzyMatch, normPath, getTabName, toUrl, _providerFor, parseMarkdown } from '../src/utils.js';

// ── _termEsc ────────────────────────────────────────────────

describe('_termEsc', () => {
  test('escapes ampersands', () => {
    expect(_termEsc('a & b')).toBe('a &amp; b');
  });
  test('escapes less-than', () => {
    expect(_termEsc('<div>')).toBe('&lt;div&gt;');
  });
  test('leaves plain text untouched', () => {
    expect(_termEsc('hello world')).toBe('hello world');
  });
  test('handles empty string', () => {
    expect(_termEsc('')).toBe('');
  });
});

// ── _termColorize ────────────────────────────────────────────

describe('_termColorize', () => {
  test('wraps $ lines in tc-cmd span', () => {
    expect(_termColorize('$ git status')).toContain('tc-cmd');
  });
  test('wraps ! lines in tc-err span', () => {
    expect(_termColorize('! error occurred')).toContain('tc-err');
  });
  test('wraps [AI] lines in tc-ai span', () => {
    expect(_termColorize('[AI] thinking...')).toContain('tc-ai');
  });
  test('returns empty string for empty input', () => {
    expect(_termColorize('')).toBe('');
  });
  test('delegates to ansi parser when escape codes present', () => {
    const ansi = '\x1b[32mgreen\x1b[0m';
    const result = _termColorize(ansi);
    expect(result).toContain('color:');
  });
});

// ── _termColorizeAnsi ────────────────────────────────────────

describe('_termColorizeAnsi', () => {
  test('wraps green ANSI code in colored span', () => {
    const result = _termColorizeAnsi('\x1b[32mok\x1b[0m');
    expect(result).toContain('color:');
    expect(result).toContain('ok');
  });
  test('closes all open spans on reset', () => {
    const result = _termColorizeAnsi('\x1b[32mtext\x1b[0m');
    const opens = (result.match(/<span/g) || []).length;
    const closes = (result.match(/<\/span>/g) || []).length;
    expect(opens).toBe(closes);
  });
  test('handles bold ANSI code', () => {
    const result = _termColorizeAnsi('\x1b[1mbold\x1b[0m');
    expect(result).toContain('font-weight:bold');
  });
  test('handles bold + color together', () => {
    const result = _termColorizeAnsi('\x1b[1;32mtext\x1b[0m');
    expect(result).toContain('font-weight:bold');
    expect(result).toContain('color:');
  });
  test('escapes HTML inside ANSI output', () => {
    const result = _termColorizeAnsi('\x1b[32m<b>\x1b[0m');
    expect(result).not.toContain('<b>');
    expect(result).toContain('&lt;b&gt;');
  });
});

// ── fuzzyMatch ────────────────────────────────────────────────

describe('fuzzyMatch', () => {
  test('returns positive score for exact match', () => {
    expect(fuzzyMatch('abc', 'abc')).toBeGreaterThan(0);
  });
  test('returns positive score for subsequence match', () => {
    expect(fuzzyMatch('ac', 'abc')).toBeGreaterThan(0);
  });
  test('returns -1 when no match', () => {
    expect(fuzzyMatch('xyz', 'abc')).toBe(-1);
  });
  test('is case-insensitive', () => {
    expect(fuzzyMatch('ABC', 'abc')).toBeGreaterThan(0);
  });
  test('returns -1 for empty query against empty string', () => {
    expect(fuzzyMatch('a', '')).toBe(-1);
  });
});

// ── normPath ─────────────────────────────────────────────────

describe('normPath', () => {
  test('resolves double dots', () => {
    expect(normPath('/foo/bar/../baz')).toBe('/foo/baz');
  });
  test('removes single dots', () => {
    expect(normPath('/foo/./bar')).toBe('/foo/bar');
  });
  test('preserves leading slash', () => {
    expect(normPath('/foo/bar')).toBe('/foo/bar');
  });
  test('handles relative paths', () => {
    expect(normPath('foo/bar')).toBe('foo/bar');
  });
  test('handles multiple consecutive slashes via empty segments', () => {
    expect(normPath('/foo//bar')).toBe('/foo/bar');
  });
  test('clamps to root when going above it', () => {
    expect(normPath('/foo/../../bar')).toBe('/bar');
  });
  test('handles trailing slash by ignoring empty segment', () => {
    expect(normPath('/foo/bar/')).toBe('/foo/bar');
  });
});

// ── getTabName ───────────────────────────────────────────────

describe('getTabName', () => {
  test('returns filename from unix path', () => {
    expect(getTabName('/home/user/project/index.js')).toBe('index.js');
  });
  test('returns filename from windows path', () => {
    expect(getTabName('C:\\Users\\user\\file.txt')).toBe('file.txt');
  });
  test('returns untitled.txt for empty input', () => {
    expect(getTabName('')).toBe('untitled.txt');
  });
  test('returns untitled.txt for null', () => {
    expect(getTabName(null)).toBe('untitled.txt');
  });
  test('returns filename with no directory', () => {
    expect(getTabName('README.md')).toBe('README.md');
  });
});

// ── toUrl ────────────────────────────────────────────────────

describe('toUrl', () => {
  test('returns empty string for empty input', () => {
    expect(toUrl('')).toBe('');
  });
  test('passes through full https URL unchanged', () => {
    expect(toUrl('https://example.com')).toBe('https://example.com');
  });
  test('prepends https to bare domain', () => {
    expect(toUrl('example.com')).toBe('https://example.com');
  });
  test('converts plain search term to duckduckgo URL', () => {
    expect(toUrl('how to center a div')).toContain('duckduckgo.com');
  });
  test('treats localhost:3000 as a search term (no dot in hostname)', () => {
    expect(toUrl('localhost:3000')).toContain('duckduckgo.com');
  });
  test('passes through http URL unchanged', () => {
    expect(toUrl('http://example.com')).toBe('http://example.com');
  });
  test('passes through file:// URLs unchanged', () => {
    expect(toUrl('file:///home/user/index.html')).toBe('file:///home/user/index.html');
  });
  test('passes through about:blank unchanged', () => {
    expect(toUrl('about:blank')).toBe('about:blank');
  });
  test('encodes special characters in search queries', () => {
    const result = toUrl('hello world');
    expect(result).toContain('hello%20world');
  });
});

// ── _providerFor ─────────────────────────────────────────────

describe('_providerFor', () => {
  test('returns anthropic for claude models', () => {
    expect(_providerFor('claude-sonnet-4-6')).toBe('anthropic');
    expect(_providerFor('claude-opus-4-7')).toBe('anthropic');
    expect(_providerFor('claude-haiku-4-5-20251001')).toBe('anthropic');
  });
  test('returns openai for gpt models', () => {
    expect(_providerFor('gpt-5.4')).toBe('openai');
    expect(_providerFor('gpt-4.1-mini')).toBe('openai');
  });
  test('returns openai for o-series models', () => {
    expect(_providerFor('o3')).toBe('openai');
    expect(_providerFor('o4-mini')).toBe('openai');
  });
});

// ── parseMarkdown ────────────────────────────────────────────

describe('parseMarkdown', () => {
  test('converts # heading to h1', () => {
    expect(parseMarkdown('# Hello')).toContain('<h1>Hello</h1>');
  });
  test('converts ## heading to h2', () => {
    expect(parseMarkdown('## Hello')).toContain('<h2>Hello</h2>');
  });
  test('converts **text** to strong', () => {
    expect(parseMarkdown('**bold**')).toContain('<strong>bold</strong>');
  });
  test('converts *text* to em', () => {
    expect(parseMarkdown('*italic*')).toContain('<em>italic</em>');
  });
  test('converts ***text*** to strong+em', () => {
    expect(parseMarkdown('***both***')).toContain('<strong><em>both</em></strong>');
  });
  test('converts backtick code to code tag', () => {
    expect(parseMarkdown('`code`')).toContain('<code>code</code>');
  });
  test('converts triple-backtick block to pre+code', () => {
    expect(parseMarkdown('```\nconst x = 1;\n```')).toContain('<pre><code>');
  });
  test('converts > blockquote', () => {
    expect(parseMarkdown('> note')).toContain('<blockquote>note</blockquote>');
  });
  test('converts unordered list item', () => {
    expect(parseMarkdown('- item')).toContain('<li>item</li>');
  });
  test('converts ordered list item', () => {
    expect(parseMarkdown('1. first')).toContain('<li>first</li>');
  });
  test('blocks javascript: links', () => {
    const result = parseMarkdown('[click](javascript:alert(1))');
    expect(result).toContain('href="#"');
  });
  test('blocks data: links', () => {
    const result = parseMarkdown('[x](data:text/html,<h1>xss</h1>)');
    expect(result).toContain('href="#"');
  });
  test('escapes raw HTML to prevent XSS', () => {
    expect(parseMarkdown('<script>alert(1)</script>')).not.toContain('<script>');
  });
  test('returns cached result on second call', () => {
    const input = 'cached input test';
    const first = parseMarkdown(input);
    const second = parseMarkdown(input);
    expect(first).toBe(second);
  });
});
