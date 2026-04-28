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
  test('converts backtick code to code tag', () => {
    expect(parseMarkdown('`code`')).toContain('<code>code</code>');
  });
  test('blocks javascript: links', () => {
    const result = parseMarkdown('[click](javascript:alert(1))');
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
