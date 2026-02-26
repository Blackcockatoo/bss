#!/usr/bin/env node
/**
 * Element Number Theory Demo
 * Run this to see worked examples of element fusion into Jewble mathematics
 *
 * Usage:
 *   npx ts-node packages/core/src/elements/demo.ts
 */

import { runAllExamples } from './examples';

console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    JEWBLE ELEMENT NUMBER THEORY DEMO                          ║');
console.log('║                   Elements Fused into Mathematical Engine                     ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
console.log('\n');

runAllExamples();

console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                              DEMO COMPLETE                                    ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
console.log('\n');
