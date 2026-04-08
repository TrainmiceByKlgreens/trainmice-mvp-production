// This file is deprecated - Supabase has been migrated to MySQL backend
// All functionality should use apiClient from './api-client' instead
// This stub exists to prevent import errors during migration

// Stub Supabase client (does nothing but prevents crashes)
export const supabase = {
  from: () => {
    throw new Error('Supabase is disabled in projectTrainer (migration to MySQL backend). Use apiClient instead.');
  },
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe() {
            /* no-op */
          },
        },
      },
    }),
    signUp: async () => ({ error: new Error('Supabase auth is disabled in projectTrainer. Use apiClient instead.') }),
    signInWithPassword: async () => ({
      error: new Error('Supabase auth is disabled in projectTrainer. Use apiClient instead.'),
    }),
    signOut: async () => ({ error: null }),
  },
  storage: {
    from: () => ({
      upload: async () => {
        throw new Error('Supabase storage is disabled in projectTrainer. Use backend API instead.');
      },
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: async () => {
        /* no-op */
      },
    }),
  },
  channel: () => ({
    on: function() { return this; },
    subscribe: function() { return this; },
  }),
  removeChannel: () => {
    /* no-op */
  },
};
