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
  const authMode = (process.env.WABLAS_AUTH_MODE || 'auto').toLowerCase();
  const timeoutMs = Number(process.env.WABLAS_TIMEOUT_MS || '20000');

  if (!token && !secretKey) {
    throw new Error('WABLAS_TOKEN or WABLAS_SECRET_KEY is required. Configure in .env file.');
  }

  try {
    // Format phone number (remove +, spaces, dashes)
    const formattedPhone = input.phone.replace(/[^\d]/g, '');
    
    // Add country code if not present (Indonesia: 62)
    const phoneWithCountryCode = formattedPhone.startsWith('62') 
      ? formattedPhone 
      : `62${formattedPhone.startsWith('0') ? formattedPhone.slice(1) : formattedPhone}`;

    // Wablas API endpoint (v1)
    const baseUrl = process.env.WABLAS_API_URL || 'https://console.wablas.com';
    const textApiUrl = `${baseUrl}/api/send-message`;
    const imageApiUrl = `${baseUrl}/api/send-image`;
    const imageFromLocalApiUrl = `${baseUrl}/api/send-image-from-local`;
    const isImageMessage = Boolean(input.image);
    const apiUrl = isImageMessage ? imageApiUrl : textApiUrl;

    // Wablas v1 API is more reliable with x-www-form-urlencoded payload.
    const body = new URLSearchParams();
    body.set('phone', phoneWithCountryCode);

    if (isImageMessage) {
      body.set('image', input.image || '');
      if (input.message) {
        body.set('caption', input.message);
      }
    } else {
      body.set('message', input.message);
    }

    type AuthAttempt =
      | 'token'
      | 'token-bearer'
      | 'combined'
      | 'combined-bearer'
      | 'token-query-combined';

    const buildHeaders = (attempt: AuthAttempt): Record<string, string> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      const combinedToken = token && secretKey ? `${token}.${secretKey}` : token || '';

      if (attempt === 'token' && token) {
        headers['Authorization'] = token;
      }

      if (attempt === 'token-bearer' && token) {
        headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }

      if ((attempt === 'combined' || attempt === 'token-query-combined') && combinedToken) {
        headers['Authorization'] = combinedToken;
      }

      if (attempt === 'combined-bearer' && combinedToken) {
        headers['Authorization'] = combinedToken.startsWith('Bearer ')
          ? combinedToken
          : `Bearer ${combinedToken}`;
      }

      return headers;
    };

    const resolveAttempts = (): AuthAttempt[] => {
      if (useSecretOnly) {
        // Wablas send-message still requires token, so secret-only cannot be used.
        return token && secretKey ? ['combined', 'token-query-combined', 'combined-bearer'] : [];
      }

      if (authMode === 'token') {
        return token ? ['token', 'token-bearer'] : [];
      }

      if (authMode === 'secret') {
        return token && secretKey ? ['combined', 'token-query-combined', 'combined-bearer'] : [];
      }

      if (authMode === 'both') {
        if (token && secretKey) return ['combined', 'token-query-combined', 'combined-bearer', 'token', 'token-bearer'];
        if (token) return ['token', 'token-bearer'];
        return [];
      }

      // auto mode: most compatible first
      if (token && secretKey) return ['combined', 'token-query-combined', 'combined-bearer', 'token', 'token-bearer'];
      if (token) return ['token', 'token-bearer'];
      return [];
    };

    const attempts = resolveAttempts();

    if (attempts.length === 0) {
      throw new Error('No valid Wablas auth strategy can be built from current environment variables.');
    }

    console.log('Sending WA:', {
      apiUrl,
      phone: phoneWithCountryCode,
      timeoutMs,
      configuredAuthMode: useSecretOnly ? 'secret-only' : authMode,
      attempts,
      hasToken: Boolean(token),
      hasSecretKey: Boolean(secretKey),
    });

    const sendRequest = async (
      endpointUrl: string,
      payload: URLSearchParams,
      headers: Record<string, string>,
      attempt: AuthAttempt
    ) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        const fetchUrl =
          attempt === 'token-query-combined' && token && secretKey
            ? `${endpointUrl}?token=${encodeURIComponent(`${token}.${secretKey}`)}`
            : endpointUrl;

        const fetchPromise = fetch(fetchUrl, {
          method: 'POST',
          headers,
          body: payload.toString(),
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

    const trySendImageFromLocal = async () => {
      if (!input.image) return null;

      try {
        const imageController = new AbortController();
        const imageTimeoutId = setTimeout(() => imageController.abort(), timeoutMs);

        let imageResponse: Response;
        try {
          imageResponse = await fetch(input.image, {
            method: 'GET',
            signal: imageController.signal,
            cache: 'no-store',
          });
        } finally {
          clearTimeout(imageTimeoutId);
        }

        if (!imageResponse.ok) {
          console.warn('Failed to fetch image for local upload fallback:', {
            url: input.image,
            status: imageResponse.status,
            statusText: imageResponse.statusText,
          });
          return null;
        }

        const contentType = imageResponse.headers.get('content-type') || 'image/png';
        const arrayBuffer = await imageResponse.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        if (fileBuffer.length === 0) {
          console.warn('Image content is empty for local upload fallback:', { url: input.image });
          return null;
        }

        const pathPart = input.image.split('?')[0] || '';
        const detectedName = pathPart.split('/').pop() || '';
        const extensionFromType =
          contentType.includes('jpeg')
            ? 'jpg'
            : contentType.includes('png')
            ? 'png'
            : contentType.includes('gif')
            ? 'gif'
            : 'png';
        const fileName =
          detectedName && /\.[a-z0-9]+$/i.test(detectedName)
            ? detectedName
            : `qrcode.${extensionFromType}`;

        const localImageBody = new URLSearchParams();
        localImageBody.set('phone', phoneWithCountryCode);
        if (input.message) {
          localImageBody.set('caption', input.message);
        }
        localImageBody.set('file', fileBuffer.toString('base64'));
        localImageBody.set(
          'data',
          JSON.stringify({
            name: fileName,
            type: contentType,
            size: fileBuffer.length,
          })
        );

        let localFallbackResult: {
          response: Response;
          contentType: string;
          rawResponse: string;
          data: any;
          attempt: AuthAttempt;
        } | null = null;

        for (let i = 0; i < attempts.length; i++) {
          const attempt = attempts[i];
          const result = await sendRequest(
            imageFromLocalApiUrl,
            localImageBody,
            buildHeaders(attempt),
            attempt
          );
          localFallbackResult = { ...result, attempt };

          const localFallbackText = `${result.data?.message || ''} ${result.rawResponse || ''}`.toLowerCase();
          const isAuthRelatedLocalFallbackError =
            localFallbackText.includes('token invalid') ||
            localFallbackText.includes('device expired') ||
            localFallbackText.includes('need secret key') ||
            localFallbackText.includes('secret key') ||
            localFallbackText.includes('access denied') ||
            localFallbackText.includes('not authorized') ||
            localFallbackText.includes('unauthorized') ||
            localFallbackText.includes('forbidden') ||
            localFallbackText.includes('whitelist') ||
            localFallbackText.includes('ip');

          const canRetryAuthLocalFallback =
            (result.response.status === 401 ||
              result.response.status === 403 ||
              (result.response.status >= 500 && isAuthRelatedLocalFallbackError)) &&
            i < attempts.length - 1;

          if (result.response.ok) {
            break;
          }

          if (!canRetryAuthLocalFallback) {
            break;
          }
        }

        if (!localFallbackResult) {
          return null;
        }

        console.log('Wablas response meta (image-from-local fallback):', {
          usedAttempt: localFallbackResult.attempt,
          status: localFallbackResult.response.status,
          statusText: localFallbackResult.response.statusText,
          contentType: localFallbackResult.contentType,
          bodyPreview: localFallbackResult.rawResponse.substring(0, 300),
        });

        if (!localFallbackResult.response.ok) {
          return {
            success: false,
            error:
              localFallbackResult.data?.message ||
              localFallbackResult.rawResponse ||
              `HTTP ${localFallbackResult.response.status}: ${localFallbackResult.response.statusText}`,
          };
        }

        if (localFallbackResult.data?.status === false || localFallbackResult.data?.error) {
          return {
            success: false,
            error:
              localFallbackResult.data?.message ||
              localFallbackResult.data?.error ||
              'Unknown error from Wablas',
          };
        }

        return {
          success: true,
          message:
            localFallbackResult.data?.message ||
            'Message sent successfully (image uploaded directly from local source)',
          data: localFallbackResult.data,
        };
      } catch (error) {
        console.warn('Failed to execute image-from-local fallback:', error);
        return null;
      }
    };

    let lastAttemptResult: {
      response: Response;
      contentType: string;
      rawResponse: string;
      data: any;
      attempt: AuthAttempt;
    } | null = null;

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      const result = await sendRequest(apiUrl, body, buildHeaders(attempt), attempt);
      lastAttemptResult = { ...result, attempt };

      const bodyText = `${result.data?.message || ''} ${result.rawResponse || ''}`.toLowerCase();
      const isAuthRelatedError =
        bodyText.includes('token invalid') ||
        bodyText.includes('device expired') ||
        bodyText.includes('need secret key') ||
        bodyText.includes('secret key') ||
        bodyText.includes('access denied') ||
        bodyText.includes('not authorized') ||
        bodyText.includes('unauthorized') ||
        bodyText.includes('forbidden') ||
        bodyText.includes('whitelist') ||
        bodyText.includes('ip');

      const canRetryAuth =
        (result.response.status === 401 ||
          result.response.status === 403 ||
          (result.response.status >= 500 && isAuthRelatedError)) &&
        i < attempts.length - 1;

      if (result.response.ok) {
        break;
      }

      if (canRetryAuth) {
        console.warn('Wablas auth attempt failed, retrying with next strategy:', {
          attempt,
          status: result.response.status,
          hint: bodyText.includes('secret key')
            ? 'server requested secret key'
            : bodyText.includes('ip')
            ? 'response mentions IP restriction'
            : 'auth failure',
        });
        continue;
      }

      break;
    }

    if (!lastAttemptResult) {
      throw new Error('Wablas request did not run');
    }

    const {
      response,
      contentType,
      rawResponse,
      data,
      attempt: usedAttempt,
    } = lastAttemptResult;

    const responseText = `${data?.message || ''} ${rawResponse || ''}`.toLowerCase();
    const mediaNotSupported =
      isImageMessage &&
      !response.ok &&
      (responseText.includes('your package not support') ||
        responseText.includes('package not support') ||
        responseText.includes('not support'));

    const imageUrlInvalidOrUnreachable =
      isImageMessage &&
      !response.ok &&
      (responseText.includes('image invalid') ||
        responseText.includes('invalid image') ||
        responseText.includes('cannot access image') ||
        responseText.includes('failed get image'));

    if (imageUrlInvalidOrUnreachable) {
      console.warn('Wablas could not read image URL directly, retrying with image-from-local upload fallback.');
      const localImageFallbackResult = await trySendImageFromLocal();
      if (localImageFallbackResult) {
        return localImageFallbackResult;
      }
    }

    if (mediaNotSupported) {
      console.warn('Wablas media sending is not supported by package, retrying as text-only message.');

      const textOnlyBody = new URLSearchParams();
      textOnlyBody.set('phone', phoneWithCountryCode);
      textOnlyBody.set('message', input.message);

      let textFallbackResult: {
        response: Response;
        contentType: string;
        rawResponse: string;
        data: any;
        attempt: AuthAttempt;
      } | null = null;

      for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        const result = await sendRequest(textApiUrl, textOnlyBody, buildHeaders(attempt), attempt);
        textFallbackResult = { ...result, attempt };

        const fallbackText = `${result.data?.message || ''} ${result.rawResponse || ''}`.toLowerCase();
        const isAuthRelatedFallbackError =
          fallbackText.includes('token invalid') ||
          fallbackText.includes('device expired') ||
          fallbackText.includes('need secret key') ||
          fallbackText.includes('secret key') ||
          fallbackText.includes('access denied') ||
          fallbackText.includes('not authorized') ||
          fallbackText.includes('unauthorized') ||
          fallbackText.includes('forbidden') ||
          fallbackText.includes('whitelist') ||
          fallbackText.includes('ip');

        const canRetryAuthFallback =
          (result.response.status === 401 ||
            result.response.status === 403 ||
            (result.response.status >= 500 && isAuthRelatedFallbackError)) &&
          i < attempts.length - 1;

        if (result.response.ok) {
          break;
        }

        if (!canRetryAuthFallback) {
          break;
        }
      }

      if (textFallbackResult) {
        const fallbackData = textFallbackResult.data;
        console.log('Wablas response meta (text fallback):', {
          usedAttempt: textFallbackResult.attempt,
          status: textFallbackResult.response.status,
          statusText: textFallbackResult.response.statusText,
          contentType: textFallbackResult.contentType,
          bodyPreview: textFallbackResult.rawResponse.substring(0, 300),
        });

        if (!textFallbackResult.response.ok) {
          return {
            success: false,
            error:
              fallbackData?.message ||
              textFallbackResult.rawResponse ||
              `HTTP ${textFallbackResult.response.status}: ${textFallbackResult.response.statusText}`,
          };
        }

        if (fallbackData?.status === false || fallbackData?.error) {
          return {
            success: false,
            error: fallbackData?.message || fallbackData?.error || 'Unknown error from Wablas',
          };
        }

        return {
          success: true,
          message:
            fallbackData?.message ||
            'Message sent successfully (text-only fallback because media package is not supported)',
          data: fallbackData,
        };
      }
    }

    console.log('Wablas response meta:', {
      usedAttempt,
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
  eventName: string,
  eventDate?: Date | string | null,
  eventLocation?: string | null
): string {
  const qrCodeSection = peserta.qr_code_url
    ? `\n🖼️ *QR Code Anda terlampir sebagai gambar pada pesan ini.*\n`
    : '';

  const formattedDate = eventDate
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta',
      }).format(new Date(eventDate))
    : '-';
  const formattedLocation = eventLocation || '-';

  return `🎉 *Selamat Datang di Reuni Akbar, Halal bi Halal, dan Milad MU Travel 2026!*

Assalamu'alaikum *${peserta.nama}*,

Terima kasih sudah mendaftar sebagai peserta Milad MU Travel! 🌟

📅 *Tanggal Acara:* Sabtu, 25 April 2026
⏰ *Waktu Mulai:* 16:00 WIB
📍 *Tempat:* ${formattedLocation}

📋 *Kode Peserta:* ${peserta.kode_unik}${qrCodeSection}
Simpan gambar QR Code ini untuk presensi dan mengikuti undian berhadiah!

Jangan lupa datang dan scan QR Code Anda untuk kesempatan memenangkan hadiah menarik! 🎁

MU Travel NYATA - Nyaman, Amanah, Terjangkau. 💛

Wassalamu'alaikum Wr. Wb.

*Catatan: Jika ada double pesan, gunakan salah satu saja. Mohon maaf atas ketidaknyamanan ini.*
`
;
}

/**
 * Sleep/delay helper
 * @param ms Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
