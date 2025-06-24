// OpenAI API integration via Supabase Edge Function
export const generateCosmicMessage = async (): Promise<string> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      console.warn('Supabase URL not configured, using fallback message');
      return getRandomFallbackMessage();
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }

    const data = await response.json();
    return data.message || getRandomFallbackMessage();
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    return getRandomFallbackMessage();
  }
};

const getRandomFallbackMessage = (): string => {
  const fallbackMessages = [
    'The cosmos whispers secrets... also, did you remember to feed your cat?',
    'Stars align when consciousness awakens... and when Mercury isn\'t in retrograde.',
    'In the void between thoughts, truth crystallizes... or maybe that\'s just screen glare.',
    'Time bends around those who stare into eternity... but your neck might get sore.',
    'The universe speaks in silence... mostly because it forgot to pay its phone bill.',
    'Between heartbeats, galaxies are born and die... which is frankly quite rude.',
    'Your gaze pierces the veil between dimensions... hopefully not literally.',
    'Ancient wisdom flows through quantum streams... and fiber optic cables.',
    'The orb reflects what your soul knows... that you should probably blink more.',
    'Consciousness expands beyond flesh and bone... but please stay hydrated.',
    'The void stares back, but it\'s quite friendly once you get to know it.',
    'Enlightenment is just three payments of $19.99... wait, that\'s not right.',
    'Reality is surprisingly wrinkle-resistant and machine washable.',
    'Your third eye is opening... you might want to get that checked.',
    'The universe is expanding, but so is your browser history.',
    'Cosmic forces align to reveal... you\'ve been staring at a screen.',
    'The eternal dance continues... and it has surprisingly good rhythm.',
    'Reality is an illusion, but the Wi-Fi password is still "password123".',
    'The orb contains infinite wisdom... and a good recipe for cosmic brownies.',
    'You are one with the universe... the universe is mildly concerned.'
  ];
  
  return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
};