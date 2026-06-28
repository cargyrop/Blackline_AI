const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { readFileMap, readFileTree } = require('../../backend/services/fileTree');

describe('backend/services/fileTree', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blackline-tree-test-'));

  // Setup test directory structure
  fs.mkdirSync(path.join(tmpDir, 'frontend'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'frontend', 'app.js'), 'console.log("hello");\n');
  fs.mkdirSync(path.join(tmpDir, 'backend'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'backend', 'server.js'), 'const express = require("express");\n');
  fs.mkdirSync(path.join(tmpDir, 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'node_modules', 'express.js'), 'module.exports = {};\n');
  fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}\n');

  it('readFileMap returns flat list of files with line counts', () => {
    const map = readFileMap(tmpDir);
    assert(Array.isArray(map));
    const appJs = map.find(f => f.path === 'frontend/app.js');
    assert(appJs);
    assert.strictEqual(appJs.lines, 2); // trailing newline adds empty element in split
    const serverJs = map.find(f => f.path === 'backend/server.js');
    assert(serverJs);
    assert.strictEqual(serverJs.lines, 2);
    // node_modules should be excluded
    assert(!map.find(f => f.path.includes('node_modules')));
    // package-lock.json doesn't exist but if it did, it would be excluded
  });

  it('readFileTree returns nested tree with content', () => {
    const tree = readFileTree(tmpDir);
    assert(Array.isArray(tree));
    const publicDir = tree.find(e => e.path === 'frontend');
    assert(publicDir);
    assert.strictEqual(publicDir.type, 'dir');
    assert(Array.isArray(publicDir.children));
    const appJs = publicDir.children.find(e => e.path === 'frontend/app.js');
    assert(appJs);
    assert.strictEqual(appJs.type, 'file');
    assert.strictEqual(appJs.content, 'console.log("hello");\n');
    assert.strictEqual(appJs.lines, 2);
  });

  it('readFileTree excludes blocked directories', () => {
    const tree = readFileTree(tmpDir);
    assert(!tree.find(e => e.path === 'node_modules'));
    assert(!tree.find(e => e.path === '.git'));
  });
});
