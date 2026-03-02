/**
 * Test Wablas API Connection
 * Run: npx tsx scripts/test-wablas.ts
 */

import { config } from 'dotenv';
config();

async function testWablas() {
  const token = process.env.WABLAS_TOKEN;
  const baseUrl = process.env.WABLAS_API_URL || 'https://bdg.wablas.com';
  
  console.log('🔍 Testing Wablas Configuration...\n');
  console.log('Token:', token?.substring(0, 20) + '...');
  console.log('Base URL:', baseUrl);
  console.log('Full API URL:', `${baseUrl}/api/send-message`);
  console.log('\n📤 Sending test request...\n');

  try {
    const apiUrl = `${baseUrl}/api/send-message`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
      body: JSON.stringify({
        phone: '6285855052664', // Test number
        message: 'Test message from MU Travel',
      }),
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('\n📥 Response Body:\n');

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('\n✅ SUCCESS! Wablas API is working correctly.');
      } else {
        console.log('\n❌ FAILED! Check the error message above.');
      }
    } else {
      const text = await response.text();
      console.log(text.substring(0, 500));
      console.log('\n❌ FAILED! API returned HTML instead of JSON.');
      console.log('\n🔧 Possible issues:');
      console.log('1. Token tidak valid atau expired');
      console.log('2. API URL salah - cek dashboard Wablas untuk endpoint yang benar');
      console.log('3. Domain Wablas salah (bdg.wablas.com mungkin bukan domain Anda)');
      console.log('\n📝 Cek https://wablas.com/docs untuk dokumentasi lengkap');
    }
  } catch (error) {
    console.error('\n💥 Network Error:', error);
  }
}

testWablas();
