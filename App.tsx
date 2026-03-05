import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeSelfiForFlower } from './services/geminiService';
import { AppState, FlowerResult } from './types';

export default function App() {
  const [state, setState] = useState<AppState>('landing');
  const [result, setResult] = useState<FlowerResult | null>(null);
  const [flowerColor, setFlowerColor] = useState('#ff6b9d');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setState('camera');
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please allow camera permissions and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setState('capturing');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Mirror and crop to square
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    stopCamera();

    // Flash effect
    await new Promise((r) => setTimeout(r, 300));
    setState('analyzing');

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];

    try {
      const flowerResult = await analyzeSelfiForFlower(base64);
      setResult(flowerResult);
      setFlowerColor(flowerResult.color);
      setState('result');
    } catch {
      setState('camera');
      startCamera();
    }
  }, [stopCamera, startCamera]);

  const tryAgain = useCallback(() => {
    setResult(null);
    setState('landing');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center overflow-hidden"
      style={{
        background: `linear-gradient(145deg, #0a0a0a 0%, ${flowerColor}15 50%, #0a0a0a 100%)`,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Decorative petals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {state === 'result' && <FloatingPetals color={flowerColor} />}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {state === 'landing' && <LandingScreen onStart={startCamera} />}
      {(state === 'camera' || state === 'capturing') && (
        <CameraScreen videoRef={videoRef} onCapture={captureAndAnalyze} isCapturing={state === 'capturing'} />
      )}
      {state === 'analyzing' && <AnalyzingScreen canvasRef={canvasRef} />}
      {state === 'result' && result && (
        <ResultScreen result={result} canvasRef={canvasRef} onTryAgain={tryAgain} />
      )}
    </div>
  );
}

/* ---- Landing Screen ---- */
function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-8 animate-fade-in">
      <div className="text-6xl mb-2">🌸</div>
      <div>
        <h1
          className="text-4xl font-semibold tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Flower Power
        </h1>
        <p className="text-white/50 mt-3 text-sm max-w-[260px] leading-relaxed">
          Take a selfie and discover what flower matches your vibe
        </p>
      </div>
      <button
        onClick={onStart}
        className="mt-4 px-8 py-4 rounded-full text-base font-medium text-black transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #ff6b9d, #ffa751)',
          boxShadow: '0 4px 24px rgba(255, 107, 157, 0.3)',
        }}
      >
        Find My Flower
      </button>
      <p className="text-white/20 text-xs absolute bottom-6">powered by AI</p>
    </div>
  );
}

/* ---- Camera Screen ---- */
function CameraScreen({
  videoRef,
  onCapture,
  isCapturing,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onCapture: () => void;
  isCapturing: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-6 px-6">
      {/* Flash overlay */}
      {isCapturing && (
        <div className="absolute inset-0 bg-white z-50 animate-flash" />
      )}

      <p className="text-white/40 text-sm tracking-wider uppercase">Strike a pose</p>

      <div className="relative">
        <div
          className="w-72 h-72 rounded-full overflow-hidden border-2 border-white/10"
          style={{ boxShadow: '0 0 40px rgba(255,107,157,0.15)' }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>
        {/* Focus ring */}
        <div className="absolute inset-0 rounded-full border-2 border-white/5 animate-pulse-slow" />
      </div>

      <button
        onClick={onCapture}
        disabled={isCapturing}
        className="mt-4 w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center transition-all active:scale-90 hover:border-white/60"
      >
        <div
          className="w-14 h-14 rounded-full"
          style={{ background: 'linear-gradient(135deg, #ff6b9d, #ffa751)' }}
        />
      </button>
      <p className="text-white/25 text-xs">Tap to capture</p>
    </div>
  );
}

/* ---- Analyzing Screen ---- */
function AnalyzingScreen({
  canvasRef,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
      <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-white/10 animate-pulse">
        <CanvasPreview canvasRef={canvasRef} />
      </div>
      <div className="text-center">
        <p className="text-white/70 text-lg">Reading your petals{dots}</p>
        <p className="text-white/30 text-xs mt-2">Consulting the garden</p>
      </div>
      <div className="flex gap-2">
        {['🌷', '🌻', '🌹', '🌸', '🌺'].map((e, i) => (
          <span
            key={i}
            className="text-2xl animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---- Result Screen ---- */
function ResultScreen({
  result,
  canvasRef,
  onTryAgain,
}: {
  result: FlowerResult;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onTryAgain: () => void;
}) {
  return (
    <div className="flex flex-col items-center h-full w-full overflow-y-auto py-12 px-6 gap-6 animate-fade-in">
      {/* Photo */}
      <div
        className="w-36 h-36 rounded-full overflow-hidden border-2 shrink-0"
        style={{ borderColor: result.color + '60' }}
      >
        <CanvasPreview canvasRef={canvasRef} />
      </div>

      {/* Flower name */}
      <div className="text-center">
        <span className="text-5xl block mb-2">{result.emoji}</span>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">You are a</p>
        <h2
          className="text-3xl font-semibold"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: result.color,
          }}
        >
          {result.flowerName}
        </h2>
        <p
          className="text-sm font-medium mt-1 px-3 py-1 rounded-full inline-block"
          style={{
            background: result.color + '20',
            color: result.color,
          }}
        >
          {result.trait}
        </p>
      </div>

      {/* Description */}
      <p className="text-white/70 text-center text-sm leading-relaxed max-w-[300px]">
        {result.description}
      </p>

      {/* Fun fact */}
      <div
        className="w-full max-w-[300px] rounded-2xl p-4 text-center"
        style={{ background: result.color + '10', border: `1px solid ${result.color}20` }}
      >
        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Fun Fact</p>
        <p className="text-white/60 text-sm">{result.funFact}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-2 shrink-0 pb-4">
        <button
          onClick={onTryAgain}
          className="px-6 py-3 rounded-full text-sm font-medium text-black transition-all active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${result.color}, ${result.color}cc)`,
            boxShadow: `0 4px 20px ${result.color}40`,
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Flower Power',
                text: `I'm a ${result.flowerName}! ${result.emoji} — ${result.trait}`,
              });
            }
          }}
          className="px-6 py-3 rounded-full text-sm font-medium border border-white/10 text-white/70 transition-all active:scale-95"
        >
          Share
        </button>
      </div>
    </div>
  );
}

/* ---- Canvas Preview Helper ---- */
function CanvasPreview({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (canvasRef.current) {
      setSrc(canvasRef.current.toDataURL('image/jpeg', 0.9));
    }
  }, [canvasRef]);
  return src ? <img src={src} className="w-full h-full object-cover" alt="selfie" /> : null;
}

/* ---- Floating Petals Animation ---- */
function FloatingPetals({ color }: { color: string }) {
  const petals = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 4 + Math.random() * 4,
    size: 8 + Math.random() * 16,
  }));

  return (
    <>
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute animate-fall"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            borderRadius: '50% 0 50% 50%',
            background: color + '30',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </>
  );
}
