#!/usr/bin/env node
/*
 * BLACKLINE AI repo hygiene gate.
 *
 * Purpose:
 * - Keep the repo easier for AI agents to edit safely.
 * - Block stale/orphan frontend paths from returning.
 * - Block new inline handlers/styles while legacy CSP migration is pending.
 * - Track known oversized modules without letting the debt grow silently.
 *
 * This script intentionally uses only Node built-ins.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  '.arena',
  '.cache',
  '.mypy_cache',
  '.pytest_cache',
  '.ruff_cache',
  '.vite',
  '.next',
  '.nuxt',
  '.parcel-cache',
  'coverage',
  'dist',
  'build',
  'out',
]);

const TEXT_EXTENSIONS = new Set([
  '.js', '.html', '.css', '.md', '.json', '.txt', '.yml', '.yaml', '.bat', '.sh'
]);

const VENDORED_PATH_PREFIXES = [
  'frontend/vendor/',
  'package-lock.json',
];

const FORBIDDEN_PATHS = [
  'frontend/js',
  'frontend/css',
  'frontend/script.js',
  'public',
];

const STALE_REFERENCE_CHECK_EXCLUDED_FILES = new Set([
  'scripts/check-repo.js',
  'AUDIT_AND_HARNESS_PLAN.md',
]);

const FORBIDDEN_STALE_REFERENCES = [
  {
    pattern: /public\/(?:app|js|modules|styles|index)|public\/modules|public\/js/i,
    message: 'Stale public/ frontend reference. Live frontend is frontend/index.html + frontend/modules/*.js.',
  },
  {
    pattern: /frontend\/js\/|frontend\/css\/|frontend\/script\.js/i,
    message: 'Stale removed frontend path reference. Do not point agents at removed legacy files.',
    allowFiles: new Set(['README.md', 'AGENTS.md']),
  },
  {
    pattern: /single file,?\s*~?\d*\s*lines|single-file frontend|single file frontend/i,
    message: 'Stale single-file architecture reference. The app is modular.',
    allowFiles: new Set(['AGENTS.md']),
  },
];

// Known debt is allowed so Phase 1 can add a gate before Phase 2/3 fixes it.
// The check fails if new files appear with inline handlers/styles, or if counts
// in these files increase beyond this baseline.
const INLINE_HANDLER_BASELINE = {
  'frontend/index.html': 40,
  'frontend/modules/chat_render.js': 10,
  'frontend/modules/conversations.js': 2,
  'frontend/modules/evolve_plan.js': 2,
  'frontend/modules/markdown.js': 1,
  'frontend/modules/model_roles.js': 2,
  'frontend/modules/models.js': 6,
  'frontend/modules/settings.js': 7,
};

const INLINE_STYLE_BASELINE = {
  'frontend/index.html': 12,
  'frontend/modules/chat_render.js': 2,
  'frontend/modules/chat_send.js': 2,
  'frontend/modules/evolve_plan.js': 10,
  'frontend/modules/evolve_send.js': 2,
  'frontend/modules/evolve_tree.js': 1,
  'frontend/modules/models.js': 4,
  'frontend/modules/settings.js': 2,
};

const LINE_LIMITS = [
  { match: rel => rel.startsWith('backend/') && rel.endsWith('.js'), target: 400, hard: 500, label: 'backend JS module' },
  { match: rel => rel.startsWith('frontend/modules/') && rel.endsWith('.js'), target: 350, hard: 450, label: 'frontend JS module' },
];

// Existing oversized files. New files must not be added here casually; split
// modules instead. Existing files may not grow beyond these line counts.
const LINE_BASELINE = {
  'backend/services/evolveEngine.js': 490,
  'frontend/modules/models.js': 486,
  'frontend/styles.css': 1186,
};

const MAX_CSS_LINES = 1200;

const SECRET_PATTERNS = [
  { name: 'OpenAI-style key', pattern: /\bsk-[A-Za-z0-9][A-Za-z0-9_-]{20,}\b/ },
  { name: 'Anthropic key', pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{20,}\b/ },
  { name: 'Groq key', pattern: /\bgsk_[A-Za-z0-9_-]{20,}\b/ },
];

const errors = [];
const warnings = [];

function relPath(fullPath) {
  return path.relative(ROOT, fullPath).split(path.sep).join('/');
}

function isExcludedRel(rel) {
  return VENDORED_PATH_PREFIXES.some(prefix => rel === prefix || rel.startsWith(prefix));
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

function checkForbiddenPaths() {
  for (const rel of FORBIDDEN_PATHS) {
    if (fs.existsSync(path.join(ROOT, rel))) {
      errors.push(`Forbidden stale/orphan path exists: ${rel}`);
    }
  }
}

function checkStaleReferences(files) {
  for (const full of files) {
    const rel = relPath(full);
    if (isExcludedRel(rel) || STALE_REFERENCE_CHECK_EXCLUDED_FILES.has(rel)) continue;
    const ext = path.extname(rel);
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const rule of FORBIDDEN_STALE_REFERENCES) {
      if (rule.allowFiles?.has(rel)) continue;
      if (rule.pattern.test(text)) errors.push(`${rel}: ${rule.message}`);
    }
  }
}

function checkInlineDebt(files) {
  for (const full of files) {
    const rel = relPath(full);
    if (isExcludedRel(rel)) continue;
    if (!(rel.startsWith('frontend/') && (rel.endsWith('.html') || rel.endsWith('.js')))) continue;
    const text = fs.readFileSync(full, 'utf8');
    const handlers = countMatches(text, /\bon[a-z]+\s*=\s*["']/gi);
    const styles = countMatches(text, /\sstyle\s*=/gi);
    const allowedHandlers = INLINE_HANDLER_BASELINE[rel] || 0;
    const allowedStyles = INLINE_STYLE_BASELINE[rel] || 0;
    if (handlers > allowedHandlers) {
      errors.push(`${rel}: inline event handlers increased from ${allowedHandlers} to ${handlers}. Do not add inline handlers; use addEventListener/event delegation.`);
    } else if (handlers > 0) {
      warnings.push(`${rel}: ${handlers} legacy inline event handler(s) remain.`);
    }
    if (styles > allowedStyles) {
      errors.push(`${rel}: inline styles increased from ${allowedStyles} to ${styles}. Do not add inline styles; use CSS classes.`);
    } else if (styles > 0) {
      warnings.push(`${rel}: ${styles} legacy inline style attribute(s) remain.`);
    }
  }
}

function checkLineLimits(files) {
  for (const full of files) {
    const rel = relPath(full);
    if (isExcludedRel(rel)) continue;
    if (!rel.endsWith('.js') && !rel.endsWith('.css')) continue;
    const lines = fs.readFileSync(full, 'utf8').split('\n').length;
    const known = LINE_BASELINE[rel];
    if (known && lines > known) {
      errors.push(`${rel}: known oversized file grew from ${known} to ${lines} lines. Split or shrink it first.`);
      continue;
    }
    for (const limit of LINE_LIMITS) {
      if (!limit.match(rel)) continue;
      if (known) {
        warnings.push(`${rel}: known oversized ${limit.label} remains at ${lines}/${limit.hard} hard-limit lines.`);
      } else if (lines > limit.hard) {
        errors.push(`${rel}: ${lines} lines exceeds hard limit ${limit.hard} for ${limit.label}. Split the module.`);
      } else if (lines > limit.target) {
        warnings.push(`${rel}: ${lines} lines exceeds target ${limit.target}; consider splitting soon.`);
      }
    }
    if (rel === 'frontend/styles.css') {
      if (lines > MAX_CSS_LINES) errors.push(`${rel}: ${lines} lines exceeds CSS baseline ceiling ${MAX_CSS_LINES}. Split or shrink CSS.`);
      else warnings.push(`${rel}: large stylesheet remains at ${lines} lines; split in a later phase.`);
    }
  }
}

function checkSecrets(files) {
  for (const full of files) {
    const rel = relPath(full);
    if (isExcludedRel(rel) || rel === 'data/config.json') continue;
    const ext = path.extname(rel);
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const secret of SECRET_PATTERNS) {
      if (secret.pattern.test(text)) errors.push(`${rel}: possible committed secret (${secret.name}).`);
    }
  }
}

function checkPackageScripts() {
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.scripts?.check !== 'node scripts/check-repo.js') {
    errors.push('package.json must define "check": "node scripts/check-repo.js".');
  }
  if (pkg.repository?.url && !/Blackline_AI\.git$/.test(pkg.repository.url)) {
    errors.push('package.json repository URL should point to Blackline_AI.git.');
  }
}

function main() {
  const files = walk(ROOT);
  checkForbiddenPaths();
  checkStaleReferences(files);
  checkInlineDebt(files);
  checkLineLimits(files);
  checkSecrets(files);
  checkPackageScripts();

  console.log('BLACKLINE repo check');
  console.log(`Warnings: ${warnings.length}`);
  for (const w of warnings) console.log(`  WARN ${w}`);
  console.log(`Errors: ${errors.length}`);
  for (const e of errors) console.error(`  FAIL ${e}`);

  if (errors.length) process.exit(1);
  console.log('OK: repo hygiene gate passed.');
}

main();
