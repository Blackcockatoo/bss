#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const roots = ['src', 'public/docs'];
const allowedExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.mdx', '.txt']);
const bannedPatterns = [
  /quantum-resistant/gi,
  /quantum resistant/gi,
];

const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!allowedExt.has(extname(fullPath))) {
      continue;
    }

    const content = readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      bannedPatterns.forEach((pattern) => {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          violations.push(`${fullPath}:${index + 1}: contains banned phrase matching ${pattern}`);
        }
      });
    });
  }
}

for (const root of roots) {
  walk(root);
}

if (violations.length > 0) {
  console.error('Banned MOSS60 copy detected:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('MOSS60 copy check passed.');
