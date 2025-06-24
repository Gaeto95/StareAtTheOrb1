import React, { useEffect, useState } from 'react';

interface UltimateAscensionMessageProps {
  show: boolean;
  onComplete: () => void;
  staringTime: number;
  onSpeak?: (message: string) => void;
}

const UltimateAscensionMessage: React.FC<UltimateAscensionMessageProps> = ({ show, onComplete, staringTime, onSpeak }) => {
  const [visible, setVisible] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [hasSpoken, setHasSpoken] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''} and ${secs} second${secs !== 1 ? 's' : ''}`;
    }
    return `${secs} second${secs !== 1 ? 's' : ''}`;
  };

  const phases = [
    "🏆 ULTIMATE ACHIEVEMENT UNLOCKED 🏆",
    `You've officially wasted ${formatTime(staringTime)} of your life...`,
    "...staring at a fancy screensaver.",
    "The orb is impressed by your dedication to procrastination.",
    "Time well spent? The universe says... probably not. 🤷‍♂️"
  ];

  useEffect(() => {
    if (show && !hasSpoken) {
      setVisible(true);
      setCurrentPhase(0);
      setHasSpoken(true);
      
      // Log to console for the ultimate achievement
      console.log('🏆 ULTIMATE ACHIEVEMENT UNLOCKED 🏆');
      console.log('═══════════════════════════════════════════');
      console.log(`You've officially wasted ${formatTime(staringTime)} of your life`);
      console.log('staring at a fancy screensaver.');
      console.log('The orb is impressed by your dedication to procrastination.');
      console.log('═══════════════════════════════════════════');
      console.log('Achievement: Master of Time Wasting');
      console.log('Rank: Legendary Procrastinator');
      
      // Speak the ultimate achievement message once - ONLY speech at ultimate level
      if (onSpeak) {
        const ultimateMessage = `Ultimate achievement unlocked! You've officially wasted ${formatTime(staringTime)} of your life staring at a fancy screensaver. The orb is impressed by your dedication to procrastination. Time well spent? The universe says probably not.`;
        setTimeout(() => {
          console.log('🎤 Ultimate message speaking...');
          onSpeak(ultimateMessage);
        }, 1000);
      }
      
      // Phase progression
      const phaseTimer = setInterval(() => {
        setCurrentPhase(prev => {
          if (prev < phases.length - 1) {
            return prev + 1;
          } else {
            clearInterval(phaseTimer);
            // Hide after showing all phases (longer to account for speech)
            setTimeout(() => {
              setVisible(false);
              setTimeout(onComplete, 1000);
            }, 4000);
            return prev;
          }
        });
      }, 2500);
      
      return () => clearInterval(phaseTimer);
    }
  }, [show, onComplete, staringTime, onSpeak, hasSpoken]);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center pointer-events-none transition-all duration-1000 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex: 1000 }}
    >
      <div className="text-center max-w-4xl mx-4">
        {/* Semi-transparent background box for better readability */}
        <div 
          className="bg-black/80 backdrop-blur-lg rounded-3xl p-10 border border-yellow-400/30"
          style={{
            boxShadow: '0 0 80px rgba(0, 0, 0, 0.9), inset 0 0 80px rgba(255, 215, 0, 0.1), 0 0 120px rgba(255, 215, 0, 0.3)'
          }}
        >
          {/* Phase messages */}
          <div 
            className="text-white text-2xl md:text-4xl font-bold tracking-wide animate-pulse transition-all duration-1000 mb-6"
            style={{
              textShadow: currentPhase === 0 
                ? '0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 215, 0, 0.8), 0 0 90px rgba(147, 51, 234, 0.6)' 
                : '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)',
              color: currentPhase === 0 ? 'rgba(255, 215, 0, 1)' : 'rgba(255, 255, 255, 1)',
              minHeight: '4rem'
            }}
          >
            {phases[currentPhase]}
          </div>
          
          {/* Special trophy effect for first phase */}
          {currentPhase === 0 && (
            <div className="mb-6">
              <div 
                className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400/30 to-purple-500/30 backdrop-blur-md border-2 border-yellow-400/60 animate-pulse"
                style={{
                  boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), 0 0 80px rgba(147, 51, 234, 0.4)'
                }}
              >
                <span 
                  className="text-yellow-300 text-lg font-bold tracking-wider"
                  style={{
                    textShadow: '0 0 15px rgba(255, 215, 0, 0.8)'
                  }}
                >
                  Master Procrastinator
                </span>
              </div>
            </div>
          )}
          
          {/* Mystical decorations */}
          <div className="flex justify-center space-x-4">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="rounded-full animate-twinkle"
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: ['rgb(255, 215, 0)', 'rgb(147, 51, 234)', 'rgb(59, 130, 246)', 'rgb(236, 72, 153)', 'rgb(16, 185, 129)'][i % 5],
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '1s',
                  boxShadow: `0 0 15px currentColor`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Cosmic portal effect - moved outside the box */}
        <div 
          className="absolute inset-0 opacity-5 animate-spin-slow pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, rgba(255, 215, 0, 0.8), rgba(147, 51, 234, 0.6), rgba(59, 130, 246, 0.6), rgba(236, 72, 153, 0.6), rgba(16, 185, 129, 0.6), rgba(255, 215, 0, 0.8))',
            borderRadius: '50%',
            filter: 'blur(4px)',
            animationDuration: '8s'
          }}
        ></div>
      </div>
    </div>
  );
};

export default UltimateAscensionMessage;