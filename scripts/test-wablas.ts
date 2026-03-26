/**
 * Test Wablas API Connection
 * Run: npx tsx scripts/test-wablas.ts
 */

import { config } from 'dotenv';
config();

async function testWablas() {
  const token = process.env.WABLAS_TOKEN;
  const secretKey = process.env.WABLAS_SECRET_KEY;
  const authMode = (process.env.WABLAS_AUTH_MODE || 'auto').toLowerCase();
  const baseUrl = process.env.WABLAS_API_URL || 'https://bdg.wablas.com';
  
  console.log('🔍 Testing Wablas Configuration...\n');
  console.log('Token exists:', Boolean(token));
  console.log('Secret key exists:', Boolean(secretKey));
  console.log('Auth mode:', authMode);
  console.log('Base URL:', baseUrl);
  console.log('Full API URL:', `${baseUrl}/api/send-message`);
  console.log('\n📤 Sending test request...\n');

  try {
    const apiUrl = `${baseUrl}/api/send-message`;
    
    const attempts: Record<string, Record<string, string>> = {
      both: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
        'secretkey': secretKey || '',
        'secret-key': secretKey || '',
        'x-secret-key': secretKey || '',
      },
      token: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
      secret: {
        'Content-Type': 'application/json',
        'secretkey': secretKey || '',
        'secret-key': secretKey || '',
        'x-secret-key': secretKey || '',
      },
    };

    const orderedAttempts =
      authMode === 'token' ? ['token', 'both'] :
      authMode === 'secret' ? ['secret', 'both'] :
      ['both', 'secret', 'token'];

    let response: Response | null = null;
    let usedAttempt = '';

    for (const attempt of orderedAttempts) {
      const headers = attempts[attempt];
      if (!headers) continue;
      if (attempt === 'token' && !token) continue;
      if (attempt === 'secret' && !secretKey) continue;
      if (attempt === 'both' && (!token || !secretKey)) continue;

      console.log(`Trying auth strategy: ${attempt}`);
      const r = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone: '6285855052664',
          message: 'Test message from MU Travel',
        }),
      });

      response = r;
      usedAttempt = attempt;

      if (r.ok) break;
      if (![401, 403].includes(r.status)) break;
    }

    if (!response) {
      throw new Error('No auth strategy could be executed. Check WABLAS_TOKEN / WABLAS_SECRET_KEY.');
    }

    console.log('Auth Strategy Used:', usedAttempt);
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
