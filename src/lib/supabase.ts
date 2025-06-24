import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const trackEvent = async (eventName: string, eventData?: any) => {
  try {
    // Only track if Supabase is properly configured
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured, skipping event tracking');
      return;
    }

    const { error } = await supabase
      .from('site_events')
      .insert({
        site_name: 'stare-at-the-orb',
        event_name: eventName,
        event_data: eventData || {},
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href
      });

    if (error) {
      console.error('Analytics tracking error:', error);
    }
  } catch (err) {
    console.error('Failed to track event:', err);
  }
};