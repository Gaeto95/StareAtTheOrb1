import React, { useEffect, useState } from 'react';

interface ProjectElevenMessageProps {
  show: boolean;
  onComplete: () => void;
  staringTime: number;
  onSpeak?: (message: string) => void;
}

const ProjectElevenMessage: React.FC<ProjectElevenMessageProps> = ({ show, onComplete, staringTime, onSpeak }) => {
  const [visible, setVisible] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''} and ${secs} second${secs !== 1 ? 's' : ''}`;
    }
    return `${secs} second${secs !== 1 ? 's' : ''}`;
  };

  useEffect(() => {
    if (show && !hasSpoken) {
      setVisible(true);
      setHasSpoken(true);
      
      // Log to console
      console.log('🎉 CONGRATULATIONS! 🎉');
      console.log(`You wasted exactly ${formatTime(staringTime)} staring at a glowing circle.`);
      console.log('The orb stares back... and judges your life choices.');
      console.log('Achievement unlocked: Professional Time Waster');
      
      // Speak the message once when it appears
      const congratsMessage = `Congratulations! You wasted exactly ${formatTime(staringTime)} staring at a glowing circle. The orb stares back and judges your life choices.`;
      if (onSpeak) {
        // Delay speech slightly to let the message appear first
        setTimeout(() => {
          console.log('🎤 Inactivity message speaking...');
          onSpeak(congratsMessage);
        }, 500);
      }
      
      // Hide after 5 seconds (longer to account for speech)
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 500);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete, staringTime, onSpeak, hasSpoken]);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex: 1000 }}
    >
      <div className="text-center max-w-2xl mx-4">
        {/* Semi-transparent background box for better readability */}
        <div 
          className="bg-black/70 backdrop-blur-md rounded-2xl p-8 border border-white/20"
          style={{
            boxShadow: '0 0 50px rgba(0, 0, 0, 0.8), inset 0 0 50px rgba(255, 255, 255, 0.1)'
          }}
        >
          <div 
            className="text-white text-3xl md:text-4xl font-bold tracking-wide animate-pulse mb-4"
            style={{
              textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 215, 0, 0.6)'
            }}
          >
            🎉 CONGRATULATIONS! 🎉
          </div>
          <div 
            className="text-white text-xl md:text-2xl font-medium tracking-wide mb-4"
            style={{
              textShadow: '0 0 15px rgba(255, 255, 255, 0.6)'
            }}
          >
            You wasted exactly <span className="text-yellow-300 font-mono font-bold">{formatTime(staringTime)}</span>
          </div>
          <div 
            className="text-white/90 text-lg md:text-xl font-medium tracking-wide animate-pulse"
            style={{
              textShadow: '0 0 15px rgba(255, 255, 255, 0.6)'
            }}
          >
            The orb stares back... and judges your life choices.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectElevenMessage;