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
  const secretHeaderName = process.env.WABLAS_SECRET_HEADER || 'secret-key';

  if (!token && !secretKey) {
    throw new Error('WABLAS auth is not configured. Set WABLAS_TOKEN or WABLAS_SECRET_KEY');
  }

  try {
    // Format phone number (remove +, spaces, dashes)
    const formattedPhone = input.phone.replace(/[^\d]/g, '');
    
    // Add country code if not present (Indonesia: 62)
    const phoneWithCountryCode = formattedPhone.startsWith('62') 
      ? formattedPhone 
      : `62${formattedPhone.startsWith('0') ? formattedPhone.slice(1) : formattedPhone}`;

    // Wablas API endpoint - adjust based on your Wablas domain
    // Format: https://[your-domain].wablas.com/api/send-message
    const baseUrl = process.env.WABLAS_API_URL || 'https://console.wablas.com';
    const apiUrl = `${baseUrl}/api/send-message`;
    const timeoutMs = Number(process.env.WABLAS_TIMEOUT_MS || '20000');

    // Prepare request body
    const body: any = {
      phone: phoneWithCountryCode,
      message: input.message,
    };

    // Add image if provided (only if subscription supports media)
    if (input.image) {
      body.image = input.image;
    }

    console.log('Sending to Wablas:', {
      apiUrl,
      phone: phoneWithCountryCode,
      timeoutMs,
      hasToken: Boolean(token),
      hasSecretKey: Boolean(secretKey),
      secretHeaderName,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = token;
      }

      if (secretKey) {
        headers[secretHeaderName] = secretKey;
      }

      // Send request to Wablas with timeout protection.
      // Promise.race acts as a hard timeout guard in case abort signal is ignored upstream.
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

    console.log('Wablas response meta:', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      bodyPreview: rawResponse.substring(0, 300),
    });

    let data: any = null;
    if (contentType.includes('application/json')) {
      try {
        data = rawResponse ? JSON.parse(rawResponse) : null;
      } catch {
        console.error('Failed to parse JSON response from Wablas');
      }
    }

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
    ? `\n🔗 *QR Code Anda:*\n${peserta.qr_code_url}\n\nSilakan buka link di atas untuk menampilkan QR Code Anda.\n` 
    : '';

  return `🎉 *Selamat Datang di ${eventName}!*

Assalamu'alaikum *${peserta.nama}*,

Terima kasih sudah mendaftar sebagai peserta Milad MU Travel! 🌟

📋 *Kode Peserta:* ${peserta.kode_unik}${qrCodeSection}
Simpan QR Code ini untuk presensi dan mengikuti undian berhadiah!

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
