#!/usr/bin/env node

/**
 * Test Cloudflare Intent Parsing
 * 
 * CloudflareでのIntentパース確認
 */

async function testCloudflareIntent() {
  console.log('🧪 Testing Cloudflare Intent Parsing\n');
  
  const accountId = "0fc5c2d478a1383a6b624d19ff4bd340";
  const apiKey = "4f7207ceb8822e7ca0825cf26da84fe32e02b";
  
  const prompt = `Parse this natural language query into structured intent.

Query: "What did Alice learn?"

Return ONLY a JSON object with:
- action: "query" or "aggregate" 
- entities: array of entities mentioned
- filters: object with verbs array if actions are mentioned

Example: {"action":"query","entities":["alice"],"filters":{"verbs":["learned"]}}`;

  const body = {
    messages: [{ role: "user", content: prompt }]
  };
  
  console.log('📤 Sending to Cloudflare...\n');
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
    {
      method: 'POST',
      headers: {
        'X-Auth-Key': apiKey,
        'X-Auth-Email': "Hiromi.motodera@aid-on.org",
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }
  );
  
  const result = await response.json();
  console.log('📥 Raw response:', JSON.stringify(result, null, 2));
  
  if (result.success) {
    const text = result.result.response;
    console.log('\n📝 Response text:', text);
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(text);
      console.log('\n✅ Parsed JSON:', parsed);
    } catch (e) {
      console.log('\n❌ Failed to parse as JSON');
      
      // Try to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          console.log('✅ Extracted JSON:', extracted);
        } catch (e2) {
          console.log('❌ Failed to extract JSON');
        }
      }
    }
  }
}

testCloudflareIntent().catch(console.error);