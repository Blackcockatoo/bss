#!/usr/bin/env node

import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('moss60-ultimate.html');
const destination = resolve('public/moss60-ultimate.html');

if (!existsSync(source)) {
  console.warn('[prepare-moss60-production] Source file not found, skipping:', source);
  process.exit(0);
}

copyFileSync(source, destination);
console.log('[prepare-moss60-production] Copied moss60-ultimate.html to public for production builds.');
