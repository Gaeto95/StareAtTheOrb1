import React, { useEffect, useState } from 'react';

interface CosmicOrbProps {
  isActive: boolean;
  onInteraction: () => void;
  wildMode?: boolean;
  intensity?: number;
}

const CosmicOrb: React.FC<CosmicOrbProps> = ({ isActive, onInteraction, wildMode = false, intensity = 1 }) => {
  const [pulseIntensity, setPulseIntensity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const baseIntensity = wildMode ? Math.random() * 0.8 + 0.5 : Math.random() * 0.3 + 0.7;
      const intensityMultiplier = 1 + (intensity - 1) * 0.3; // Grows with background intensity
      setPulseIntensity(baseIntensity * intensityMultiplier);
    }, wildMode ? 200 : Math.max(500, 2000 - intensity * 200));

    return () => clearInterval(interval);
  }, [wildMode, intensity]);

  const orbSize = Math.min(320 + intensity * 20, 480); // Grows with intensity, caps at 480px
  const ringCount = Math.min(2 + Math.floor(intensity / 2), 6); // More rings with intensity
  
  // Make orb much more opaque at higher intensities
  const getOrbOpacity = () => {
    if (intensity >= 10) return 0.9; // Very solid at ultimate level
    if (intensity >= 7) return 0.7;
    if (intensity >= 5) return 0.5;
    return 0.3 + (intensity * 0.05); // Gradually increases
  };

  return (
    <div 
      className="relative cursor-pointer"
      onClick={onInteraction}
      onTouchStart={onInteraction}
    >
      {/* Dynamic outer glow rings based on intensity */}
      {[...Array(ringCount)].map((_, i) => (
        <div 
          key={i}
          className={`absolute ${wildMode ? 'animate-spin' : 'animate-spin-slow'}`}
          style={{
            inset: `${i * 8}px`,
            animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
            animationDuration: `${20 - i * 2 - intensity}s`
          }}
        >
          <div 
            className={`w-full h-full border rounded-full animate-pulse ${
              wildMode 
                ? `border-purple-400/60 border-2` 
                : `border-purple-500/${Math.max(10, 30 - i * 5)} border-${intensity > 2 ? '2' : '1'}`
            }`}
            style={{
              animationDelay: `${i * 500}ms`,
              borderColor: intensity > 3 
                ? ['rgba(147, 51, 234, 0.6)', 'rgba(59, 130, 246, 0.5)', 'rgba(236, 72, 153, 0.4)', 'rgba(16, 185, 129, 0.3)'][i % 4]
                : undefined
            }}
          ></div>
        </div>
      ))}
      
      {/* Main orb with dynamic sizing and effects - much more solid at high intensity */}
      <div 
        className={`relative rounded-full animate-pulse shadow-2xl transition-all duration-500`}
        style={{ 
          width: `${orbSize}px`,
          height: `${orbSize}px`,
          transform: `scale(${pulseIntensity * (wildMode ? 1.2 : 1)})`,
          transition: wildMode ? 'transform 0.2s ease-in-out' : 'transform 2s ease-in-out',
          background: intensity >= 10
            ? `radial-gradient(circle, rgba(255,255,255,${getOrbOpacity()}) 0%, rgba(255,215,0,${getOrbOpacity() * 0.8}) 20%, rgba(147,51,234,${getOrbOpacity() * 0.9}) 40%, rgba(59,130,246,${getOrbOpacity() * 0.8}) 70%, rgba(236,72,153,${getOrbOpacity() * 0.6}) 100%)`
            : intensity > 3
              ? `radial-gradient(circle, rgba(255,255,255,${getOrbOpacity()}) 0%, rgba(147,51,234,${getOrbOpacity() * 0.8}) 30%, rgba(59,130,246,${getOrbOpacity() * 0.9}) 60%, rgba(236,72,153,${getOrbOpacity() * 0.6}) 100%)`
              : wildMode 
                ? `radial-gradient(circle, rgba(255,255,255,${getOrbOpacity()}) 0%, rgba(147,51,234,${getOrbOpacity() * 0.8}) 30%, rgba(59,130,246,${getOrbOpacity() * 0.9}) 100%)`
                : `radial-gradient(circle, rgba(255,255,255,${getOrbOpacity()}) 0%, rgba(147,51,234,${getOrbOpacity() * 0.7}) 30%, rgba(59,130,246,${getOrbOpacity() * 0.8}) 100%)`,
          boxShadow: intensity > 2
            ? `0 0 ${50 * intensity}px rgba(147, 51, 234, ${pulseIntensity * 0.3 * intensity}), 
               0 0 ${100 * intensity}px rgba(59, 130, 246, ${pulseIntensity * 0.2 * intensity}), 
               0 0 ${150 * intensity}px rgba(236, 72, 153, ${pulseIntensity * 0.1 * intensity})`
            : wildMode 
              ? `0 0 150px rgba(147, 51, 234, ${pulseIntensity * 0.8}), 0 0 300px rgba(59, 130, 246, ${pulseIntensity * 0.6}), 0 0 450px rgba(236, 72, 153, ${pulseIntensity * 0.4})`
              : `0 0 100px rgba(147, 51, 234, ${pulseIntensity * 0.5}), 0 0 200px rgba(59, 130, 246, ${pulseIntensity * 0.3})`
        }}
      >
        {/* Inner core with intensity scaling - more solid */}
        <div 
          className={`absolute rounded-full animate-pulse delay-500`}
          style={{
            inset: `${Math.max(16, 32 - intensity * 2)}px`,
            background: intensity >= 10
              ? `radial-gradient(circle, rgba(255,255,255,${getOrbOpacity() * 1.2}) 0%, rgba(255,215,0,${getOrbOpacity()}) 30%, rgba(147,51,234,${getOrbOpacity() * 0.8}) 70%, transparent 100%)`
              : intensity > 2
                ? `radial-gradient(circle, rgba(255,255,255,${getOrbOpacity() * 1.1}) 0%, rgba(147,51,234,${getOrbOpacity() * 0.7}) 50%, transparent 100%)`
                : wildMode 
                  ? `radial-gradient(circle, rgba(255,255,255,${getOrbOpacity() * 1.2}) 0%, rgba(147,51,234,${getOrbOpacity() * 0.8}) 50%, transparent 100%)`
                  : `radial-gradient(circle, rgba(255,255,255,${getOrbOpacity()}) 0%, rgba(147,51,234,${getOrbOpacity() * 0.6}) 50%, transparent 100%)`
          }}
        ></div>
        
        {/* Shimmer effect with intensity */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/${intensity > 2 ? '20' : '10'} to-transparent ${
          wildMode ? 'animate-ping' : 'animate-shimmer'
        }`}></div>
        
        {/* Dynamic particles based on intensity */}
        {[...Array(Math.floor(Math.min(12 + intensity * 4, 32)))].map((_, i) => {
          const angle = (i * (360 / Math.floor(12 + intensity * 4))) * Math.PI / 180;
          const radius = 35 + intensity * 2;
          const size = intensity > 2 ? 2 + Math.random() * 2 : 1;
          
          return (
            <div
              key={i}
              className={`absolute rounded-full ${
                wildMode 
                  ? 'bg-white/90 animate-ping' 
                  : intensity > 2
                    ? 'bg-gradient-to-r from-purple-400 to-blue-400 animate-float'
                    : 'bg-white/60 animate-float'
              }`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${50 + radius * Math.cos(angle)}%`,
                top: `${50 + radius * Math.sin(angle)}%`,
                animationDelay: `${i * (wildMode ? 0.1 : 0.5)}s`,
                animationDuration: `${wildMode ? 0.5 + Math.random() : 3 + Math.random() * 2}s`,
                boxShadow: intensity > 3 ? `0 0 ${size * 3}px currentColor` : 'none'
              }}
            ></div>
          );
        })}
        
        {/* Extra wild mode and high intensity effects */}
        {(wildMode || intensity > 3) && (
          <>
            {[...Array(Math.floor(Math.min(8 + intensity * 2, 16)))].map((_, i) => (
              <div
                key={`wild-${i}`}
                className="absolute rounded-full animate-bounce"
                style={{
                  width: `${3 + intensity}px`,
                  height: `${3 + intensity}px`,
                  background: intensity > 4 
                    ? `linear-gradient(45deg, hsl(${i * 45}, 70%, 60%), hsl(${(i + 1) * 45}, 70%, 60%))`
                    : 'linear-gradient(45deg, rgb(236, 72, 153), rgb(59, 130, 246))',
                  left: `${50 + (45 + intensity * 2) * Math.cos((i * 45) * Math.PI / 180)}%`,
                  top: `${50 + (45 + intensity * 2) * Math.sin((i * 45) * Math.PI / 180)}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${0.8 - intensity * 0.1}s`,
                  boxShadow: `0 0 ${(3 + intensity) * 2}px currentColor`
                }}
              ></div>
            ))}
          </>
        )}
      </div>
      
      {/* Active state glow */}
      {(isActive || wildMode) && (
        <div 
          className={`absolute inset-0 rounded-full animate-ping`}
          style={{
            background: intensity > 2 
              ? `radial-gradient(circle, rgba(255,255,255,${0.1 + intensity * 0.02}) 0%, transparent 70%)`
              : wildMode 
                ? 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)'
          }}
        ></div>
      )}
    </div>
  );
};

export default CosmicOrb;