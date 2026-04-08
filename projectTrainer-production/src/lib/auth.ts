/**
 * Authentication utilities for TrainMICE Trainer App
 * Replaces Supabase auth with JWT-based authentication
 */

import { apiClient } from './api-client';
import { requestForToken } from './firebase';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'CLIENT' | 'TRAINER' | 'ADMIN';
  emailVerified?: boolean;
}

class AuthService {
  private currentUser: User | null = null;
  private listeners: Set<(user: User | null) => void> = new Set();

  onAuthStateChange(callback: (user: User | null) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback(this.currentUser));
  }

  /**
   * Register FCM token with backend
   */
  private async registerFcmToken() {
    try {
      const token = await requestForToken();
      if (token) {
        await apiClient.updateFcmToken(token);
        console.log('✅ FCM token registered with backend');
      }
    } catch (error) {
      console.error('Failed to register FCM token:', error);
    }
  }

  async getSession(): Promise<{ user: User | null; session: { access_token: string } | null }> {
    const token = apiClient.getToken();
    if (!token) {
      return { user: null, session: null };
    }

    try {
      const user = await apiClient.getCurrentUser();
      if (user) {
        this.currentUser = user;
        return {
          user,
          session: { access_token: token },
        };
      }
    } catch (error) {
      console.error('Error getting session:', error);
    }

    return { user: null, session: null };
  }

  async signUp(data: {
    email: string;
    password: string;
    fullName?: string;
    role?: 'CLIENT' | 'TRAINER' | 'ADMIN';
  }) {
    try {
      const response = await apiClient.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role || 'TRAINER',
      });

      this.currentUser = response.user;
      this.notifyListeners();

      // Automatically register FCM token after signup
      if (typeof window !== 'undefined') {
        this.registerFcmToken();
      }

      return {
        data: {
          user: response.user,
          session: { access_token: response.token },
        },
        error: null,
      };
    } catch (error: any) {
      return {
        data: { user: null, session: null },
        error: { message: error.message },
      };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const response = await apiClient.login(email, password);

      // Check if login was blocked due to unverified email
      if ((response as any).requiresVerification || (response as any).error?.includes('Email not verified')) {
        return {
          data: { user: null, session: null },
          error: { message: 'Please verify your email address before logging in. Check your inbox for the verification email.' },
        };
      }

      this.currentUser = response.user;
      this.notifyListeners();

      // Automatically register FCM token after sign-in
      if (typeof window !== 'undefined') {
        this.registerFcmToken();
      }

      return {
        data: {
          user: response.user,
          session: { access_token: response.token },
        },
        error: null,
      };
    } catch (error: any) {
      // Check if error is due to unverified email
      if (error.message && error.message.includes('Email not verified')) {
        return {
          data: { user: null, session: null },
          error: { message: 'Please verify your email address before logging in. Check your inbox for the verification email.' },
        };
      }
      return {
        data: { user: null, session: null },
        error: { message: error.message || 'Invalid email or password' },
      };
    }
  }

  async signOut() {
    apiClient.logout();
    this.currentUser = null;
    this.notifyListeners();
    return { error: null };
  }

  getUser(): User | null {
    return this.currentUser;
  }

  async initialize() {
    const { user } = await this.getSession();
    if (user) {
      this.currentUser = user;
      this.notifyListeners();

      // Register FCM token if user is already logged in
      if (typeof window !== 'undefined') {
        this.registerFcmToken();
      }
    }
  }
}

export const auth = new AuthService();

auth.initialize();

