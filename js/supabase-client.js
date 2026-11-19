// js/supabase-client.js
const SUPABASE_URL = 'https://rerqfuzhflogbphkcqcu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9QX1c2FWSj3M5kkuYCU-7w_VGW3iXIw';

// Initialize the Supabase client using the CDN global 'supabase'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);