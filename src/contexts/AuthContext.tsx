
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, User, Session, AuthError } from './auth-context';

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
    // On mount, check for JWT token in localStorage
    const token = localStorage.getItem('jwt_token');
    const email = localStorage.getItem('user_email');
    const id = localStorage.getItem('user_id');
    if (token && email && id) {
      setUser({ id, email });
      setSession({ token });
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    // TODO: Connect to backend /auth/signup endpoint
    // For now, just fake a user
    setUser({ id: email, email });
    setSession({ token: 'dummy' });
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_id', email);
    localStorage.setItem('jwt_token', 'dummy');
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    // TODO: Connect to backend /auth/signin endpoint
    // For now, just fake a user
    setUser({ id: email, email });
    setSession({ token: 'dummy' });
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_id', email);
    localStorage.setItem('jwt_token', 'dummy');
    return { error: null };
  };

  const signInWithGoogle = async () => {
    // TODO: Implement Google OAuth with backend
    return { error: { message: 'Not implemented' } };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('jwt_token');
    return { error: null };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
