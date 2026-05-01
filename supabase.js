// Supabase configuration for UIT Knowledge
const SUPABASE_URL = 'https://yxrdwnmoffzwqflxgvly.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cmR3bm1vZmZ6d3FmbHhndmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxOTMwMzksImV4cCI6MjA5Mjc2OTAzOX0.EPStl73THYx32aQWNRKw7Z2k8HOD6ccTy2sQ61qlHt0';

// Initialize the Supabase client
// Use a different name for the client to avoid collision with the global 'supabase' library object
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
