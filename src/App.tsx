import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Clock, Music, Music as MusicOff, Eye } from 'lucide-react';
import CosmicOrb from './components/CosmicOrb';
import ProjectElevenMessage from './components/ProjectElevenMessage';
import UltimateAscensionMessage from './components/UltimateAscensionMessage';
import { generateCosmicMessage } from './lib/openai';
import { generateSpeech, playAudio } from './lib/elevenlabs';
import { trackEvent } from './lib/supabase';

function App() {
  const [isOrbActive, setIsOrbActive] = useState(false);
  const [showProjectEleven, setShowProjectEleven] = useState(false);
  const [showUltimateAscension, setShowUltimateAscension] = useState(false);
  const [lastMouseMove, setLastMouseMove] = useState(Date.now());
  const [sessionStartTime] = useState(Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [staringTime, setStaringTime] = useState(0);
  const [isWildMode, setIsWildMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [backgroundIntensity, setBackgroundIntensity] = useState(1);
  const [hasReachedUltimate, setHasReachedUltimate] = useState(false);
  
  const mouseInactiveTimer = useRef<NodeJS.Timeout>();
  const voiceTimer = useRef<NodeJS.Timeout>();
  const staringTimer = useRef<NodeJS.Timeout>();
  const wildModeTimer = useRef<NodeJS.Timeout>();
  const inactivityTriggered = useRef(false);
  const ultimateTriggered = useRef(false);
  const lastApiCall = useRef<number>(0);
  const backgroundMusic = useRef<HTMLAudioElement | null>(null);
  
  // SPEECH PROTECTION - Maximum 1 speech per session
  const [speechCount, setSpeechCount] = useState(0);
  const MAX_TOTAL_SPEECHES = 1; // Only 1 speech allowed total
  const speechInProgress = useRef(false); // Prevent overlapping speeches

  // Initialize background music
  useEffect(() => {
    const musicFile = '/music/cosmic-ambient.mp3';
    
    backgroundMusic.current = new Audio(musicFile);
    backgroundMusic.current.loop = true;
    backgroundMusic.current.volume = 0.3;
    
    const playMusic = async () => {
      try {
        if (!isMusicMuted && backgroundMusic.current) {
          await backgroundMusic.current.play();
        }
      } catch (error) {
        console.log('Background music autoplay blocked, will play on first interaction');
      }
    };
    
    playMusic();
    
    return () => {
      if (backgroundMusic.current) {
        backgroundMusic.current.pause();
        backgroundMusic.current = null;
      }
    };
  }, []);

  // Handle music muting
  useEffect(() => {
    if (backgroundMusic.current) {
      if (isMusicMuted) {
        backgroundMusic.current.pause();
      } else {
        backgroundMusic.current.play().catch(console.log);
      }
    }
  }, [isMusicMuted]);

  // Progressive background intensity based on staring time - every 15 seconds
  useEffect(() => {
    const intensity = Math.min(1 + Math.floor(staringTime / 15), 10); // Increases every 15 seconds, caps at level 10
    setBackgroundIntensity(intensity);
    
    // Trigger Ultimate Ascension at level 10 (150 seconds of staring)
    if (intensity >= 10 && !ultimateTriggered.current) {
      ultimateTriggered.current = true;
      setHasReachedUltimate(true);
      setShowUltimateAscension(true);
      
      // IMMEDIATELY STOP ALL TIMERS AND PREVENT INACTIVITY MESSAGE
      if (voiceTimer.current) {
        clearInterval(voiceTimer.current);
        voiceTimer.current = undefined;
      }
      if (mouseInactiveTimer.current) {
        clearTimeout(mouseInactiveTimer.current);
        mouseInactiveTimer.current = undefined;
      }
      
      // Prevent inactivity message from showing
      inactivityTriggered.current = true;
      
      trackEvent('ultimate_ascension_achieved', {
        staring_duration: staringTime,
        intensity_level: intensity,
        session_duration: Date.now() - sessionStartTime,
        total_speeches: speechCount,
        timestamp: new Date().toISOString()
      });
      
      console.log('🏆 ULTIMATE ACHIEVEMENT UNLOCKED 🏆');
      console.log('You have mastered the art of time wasting...');
      console.log('The orb acknowledges your dedication to procrastination...');
    }
  }, [staringTime, sessionStartTime, speechCount]);

  // Staring timer - updates every second
  useEffect(() => {
    staringTimer.current = setInterval(() => {
      setStaringTime(prev => {
        const newTime = prev + 1;
        
        // Only trigger wild mode if we haven't reached ultimate level
        if (!hasReachedUltimate) {
          const wildInterval = Math.max(8, 25 - Math.floor(newTime / 15) * 2);
          if (newTime % wildInterval === 0 && newTime > 0) {
            setIsWildMode(true);
            trackEvent('wild_mode_activated', { 
              staring_duration: newTime,
              intensity_level: Math.floor(newTime / 15) + 1,
              timestamp: new Date().toISOString()
            });
            
            const wildDuration = Math.min(2000 + (newTime / 15) * 500, 10000);
            if (wildModeTimer.current) {
              clearTimeout(wildModeTimer.current);
            }
            wildModeTimer.current = setTimeout(() => {
              setIsWildMode(false);
            }, wildDuration);
          }
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (staringTimer.current) {
        clearInterval(staringTimer.current);
      }
      if (wildModeTimer.current) {
        clearTimeout(wildModeTimer.current);
      }
    };
  }, [hasReachedUltimate]);

  // Track session start
  useEffect(() => {
    trackEvent('session_start', { 
      timestamp: new Date().toISOString(),
      viewport: { width: window.innerWidth, height: window.innerHeight }
    });

    return () => {
      trackEvent('session_end', { 
        duration: Date.now() - sessionStartTime,
        staring_duration: staringTime,
        max_intensity: backgroundIntensity,
        ultimate_achieved: hasReachedUltimate,
        total_speeches: speechCount,
        timestamp: new Date().toISOString()
      });
    };
  }, [sessionStartTime, staringTime, backgroundIntensity, hasReachedUltimate, speechCount]);

  // SINGLE SPEECH FUNCTION - Maximum 1 speech per session
  const speakCosmicWisdom = useCallback(async (customMessage?: string, source?: string) => {
    // Prevent any speech if already used or in progress
    if (speechCount >= MAX_TOTAL_SPEECHES || speechInProgress.current) {
      console.log(`🚫 Speech blocked - Count: ${speechCount}/${MAX_TOTAL_SPEECHES}, InProgress: ${speechInProgress.current}, Source: ${source}`);
      return;
    }

    if (isGenerating) {
      console.log('🚫 Already generating, skipping...');
      return;
    }

    // Rate limiting - minimum 5 seconds between ANY speech attempts
    const now = Date.now();
    if (now - lastApiCall.current < 5000) {
      console.log(`🚫 Rate limited: ${Math.ceil((5000 - (now - lastApiCall.current)) / 1000)}s remaining`);
      return;
    }

    try {
      speechInProgress.current = true;
      setIsGenerating(true);
      setIsOrbActive(true);
      lastApiCall.current = now;
      setSpeechCount(prev => prev + 1);
      
      console.log(`🎤 SPEECH INITIATED - Source: ${source}, Count: ${speechCount + 1}/${MAX_TOTAL_SPEECHES}`);
      
      const message = customMessage || await generateCosmicMessage();
      console.log('🌌 Cosmic Oracle speaks:', message);
      
      trackEvent('ai_message_generated', { 
        message, 
        staring_duration: staringTime,
        speech_count: speechCount + 1,
        source: source || 'unknown',
        custom_message: !!customMessage
      });
      
      // Generate and play speech if not muted
      if (!isMuted) {
        try {
          const audioBuffer = await generateSpeech(message);
          if (audioBuffer) {
            await playAudio(audioBuffer);
            trackEvent('voice_played', { 
              message, 
              staring_duration: staringTime,
              speech_count: speechCount + 1,
              source: source || 'unknown'
            });
            console.log('✅ Speech completed successfully');
          }
        } catch (audioError) {
          console.error('Audio generation failed:', audioError);
          trackEvent('voice_error', { 
            error: audioError instanceof Error ? audioError.message : 'Audio error',
            message,
            staring_duration: staringTime,
            speech_count: speechCount + 1,
            source: source || 'unknown'
          });
        }
      } else {
        trackEvent('voice_skipped_muted', { 
          message, 
          staring_duration: staringTime,
          speech_count: speechCount + 1,
          source: source || 'unknown'
        });
        console.log('🔇 Speech skipped - muted');
      }
      
      setTimeout(() => setIsOrbActive(false), 1000);
    } catch (error) {
      console.error('Message generation error:', error);
      trackEvent('message_error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        staring_duration: staringTime,
        speech_count: speechCount + 1,
        source: source || 'unknown'
      });
      setIsOrbActive(false);
    } finally {
      setIsGenerating(false);
      speechInProgress.current = false;
    }
  }, [isMuted, staringTime, isGenerating, speechCount]);

  // NO AUTOMATIC VOICE CYCLE - COMPLETELY DISABLED
  useEffect(() => {
    console.log('🛑 Automatic speech generation is DISABLED');
    console.log('💬 Speech only available through manual triggers');
    console.log(`📊 Speech limit: ${speechCount}/${MAX_TOTAL_SPEECHES}`);
    
    // Clear any existing voice timers
    if (voiceTimer.current) {
      clearInterval(voiceTimer.current);
      voiceTimer.current = undefined;
    }
  }, [speechCount]);

  // Mouse movement tracking for inactivity message
  const handleMouseMove = useCallback(() => {
    setLastMouseMove(Date.now());
    
    // Try to play background music on first interaction
    if (backgroundMusic.current && !isMusicMuted) {
      backgroundMusic.current.play().catch(console.log);
    }
    
    // Reset the inactivity timer ONLY if ultimate hasn't been reached
    if (mouseInactiveTimer.current) {
      clearTimeout(mouseInactiveTimer.current);
    }
    
    if (!inactivityTriggered.current && !hasReachedUltimate && !ultimateTriggered.current) {
      mouseInactiveTimer.current = setTimeout(() => {
        if (!inactivityTriggered.current && !hasReachedUltimate && !ultimateTriggered.current) {
          inactivityTriggered.current = true;
          setShowProjectEleven(true);
          trackEvent('inactivity_message_shown', { 
            inactivity_duration: 66000,
            staring_duration: staringTime,
            intensity_level: backgroundIntensity,
            timestamp: new Date().toISOString()
          });
        }
      }, 66000);
    }
  }, [staringTime, isMusicMuted, backgroundIntensity, hasReachedUltimate]);

  // Mouse move listener
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleMouseMove);
    
    // Only set inactivity timer if ultimate hasn't been reached
    if (!hasReachedUltimate && !ultimateTriggered.current) {
      mouseInactiveTimer.current = setTimeout(() => {
        if (!inactivityTriggered.current && !hasReachedUltimate && !ultimateTriggered.current) {
          inactivityTriggered.current = true;
          setShowProjectEleven(true);
          trackEvent('inactivity_message_shown', { 
            inactivity_duration: 66000,
            staring_duration: staringTime,
            intensity_level: backgroundIntensity,
            timestamp: new Date().toISOString()
          });
        }
      }, 66000);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleMouseMove);
      if (mouseInactiveTimer.current) {
        clearTimeout(mouseInactiveTimer.current);
      }
    };
  }, [handleMouseMove, hasReachedUltimate]);

  const handleOrbInteraction = useCallback(() => {
    trackEvent('orb_interaction', { 
      staring_duration: staringTime,
      intensity_level: backgroundIntensity,
      speech_count: speechCount,
      timestamp: new Date().toISOString() 
    });
    
    // Only allow orb speech if under limit and not at ultimate level
    if (speechCount < MAX_TOTAL_SPEECHES && !hasReachedUltimate) {
      speakCosmicWisdom(undefined, 'orb_click');
    } else if (hasReachedUltimate) {
      console.log('🛑 Orb interaction disabled - Ultimate level active');
    } else {
      console.log('🛑 Orb interaction disabled - Speech limit reached');
    }
  }, [speakCosmicWisdom, staringTime, backgroundIntensity, speechCount, hasReachedUltimate]);

  const handleProjectElevenComplete = useCallback(() => {
    setShowProjectEleven(false);
  }, []);

  const handleUltimateAscensionComplete = useCallback(() => {
    setShowUltimateAscension(false);
  }, []);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    trackEvent('mute_toggled', { 
      muted: newMutedState,
      staring_duration: staringTime,
      intensity_level: backgroundIntensity,
      speech_count: speechCount,
      timestamp: new Date().toISOString()
    });
  }, [isMuted, staringTime, backgroundIntensity, speechCount]);

  const toggleMusic = useCallback(() => {
    const newMusicMutedState = !isMusicMuted;
    setIsMusicMuted(newMusicMutedState);
    trackEvent('music_toggled', { 
      muted: newMusicMutedState,
      staring_duration: staringTime,
      intensity_level: backgroundIntensity,
      timestamp: new Date().toISOString()
    });
  }, [isMusicMuted, staringTime, backgroundIntensity]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate dynamic background effects
  const getBackgroundEffects = () => {
    const intensity = backgroundIntensity;
    const wildMultiplier = isWildMode ? 3 : 1;
    const ultimateMultiplier = hasReachedUltimate ? 2 : 1;
    
    return {
      starCount: Math.floor(50 * intensity * wildMultiplier * ultimateMultiplier),
      gradientIntensity: Math.min(intensity * 0.4 * wildMultiplier * ultimateMultiplier, 1.0),
      pulseSpeed: Math.max(0.2, 2 - intensity * 0.4),
      glowIntensity: intensity * 0.3 * wildMultiplier * ultimateMultiplier
    };
  };

  const effects = getBackgroundEffects();

  return (
    <div className={`relative min-h-screen bg-black overflow-hidden transition-all duration-1000 ${
      isWildMode ? 'animate-pulse' : ''
    } ${hasReachedUltimate ? 'animate-pulse' : ''}`}>
      {/* Progressive cosmic background layers */}
      <div 
        className="absolute inset-0 transition-all duration-2000"
        style={{
          background: hasReachedUltimate ? `
            radial-gradient(circle at 20% 30%, rgba(147, 51, 234, ${effects.gradientIntensity}) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(59, 130, 246, ${effects.gradientIntensity * 0.9}) 0%, transparent 40%),
            radial-gradient(circle at 40% 80%, rgba(236, 72, 153, ${effects.gradientIntensity * 0.8}) 0%, transparent 40%),
            radial-gradient(circle at 60% 20%, rgba(16, 185, 129, ${effects.gradientIntensity * 0.7}) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(255, 215, 0, ${effects.gradientIntensity * 0.6}) 0%, transparent 30%),
            linear-gradient(45deg, rgba(147, 51, 234, ${effects.gradientIntensity * 0.2}) 0%, rgba(59, 130, 246, ${effects.gradientIntensity * 0.2}) 100%),
            black
          ` : `
            radial-gradient(circle at 20% 30%, rgba(147, 51, 234, ${effects.gradientIntensity}) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(59, 130, 246, ${effects.gradientIntensity * 0.8}) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(236, 72, 153, ${effects.gradientIntensity * 0.6}) 0%, transparent 50%),
            radial-gradient(circle at 60% 20%, rgba(16, 185, 129, ${effects.gradientIntensity * 0.4}) 0%, transparent 50%),
            linear-gradient(45deg, rgba(147, 51, 234, ${effects.gradientIntensity * 0.1}) 0%, rgba(59, 130, 246, ${effects.gradientIntensity * 0.1}) 100%),
            black
          `
        }}
      ></div>
      
      {/* Animated nebula clouds - intensity based */}
      {backgroundIntensity > 2 && (
        <>
          <div 
            className="absolute inset-0 opacity-40 animate-pulse"
            style={{
              background: `radial-gradient(ellipse 800px 400px at 30% 40%, rgba(147, 51, 234, ${0.4 * (hasReachedUltimate ? 1.5 : 1)}), transparent)`,
              animationDuration: `${effects.pulseSpeed * 4}s`
            }}
          ></div>
          <div 
            className="absolute inset-0 opacity-30 animate-pulse"
            style={{
              background: `radial-gradient(ellipse 600px 300px at 70% 60%, rgba(59, 130, 246, ${0.4 * (hasReachedUltimate ? 1.5 : 1)}), transparent)`,
              animationDuration: `${effects.pulseSpeed * 6}s`,
              animationDelay: '2s'
            }}
          ></div>
        </>
      )}
      
      {/* Swirling energy patterns - high intensity */}
      {backgroundIntensity > 3 && (
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute inset-0 animate-spin-slow"
            style={{
              background: hasReachedUltimate 
                ? `conic-gradient(from 0deg, transparent, rgba(255, 215, 0, 0.6), transparent, rgba(147, 51, 234, 0.5), transparent, rgba(59, 130, 246, 0.5), transparent)`
                : `conic-gradient(from 0deg, transparent, rgba(147, 51, 234, 0.4), transparent, rgba(59, 130, 246, 0.4), transparent)`,
              animationDuration: `${10 / backgroundIntensity}s`
            }}
          ></div>
        </div>
      )}

      {/* Ultimate level portal effect */}
      {hasReachedUltimate && (
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute inset-0 animate-spin"
            style={{
              background: `conic-gradient(from 0deg, rgba(255, 215, 0, 0.8), rgba(147, 51, 234, 0.6), rgba(59, 130, 246, 0.6), rgba(236, 72, 153, 0.6), rgba(16, 185, 129, 0.6), rgba(255, 215, 0, 0.8))`,
              animationDuration: '3s',
              borderRadius: '50%',
              filter: 'blur(2px)'
            }}
          ></div>
        </div>
      )}
      
      {/* Dynamic stars with varying intensity */}
      <div className="absolute inset-0">
        {[...Array(effects.starCount)].map((_, i) => {
          const size = backgroundIntensity > 3 ? Math.random() * 4 + 1 : 1;
          const opacity = Math.random() * 0.9 + 0.3;
          const color = hasReachedUltimate 
            ? ['white', 'rgb(255, 215, 0)', 'rgb(147, 51, 234)', 'rgb(59, 130, 246)', 'rgb(236, 72, 153)'][Math.floor(Math.random() * 5)]
            : backgroundIntensity > 2 
              ? ['white', 'rgb(147, 51, 234)', 'rgb(59, 130, 246)', 'rgb(236, 72, 153)'][Math.floor(Math.random() * 4)]
              : 'white';
          
          return (
            <div
              key={i}
              className={`absolute animate-twinkle ${
                isWildMode || hasReachedUltimate ? 'animate-ping' : ''
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                opacity: opacity * (isWildMode || hasReachedUltimate ? 1 : 0.8),
                borderRadius: '50%',
                boxShadow: backgroundIntensity > 2 ? `0 0 ${size * 3}px ${color}` : 'none',
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${isWildMode || hasReachedUltimate ? 0.2 + Math.random() * 0.3 : effects.pulseSpeed + Math.random() * 2}s`
              }}
            ></div>
          );
        })}
      </div>

      {/* Shooting stars - very high intensity */}
      {backgroundIntensity > 5 && (
        <div className="absolute inset-0">
          {[...Array(Math.min(backgroundIntensity - 4, hasReachedUltimate ? 12 : 6))].map((_, i) => (
            <div
              key={`shooting-${i}`}
              className="absolute w-1 h-1 bg-white animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: hasReachedUltimate ? 'rgb(255, 215, 0)' : 'white',
                animationDelay: `${i * 1.5}s`,
                animationDuration: hasReachedUltimate ? '0.2s' : '0.3s'
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Title with intensity-based effects and better contrast */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <h1 
          className={`text-white text-4xl md:text-6xl font-bold tracking-widest text-center transition-all duration-500 ${
            isWildMode || hasReachedUltimate ? 'animate-pulse text-7xl md:text-8xl tracking-wider' : ''
          }`}
          style={{
            textShadow: hasReachedUltimate 
              ? `0 0 ${25 * backgroundIntensity}px rgba(255, 215, 0, 1), 0 0 ${50 * backgroundIntensity}px rgba(255, 215, 0, 0.8), 0 0 ${75 * backgroundIntensity}px rgba(147, 51, 234, 0.6), 0 0 10px rgba(0, 0, 0, 0.8)`
              : backgroundIntensity > 2 
                ? `0 0 ${15 * backgroundIntensity}px rgba(147, 51, 234, 1), 0 0 ${30 * backgroundIntensity}px rgba(59, 130, 246, 0.8), 0 0 10px rgba(0, 0, 0, 0.8)`
                : '0 0 20px rgba(255, 255, 255, 0.8), 0 0 10px rgba(0, 0, 0, 0.8)',
            fontSize: backgroundIntensity > 3 ? `${4 + backgroundIntensity * 0.3}rem` : undefined,
            color: hasReachedUltimate ? 'rgba(255, 215, 0, 1)' : 'rgba(255, 255, 255, 1)'
          }}
        >
          {hasReachedUltimate ? 'MASTER PROCRASTINATOR' : 'STARE AT THE ORB'}
        </h1>
      </div>

      {/* Voice mute button - top left with better contrast */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full bg-black/60 hover:bg-black/80 transition-all duration-300 backdrop-blur-sm border-2 border-white/40 hover:border-white/60 ${
            isWildMode || hasReachedUltimate ? 'animate-bounce bg-purple-500/40 border-purple-400/60' : ''
          } ${speechCount >= MAX_TOTAL_SPEECHES ? 'border-red-400/60 bg-red-500/20' : ''} ${hasReachedUltimate ? 'border-yellow-400/60 bg-yellow-500/20' : ''}`}
          title={isMuted ? "Unmute cosmic voice" : hasReachedUltimate ? "Voice disabled at ultimate level" : speechCount >= MAX_TOTAL_SPEECHES ? `Speech limit reached (${speechCount}/${MAX_TOTAL_SPEECHES})` : "Mute cosmic voice"}
          style={{
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)'
          }}
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className={`w-6 h-6 ${hasReachedUltimate ? 'text-yellow-300' : speechCount >= MAX_TOTAL_SPEECHES ? 'text-red-300' : 'text-white'}`} />
          )}
        </button>
      </div>

      {/* Music mute button - top left, below voice button with better contrast */}
      <div className="absolute top-20 left-4 z-10">
        <button
          onClick={toggleMusic}
          className={`p-3 rounded-full bg-black/60 hover:bg-black/80 transition-all duration-300 backdrop-blur-sm border-2 border-white/40 hover:border-white/60 ${
            isWildMode || hasReachedUltimate ? 'animate-bounce bg-purple-500/40 border-purple-400/60' : ''
          }`}
          title={isMusicMuted ? "Unmute background music" : "Mute background music"}
          style={{
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)'
          }}
        >
          {isMusicMuted ? (
            <MusicOff className="w-6 h-6 text-white" />
          ) : (
            <Music className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Speech limit indicator */}
      {speechCount >= MAX_TOTAL_SPEECHES && !hasReachedUltimate && (
        <div className="absolute top-36 left-4 z-10">
          <div 
            className="p-2 px-3 rounded-full bg-red-500/30 backdrop-blur-sm border border-red-400/50 animate-pulse"
            style={{
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
            }}
          >
            <span className="text-red-300 text-xs font-bold">
              SPEECH USED ({speechCount}/{MAX_TOTAL_SPEECHES})
            </span>
          </div>
        </div>
      )}

      {/* Ultimate Achievement Badge - appears when reached level 10 with better contrast */}
      {hasReachedUltimate && (
        <div className="absolute top-36 left-4 z-10">
          <div 
            className="p-3 rounded-full bg-gradient-to-r from-yellow-400/40 to-purple-500/40 backdrop-blur-sm border-2 border-yellow-400/60 animate-pulse"
            style={{
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.6), 0 0 20px rgba(0, 0, 0, 0.8)'
            }}
          >
            <Eye className="w-6 h-6 text-yellow-300 animate-spin" />
          </div>
        </div>
      )}

      {/* Bolt logo - top right corner */}
      <div className="absolute top-4 right-4 z-10">
        <a href="https://bolt.new" target="_blank" rel="noopener noreferrer">
          <img 
            src="/images/logo-bottom.png" 
            alt="Bolt.new" 
            className={`h-32 opacity-70 hover:opacity-100 transition-all duration-300 ${
              isWildMode || hasReachedUltimate ? 'animate-pulse h-40 opacity-100' : ''
            }`}
            style={{
              filter: hasReachedUltimate 
                ? `drop-shadow(0 0 ${12 * backgroundIntensity}px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 5px rgba(0, 0, 0, 0.8))`
                : backgroundIntensity > 2 
                  ? `drop-shadow(0 0 ${8 * backgroundIntensity}px rgba(147, 51, 234, 0.6)) drop-shadow(0 0 5px rgba(0, 0, 0, 0.8))`
                  : 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.8))'
            }}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </a>
      </div>

      {/* Staring Timer - bottom right corner with better contrast */}
      <div className="absolute bottom-4 right-4 z-10">
        <div 
          className={`flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 backdrop-blur-sm border-2 border-white/40 transition-all duration-500 ${
            isWildMode || hasReachedUltimate ? 'bg-purple-500/50 border-purple-400/70 animate-bounce' : ''
          }`}
          style={{
            backgroundColor: hasReachedUltimate 
              ? `rgba(255, 215, 0, ${0.3 + backgroundIntensity * 0.05})`
              : backgroundIntensity > 2 
                ? `rgba(147, 51, 234, ${0.2 + backgroundIntensity * 0.08})`
                : 'rgba(0, 0, 0, 0.7)',
            boxShadow: hasReachedUltimate 
              ? `0 0 ${25 * backgroundIntensity}px rgba(255, 215, 0, ${effects.glowIntensity}), 0 0 20px rgba(0, 0, 0, 0.8)`
              : backgroundIntensity > 2 
                ? `0 0 ${15 * backgroundIntensity}px rgba(147, 51, 234, ${effects.glowIntensity}), 0 0 20px rgba(0, 0, 0, 0.8)`
                : '0 0 20px rgba(0, 0, 0, 0.8)'
          }}
        >
          <Clock className={`w-4 h-4 text-white ${isWildMode || hasReachedUltimate ? 'animate-spin' : ''}`} />
          <span className={`text-white font-mono text-sm font-bold ${
            isWildMode || hasReachedUltimate ? 'animate-pulse text-lg' : ''
          }`}>
            {formatTime(staringTime)}
          </span>
          {backgroundIntensity > 1 && (
            <span className={`text-xs animate-pulse ml-2 font-bold ${
              hasReachedUltimate ? 'text-yellow-300' : 'text-purple-300'
            }`}>
              {hasReachedUltimate ? 'ULTIMATE' : `LVL ${Math.floor(backgroundIntensity)}`}
            </span>
          )}
          {Math.floor(staringTime / 15) >= 1 && staringTime % 15 < 3 && !hasReachedUltimate && (
            <span className="text-cyan-300 text-xs animate-pulse ml-2 font-bold">ASCENDING</span>
          )}
          {isGenerating && !hasReachedUltimate && (
            <span className="text-yellow-300 text-xs animate-pulse ml-2 font-bold">CHANNELING...</span>
          )}
          {speechCount >= MAX_TOTAL_SPEECHES && !hasReachedUltimate && (
            <span className="text-red-300 text-xs animate-pulse ml-2 font-bold">SILENT</span>
          )}
          {hasReachedUltimate && (
            <span className="text-yellow-300 text-xs animate-pulse ml-2 font-bold">COMPLETE</span>
          )}
        </div>
      </div>

      {/* Main orb container */}
      <div className="flex items-center justify-center min-h-screen pt-16">
        <CosmicOrb 
          isActive={isOrbActive || isWildMode || hasReachedUltimate} 
          onInteraction={handleOrbInteraction}
          wildMode={isWildMode || hasReachedUltimate}
          intensity={backgroundIntensity}
        />
      </div>

      {/* Inactivity Message - ONLY shows if ultimate hasn't been reached */}
      {!hasReachedUltimate && (
        <ProjectElevenMessage 
          show={showProjectEleven} 
          onComplete={handleProjectElevenComplete}
          staringTime={staringTime}
          onSpeak={(message) => {
            if (speechCount < MAX_TOTAL_SPEECHES) {
              speakCosmicWisdom(message, 'inactivity_message');
            }
          }}
        />
      )}

      {/* Ultimate Ascension Message - ONLY speech source at ultimate level */}
      <UltimateAscensionMessage 
        show={showUltimateAscension} 
        onComplete={handleUltimateAscensionComplete}
        staringTime={staringTime}
        onSpeak={(message) => {
          if (speechCount < MAX_TOTAL_SPEECHES) {
            speakCosmicWisdom(message, 'ultimate_message');
          }
        }}
      />
    </div>
  );
}

export default App;