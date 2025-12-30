import { WhenM } from './dist/index.js';

async function test() {
  console.log('Testing WhenM v0.3.0...');
  
  // Test class exists
  if (typeof WhenM !== 'function') throw new Error('WhenM class not found');
  console.log('✓ WhenM class exists');
  
  // Test static methods exist
  if (typeof WhenM.cloudflare !== 'function') throw new Error('WhenM.cloudflare not found');
  if (typeof WhenM.groq !== 'function') throw new Error('WhenM.groq not found');
  if (typeof WhenM.gemini !== 'function') throw new Error('WhenM.gemini not found');
  if (typeof WhenM.create !== 'function') throw new Error('WhenM.create not found');
  console.log('✓ All static methods exist');
  
  // Test mock provider
  const memory = await WhenM.create({ debug: false });
  console.log('✓ Mock provider initialized');
  
  await memory.remember('Test event');
  console.log('✓ remember() works');
  
  const answer = await memory.ask('What happened?');
  console.log('✓ ask() works');
  
  console.log('\n✅ All basic tests passed!');
}

test().catch(e => { 
  console.error('❌', e.message); 
  process.exit(1); 
});