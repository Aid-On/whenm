#!/usr/bin/env node

/**
 * Reset LoCoMo test data
 */

import fs from 'fs/promises';

async function reset() {
  console.log('🗑️ Resetting LoCoMo test data...');
  
  try {
    await fs.unlink('.locomo-data-loaded');
    console.log('✅ Data marker removed.');
    console.log('Note: Data in Cloudflare remains. Run test-locomo-load.js to refresh.');
  } catch {
    console.log('ℹ️ No data to reset.');
  }
}

reset();