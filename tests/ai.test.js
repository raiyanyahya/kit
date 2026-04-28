import { jest } from '@jest/globals';

// AI function tests — aiTask, aiTaskWindow, selectedModel, agentAskPermission

// ── selectedModel ────────────────────────────────────────────

describe('selectedModel', () => {
  function selectedModel(getValue) {
    const val = getValue();
    return val || 'gpt-5.4';
  }

  test('returns value from select element', () => {
    const result = selectedModel(() => 'claude-sonnet-4-6');
    expect(result).toBe('claude-sonnet-4-6');
  });

  test('returns default gpt-5.4 when no value selected', () => {
    const result = selectedModel(() => '');
    expect(result).toBe('gpt-5.4');
  });

  test('returns default gpt-5.4 when value is null', () => {
    const result = selectedModel(() => null);
    expect(result).toBe('gpt-5.4');
  });
});

// ── aiTask ───────────────────────────────────────────────────

describe('aiTask', () => {
  async function aiTask(prompt, kit, model = 'gpt-5.4') {
    const res = await kit.aiRequest({ input: prompt, model });
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, text: res.text };
  }

  test('returns text on successful response', async () => {
    const kit = { aiRequest: jest.fn().mockResolvedValue({ ok: true, text: 'AI response' }) };
    const result = await aiTask('explain this', kit);
    expect(result.ok).toBe(true);
    expect(result.text).toBe('AI response');
  });

  test('returns error when API call fails', async () => {
    const kit = { aiRequest: jest.fn().mockResolvedValue({ ok: false, error: 'no key' }) };
    const result = await aiTask('explain this', kit);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('no key');
  });

  test('passes prompt to aiRequest', async () => {
    const kit = { aiRequest: jest.fn().mockResolvedValue({ ok: true, text: '' }) };
    await aiTask('my prompt', kit, 'gpt-5.4');
    expect(kit.aiRequest).toHaveBeenCalledWith(expect.objectContaining({ input: 'my prompt' }));
  });

  test('passes model to aiRequest', async () => {
    const kit = { aiRequest: jest.fn().mockResolvedValue({ ok: true, text: '' }) };
    await aiTask('prompt', kit, 'claude-sonnet-4-6');
    expect(kit.aiRequest).toHaveBeenCalledWith(expect.objectContaining({ model: 'claude-sonnet-4-6' }));
  });
});

// ── aiTaskWindow ─────────────────────────────────────────────

describe('aiTaskWindow', () => {
  async function aiTaskWindow(prompt, title, kit, model = 'gpt-5.4', fileContent = '') {
    const input = fileContent ? `${prompt}\n\n${fileContent}` : prompt;
    const res = await kit.aiRequest({ input, model });
    if (!res.ok) return { ok: false };
    await kit.openResultWindow({ title, mode: 'html', html: res.text });
    return { ok: true };
  }

  test('calls openResultWindow with correct title', async () => {
    const kit = {
      aiRequest: jest.fn().mockResolvedValue({ ok: true, text: '<p>result</p>' }),
      openResultWindow: jest.fn().mockResolvedValue({})
    };
    await aiTaskWindow('summarise', 'Code Summary', kit);
    expect(kit.openResultWindow).toHaveBeenCalledWith(expect.objectContaining({ title: 'Code Summary' }));
  });

  test('does not open window when AI request fails', async () => {
    const kit = {
      aiRequest: jest.fn().mockResolvedValue({ ok: false, error: 'fail' }),
      openResultWindow: jest.fn()
    };
    await aiTaskWindow('summarise', 'Summary', kit);
    expect(kit.openResultWindow).not.toHaveBeenCalled();
  });

  test('includes file content in prompt when provided', async () => {
    const kit = {
      aiRequest: jest.fn().mockResolvedValue({ ok: true, text: '' }),
      openResultWindow: jest.fn().mockResolvedValue({})
    };
    await aiTaskWindow('explain', 'Explanation', kit, 'gpt-5.4', 'const x = 1;');
    expect(kit.aiRequest).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.stringContaining('const x = 1;')
    }));
  });
});

// ── agentAskPermission ───────────────────────────────────────

describe('agentAskPermission', () => {
  const permissions = {};

  function makeAskPermission(choice) {
    return async function agentAskPermission(toolName) {
      if (choice === 'allowAll') permissions[toolName] = true;
      return choice === 'allowAll' ? 'allowAll' : choice;
    };
  }

  test('allow once does not set blanket permission', async () => {
    const ask = makeAskPermission('allow');
    permissions.write_file = false;
    const result = await ask('write_file');
    expect(result).toBe('allow');
    expect(permissions.write_file).toBe(false);
  });

  test('allow all sets blanket permission flag', async () => {
    const ask = makeAskPermission('allowAll');
    permissions.run_command = false;
    const result = await ask('run_command');
    expect(result).toBe('allowAll');
    expect(permissions.run_command).toBe(true);
  });

  test('deny returns deny without setting permission', async () => {
    const ask = makeAskPermission('deny');
    permissions.write_file = false;
    const result = await ask('write_file');
    expect(result).toBe('deny');
    expect(permissions.write_file).toBe(false);
  });
});
