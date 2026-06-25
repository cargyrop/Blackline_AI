const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  applySearchReplacePatch,
  stripGeneratedFileContent,
  cleanupOldBackups,
  MAX_BACKUPS_TO_KEEP,
} = require('../../backend/services/evolveEngine');

describe('backend/services/evolveEngine', () => {
  describe('applySearchReplacePatch', () => {
    it('applies a single change', () => {
      const original = 'function foo() { return 1; }';
      const changes = [{ search: 'return 1;', replace: 'return 2;' }];
      const result = applySearchReplacePatch(original, changes, 'test.js');
      assert.strictEqual(result, 'function foo() { return 2; }');
    });

    it('applies multiple changes in order', () => {
      const original = 'const a = 1;\nconst b = 2;\nconst c = 3;';
      const changes = [
        { search: 'const a = 1;', replace: 'const a = 10;' },
        { search: 'const b = 2;', replace: 'const b = 20;' },
      ];
      const result = applySearchReplacePatch(original, changes, 'test.js');
      assert.strictEqual(result, 'const a = 10;\nconst b = 20;\nconst c = 3;');
    });

    it('throws when search is not found', () => {
      const original = 'function foo() { return 1; }';
      const changes = [{ search: 'return 999;', replace: 'return 2;' }];
      assert.throws(() => applySearchReplacePatch(original, changes, 'test.js'), /not found/);
    });

    it('throws when search matches multiple times', () => {
      const original = 'return 1;\nreturn 1;';
      const changes = [{ search: 'return 1;', replace: 'return 2;' }];
      assert.throws(() => applySearchReplacePatch(original, changes, 'test.js'), /multiple locations/);
    });

    it('throws on empty changes array', () => {
      assert.throws(() => applySearchReplacePatch('hello', [], 'test.js'), /did not include any changes/);
    });

    it('throws on missing search field', () => {
      assert.throws(() => applySearchReplacePatch('hello', [{ replace: 'world' }], 'test.js'), /non-empty search/);
    });

    it('uses unique search to disambiguate', () => {
      const original = 'function foo() { return 1; }\nfunction bar() { return 1; }';
      const changes = [{ search: 'function bar() { return 1; }', replace: 'function bar() { return 2; }' }];
      const result = applySearchReplacePatch(original, changes, 'test.js');
      assert.strictEqual(result, 'function foo() { return 1; }\nfunction bar() { return 2; }');
    });
  });

  describe('stripGeneratedFileContent', () => {
    it('removes markdown fences', () => {
      const input = '```javascript\nconst x = 1;\n```';
      assert.strictEqual(stripGeneratedFileContent(input, 'test.js'), 'const x = 1;');
    });

    it('removes file path markers', () => {
      const input = '=== FILE: test.js ===\nconst x = 1;';
      assert.strictEqual(stripGeneratedFileContent(input, 'test.js'), 'const x = 1;');
    });

    it('removes trailing fences', () => {
      const input = 'const x = 1;\n```';
      assert.strictEqual(stripGeneratedFileContent(input, 'test.js'), 'const x = 1;');
    });

    it('handles clean input', () => {
      const input = 'const x = 1;';
      assert.strictEqual(stripGeneratedFileContent(input, 'test.js'), 'const x = 1;');
    });
  });

  describe('cleanupOldBackups', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blackline-backup-test-'));

    it('keeps MAX_BACKUPS_TO_KEEP most recent backups', () => {
      const appName = 'Blackline_AI';
      const now = Date.now();
      // Create 7 backup directories with explicit mtimes (spaced 1 second apart)
      for (let i = 0; i < 7; i++) {
        const dir = path.join(tmpDir, `${appName}-backup-2024-01-0${i + 1}T00-00-00-000Z`);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'marker.txt'), String(i));
        // Set explicit mtime to ensure deterministic ordering (older first)
        fs.utimesSync(dir, now / 1000 - (7 - i), now / 1000 - (7 - i));
      }
      const currentBackup = path.join(tmpDir, `${appName}-backup-2024-01-10T00-00-00-000Z`);
      fs.mkdirSync(currentBackup, { recursive: true });
      fs.writeFileSync(path.join(currentBackup, 'marker.txt'), 'current');
      fs.utimesSync(currentBackup, now / 1000 + 1, now / 1000 + 1); // newest

      const deleted = cleanupOldBackups(tmpDir, appName, currentBackup);
      // 7 old + 1 current = 8. Keep 5 total (current + 4 next newest).
      // Delete 7 - 4 = 3 oldest.
      assert.strictEqual(deleted, 3);

      const remaining = fs.readdirSync(tmpDir).filter(d => d.startsWith(`${appName}-backup-`));
      assert.strictEqual(remaining.length, 5);
      // Verify current backup is still there
      assert(remaining.includes(path.basename(currentBackup)));
    });
  });
});
