#!/usr/bin/env node

import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const destination = resolve('public/moss60-ultimate.html');
const candidateSources = [
  resolve('moss60-ultimate.html'),
  resolve('public/moss60-enhanced.html'),
  resolve('public/moss60.html'),
];

const source = candidateSources.find((candidate) => existsSync(candidate));

if (!source) {
  if (existsSync(destination)) {
    console.log('[prepare-moss60-production] moss60-ultimate.html already present in public, skipping copy.');
    process.exit(0);
  }

  console.warn(
    '[prepare-moss60-production] No source file found for moss60-ultimate.html. Checked:',
    candidateSources.join(', '),
  );
  process.exit(0);
}

if (source === destination) {
  console.log('[prepare-moss60-production] moss60-ultimate.html already present in public, skipping copy.');
  process.exit(0);
}

copyFileSync(source, destination);
console.log(
  `[prepare-moss60-production] Copied ${source.split('/').pop()} to public/moss60-ultimate.html for production builds.`,
);
