'use client';

/**
 * Public QR Scan Page
 * /scan
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [participantData, setParticipantData] = useState<{
    nama: string;
    kode_unik: string;
    event: {
      nama_event: string;
      tanggal: Date;
      lokasi: string;
    };
    already_attended: boolean;
  } | null>(null);

  useEffect(() => {
    if (token) {
      processScan();
    } else {
      setProcessing(false);
      setSuccess(false);
      setMessage('Invalid QR code. No token provided.');
    }
  }, [token]);

  const processScan = async () => {
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      setSuccess(data.success);
      setMessage(data.message);

      if (data.success && data.data) {
        setParticipantData(data.data);
      }
    } catch (error) {
      console.error('Scan error:', error);
      setSuccess(false);
      setMessage('An error occurred while processing your check-in. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-black to-gray-900 px-4">
        <div className="max-w-md w-full bg-linear-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-12 text-center border border-yellow-600/30">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-6"></div>
          <h2 className="text-3xl font-bold text-yellow-400 mb-2">Processing...</h2>
          <p className="text-gray-400">Please wait while we check you in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-black to-gray-900 px-4">
      <div className="max-w-md w-full bg-linear-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 border border-yellow-600/30">
        {/* Success State */}
        {success ? (
          <div className="text-center">
            {/* Success Icon */}
            <div className="mb-6">
              {participantData?.already_attended ? (
                <div className="text-8xl">ℹ️</div>
              ) : (
                <div className="text-8xl animate-bounce">✅</div>
              )}
            </div>

            {/* Success Message */}
            <h1 className="text-4xl font-bold bg-linear-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-4">
              {participantData?.already_attended ? 'Already Checked In' : 'Check-in Successful!'}
            </h1>

            {/* Participant Info */}
            {participantData && (
              <div className="bg-yellow-600/20 rounded-xl p-6 mb-6 text-left border border-yellow-600/40">
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-1">Kode Peserta</div>
                  <div className="text-xl font-bold text-yellow-400">{participantData.kode_unik}</div>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-1">Nama Peserta</div>
                  <div className="text-2xl font-bold text-white">{participantData.nama}</div>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-1">Event</div>
                  <div className="text-lg font-semibold text-white">
                    {participantData.event.nama_event}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Date</div>
                    <div className="text-sm font-medium text-gray-300">
                      {new Date(participantData.event.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Location</div>
                    <div className="text-sm font-medium text-gray-300">
                      {participantData.event.lokasi}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Message */}
            <div className="bg-green-600/20 border-l-4 border-green-500 p-4 mb-6 rounded">
              <p className="text-green-400 font-medium">{message}</p>
            </div>

            {/* Additional Info */}
            {!participantData?.already_attended && (
              <div className="text-center text-gray-400 mb-6">
                <p className="mb-2 text-lg">🎉 You are now registered for the event!</p>
                <p className="text-sm">You are eligible for the lottery draw.</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-sm text-gray-500 mt-8">
              MU Travel Milad Event &copy; 2026
            </div>
          </div>
        ) : (
          /* Error State */
          <div className="text-center">
            {/* Error Icon */}
            <div className="text-8xl mb-6">❌</div>

            {/* Error Message */}
            <h1 className="text-4xl font-bold text-red-400 mb-4">Check-in Failed</h1>

            {/* Error Details */}
            <div className="bg-red-600/20 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-red-400 font-medium">{message}</p>
            </div>

            {/* Help Text */}
            <div className="text-gray-400 mb-6">
              <p className="mb-2">Please check your QR code and try again.</p>
              <p className="text-sm">If the problem persists, please contact event staff.</p>
            </div>

            {/* Retry Button */}
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-linear-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold rounded-lg transition shadow-lg"
            >
              Try Again
            </button>

            {/* Footer */}
            <div className="text-sm text-gray-500 mt-8">
              MU Travel Milad Event &copy; 2026
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-black to-gray-900 px-4">
          <div className="max-w-md w-full bg-linear-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-12 text-center border border-yellow-600/30">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-6"></div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">Loading...</h2>
            <p className="text-gray-400">Please wait</p>
          </div>
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
