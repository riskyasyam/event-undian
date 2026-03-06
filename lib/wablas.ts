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

  if (!token) {
    throw new Error('WABLAS_TOKEN environment variable is not set');
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

    // Prepare request body
    const body: any = {
      phone: phoneWithCountryCode,
      message: input.message,
    };

    // Add image if provided (only if subscription supports media)
    if (input.image) {
      body.image = input.image;
    }

    console.log('Sending to Wablas:', { apiUrl, phone: phoneWithCountryCode });

    // Send request to Wablas
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(body),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Non-JSON response from Wablas:', textResponse.substring(0, 500));
      return {
        success: false,
        error: `Invalid response from Wablas API. Check token and API URL. Status: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    if (data.status === false || data.error) {
      return {
        success: false,
        error: data.message || data.error || 'Unknown error from Wablas',
      };
    }

    return {
      success: true,
      message: data.message || 'Message sent successfully',
      data: data,
    };
  } catch (error) {
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
