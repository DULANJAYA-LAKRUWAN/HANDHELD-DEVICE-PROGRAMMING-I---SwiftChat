/**
 * SwiftChat - Unified Master Test Orchestrator
 *
 * Runs all test tiers across the full stack:
 * 1. Database Schema & Constraint Smoke Tests
 * 2. Backend Unit & Smoke Test Suite (JUnit 5 + Mockito)
 * 3. Frontend Utility & Client Smoke Tests (Node test runner)
 * 4. Full-Stack Live End-to-End (E2E) Integration Tests
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const mvnCmd = isWindows ? 'mvn.cmd' : 'mvn';

console.log('='.repeat(75));
console.log('       SWIFTCHAT FULL-STACK VERIFICATION & TEST ORCHESTRATOR');
console.log('='.repeat(75));
console.log(`Execution Timestamp: ${new Date().toISOString()}`);
console.log(`Node Environment:    ${process.version}`);
console.log(`Project Root:        ${projectRoot}\n`);

const results = [];

function runTier(name, runnerFn) {
  console.log(`\n>>> [TIER] Running ${name}...`);
  const startTime = Date.now();
  try {
    const output = runnerFn();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✔ [PASS] ${name} (${duration}s)`);
    results.push({ name, status: 'PASS', duration: `${duration}s`, error: null });
    return true;
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`✖ [FAIL] ${name} (${duration}s): ${err.message}`);
    results.push({ name, status: 'FAIL', duration: `${duration}s`, error: err.message });
    return false;
  }
}

// Tier 1: Database Schema Smoke Tests
runTier('Database Schema & Constraint Smoke Tests', () => {
  const res = spawnSync(
    'node',
    ['--test', path.resolve(projectRoot, 'database/tests/schema-smoke.test.mjs')],
    { stdio: 'inherit', cwd: projectRoot }
  );
  if (res.status !== 0) throw new Error('Database schema smoke tests failed');
});

// Tier 2: Backend Maven Test Suite (JUnit 5 + Mockito)
runTier('Backend Unit & Service Smoke Tests (JUnit 5 & Mockito)', () => {
  const backendDir = path.resolve(projectRoot, 'backend');
  const res = spawnSync(mvnCmd, ['test'], {
    stdio: 'inherit',
    cwd: backendDir,
    shell: true,
  });
  if (res.status !== 0) throw new Error('Backend Maven test suite failed');
});

// Tier 3: Frontend Unit & Smoke Tests
runTier('Frontend Utility & Client Smoke Tests', () => {
  const res = spawnSync(
    'node',
    [
      '--test',
      path.resolve(projectRoot, 'frontend/src/__tests__/formatDate.test.mjs'),
      path.resolve(projectRoot, 'frontend/src/__tests__/api.test.mjs'),
    ],
    { stdio: 'inherit', cwd: projectRoot }
  );
  if (res.status !== 0) throw new Error('Frontend smoke tests failed');
});

// Tier 4: Live Stack End-to-End (E2E) Test Suite
runTier('Live Stack Full-Duplex E2E Test Suite', () => {
  const res = spawnSync(
    'node',
    ['--test', path.resolve(projectRoot, 'scripts/e2e-test.mjs')],
    { stdio: 'inherit', cwd: projectRoot }
  );
  if (res.status !== 0) throw new Error('Live E2E test suite failed');
});

// Summary Report
console.log('\n' + '='.repeat(75));
console.log('                          FINAL TEST SUMMARY');
console.log('='.repeat(75));
console.log(
  'TIER'.padEnd(52) +
  'STATUS'.padEnd(12) +
  'TIME'
);
console.log('-'.repeat(75));

let allPassed = true;
for (const r of results) {
  const statusFormatted = r.status === 'PASS' ? '✔ PASS' : '✖ FAIL';
  console.log(
    r.name.padEnd(52) +
    statusFormatted.padEnd(12) +
    r.duration
  );
  if (r.status !== 'PASS') allPassed = false;
}

console.log('-'.repeat(75));
if (allPassed) {
  console.log('🎉 ALL TIERS PASSED! SwiftChat is 100% verified and production-ready.');
  process.exit(0);
} else {
  console.error('⚠️ ONE OR MORE TIERS FAILED. Review logs above.');
  process.exit(1);
}
