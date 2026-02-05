#!/usr/bin/env node

/**
 * Test Runner Script for EAMCET Mock Test Platform
 * Provides unified interface for running different types of tests across all packages
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const testConfig = require('../test.config.js');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`${message}`, 'blue');
  log(`${'-'.repeat(40)}`, 'blue');
}

function executeCommand(command, options = {}) {
  try {
    log(`Executing: ${command}`, 'yellow');
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options,
    });
    return { success: true, result };
  } catch (error) {
    log(`Command failed: ${error.message}`, 'red');
    return { success: false, error };
  }
}

function getPackages() {
  const packagesDir = path.join(process.cwd(), 'packages');
  if (!fs.existsSync(packagesDir)) {
    return [];
  }
  
  return fs.readdirSync(packagesDir)
    .filter(dir => {
      const packagePath = path.join(packagesDir, dir);
      return fs.statSync(packagePath).isDirectory() && 
             fs.existsSync(path.join(packagePath, 'package.json'));
    });
}

function runTestsForPackage(packageName, testType = 'all') {
  logSection(`Testing package: ${packageName}`);
  
  const commands = {
    unit: `npm run test --workspace=packages/${packageName}`,
    pbt: `npm run test:pbt --workspace=packages/${packageName}`,
    coverage: `npm run test:coverage --workspace=packages/${packageName}`,
    watch: `npm run test:watch --workspace=packages/${packageName}`,
  };
  
  if (testType === 'all') {
    // Run unit tests and property-based tests
    const unitResult = executeCommand(commands.unit);
    
    // Only run PBT if unit tests pass and package has PBT tests
    if (unitResult.success) {
      const pbtResult = executeCommand(commands.pbt);
      return pbtResult.success; // Return PBT result if unit tests pass
    }
    return unitResult.success;
  } else if (commands[testType]) {
    const result = executeCommand(commands[testType]);
    return result.success;
  } else {
    log(`Unknown test type: ${testType}`, 'red');
    return false;
  }
}

function runAllTests(testType = 'all') {
  logHeader(`Running ${testType} tests for all packages`);
  
  const packages = getPackages();
  if (packages.length === 0) {
    log('No packages found', 'yellow');
    return false;
  }
  
  log(`Found packages: ${packages.join(', ')}`, 'green');
  
  let allPassed = true;
  const results = {};
  
  for (const packageName of packages) {
    const success = runTestsForPackage(packageName, testType);
    results[packageName] = success;
    allPassed = allPassed && success;
  }
  
  // Summary
  logHeader('Test Results Summary');
  for (const [packageName, success] of Object.entries(results)) {
    const status = success ? 'PASSED' : 'FAILED';
    const color = success ? 'green' : 'red';
    log(`${packageName}: ${status}`, color);
  }
  
  const overallStatus = allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED';
  const overallColor = allPassed ? 'green' : 'red';
  log(`\n${overallStatus}`, overallColor);
  
  return allPassed;
}

function runCoverageReport() {
  logHeader('Generating Coverage Report');
  
  // Run coverage for all packages
  const packages = getPackages();
  let allPassed = true;
  
  for (const packageName of packages) {
    const success = runTestsForPackage(packageName, 'coverage');
    allPassed = allPassed && success;
  }
  
  // Generate combined coverage report using Jest
  if (allPassed) {
    log('\nGenerating combined coverage report...', 'blue');
    executeCommand('npx jest --coverage --passWithNoTests');
  }
  
  return allPassed;
}

function runPropertyBasedTests() {
  logHeader('Running Property-Based Tests');
  
  const packages = getPackages();
  let allPassed = true;
  
  for (const packageName of packages) {
    logSection(`Property-based tests for ${packageName}`);
    const command = `npm run test:pbt --workspace=packages/${packageName}`;
    const result = executeCommand(command);
    allPassed = allPassed && result.success;
  }
  
  return allPassed;
}

function showHelp() {
  log('EAMCET Mock Test Platform - Test Runner', 'bright');
  log('\nUsage: node scripts/test-runner.js [command] [options]', 'cyan');
  log('\nCommands:', 'yellow');
  log('  all          Run all tests (unit + property-based)', 'green');
  log('  unit         Run unit tests only', 'green');
  log('  pbt          Run property-based tests only', 'green');
  log('  coverage     Run tests with coverage report', 'green');
  log('  watch        Run tests in watch mode', 'green');
  log('  help         Show this help message', 'green');
  log('\nExamples:', 'yellow');
  log('  node scripts/test-runner.js all', 'cyan');
  log('  node scripts/test-runner.js pbt', 'cyan');
  log('  node scripts/test-runner.js coverage', 'cyan');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  switch (command) {
    case 'all':
      process.exit(runAllTests('all') ? 0 : 1);
      break;
    case 'unit':
      process.exit(runAllTests('unit') ? 0 : 1);
      break;
    case 'pbt':
      process.exit(runPropertyBasedTests() ? 0 : 1);
      break;
    case 'coverage':
      process.exit(runCoverageReport() ? 0 : 1);
      break;
    case 'watch':
      // Watch mode doesn't exit
      runAllTests('watch');
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      log(`Unknown command: ${command}`, 'red');
      showHelp();
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  runPropertyBasedTests,
  runCoverageReport,
  runTestsForPackage,
};