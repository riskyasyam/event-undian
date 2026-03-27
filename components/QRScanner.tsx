'use client';

/**
 * QR Code Scanner Component
 * Uses device camera to scan QR codes
 */

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [scanDetected, setScanDetected] = useState(false);
  const isProcessingRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const startScanning = async () => {
    try {
      setError('');
      
      // Check camera permission
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        setCameraPermission('granted');
      }

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Prevent double detection - skip if already processing
          if (isProcessingRef.current) return;
          
          // Success callback - show green feedback
          isProcessingRef.current = true;
          setScanDetected(true);
          
          setTimeout(() => {
            onScanSuccess(decodedText);
            setScanDetected(false);
          }, 500); // Brief green flash before processing
          
          // Prevent new scans for 5 seconds after successful detection
          // Don't reset in stopScanning, only here to ensure consistency
          setTimeout(() => {
            isProcessingRef.current = false;
            stopScanning();
          }, 5000);
        },
        (errorMessage) => {
          // Error callback (can be ignored for scanning process)
          // This fires frequently during scanning, so we don't show it
        }
      );

      setIsScanning(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start camera';
      setError(errorMsg);
      setCameraPermission('denied');
      if (onScanError) {
        onScanError(errorMsg);
      }
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
        setScanDetected(false);
        // Don't reset isProcessingRef here - let it be controlled by the callback timeout
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => {
          console.error('Error stopping scanner on unmount:', err);
        });
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Scanner Container */}
      <div className={`relative bg-black rounded-lg overflow-hidden border-2 transition-all duration-300 ${
        scanDetected 
          ? 'border-green-500 shadow-lg shadow-green-500/50 bg-green-950/20' 
          : 'border-yellow-500/20'
      }`}>
        <div id="qr-reader" className="w-full min-h-[300px] md:min-h-[400px]" />
        
        {scanDetected && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-6xl mb-3 animate-bounce">✅</div>
              <p className="text-green-400 font-bold text-lg">QR Terdeteksi!</p>
            </div>
          </div>
        )}
        
        {!isScanning && !scanDetected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-6">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <p className="text-white font-semibold">Kamera Belum Aktif</p>
              <p className="text-gray-400 text-sm mt-2">Klik tombol Start untuk memulai scan</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-500 text-sm">
            <strong>Error:</strong> {error}
          </p>
          {cameraPermission === 'denied' && (
            <p className="text-red-400 text-xs mt-2">
              💡 Tip: Pastikan Anda mengizinkan akses kamera di browser settings
            </p>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition shadow-lg shadow-yellow-500/50"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Start Camera
            </span>
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition shadow-lg shadow-red-500/50"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Stop Camera
            </span>
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-yellow-500 text-sm font-semibold mb-2">📱 Cara Menggunakan:</p>
        <ol className="text-gray-300 text-sm space-y-1 ml-4 list-decimal">
          <li>Klik tombol "Start Camera"</li>
          <li>Izinkan akses kamera jika diminta browser</li>
          <li>Arahkan kamera ke QR Code peserta</li>
          <li>Scanner akan otomatis membaca QR Code</li>
          <li>Presensi akan tersimpan otomatis</li>
        </ol>
      </div>
    </div>
  );
}
