const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { safeResolve, readErrorMessage, joinUrl, getCustomProvider } = require('../utils');
const { loadConfig, saveConfig } = require('../config');
const { readFileTree, readFileMap, readFilesByPaths } = require('./fileTree');

const execAsync = promisify(exec);

const MAX_BACKUPS_TO_KEEP = 5;
const MAX_PLAN_ITEMS = 25;
const EVOLVE_EXECUTION_TIMEOUT_MS = 15 * 60 * 1000;

function cleanupOldBackups(parentDir, appName, currentBackupDir) {
  try {
    const entries = fs.readdirSync(parentDir)
      .filter(name => name.startsWith(`${appName}-backup-`))
      .map(name => ({ name, full: path.join(parentDir, name), mtime: fs.statSync(path.join(parentDir, name)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);
    const toDelete = entries.slice(MAX_BACKUPS_TO_KEEP).filter(e => e.full !== currentBackupDir);
    for (const e of toDelete) {
      try { fs.rmSync(e.full, { recursive: true, force: true }); } catch {}
    }
    return toDelete.length;
  } catch {
    return 0;
  }
}

function stripGeneratedFileContent(text, filePath) {
  let out = String(text || '').replace(/\r\n/g, '\n').trim();
  const fenced = out.match(/^```[\w-]*\n([\s\S]*?)\n```\s*$/);
  if (fenced) out = fenced[1].trim();
  out = out.replace(/^=== FILE:\s*.+?\s*===\n/i, '').trim();
  out = out.replace(/\n```\s*$/g, '').trim();
  return out;
}

function extractJsonObject(text) {
  let cleaned = String(text || '').replace(/\s*<think>[\s\S]*?<\/think>\s*/gi, '').trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) cleaned = fence[1].trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
  return JSON.parse(cleaned);
}

function applySearchReplacePatch(original, changes, filePath) {
  if (!Array.isArray(changes) || changes.length === 0) {
    throw new Error(`Edit patch for ${filePath} did not include any changes`);
  }
  let content = original;
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i] || {};
    if (typeof change.search !== 'string' || typeof change.replace !== 'string' || !change.search) {
      throw new Error(`Change ${i + 1} for ${filePath} must include non-empty search and replacement strings`);
    }
    const first = content.indexOf(change.search);
    if (first === -1) {
      throw new Error(`Search block ${i + 1} was not found in ${filePath}. The model must use exact current text with enough surrounding context.`);
    }
    if (content.indexOf(change.search, first + change.search.length) !== -1) {
      throw new Error(`Search block ${i + 1} matched multiple locations in ${filePath}. The model must include more surrounding context.`);
    }
    content = content.slice(0, first) + change.replace + content.slice(first + change.search.length);
  }
  return content;
}

async function streamModelText(port, provider, model, prompt, onText, cfg, sendEvent) {
  const keys = cfg.keys || {};
  const customProvider = getCustomProvider(cfg, provider);
  const addedEndpoint = (cfg.endpoints || []).find(e => e.id === provider && e.enabled !== false);
  const endpointType = addedEndpoint?.providerType || addedEndpoint?.id || provider;
  let textResult = '';
  const push = (txt) => {
    if (!txt) return;
    textResult += txt;
    onText(txt);
  };

  if (provider === 'anthropic' || (addedEndpoint && endpointType === 'anthropic')) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': addedEndpoint ? addedEndpoint.apiKey : keys.anthropic,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 16384,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(EVOLVE_EXECUTION_TIMEOUT_MS),
    });
    if (!r.ok) throw new Error(`Anthropic API error: ${await readErrorMessage(r, 'Execution failed')}`);
    for await (const chunk of r.body) {
      const lines = Buffer.from(chunk).toString().split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const d = JSON.parse(line.slice(6));
          if (d.type === 'content_block_delta' && d.delta?.text) push(d.delta.text);
        } catch { /* skip */ }
      }
    }
    return textResult;
  }

  if (provider === 'openai' || provider === 'groq' || provider === 'openrouter' || provider === 'deepseek' || customProvider || (addedEndpoint && !['anthropic', 'gemini', 'ollama'].includes(endpointType))) {
    const endpoints = {
      openai: 'https://api.openai.com/v1/chat/completions',
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/v1/chat/completions',
    };
    const endpoint = addedEndpoint
      ? joinUrl(addedEndpoint.baseUrl, addedEndpoint.chatPath || '/chat/completions')
      : customProvider ? joinUrl(customProvider.baseUrl, customProvider.chatPath || '/chat/completions') : endpoints[provider];
    const authKey = addedEndpoint ? addedEndpoint.apiKey : customProvider ? customProvider.apiKey : keys[provider];
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authKey}`,
        'Content-Type': 'application/json',
        ...(provider === 'openrouter' || endpointType === 'openrouter' ? { 'HTTP-Referer': 'http://localhost:3737', 'X-Title': 'BLACKLINE AI' } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      }),
      signal: AbortSignal.timeout(EVOLVE_EXECUTION_TIMEOUT_MS),
    });
    if (!r.ok) throw new Error(`${provider} API error: ${await readErrorMessage(r, 'Execution failed')}`);
    for await (const chunk of r.body) {
      const lines = Buffer.from(chunk).toString().split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
        try {
          const d = JSON.parse(line.slice(6));
          const txt = d.choices?.[0]?.delta?.content;
          if (txt) push(txt);
        } catch { /* skip */ }
      }
    }
    return textResult;
  }

  if (provider === 'gemini' || (addedEndpoint && endpointType === 'gemini')) {
    const callGemini = async (targetModel) => {
      let geminiText = '';
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(targetModel)}:streamGenerateContent?key=${addedEndpoint ? addedEndpoint.apiKey : keys.gemini}&alt=sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
          signal: AbortSignal.timeout(EVOLVE_EXECUTION_TIMEOUT_MS)
        }
      );
      if (!r.ok) {
        const msg = await readErrorMessage(r, 'Gemini API error');
        throw new Error(msg);
      }
      for await (const chunk of r.body) {
        const lines = Buffer.from(chunk).toString().split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const d = JSON.parse(line.slice(6));
            const txt = d.candidates?.[0]?.content?.parts?.[0]?.text;
            if (txt) { geminiText += txt; push(txt); }
          } catch { /* skip */ }
        }
      }
      return geminiText;
    };
    try {
      await callGemini(model);
    } catch (err) {
      if (/high demand|overloaded|429|503|400/i.test(err.message)) {
        if (sendEvent) sendEvent({ type: 'info', message: `${model} overloaded. Retrying with gemini-1.5-flash...` });
        await callGemini('gemini-1.5-flash');
      } else {
        throw err;
      }
    }
    return textResult;
  }

  if (provider === 'ollama') {
    const r = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], stream: true }),
      signal: AbortSignal.timeout(EVOLVE_EXECUTION_TIMEOUT_MS)
    });
    if (!r.ok) throw new Error('Ollama local execution request failed');
    for await (const chunk of r.body) {
      const lines = Buffer.from(chunk).toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const d = JSON.parse(line);
          if (d.message?.content) push(d.message.content);
        } catch { /* skip */ }
      }
    }
    return textResult;
  }

  throw new Error(`Unknown provider for execution: ${provider}`);
}

async function runTests() {
  try {
    const { stdout, stderr } = await execAsync('npm test', { timeout: 30000, cwd: path.resolve(__dirname, '..', '..') });
    return { passed: true, stdout, stderr };
  } catch (err) {
    return { passed: false, stdout: err.stdout || '', stderr: err.stderr || '', error: err.message };
  }
}

async function executePlan(port, req, res) {
  const { provider, model, plan } = req.body;
  if (!provider || !model) return res.status(400).json({ error: 'provider and model required' });
  if (!Array.isArray(plan) || plan.length === 0) return res.status(400).json({ error: 'plan must be a non-empty array' });
  if (plan.length > MAX_PLAN_ITEMS) return res.status(400).json({ error: `Plan is too large (${plan.length} items, max ${MAX_PLAN_ITEMS}). Split it into smaller updates.` });

  const cfg = loadConfig();
  const keys = cfg.keys || {};
  const customProvider = getCustomProvider(cfg, provider);
  const addedEndpoint = (cfg.endpoints || []).find(e => e.id === provider && e.enabled !== false && e.apiKey);
  if (provider !== 'ollama' && !customProvider && !addedEndpoint && !keys[provider]) {
    return res.status(400).json({ error: `A valid ${provider} API key is required in Settings.` });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const appDir = path.resolve(__dirname, '..', '..');
  const parentDir = path.dirname(appDir);
  const appName = path.basename(appDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(parentDir, `${appName}-backup-${timestamp}`);

  try {
    fs.cpSync(appDir, backupDir, {
      recursive: true,
      filter: (src) => {
        const basename = path.basename(src);
        return !['node_modules', '.git', 'data', '.arena', '.cache'].includes(basename);
      }
    });
    const pruned = cleanupOldBackups(parentDir, appName, backupDir);
    send({ type: 'backup', dir: backupDir, prunedOldBackups: pruned });
  } catch (err) {
    send({ type: 'error', message: 'Backup failed: ' + err.message });
    return res.end();
  }

  // Smart file loading: only read files that are in the plan + a lightweight manifest
  const planPaths = plan
    .filter(item => item && typeof item.path === 'string')
    .map(item => item.path.trim());

  let allFileMap, planFiles;
  try {
    allFileMap = readFileMap(appDir);
    planFiles = readFilesByPaths(appDir, planPaths);
  } catch (e) {
    send({ type: 'error', message: `Could not read app files: ${e.message}` });
    return res.end();
  }

  const renderManifest = () => allFileMap.map(f => `  ${f.path} (${f.lines} lines)`).join('\n');
  const renderFilesDump = () => {
    const manifest = `CODEBASE MANIFEST (all files, paths + line counts):\n${renderManifest()}\n\n`;
    const targets = planFiles.length
      ? planFiles.map(f => `=== FILE: ${f.path} ===\n${f.content}`).join('\n\n')
      : '';
    return manifest + (targets ? '\n--- TARGET FILES IN THIS PLAN ---\n\n' + targets : '');
  };
  let filesDump = renderFilesDump();

  try {
    const applied = [];
    const failed = [];
    const recordFailure = (pathValue, errorValue) => {
      const failure = { path: pathValue || '(missing path)', error: String(errorValue || 'Unknown error') };
      failed.push(failure);
      send({ type: 'file_error', path: failure.path, error: failure.error });
    };

    for (let i = 0; i < plan.length; i++) {
      const item = plan[i] || {};
      const filePath = String(item.path || '').trim();
      const action = String(item.action || 'edit').toLowerCase();
      const target = safeResolve(appDir, filePath);

      if (!target || !['create', 'edit', 'delete'].includes(action)) {
        recordFailure(filePath || '(missing path)', 'Unsafe path or invalid action');
        continue;
      }

      send({ type: 'chunk', text: `\n\n---\n[${i + 1}/${plan.length}] ${action.toUpperCase()} ${filePath}\n` });

      if (action === 'delete') {
        if (fs.existsSync(target)) fs.unlinkSync(target);
        applied.push({ path: filePath, action });
        send({ type: 'file_complete', path: filePath, action });
        continue;
      }

      const existingContent = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
      if (action === 'edit' && !fs.existsSync(target)) {
        recordFailure(filePath, 'Cannot edit a missing file. Use create instead.');
        continue;
      }

      let generated;

      if (action === 'edit') {
        const patchPrompt = `You are executing ONE approved BLACKLINE AI edit action.

TARGET FILE: ${filePath}
ACTION: edit
DESCRIPTION: ${item.description || ''}

CURRENT TARGET FILE CONTENT:
=== FILE: ${filePath} ===
${existingContent}

OUTPUT RULES:
- Respond ONLY with one valid RFC 8259 JSON object. No markdown, no explanation.
- The first character must be { and the last character must be }.
- Every property name MUST be double-quoted: "path", "action", "changes", "search", "replace".
- Every string value MUST be double-quoted and internal quotes/newlines MUST be JSON-escaped.
- Prefer targeted edits. Use this exact shape:
  { "path": "${filePath}", "action": "edit", "changes": [ { "search": "exact unique current text", "replace": "replacement text" } ] }
- Each search string must match the current file exactly and must be unique. Include enough surrounding context.
- Do NOT output JavaScript object literals, unquoted strings, trailing commas, or comments.
- Do NOT rewrite the whole file unless a targeted patch is genuinely impractical.
- If a full rewrite is genuinely necessary, use: { "path": "${filePath}", "action": "edit", "content": "complete final file content" }
- Preserve all unrelated behavior.`;

        let patchText = await streamModelText(port, provider, model, patchPrompt, txt => send({ type: 'chunk', text: txt }), cfg, send);
        let patch;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            patch = extractJsonObject(patchText);
            break;
          } catch (err) {
            if (attempt === 1) {
              recordFailure(filePath, 'Could not parse edit patch JSON after repair attempt: ' + err.message);
              break;
            }
            send({ type: 'info', message: `Patch JSON for ${filePath} was invalid. Asking model to repair JSON only...` });
            const repairPrompt = `The previous response was not valid JSON and could not be parsed.\n\nParse error: ${err.message}\n\nInvalid response:\n${patchText}\n\nReturn ONLY one valid JSON object for this exact edit action. Do not explain. Use double-quoted property names and JSON-escaped string values. Target file: ${filePath}.`;
            patchText = await streamModelText(port, provider, model, repairPrompt, txt => send({ type: 'chunk', text: txt }), cfg, send);
          }
        }
        if (!patch) continue;

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (Array.isArray(patch.changes) && patch.changes.length > 0) {
              generated = applySearchReplacePatch(existingContent, patch.changes, filePath);
            } else if (typeof patch.content === 'string') {
              generated = patch.content;
              send({ type: 'chunk', text: `\n[Full rewrite fallback used for ${filePath}]\n` });
            } else {
              throw new Error('Patch must include either changes[] or content');
            }
            break;
          } catch (err) {
            if (attempt === 1) {
              recordFailure(filePath, err.message);
              break;
            }
            send({ type: 'info', message: `Patch for ${filePath} did not apply. Asking model for one corrected patch...` });
            const retryPrompt = `${patchPrompt}\n\nThe previous JSON patch was valid JSON but failed to apply.\nApply error: ${err.message}\n\nPrevious patch JSON:\n${JSON.stringify(patch)}\n\nRe-read the CURRENT TARGET FILE CONTENT above and return ONLY one corrected valid JSON object. Do not explain.`;
            const retryText = await streamModelText(port, provider, model, retryPrompt, txt => send({ type: 'chunk', text: txt }), cfg, send);
            try { patch = extractJsonObject(retryText); }
            catch (parseErr) {
              recordFailure(filePath, 'Could not parse corrected edit patch JSON: ' + parseErr.message);
              break;
            }
          }
        }
        if (!generated) continue;
      } else {
        const filePrompt = `You are executing ONE approved BLACKLINE AI file creation action.

TARGET FILE: ${filePath}
ACTION: create
DESCRIPTION: ${item.description || ''}

CODEBASE CONTEXT:
${filesDump}

OUTPUT RULES:
- Output ONLY the complete final content for TARGET FILE.
- Do not output the file path marker.
- Do not wrap the content in markdown fences unless those fences are literally part of the file content.
- Do not explain what you changed.
- For Markdown documentation files, write useful complete Markdown content.`;

        generated = await streamModelText(port, provider, model, filePrompt, txt => send({ type: 'chunk', text: txt }), cfg, send);
        generated = stripGeneratedFileContent(generated, filePath);
      }

      if (!generated || !generated.trim()) {
        recordFailure(filePath, 'Model returned empty file content');
        continue;
      }

      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, generated, 'utf8');
      applied.push({ path: filePath, action });
      send({ type: 'file_complete', path: filePath, action });

      const existingIdx = planFiles.findIndex(f => f.path === filePath);
      if (existingIdx >= 0) planFiles[existingIdx].content = generated;
      else planFiles.push({ path: filePath, content: generated });
      filesDump = renderFilesDump();
    }

    // Run tests after applying all patches to verify correctness
    let testResult = null;
    if (applied.length > 0) {
      send({ type: 'info', message: 'Running tests to verify changes...' });
      try {
        testResult = await runTests();
        if (testResult.passed) {
          send({ type: 'test_pass', message: 'All tests passed ✓' });
        } else {
          send({ type: 'test_fail', message: 'Tests failed ✗', details: testResult.stdout + '\n' + testResult.stderr });
        }
      } catch (err) {
        send({ type: 'test_error', message: 'Could not run tests: ' + err.message });
      }
    }

    let type = 'done';
    let message = `Successfully applied ${applied.length} file update(s)! Reload the page to see your evolved application.`;
    if (failed.length && applied.length) {
      type = 'partial';
      message = `Partially applied ${applied.length} file update(s), but ${failed.length} file(s) failed. Do not treat this update as complete until the failed file(s) are investigated and fixed.`;
    } else if (failed.length && !applied.length) {
      type = 'error';
      message = `No files were applied. ${failed.length} planned file(s) failed.`;
    } else if (!applied.length) {
      type = 'error';
      message = 'No files were applied. The model did not produce valid file content for any planned item.';
    }
    if (testResult && !testResult.passed) {
      type = type === 'done' ? 'partial' : type;
      message += `\n\n⚠️ Tests failed. Restore from backup if needed: ${backupDir}`;
    }
    send({ type, applied, failed, backupDir, message, testResult });
  } catch (err) {
    const message = /timeout|aborted/i.test(err.message || '')
      ? `Execution timed out after ${Math.round(EVOLVE_EXECUTION_TIMEOUT_MS / 60000)} minutes. The plan may be too large for one model run; try splitting it into fewer files or using a faster/higher-output model. (${err.message})`
      : err.message;
    send({ type: 'error', message });
  }
  res.end();
}

module.exports = {
  executePlan,
  runTests,
  cleanupOldBackups,
  stripGeneratedFileContent,
  extractJsonObject,
  applySearchReplacePatch,
  streamModelText,
  MAX_BACKUPS_TO_KEEP,
  MAX_PLAN_ITEMS,
  EVOLVE_EXECUTION_TIMEOUT_MS,
};
