#!/usr/bin/env node

/**
 * Direct Cloudflare API Test
 * 
 * Cloudflare APIを直接テスト
 */

async function testCloudflareAPI() {
  console.log('🧪 Testing Cloudflare API directly...\n');
  
  const accountId = "0fc5c2d478a1383a6b624d19ff4bd340";
  const apiKey = "4f7207ceb8822e7ca0825cf26da84fe32e02b";
  
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`;
  
  const body = {
    messages: [
      { 
        role: "user", 
        content: "Extract event information from this text and return ONLY valid JSON.\n\nText: \"Alice learned Python\"\n\nReturn a JSON object with these fields:\n- subject: the entity performing the action\n- verb: the action being performed\n- object: what the action is performed on\n\nIMPORTANT: Return ONLY the JSON object, no explanations."
      }
    ]
  };
  
  console.log('📤 Sending request to Cloudflare...');
  console.log('URL:', url);
  console.log('Headers: X-Auth-Key, X-Auth-Email\n');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Auth-Key': apiKey,
        'X-Auth-Email': "Hiromi.motodera@aid-on.org",
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\n📄 Response body:', text);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('\n✅ Parsed response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('\n⚠️ Could not parse as JSON');
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCloudflareAPI().catch(console.error);