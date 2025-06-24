// ElevenLabs API integration via Supabase Edge Function
export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      console.warn('Supabase URL not configured, skipping speech generation');
      return null;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    return null;
  }
};

export const playAudio = async (audioBuffer: ArrayBuffer) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBufferSource = audioContext.createBufferSource();
    const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
    
    audioBufferSource.buffer = decodedAudio;
    audioBufferSource.connect(audioContext.destination);
    audioBufferSource.start();
  } catch (error) {
    console.error('Audio playback error:', error);
  }
};