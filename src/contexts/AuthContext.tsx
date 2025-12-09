
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, User, Session, AuthError } from './auth-context';
import { supabase } from '@/integrations/supabase/client';

// Export the useAuth hook from this file to maintain compatibility
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || ''
        });
        setSession({ token: session.access_token });
        localStorage.setItem('jwt_token', session.access_token);
        localStorage.setItem('user_email', session.user.email || '');
        localStorage.setItem('user_id', session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || ''
        });
        setSession({ token: session.access_token });
        localStorage.setItem('jwt_token', session.access_token);
        localStorage.setItem('user_email', session.user.email || '');
        localStorage.setItem('user_id', session.user.id);
      } else {
        setUser(null);
        setSession(null);
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_id');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (data.user) {
        // Ensure profile exists (create if database trigger didn't fire)
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              full_name: fullName || '',
              subscription_tier: 'free',
              preferences: {},
              analysis_count: 0,
              favorite_stocks: [],
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.warn('Profile creation warning:', profileError);
            // Don't fail signup if profile creation fails, but log it
          }
        } catch (profileErr) {
          console.warn('Profile creation error:', profileErr);
        }

        // Set user state
        setUser({
          id: data.user.id,
          email: data.user.email || ''
        });

        // With email verification disabled, session should be available immediately
        if (data.session) {
          setSession({ token: data.session.access_token });
          localStorage.setItem('jwt_token', data.session.access_token);
          localStorage.setItem('user_email', data.user.email || '');
          localStorage.setItem('user_id', data.user.id);
        } else {
          // If no session, try to get it (shouldn't happen with email verification disabled)
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            setSession({ token: sessionData.session.access_token });
            localStorage.setItem('jwt_token', sessionData.session.access_token);
            localStorage.setItem('user_email', data.user.email || '');
            localStorage.setItem('user_id', data.user.id);
          }
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to sign up' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (data.user && data.session) {
        setUser({
          id: data.user.id,
          email: data.user.email || ''
        });
        setSession({ token: data.session.access_token });
        localStorage.setItem('jwt_token', data.session.access_token);
        localStorage.setItem('user_email', data.user.email || '');
        localStorage.setItem('user_id', data.user.id);
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to sign in' } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to sign in with Google' } };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: { message: error.message } };
      }
      setUser(null);
      setSession(null);
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_id');
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to sign out' } };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${frontendUrl}/reset-password`,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to send password reset email' } };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
