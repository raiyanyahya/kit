import { jest } from '@jest/globals';

// Agent tool execution and permission model tests

// Inline the logic we're testing so there's no DOM/renderer dependency
const agentPermissions = { write_file: false, run_command: false };

async function agentExecuteTool(name, argsObj, kit, permissions) {
  if (name === 'write_file' && !permissions.write_file) return 'Denied by user.';
  if (name === 'run_command' && !permissions.run_command) return 'Denied by user.';

  switch (name) {
    case 'read_file': {
      const res = await kit.readFile(argsObj.path);
      if (!res.ok) return `Error: ${res.error}`;
      return res.data;
    }
    case 'write_file': {
      const res = await kit.writeFile(argsObj.path, argsObj.content);
      if (!res.ok) return `Error: ${res.error}`;
      return `Written ${argsObj.path}`;
    }
    case 'list_dir': {
      const res = await kit.list(argsObj.path);
      if (!res.ok) return `Error: ${res.error}`;
      return res.items.map(i => (i.dir ? '[dir] ' : '      ') + i.name).join('\n') || '(empty)';
    }
    case 'run_command': {
      const res = await kit.exec('/tmp', argsObj.command);
      return res.output || '(no output)';
    }
    case 'search_project': {
      const res = await kit.exec('/tmp', `grep -rn '${argsObj.query}' . 2>/dev/null | head -60`);
      return res.output || '(no matches)';
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

async function loadProjectRules(dir, kit) {
  if (!dir) return '';
  for (const name of ['.kitrules', 'AGENT.md']) {
    try {
      const res = await kit.readFile(dir.replace(/\/$/, '') + '/' + name);
      if (res?.ok && res.data?.trim()) return res.data.trim();
    } catch (_) {}
  }
  return '';
}

// ── agentExecuteTool ─────────────────────────────────────────

describe('agentExecuteTool — read_file', () => {
  test('returns file content on success', async () => {
    const kit = { readFile: jest.fn().mockResolvedValue({ ok: true, data: 'file content' }) };
    const result = await agentExecuteTool('read_file', { path: '/foo.js' }, kit, { write_file: true, run_command: true });
    expect(result).toBe('file content');
  });

  test('returns error message when read fails', async () => {
    const kit = { readFile: jest.fn().mockResolvedValue({ ok: false, error: 'not found' }) };
    const result = await agentExecuteTool('read_file', { path: '/missing.js' }, kit, { write_file: true, run_command: true });
    expect(result).toContain('Error:');
  });
});

describe('agentExecuteTool — write_file', () => {
  test('is denied when permission is false', async () => {
    const kit = { writeFile: jest.fn() };
    const result = await agentExecuteTool('write_file', { path: '/out.js', content: 'code' }, kit, { write_file: false, run_command: false });
    expect(result).toBe('Denied by user.');
    expect(kit.writeFile).not.toHaveBeenCalled();
  });

  test('writes file when permission is granted', async () => {
    const kit = { writeFile: jest.fn().mockResolvedValue({ ok: true }) };
    const result = await agentExecuteTool('write_file', { path: '/out.js', content: 'code' }, kit, { write_file: true, run_command: false });
    expect(result).toContain('Written /out.js');
  });
});

describe('agentExecuteTool — run_command', () => {
  test('is denied when permission is false', async () => {
    const kit = { exec: jest.fn() };
    const result = await agentExecuteTool('run_command', { command: 'rm -rf /' }, kit, { write_file: false, run_command: false });
    expect(result).toBe('Denied by user.');
    expect(kit.exec).not.toHaveBeenCalled();
  });

  test('runs command when permission is granted', async () => {
    const kit = { exec: jest.fn().mockResolvedValue({ ok: true, output: 'done' }) };
    const result = await agentExecuteTool('run_command', { command: 'echo hello' }, kit, { write_file: false, run_command: true });
    expect(result).toBe('done');
  });
});

describe('agentExecuteTool — list_dir', () => {
  test('formats directory listing', async () => {
    const kit = {
      list: jest.fn().mockResolvedValue({
        ok: true,
        items: [{ name: 'src', dir: true }, { name: 'index.js', dir: false }]
      })
    };
    const result = await agentExecuteTool('list_dir', { path: '/project' }, kit, { write_file: true, run_command: true });
    expect(result).toContain('[dir] src');
    expect(result).toContain('index.js');
  });
});

// ── loadProjectRules ─────────────────────────────────────────

describe('loadProjectRules', () => {
  test('returns content of .kitrules when it exists', async () => {
    const kit = {
      readFile: jest.fn().mockImplementation((path) => {
        if (path.endsWith('.kitrules')) return Promise.resolve({ ok: true, data: 'use typescript' });
        return Promise.resolve({ ok: false });
      })
    };
    const result = await loadProjectRules('/project', kit);
    expect(result).toBe('use typescript');
  });

  test('falls back to AGENT.md when .kitrules is missing', async () => {
    const kit = {
      readFile: jest.fn().mockImplementation((path) => {
        if (path.endsWith('AGENT.md')) return Promise.resolve({ ok: true, data: 'agent rules' });
        return Promise.resolve({ ok: false });
      })
    };
    const result = await loadProjectRules('/project', kit);
    expect(result).toBe('agent rules');
  });

  test('returns empty string when neither file exists', async () => {
    const kit = { readFile: jest.fn().mockResolvedValue({ ok: false }) };
    const result = await loadProjectRules('/project', kit);
    expect(result).toBe('');
  });

  test('returns empty string when dir is null', async () => {
    const kit = { readFile: jest.fn() };
    const result = await loadProjectRules(null, kit);
    expect(result).toBe('');
    expect(kit.readFile).not.toHaveBeenCalled();
  });
});
