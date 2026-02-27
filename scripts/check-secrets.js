#!/usr/bin/env node

/**
 * Lightweight secret scan for the repository.
 * 
 * This does NOT guarantee there are no secrets, but it helps catch obvious ones
 * (API keys, private keys, common token prefixes).
 */

const { spawnSync } = require('child_process');

const patterns = [
  'BEGIN RSA PRIVATE KEY',
  'BEGIN OPENSSH PRIVATE KEY',
  'BEGIN PRIVATE KEY',
  'INKYSTREAM_API_KEY=\\w',
  'sk_live_',
  'sk_test_',
  'ghp_[A-Za-z0-9]{20,}',
  'xoxb-[A-Za-z0-9-]{20,}',
  'AWS_SECRET_ACCESS_KEY',
  'Authorization:\\s*Bearer\\s+[A-Za-z0-9]{20,}'
];

const args = [
  '--ignore-case',
  '--line-number',
  '--color', 'never',
  patterns.join('|'),
  '.'
];

const result = spawnSync('rg', args, { stdio: 'pipe', encoding: 'utf8' });

if (result.error) {
  console.error('[check-secrets] Failed to run ripgrep (rg). Is it installed?');
  process.exit(1);
}

if (result.status === 0) {
  console.error('[check-secrets] Potential secrets found:\n');
  console.error(result.stdout.trim());
  process.exit(1);
}

console.log('[check-secrets] No obvious secrets found.');
process.exit(0);

