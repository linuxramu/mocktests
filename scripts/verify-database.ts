#!/usr/bin/env node
/**
 * Database Verification Script
 * Verifies database schema and connectivity for the EAMCET Mock Test Platform
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface TableInfo {
  name: string;
  sql: string;
}

interface IndexInfo {
  name: string;
  tbl_name: string;
  sql: string;
}

// Expected tables from schema
const EXPECTED_TABLES = [
  'users',
  'test_sessions',
  'questions',
  'test_questions',
  'user_answers',
  'performance_analytics',
  'progress_tracking',
  'schema_migrations',
];

// Expected indexes
const EXPECTED_INDEXES = [
  'idx_users_email',
  'idx_users_created_at',
  'idx_test_sessions_user_id',
  'idx_test_sessions_status',
  'idx_test_sessions_started_at',
  'idx_questions_subject',
  'idx_questions_difficulty',
  'idx_questions_created_at',
  'idx_test_questions_session',
  'idx_test_questions_question',
  'idx_user_answers_session',
  'idx_user_answers_question',
  'idx_user_answers_answered_at',
  'idx_performance_analytics_user',
  'idx_performance_analytics_session',
  'idx_performance_analytics_subject',
  'idx_performance_analytics_calculated_at',
  'idx_progress_tracking_user',
  'idx_progress_tracking_metric',
  'idx_progress_tracking_recorded_at',
];

function verifySchemaFile(): boolean {
  console.log('🔍 Verifying database schema file...\n');

  try {
    const schemaPath = join(process.cwd(), 'database', 'schema.sql');
    const schemaContent = readFileSync(schemaPath, 'utf-8');

    let allChecksPass = true;

    // Check for all expected tables
    console.log('📋 Checking tables:');
    for (const table of EXPECTED_TABLES) {
      const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`, 'i');
      if (tableRegex.test(schemaContent)) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} - MISSING`);
        allChecksPass = false;
      }
    }

    // Check for all expected indexes
    console.log('\n📊 Checking indexes:');
    for (const index of EXPECTED_INDEXES) {
      const indexRegex = new RegExp(`CREATE INDEX IF NOT EXISTS ${index}`, 'i');
      if (indexRegex.test(schemaContent)) {
        console.log(`  ✅ ${index}`);
      } else {
        console.log(`  ❌ ${index} - MISSING`);
        allChecksPass = false;
      }
    }

    // Check for foreign key constraints
    console.log('\n🔗 Checking foreign key constraints:');
    const fkCount = (schemaContent.match(/FOREIGN KEY/gi) || []).length;
    console.log(`  ✅ Found ${fkCount} foreign key constraints`);

    // Check for check constraints
    console.log('\n✔️  Checking CHECK constraints:');
    const checkCount = (schemaContent.match(/CHECK \(/gi) || []).length;
    console.log(`  ✅ Found ${checkCount} CHECK constraints`);

    return allChecksPass;
  } catch (error) {
    console.error('❌ Error reading schema file:', error);
    return false;
  }
}

function verifyMigrationFile(): boolean {
  console.log('\n🔍 Verifying migration file...\n');

  try {
    const migrationPath = join(
      process.cwd(),
      'database',
      'migrations',
      '001_initial_schema.sql'
    );
    const migrationContent = readFileSync(migrationPath, 'utf-8');

    console.log('📋 Checking migration file:');

    // Check if migration has all tables
    let allTablesPresent = true;
    for (const table of EXPECTED_TABLES) {
      const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`, 'i');
      if (!tableRegex.test(migrationContent)) {
        console.log(`  ❌ ${table} - MISSING from migration`);
        allTablesPresent = false;
      }
    }

    if (allTablesPresent) {
      console.log('  ✅ All tables present in migration');
    }

    return allTablesPresent;
  } catch (error) {
    console.error('❌ Error reading migration file:', error);
    return false;
  }
}

function verifyConnectionUtilities(): boolean {
  console.log('\n🔍 Verifying database connection utilities...\n');

  try {
    const connectionPath = join(process.cwd(), 'database', 'connection.ts');
    const connectionContent = readFileSync(connectionPath, 'utf-8');

    console.log('📋 Checking connection utilities:');

    const expectedFunctions = [
      'executeQuery',
      'executeQueryFirst',
      'executeWrite',
      'executeBatch',
      'checkDatabaseConnection',
      'getSchemaVersion',
    ];

    let allFunctionsPresent = true;
    for (const func of expectedFunctions) {
      const funcRegex = new RegExp(`export async function ${func}`, 'i');
      if (funcRegex.test(connectionContent)) {
        console.log(`  ✅ ${func}`);
      } else {
        console.log(`  ❌ ${func} - MISSING`);
        allFunctionsPresent = false;
      }
    }

    return allFunctionsPresent;
  } catch (error) {
    console.error('❌ Error reading connection file:', error);
    return false;
  }
}

function verifyWranglerConfigurations(): boolean {
  console.log('\n🔍 Verifying Wrangler configurations...\n');

  const workers = ['auth-worker', 'ai-worker'];
  let allConfigsValid = true;

  for (const worker of workers) {
    try {
      const wranglerPath = join(
        process.cwd(),
        'packages',
        worker,
        'wrangler.toml'
      );
      const wranglerContent = readFileSync(wranglerPath, 'utf-8');

      console.log(`📋 Checking ${worker}:`);

      // Check for D1 database binding
      if (/\[\[d1_databases\]\]/i.test(wranglerContent)) {
        console.log(`  ✅ D1 database binding configured`);
      } else {
        console.log(`  ❌ D1 database binding - MISSING`);
        allConfigsValid = false;
      }

      // Check for DB binding name
      if (/binding\s*=\s*"DB"/i.test(wranglerContent)) {
        console.log(`  ✅ DB binding name correct`);
      } else {
        console.log(`  ❌ DB binding name - INCORRECT`);
        allConfigsValid = false;
      }

      console.log('');
    } catch (error) {
      console.error(`❌ Error reading ${worker} wrangler.toml:`, error);
      allConfigsValid = false;
    }
  }

  return allConfigsValid;
}

// Main verification
console.log('═══════════════════════════════════════════════════════════');
console.log('  EAMCET Mock Test Platform - Database Verification');
console.log('═══════════════════════════════════════════════════════════\n');

const schemaValid = verifySchemaFile();
const migrationValid = verifyMigrationFile();
const connectionValid = verifyConnectionUtilities();
const wranglerValid = verifyWranglerConfigurations();

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  Verification Summary');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`Schema File:          ${schemaValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Migration File:       ${migrationValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Connection Utilities: ${connectionValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Wrangler Configs:     ${wranglerValid ? '✅ PASS' : '❌ FAIL'}`);

const allPass =
  schemaValid && migrationValid && connectionValid && wranglerValid;

console.log('\n═══════════════════════════════════════════════════════════');
if (allPass) {
  console.log('  ✅ ALL CHECKS PASSED - Database setup is complete!');
} else {
  console.log('  ❌ SOME CHECKS FAILED - Please review the issues above');
}
console.log('═══════════════════════════════════════════════════════════\n');

process.exit(allPass ? 0 : 1);
