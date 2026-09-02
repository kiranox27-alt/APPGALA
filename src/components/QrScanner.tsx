import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

interface QrScannerProps {
  onScan: (decoded: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setReady(true);

        scannerRef.current = new Html5Qrcode('qr-decode-area', { verbose: false });

        let lastScan = 0;
        const scanLoop = async (now: number) => {
          if (!scanningRef.current || !mounted) return;
          if (now - lastScan > 400 && videoRef.current && videoRef.current.readyState >= 2) {
            lastScan = now;
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 480;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              try {
                const blob = await new Promise<Blob | null>((res) =>
                  canvas.toBlob(res, 'image/jpeg', 0.7),
                );
                if (blob && scanningRef.current && scannerRef.current) {
                  const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
                  const decoded = await scannerRef.current.scanFile(file, false);
                  if (decoded && mounted) {
                    scanningRef.current = false;
                    onScan(decoded);
                    return;
                  }
                }
              } catch {
                // No QR found in this frame — continue scanning
              }
            }
          }
          requestAnimationFrame(scanLoop);
        };
        requestAnimationFrame(scanLoop);
      } catch {
        if (!mounted) return;
        setError('Cámara no disponible o permiso denegado.');
      }
    }

    start();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [onScan, stopCamera]);

  function handleClose() {
    stopCamera();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-gold-400">
          <Camera className="w-5 h-5" />
          <span className="text-sm font-light tracking-[0.2em] uppercase">Escáner QR</span>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Cerrar cámara"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {error ? (
          <div className="text-center max-w-sm animate-fade-in-up">
            <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <p className="text-white/80 font-light leading-relaxed mb-6">{error}</p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-full border border-gold-400/50 text-gold-400 hover:bg-gold-400/10 transition-colors text-sm tracking-wide"
            >
              Volver
            </button>
          </div>
        ) : (
          <>
            <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden border border-gold-400/30 shadow-gold relative bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-lg" />
              {ready && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 max-w-[80%] max-h-[80%] rounded-xl border-2 border-gold-400/80 animate-pulse-ring" />
                </div>
              )}
            </div>
            {!ready && (
              <p className="absolute text-white/60 text-sm font-light mt-4 animate-pulse">
                Iniciando cámara…
              </p>
            )}
            <p className="text-white/50 text-xs font-light mt-6 text-center max-w-xs tracking-wide">
              Enfocá el código QR del pase del invitado
            </p>
          </>
        )}
      </div>

      <div className="flex justify-center pb-6">
        <button
          onClick={handleClose}
          className="px-6 py-2.5 rounded-full border border-white/20 text-white/70 hover:bg-white/10 transition-colors text-sm tracking-wide"
        >
          Cerrar cámara
        </button>
      </div>

      <div id="qr-decode-area" style={{ display: 'none' }} />
    </div>
  );
}
