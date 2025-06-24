import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// CHANGE THIS FOR EACH SITE
const SITE_NAME = 'your-site-name-here'; // e.g., 'cosmic-calculator', 'magic-8-ball', etc.

export const trackEvent = async (eventName, eventData = {}) => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured, skipping analytics');
      return;
    }

    await supabase
      .from('site_events')
      .insert({
        site_name: SITE_NAME,
        event_name: eventName,
        event_data: eventData,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href
      });

  } catch (err) {
    console.error('Analytics error:', err);
  }
};

// Auto-track session start/end
let sessionStartTime = Date.now();

// Track session start
trackEvent('session_start', {
  timestamp: new Date().toISOString(),
  viewport: { width: window.innerWidth, height: window.innerHeight }
});

// Track session end when user leaves
window.addEventListener('beforeunload', () => {
  trackEvent('session_end', {
    duration: Date.now() - sessionStartTime,
    timestamp: new Date().toISOString()
  });
});

// Export for custom tracking
export { supabase };