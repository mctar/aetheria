import React, { useState, useEffect } from 'react';
import { ShapeType, COLORS, CuratorInsight, HandGesture } from '../types';

interface InterfaceProps {
  currentShape: ShapeType;
  setShape: (s: ShapeType) => void;
  currentColor: string;
  setColor: (c: string) => void;
  insight: CuratorInsight | null;
  gesture: HandGesture;
  isLoading: boolean;
  onToggleAudio: () => void;
  isAudioActive: boolean;
}

export const Interface: React.FC<InterfaceProps> = ({
  currentShape,
  setShape,
  currentColor,
  setColor,
  insight,
  gesture,
  isLoading,
  onToggleAudio,
  isAudioActive
}) => {
  const [showTutorial, setShowTutorial] = useState(true);

  // Auto-hide tutorial when hands are detected
  useEffect(() => {
    if (gesture.handsDetected) {
        const timer = setTimeout(() => setShowTutorial(false), 4000);
        return () => clearTimeout(timer);
    }
  }, [gesture.handsDetected]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 md:p-8 overflow-hidden">
      
      {/* Background Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-start pointer-events-auto z-20">
        <div className="group cursor-default">
          <h1 className="text-5xl md:text-7xl font-serif italic font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-500 group-hover:tracking-normal">
            Aetheria
          </h1>
          <div className="h-px w-0 group-hover:w-32 bg-white transition-all duration-700 ease-out" />
          <p className="text-xs md:text-sm text-gray-400 mt-2 font-mono uppercase tracking-[0.3em]">
            Matter · Energy · Consciousness
          </p>
        </div>
        
        {/* Status Indicator & Audio Toggle */}
        <div className="flex flex-col items-end gap-3">
             {/* Audio Toggle */}
             <button 
                onClick={onToggleAudio}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-xl transition-all duration-300 ${isAudioActive ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
            >
                 <span className="text-lg">{isAudioActive ? '🔊' : '🔇'}</span>
                 <span className="text-xs font-mono font-bold">{isAudioActive ? 'AUDIO LINKED' : 'ENABLE AUDIO'}</span>
            </button>

            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 backdrop-blur-xl transition-all duration-500 ${gesture.handsDetected ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5'}`}>
                <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${gesture.handsDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400/50'}`} />
                <span className={`text-xs font-mono font-bold ${gesture.handsDetected ? 'text-green-200' : 'text-gray-500'}`}>
                    {gesture.handsDetected ? 'NEURAL SYNC ESTABLISHED' : 'AWAITING INPUT'}
                </span>
            </div>
        </div>
      </header>

      {/* GESTURE TUTORIAL OVERLAY */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 ${showTutorial ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl flex flex-col md:flex-row gap-8 items-center text-center shadow-2xl">
              <div className="flex flex-col items-center gap-3">
                  <div className="text-4xl">👐</div>
                  <div className="text-white font-bold tracking-wider">EXPAND</div>
                  <p className="text-xs text-gray-400 font-mono">Move hands apart</p>
              </div>
              <div className="w-px h-12 bg-white/20 hidden md:block" />
              <div className="flex flex-col items-center gap-3">
                  <div className="text-4xl">🤏</div>
                  <div className="text-white font-bold tracking-wider">CHAOS</div>
                  <p className="text-xs text-gray-400 font-mono">Pinch to disrupt</p>
              </div>
              <div className="w-px h-12 bg-white/20 hidden md:block" />
               <div className="flex flex-col items-center gap-3">
                  <div className="text-4xl">👋</div>
                  <div className="text-white font-bold tracking-wider">ATTRACT</div>
                  <p className="text-xs text-gray-400 font-mono">Move hands to pull</p>
              </div>
          </div>
          <p className="text-center text-white/50 mt-4 text-xs font-mono animate-pulse">Raise your hands to begin</p>
      </div>

      {/* Main Controls (Right Side) */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-12 pointer-events-auto z-20">
        {/* Shape Selector */}
        <div className="flex flex-col gap-3 items-end">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 rotate-90 origin-bottom-right mb-6 mr-[-15px]">Blueprint</span>
            {Object.values(ShapeType).map((shape) => (
                <button
                    key={shape}
                    onClick={() => setShape(shape)}
                    className={`group relative flex items-center justify-end gap-4 transition-all duration-300 ${currentShape === shape ? 'opacity-100 translate-x-0' : 'opacity-30 hover:opacity-100 translate-x-2'}`}
                >
                    <span className="text-xs font-mono tracking-widest uppercase hidden md:block group-hover:text-white transition-colors">{shape}</span>
                    <div className={`w-2 h-2 md:w-3 md:h-3 border border-white rotate-45 transition-all duration-500 ${currentShape === shape ? 'bg-white scale-125 shadow-[0_0_15px_white]' : 'bg-transparent'}`} />
                </button>
            ))}
        </div>

        {/* Color Selector */}
        <div className="flex flex-col gap-4 items-end mt-4">
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 rotate-90 origin-bottom-right mb-6 mr-[-15px]">Spectrum</span>
             {COLORS.map((c) => (
                 <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-3 h-3 rounded-full transition-all duration-500 relative ${currentColor === c ? 'scale-150 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-125 opacity-50 hover:opacity-100'}`}
                    style={{ backgroundColor: c, boxShadow: currentColor === c ? `0 0 20px ${c}` : 'none' }}
                 >
                    {currentColor === c && <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{backgroundColor: c}} />}
                 </button>
             ))}
        </div>
      </div>

      {/* AI Insight */}
      <div className="w-full max-w-lg pointer-events-auto z-20">
        <div className={`relative overflow-hidden rounded-sm bg-gradient-to-r from-black/80 to-transparent border-l-2 ${isLoading ? 'border-white/20' : 'border-white'} p-6 transition-all duration-700`}>
            {isLoading && (
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            )}
            
            <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-serif italic text-white mb-3 tracking-wide">
                    {insight ? insight.title : "Initializing Neural Link..."}
                </h2>
                
                {insight && (
                    <div className="space-y-3">
                        <div>
                            <span className="text-[10px] text-blue-300 uppercase tracking-widest font-bold">Scientific Principle</span>
                            <p className="text-sm text-gray-300 font-light leading-relaxed font-mono mt-1 border-l border-blue-500/30 pl-3">
                                {insight.scientificPrinciple}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-purple-300 uppercase tracking-widest font-bold">Poetic Truth</span>
                            <p className="text-sm text-gray-300 font-light leading-relaxed italic mt-1 border-l border-purple-500/30 pl-3">
                                "{insight.poeticTruth}"
                            </p>
                        </div>
                    </div>
                )}
                 {!insight && (
                     <p className="text-xs text-gray-500 font-mono animate-pulse">Establishing connection with the curator...</p>
                 )}
            </div>
            
            <div className="mt-6 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                 <span className="text-[9px] uppercase tracking-widest text-white/60">
                    Analysis by Gemini 2.5 Flash
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};