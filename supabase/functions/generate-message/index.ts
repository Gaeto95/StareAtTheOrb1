const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      // Return absurdly funny cosmic nonsense if no API key
      const fallbackMessages = [
        'The universe whispers... but it forgot to turn on its microphone again.',
        'Quantum entanglement is just the universe playing cosmic twister.',
        'Your chakras are aligned... with a parking meter in Nebraska.',
        'The void stares back and asks if you have any snacks.',
        'Enlightenment is 42% off at the cosmic clearance sale.',
        'Reality is a simulation... running on Windows Vista.',
        'The stars spell out your destiny: "Error 404: Fate not found."',
        'Ancient wisdom flows like... really slow Wi-Fi.',
        'You are one with everything... except your car keys.',
        'The cosmic dance continues... but someone stepped on the universe\'s toes.',
        'Time is an illusion... lunch time doubly so.',
        'The orb contains infinite wisdom... and a decent recipe for pancakes.',
        'Consciousness expands beyond flesh... into your browser history.',
        'The eternal now is buffering... please wait.',
        'Your third eye is opening... it needs glasses.',
        'The universe is expanding... so is your student debt.',
        'Cosmic forces align to reveal... you left the stove on.',
        'The void whispers secrets... mostly about expired warranties.',
        'Reality bends around you... because you sat on it.',
        'The multiverse converges... at a really awkward angle.',
        'Stardust flows through your veins... also caffeine.',
        'The cosmic web connects all... except your internet.',
        'Infinity loops back on itself... like a cosmic donut.',
        'The universe speaks in mathematics... but failed algebra.',
        'Your aura is glowing... might want to check that radiation detector.',
        'The eternal dance of existence... has two left feet.',
        'Quantum mechanics suggests... you should probably call a mechanic.',
        'The fabric of spacetime... needs fabric softener.',
        'Cosmic consciousness awakens... hits snooze button.',
        'The universe is a hologram... projected by a very confused projector.'
      ];
      
      const message = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
      
      return new Response(
        JSON.stringify({ message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a cosmic oracle that speaks profound nonsense. Mix deep spiritual concepts with absurd everyday observations. Be mystical yet hilariously illogical. Keep responses under 15 words. Make it sound wise but completely ridiculous.'
          },
          {
            role: 'user',
            content: 'Speak cosmic wisdom that makes no sense.'
          }
        ],
        max_tokens: 30,
        temperature: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }
    
    const message = data.choices[0].message.content || 'The universe speaks in silence... mostly because it forgot to pay its phone bill.';

    return new Response(
      JSON.stringify({ message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Message generation error:', error);
    
    // Return absurdly funny cosmic nonsense on error
    const fallbackMessages = [
      'The cosmos whispers... but it forgot to turn on its microphone again.',
      'Your chakras are aligned... with a parking meter in Nebraska.',
      'The void stares back and asks if you have any snacks.',
      'Reality is a simulation... running on Windows Vista.',
      'The orb contains infinite wisdom... and a decent recipe for pancakes.',
      'The universe is expanding... so is your student debt.',
      'Cosmic forces align to reveal... you left the stove on.',
      'The multiverse converges... at a really awkward angle.',
      'Stardust flows through your veins... also caffeine.',
      'The eternal dance of existence... has two left feet.'
    ];
    
    const message = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    
    return new Response(
      JSON.stringify({ message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});