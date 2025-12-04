import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { OrbitControls, Stars } from '@react-three/drei';
import { initializeHandTracking, detectHands } from './services/visionService';
import { getArtisticInsight } from './services/geminiService';
import { ParticleSystem } from './components/ParticleSystem';
import { Interface } from './components/Interface';
import { ShapeType, PRESETS, COLORS, CuratorInsight, HandGesture } from './types';

const getDistance = (p1: any, p2: any) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export default function App() {
  const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.HEART);
  const [currentColor, setCurrentColor] = useState<string>(COLORS[2]);
  const [insight, setInsight] = useState<CuratorInsight | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  
  const [gesture, setGesture] = useState<HandGesture>({
      leftPinch: 0,
      rightPinch: 0,
      handDistance: 0.5,
      handsDetected: false,
      leftHandPos: null,
      rightHandPos: null
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize Camera & Vision
  useEffect(() => {
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 1280, height: 720, facingMode: "user" } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadeddata = () => {
                   videoRef.current?.play();
                   requestRef.current = requestAnimationFrame(loop);
                };
            }
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    const initVision = async () => {
        await initializeHandTracking();
        startCamera();
    };

    initVision();

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Hand Tracking Loop
  const loop = () => {
      if (videoRef.current) {
          const result = detectHands(videoRef.current);
          
          let newGesture: HandGesture = {
              leftPinch: 0,
              rightPinch: 0,
              handDistance: 0.5,
              handsDetected: false,
              leftHandPos: null,
              rightHandPos: null
          };

          if (result && result.landmarks.length > 0) {
              newGesture.handsDetected = true;
              
              const hand1 = result.landmarks[0];
              const hand2 = result.landmarks.length > 1 ? result.landmarks[1] : null;

              const pinch1 = getDistance(hand1[4], hand1[8]);
              newGesture.rightPinch = Math.max(0, Math.min(1, (0.15 - pinch1) / 0.13)); 
              newGesture.rightHandPos = { x: hand1[8].x, y: hand1[8].y };

              if (hand2) {
                  const pinch2 = getDistance(hand2[4], hand2[8]);
                  newGesture.leftPinch = Math.max(0, Math.min(1, (0.15 - pinch2) / 0.13));
                  newGesture.leftHandPos = { x: hand2[8].x, y: hand2[8].y };

                  const dist = getDistance(hand1[0], hand2[0]);
                  newGesture.handDistance = Math.max(0, Math.min(2, dist * 2));
              } else {
                  newGesture.handDistance = 0.5;
                  if (hand1[0].x < 0.5) {
                      newGesture.leftPinch = newGesture.rightPinch;
                      newGesture.leftHandPos = newGesture.rightHandPos;
                      newGesture.rightHandPos = null;
                      newGesture.rightPinch = 0;
                  }
              }
          }

          setGesture(newGesture);
      }
      requestRef.current = requestAnimationFrame(loop);
  };

  // AI Curator
  useEffect(() => {
    let active = true;
    
    const fetchInsight = async () => {
        setIsAiLoading(true);
        const data = await getArtisticInsight(currentShape, currentColor);
        if (active) {
            setInsight(data);
            setIsAiLoading(false);
        }
    };

    const timeout = setTimeout(fetchInsight, 1000); 

    return () => {
        active = false;
        clearTimeout(timeout);
    };
  }, [currentShape, currentColor]);

  // Audio Toggle
  const toggleAudio = async () => {
    if (isAudioActive) {
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
            analyserRef.current = null;
        }
        setIsAudioActive(false);
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            
            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;
            setIsAudioActive(true);
        } catch (e) {
            console.error("Microphone access denied", e);
        }
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video ref={videoRef} className="absolute top-0 left-0 opacity-0 pointer-events-none" playsInline muted />

      <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: false }}>
        <color attach="background" args={['#020202']} />
        
        {/* Environment */}
        <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
        
        {/* Particles */}
        <ParticleSystem 
            shape={currentShape} 
            color={currentColor} 
            gesture={gesture} 
            config={PRESETS[currentShape]}
            audioAnalyser={analyserRef}
        />

        {/* Cinematic Post Processing */}
        <EffectComposer disableNormalPass>
            <Bloom 
                luminanceThreshold={0.1} 
                mipmapBlur 
                intensity={1.2} 
                radius={0.8}
            />
            <Noise opacity={0.08} />
            <Vignette eskil={false} offset={0.1} darkness={0.8} />
        </EffectComposer>

        <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate={!gesture.handsDetected}
            autoRotateSpeed={0.3}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
        />
      </Canvas>

      <Interface 
        currentShape={currentShape} 
        setShape={setCurrentShape}
        currentColor={currentColor}
        setColor={setCurrentColor}
        insight={insight}
        gesture={gesture}
        isLoading={isAiLoading}
        onToggleAudio={toggleAudio}
        isAudioActive={isAudioActive}
      />
    </div>
  );
}