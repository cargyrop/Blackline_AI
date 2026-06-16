const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3737;
const DATA_FILE = path.join(__dirname, 'data', 'config.json');
const ALLOWED_PROVIDERS = new Set(['anthropic', 'openai', 'gemini', 'groq', 'openrouter']);
const GEMINI_FALLBACK_MODELS = [
  { id: 'gemini-3.5-flash',      name: 'Gemini 3.5 Flash' },
  { id: 'gemini-2.5-flash',      name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
  { id: 'gemini-2.5-pro',        name: 'Gemini 2.5 Pro' },
];

app.use(cors({
  origin(origin, cb) {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)) return cb(null, true);
    cb(new Error('Origin not allowed'));
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// -- Config persistence --------------------------------------------------------
function loadConfig() {
  if (!fs.existsSync(DATA_FILE)) return { keys: {}, conversations: [] };
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { keys: {}, conversations: [] }; }
}
function saveConfig(cfg) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(cfg, null, 2));
}
function prettyModelName(id) {
  return id
    .replace(/^models\//, '')
    .split('-')
    .map(part => part === 'tts' ? 'TTS' : part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
async function readErrorMessage(response, fallback) {
  try {
    const data = await response.json();
    return data.error?.message || data.message || fallback;
  } catch {
    try { return await response.text() || fallback; }
    catch { return fallback; }
  }
}
function explainProviderError(provider, message) {
  if (provider === 'gemini' && /quota|rate limit|resource_exhausted/i.test(message)) {
    return `${message}\n\nGemini accepted the model request, but the key has hit its current quota/rate limit. Wait for the reset time shown by Google, add billing, or try a different Gemini model/key.`;
  }
  return message;
}
function isAllowedProvider(provider) {
  return ALLOWED_PROVIDERS.has(provider);
}
function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return null;
  return messages
    .filter(m => m && ['user', 'assistant', 'system'].includes(m.role) && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 200000) }));
}
function safeResolve(base, rel) {
  if (!rel || typeof rel !== 'string' || path.isAbsolute(rel)) return null;
  const target = path.resolve(base, rel);
  return target.startsWith(base + path.sep) ? target : null;
}

// -- API Keys ------------------------------------------------------------------
app.get('/api/keys', (req, res) => {
  const cfg = loadConfig();
  const safe = {};
  for (const [k, v] of Object.entries(cfg.keys || {})) {
    safe[k] = v ? '????????' + v.slice(-4) : '';
  }
  res.json(safe);
});

app.post('/api/keys', (req, res) => {
  const { provider, key } = req.body;
  if (!isAllowedProvider(provider)) return res.status(400).json({ error: 'unknown provider' });
  if (!key || typeof key !== 'string' || !key.trim()) return res.status(400).json({ error: 'provider and key required' });
  const cfg = loadConfig();
  cfg.keys = cfg.keys || {};
  cfg.keys[provider] = key.trim();
  saveConfig(cfg);
  res.json({ ok: true });
});

app.delete('/api/keys/:provider', (req, res) => {
  if (!isAllowedProvider(req.params.provider)) return res.status(400).json({ error: 'unknown provider' });
  const cfg = loadConfig();
  delete (cfg.keys || {})[req.params.provider];
  saveConfig(cfg);
  res.json({ ok: true });
});

// -- Model discovery -----------------------------------------------------------
app.get('/api/models', async (req, res) => {
  const cfg = loadConfig();
  const keys = cfg.keys || {};
  const models = [];

  // Anthropic
  if (keys.anthropic) {
    models.push(
      { id: 'claude-fable-5',     name: 'Claude Fable 5',     provider: 'anthropic', icon: '[A]' },
      { id: 'claude-opus-4-8',    name: 'Claude Opus 4.8',    provider: 'anthropic', icon: '[A]' },
      { id: 'claude-sonnet-4-6',  name: 'Claude Sonnet 4.6',  provider: 'anthropic', icon: '[A]' },
      { id: 'claude-haiku-4-5',   name: 'Claude Haiku 4.5',   provider: 'anthropic', icon: '[A]' },
    );
  }

  // OpenAI
  if (keys.openai) {
    try {
      const r = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${keys.openai}` },
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const data = await r.json();
        const chat = data.data
          .filter(m => m.id.startsWith('gpt') || /^o\d/.test(m.id))
          .filter(m => !/image|audio|realtime|transcribe|tts|embedding|moderation/i.test(m.id))
          .sort((a, b) => b.created - a.created)
          .slice(0, 12);
        chat.forEach(m => models.push({ id: m.id, name: m.id, provider: 'openai', icon: '[O]' }));
      }
    } catch { /* skip */ }
  }

  // Google Gemini
  if (keys.gemini) {
    try {
      const discovered = [];
      let pageToken = '';
      do {
        const params = new URLSearchParams({ key: keys.gemini, pageSize: '1000' });
        if (pageToken) params.set('pageToken', pageToken);
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?${params}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) throw new Error(await readErrorMessage(r, 'Could not list Gemini models'));

        const data = await r.json();
        (data.models || [])
          .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
          .filter(m => !/embedding|tts|image|veo|lyria|live|aqa/i.test(`${m.name} ${m.displayName}`))
          .forEach(m => {
            const id = (m.name || m.baseModelId || '').replace(/^models\//, '');
            if (!id || discovered.some(existing => existing.id === id)) return;
            discovered.push({
              id,
              name: m.displayName || prettyModelName(id),
              provider: 'gemini',
              icon: '[G]',
            });
          });
        pageToken = data.nextPageToken || '';
      } while (pageToken);

      const preferredOrder = [
        'gemini-3.5-flash',
        'gemini-3.1-pro',
        'gemini-3-flash',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro',
      ];
      discovered.sort((a, b) => {
        const ai = preferredOrder.indexOf(a.id);
        const bi = preferredOrder.indexOf(b.id);
        if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        return a.name.localeCompare(b.name);
      });
      models.push(...discovered.slice(0, 12));
    } catch {
      GEMINI_FALLBACK_MODELS.forEach(m =>
        models.push({ ...m, provider: 'gemini', icon: '[G]' })
      );
    }
  }

  // Groq
  if (keys.groq) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${keys.groq}` },
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const data = await r.json();
        data.data
          .filter(m => !/whisper|tts|audio|embedding|guard|moderation/i.test(m.id))
          .forEach(m => models.push({ id: m.id, name: m.id, provider: 'groq', icon: '[Q]' }));
      }
    } catch { /* skip */ }
  }

  // OpenRouter
  if (keys.openrouter) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${keys.openrouter}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error('OpenRouter models request failed');
      const data = await r.json();
      const preferred = ['openai/', 'anthropic/', 'google/', 'meta-llama/', 'deepseek/', 'mistralai/'];
      (data.data || [])
        .filter(m => preferred.some(prefix => m.id?.startsWith(prefix)))
        .filter(m => !/image|audio|embedding|moderation|tts|whisper/i.test(`${m.id} ${m.name}`))
        .slice(0, 20)
        .forEach(m => models.push({ id: m.id, provider: 'openrouter', name: `${m.name || m.id} (OR)`, icon: '[R]' }));
    } catch {
      models.push(
        { id: 'openai/gpt-4o',                    provider: 'openrouter', name: 'GPT-4o (via OpenRouter)',       icon: '[R]' },
        { id: 'anthropic/claude-sonnet-4',         provider: 'openrouter', name: 'Claude Sonnet 4 (OR)',          icon: '[R]' },
        { id: 'google/gemini-2.5-flash',           provider: 'openrouter', name: 'Gemini 2.5 Flash (OR)',        icon: '[R]' },
        { id: 'meta-llama/llama-3.3-70b-instruct', provider: 'openrouter', name: 'Llama 3.3 70B (OR)',           icon: '[R]' },
        { id: 'deepseek/deepseek-chat',            provider: 'openrouter', name: 'DeepSeek Chat (OR)',           icon: '[R]' },
      );
    }
  }

  // Ollama (local)
  try {
    const r = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(1500) });
    if (r.ok) {
      const data = await r.json();
      (data.models || []).forEach(m =>
        models.push({ id: m.name, name: m.name, provider: 'ollama', icon: '[L]', local: true })
      );
    }
  } catch { /* Ollama not running */ }

  res.json(models);
});

// -- Chat ----------------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  const { provider, model, systemPrompt } = req.body;
  const messages = sanitizeMessages(req.body.messages);
  const safeSystemPrompt = typeof systemPrompt === 'string' ? systemPrompt.slice(0, 200000) : '';
  const cfg = loadConfig();
  const keys = cfg.keys || {};

  if (!['anthropic', 'openai', 'gemini', 'groq', 'openrouter', 'ollama'].includes(provider)) {
    return res.status(400).json({ error: 'unknown provider' });
  }
  if (!model || typeof model !== 'string') return res.status(400).json({ error: 'model required' });
  if (!messages) return res.status(400).json({ error: 'messages must be an array' });
  if (provider !== 'ollama' && !keys[provider]) return res.status(400).json({ error: `${provider} API key is not configured` });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    if (provider === 'anthropic') {
      const body = {
        model,
        max_tokens: 4096,
        stream: true,
        messages: messages.filter(m => m.role !== 'system'),
      };
      if (safeSystemPrompt) body.system = safeSystemPrompt;

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': keys.anthropic,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      });
      if (!r.ok) {
        send({ error: await readErrorMessage(r, 'Anthropic error') });
        return res.end();
      }
      for await (const chunk of r.body) {
        const lines = Buffer.from(chunk).toString().split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === 'content_block_delta' && d.delta?.text) send({ text: d.delta.text });
            if (d.type === 'message_stop') send({ done: true });
          } catch { /* skip */ }
        }
      }

    } else if (provider === 'openai' || provider === 'groq' || provider === 'openrouter') {
      const endpoints = {
        openai:     'https://api.openai.com/v1/chat/completions',
        groq:       'https://api.groq.com/openai/v1/chat/completions',
        openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      };
      const msgs = safeSystemPrompt
        ? [{ role: 'system', content: safeSystemPrompt }, ...messages]
        : messages;

      const r = await fetch(endpoints[provider], {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${keys[provider]}`,
          'Content-Type': 'application/json',
          ...(provider === 'openrouter' ? { 'HTTP-Referer': 'http://localhost:3737' } : {}),
        },
        body: JSON.stringify({ model, messages: msgs, stream: true }),
        signal: AbortSignal.timeout(120000),
      });
      if (!r.ok) {
        send({ error: await readErrorMessage(r, `${provider} error`) });
        return res.end();
      }
      for await (const chunk of r.body) {
        const lines = Buffer.from(chunk).toString().split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
          try {
            const d = JSON.parse(line.slice(6));
            const text = d.choices?.[0]?.delta?.content;
            if (text) send({ text });
            if (d.choices?.[0]?.finish_reason) send({ done: true });
          } catch { /* skip */ }
        }
      }

    } else if (provider === 'gemini') {
      const msgs = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const body = { contents: msgs };
      if (safeSystemPrompt) body.systemInstruction = { parts: [{ text: safeSystemPrompt }] };

      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?key=${keys.gemini}&alt=sse`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) }
      );
      if (!r.ok) {
        const message = await readErrorMessage(r, 'Gemini error');
        send({ error: explainProviderError('gemini', message) });
        return res.end();
      }
      for await (const chunk of r.body) {
        const lines = Buffer.from(chunk).toString().split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const d = JSON.parse(line.slice(6));
            const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) send({ text });
            if (d.candidates?.[0]?.finishReason) send({ done: true });
          } catch { /* skip */ }
        }
      }

    } else if (provider === 'ollama') {
      const msgs = safeSystemPrompt
        ? [{ role: 'system', content: safeSystemPrompt }, ...messages]
        : messages;
      const r = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: msgs, stream: true }),
        signal: AbortSignal.timeout(120000),
      });
      if (!r.ok) {
        send({ error: 'Ollama request failed' });
        return res.end();
      }
      for await (const chunk of r.body) {
        const lines = Buffer.from(chunk).toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const d = JSON.parse(line);
            if (d.message?.content) send({ text: d.message.content });
            if (d.done) send({ done: true });
          } catch { /* skip */ }
        }
      }
    } else {
      send({ error: `Unknown provider: ${provider}` });
    }
  } catch (err) {
    send({ error: err.message });
  }
  res.end();
});

// -- Self-update ---------------------------------------------------------------
app.post('/api/update', async (req, res) => {
  const { featureRequest } = req.body;
  if (!featureRequest) return res.status(400).json({ error: 'featureRequest required' });

  const appDir = __dirname;
  const parentDir = path.dirname(appDir);
  const appName = path.basename(appDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(parentDir, `${appName}-backup-${timestamp}`);

  // Step 1: backup
  try {
    fs.cpSync(appDir, backupDir, { recursive: true });
  } catch (err) {
    return res.status(500).json({ error: `Backup failed: ${err.message}` });
  }

  // Step 2: call Claude to generate the patch
  const cfg = loadConfig();
  const anthropicKey = cfg.keys?.anthropic;
  if (!anthropicKey) {
    return res.status(400).json({ error: 'An Anthropic API key is required for the update feature. Add one in Settings.' });
  }

  // Read current file contents
  const readDir = (dir, base = '') => {
    const results = [];
    for (const entry of fs.readdirSync(dir)) {
      if (['node_modules', '.git', 'data'].includes(entry)) continue;
      const full = path.join(dir, entry);
      const rel = path.join(base, entry);
      if (fs.statSync(full).isDirectory()) results.push(...readDir(full, rel));
      else results.push({ path: rel, content: fs.readFileSync(full, 'utf8') });
    }
    return results;
  };

  let files;
  try { files = readDir(appDir); } catch (e) {
    return res.status(500).json({ error: `Could not read app files: ${e.message}` });
  }

  const filesDump = files.map(f => `=== FILE: ${f.path} ===\n${f.content}`).join('\n\n');

  const prompt = `You are an expert Node.js / HTML / CSS / JS developer. You are given the full source code of a local AI chat application and a feature request. Your job is to output a JSON array of file patches to apply.

FEATURE REQUEST: ${featureRequest}

CURRENT SOURCE CODE:
${filesDump}

OUTPUT RULES:
- Respond ONLY with a valid JSON array, no markdown, no explanation.
- Each element: { "path": "relative/path/from/app/root", "content": "full new file content as string" }
- Only include files that need to change or new files to create.
- Preserve all existing functionality unless explicitly asked to remove something.
- Use the same code style as the existing files.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(180000),
    });

    if (!r.ok) {
      return res.status(500).json({ error: `Claude API error: ${await readErrorMessage(r, 'Claude request failed')}`, backupDir });
    }

    const data = await r.json();
    const raw = data.content?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();

    let patches;
    try { patches = JSON.parse(clean); }
    catch { return res.status(500).json({ error: 'Could not parse patch JSON from Claude response', raw, backupDir }); }
    if (!Array.isArray(patches)) {
      return res.status(500).json({ error: 'Patch response was not an array', raw, backupDir });
    }

    // Apply patches
    const applied = [];
    for (const patch of patches) {
      const target = safeResolve(appDir, patch.path);
      if (!target || typeof patch.content !== 'string') {
        return res.status(500).json({ error: `Unsafe or invalid patch path: ${patch.path}`, backupDir, applied });
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, patch.content, 'utf8');
      applied.push(patch.path);
    }

    res.json({ ok: true, backupDir, applied, message: `Backup saved to ${backupDir}. ${applied.length} file(s) updated. Reload the page to see changes.` });
  } catch (err) {
    res.status(500).json({ error: err.message, backupDir });
  }
});

// -- Serve index for all other routes -----------------------------------------
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log(`\n[OK]  AI Chat running at ? http://localhost:${PORT}\n`);
  // Try to open browser automatically
  if (!process.env.NO_OPEN_BROWSER) {
    const url = `http://localhost:${PORT}`;
    const cmd = process.platform === 'win32' ? `start ${url}` :
                 process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
    exec(cmd, () => {});
  }
});
