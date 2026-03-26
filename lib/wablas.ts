export interface SendWablasMessageInput {
  phone: string;
  message: string;
  image?: string; // URL to image
}

export interface WablasResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Send WhatsApp message via Wablas API
 * @param input Message data with phone, message, and optional image
 * @returns Promise with success status and response data
 */
export async function sendWablasMessage(
  input: SendWablasMessageInput
): Promise<WablasResponse> {
  const token = process.env.WABLAS_TOKEN;
  const secretKey = process.env.WABLAS_SECRET_KEY;
  const useSecretOnly = process.env.WABLAS_USE_SECRET_ONLY === 'true';
  const proxyUrl = process.env.WABLAS_PROXY_URL;
  const proxyApiKey = process.env.WABLAS_PROXY_API_KEY;
  const timeoutMs = Number(process.env.WABLAS_TIMEOUT_MS || '20000');
  const proxyTimeoutMs = Number(
    process.env.WABLAS_PROXY_TIMEOUT_MS || String(Math.max(timeoutMs, 30000))
  );

  if (!proxyUrl && !token && !secretKey) {
    throw new Error('WABLAS_TOKEN or WABLAS_SECRET_KEY is required. Configure in .env file.');
  }

  try {
    // Format phone number (remove +, spaces, dashes)
    const formattedPhone = input.phone.replace(/[^\d]/g, '');
    
    // Add country code if not present (Indonesia: 62)
    const phoneWithCountryCode = formattedPhone.startsWith('62') 
      ? formattedPhone 
      : `62${formattedPhone.startsWith('0') ? formattedPhone.slice(1) : formattedPhone}`;

    // Wablas API endpoint
    const baseUrl = process.env.WABLAS_API_URL || 'https://console.wablas.com';
    const apiUrl = `${baseUrl}/api/send-message`;

    // Prepare request body
    const body: any = {
      phone: phoneWithCountryCode,
      message: input.message,
    };

    // Add image if provided (only if subscription supports media)
    if (input.image) {
      body.image = input.image;
    }

    console.log('Sending WA:', {
      apiUrl,
      phone: phoneWithCountryCode,
      timeoutMs,
      proxyTimeoutMs,
      usingProxy: Boolean(proxyUrl),
      authMode: useSecretOnly ? 'secret-only' : token ? 'token' : 'secret',
      hasToken: Boolean(token),
      hasSecretKey: Boolean(secretKey),
    });

    const sendViaProxy = async () => {
      if (!proxyUrl) {
        return null;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), proxyTimeoutMs);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (proxyApiKey) {
          headers['x-api-key'] = proxyApiKey;
        }

        let proxyResponse: Response;
        try {
          const fetchPromise = fetch(`${proxyUrl.replace(/\/$/, '')}/send`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          const hardTimeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('WABLAS_PROXY_HARD_TIMEOUT')), proxyTimeoutMs + 500);
          });

          proxyResponse = (await Promise.race([fetchPromise, hardTimeoutPromise])) as Response;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('WABLAS_PROXY_TIMEOUT');
          }
          throw error;
        }

        const contentType = proxyResponse.headers.get('content-type') || 'unknown';
        const rawResponse = await proxyResponse.text();
        let data: any = null;

        if (contentType.includes('application/json')) {
          try {
            data = rawResponse ? JSON.parse(rawResponse) : null;
          } catch {
            console.error('Failed to parse JSON response from WA proxy');
          }
        }

        return { response: proxyResponse, contentType, rawResponse, data };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const buildHeaders = (): Record<string, string> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Use secret-key mode if WABLAS_USE_SECRET_ONLY=true, otherwise use token
      if (useSecretOnly && secretKey) {
        headers['secretkey'] = secretKey;
        headers['X-API-Key'] = secretKey;
      } else if (token) {
        headers['Authorization'] = token;
      } else if (secretKey) {
        headers['secretkey'] = secretKey;
        headers['X-API-Key'] = secretKey;
      }

      return headers;
    };

    const sendRequest = async (headers: Record<string, string>) => {
      let response: Response;
      try {
        const fetchPromise = fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const hardTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('WABLAS_HARD_TIMEOUT')), timeoutMs + 500);
        });

        response = (await Promise.race([fetchPromise, hardTimeoutPromise])) as Response;
      } finally {
        clearTimeout(timeoutId);
      }

      const contentType = response.headers.get('content-type') || 'unknown';
      const rawResponse = await response.text();

      let data: any = null;
      if (contentType.includes('application/json')) {
        try {
          data = rawResponse ? JSON.parse(rawResponse) : null;
        } catch {
          console.error('Failed to parse JSON response from Wablas');
        }
      }

      return { response, contentType, rawResponse, data };
    };

    let proxyResult = await sendViaProxy();
    let response: Response;
    let contentType: string;
    let rawResponse: string;
    let data: any;

    if (proxyResult) {
      ({ response, contentType, rawResponse, data } = proxyResult);
    } else {
      ({ response, contentType, rawResponse, data } = await sendRequest(buildHeaders()));
    }

    console.log('Wablas response meta:', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      bodyPreview: rawResponse.substring(0, 300),
    });

    if (!response.ok) {
      console.error('Wablas HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: rawResponse.substring(0, 1000),
      });
      return {
        success: false,
        error:
          data?.message ||
          rawResponse ||
          `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    if (data?.status === false || data?.error) {
      console.error('Wablas business error:', data);
      return {
        success: false,
        error: data?.message || data?.error || 'Unknown error from Wablas',
      };
    }

    return {
      success: true,
      message: data?.message || 'Message sent successfully',
      data: data,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'WABLAS_PROXY_TIMEOUT') {
      console.error('WA proxy request timeout');
      return {
        success: false,
        error: 'Proxy timeout while calling VM /send endpoint',
      };
    }

    if (error instanceof Error && error.message === 'WABLAS_PROXY_HARD_TIMEOUT') {
      console.error('WA proxy hard timeout guard triggered');
      return {
        success: false,
        error: 'Proxy hard timeout while waiting VM /send response',
      };
    }

    if (error instanceof Error && error.message === 'WABLAS_HARD_TIMEOUT') {
      console.error('Wablas hard timeout guard triggered');
      return {
        success: false,
        error: 'Hard timeout while waiting for Wablas API response',
      };
    }

    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Wablas request timeout');
      return {
        success: false,
        error: 'Request timeout while calling Wablas API',
      };
    }

    console.error('Wablas send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build WhatsApp message for participant with QR code
 * @param peserta Participant data
 * @param eventName Event name
 * @returns Formatted message text
 */
export function buildParticipantMessage(
  peserta: {
    nama: string;
    kode_unik: string;
    qr_code_url?: string | null;
  },
  eventName: string
): string {
  const qrCodeSection = peserta.qr_code_url
    ? `\n🖼️ *QR Code Anda terlampir sebagai gambar pada pesan ini.*\n`
    : '';

  return `🎉 *Selamat Datang di ${eventName}!*

Assalamu'alaikum *${peserta.nama}*,

Terima kasih sudah mendaftar sebagai peserta Milad MU Travel! 🌟

📋 *Kode Peserta:* ${peserta.kode_unik}${qrCodeSection}
Simpan gambar QR Code ini untuk presensi dan mengikuti undian berhadiah!

Jangan lupa datang dan scan QR Code Anda untuk kesempatan memenangkan hadiah menarik! 🎁

_MU Travel NYATA - Nyaman, Amanah, Terjangkau. 💛

Wassalamu'alaikum Wr. Wb.`;
}

/**
 * Sleep/delay helper
 * @param ms Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
