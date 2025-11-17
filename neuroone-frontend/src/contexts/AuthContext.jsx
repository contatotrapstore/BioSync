import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // WORKAROUND: Supabase getSession() hangs indefinitely
    // Read session directly from localStorage instead
    console.log('[AuthContext] useEffect iniciado - carregando sessão do localStorage');

    async function loadSession() {
      try {
        const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`;
        const sessionData = localStorage.getItem(storageKey);

        console.log('[AuthContext] Session key:', storageKey);
        console.log('[AuthContext] Has session data:', !!sessionData);

        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          const userId = parsed?.user?.id;
          const userEmail = parsed?.user?.email;

          console.log('[AuthContext] Session found:', { userId, userEmail });

          if (userId && parsed.user) {
            setUser(parsed.user);
            // Don't await - Supabase queries hang indefinitely
            // Let fetchProfile run in background
            fetchProfile(userId).catch(err => {
              console.error('[AuthContext] fetchProfile failed:', err);
            });
          }
        } else {
          console.log('[AuthContext] Nenhuma sessão encontrada no localStorage');
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao carregar sessão:', error);
      } finally {
        // ALWAYS set loading to false, even if fetchProfile hangs
        console.log('[AuthContext] Finalizando carregamento, setLoading(false)');
        setLoading(false);
      }
    }

    loadSession();

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
    } else {
      console.error('Error fetching profile:', error);
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await fetchProfile(data.user.id);
    return data;
  }

  async function signOut() {
    // WORKAROUND: supabase.auth.signOut() also hangs indefinitely
    // Clear localStorage session directly instead
    console.log('[AuthContext] Fazendo logout - limpando localStorage');

    try {
      const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`;
      localStorage.removeItem(storageKey);
      console.log('[AuthContext] Session cleared from localStorage');

      // Don't await signOut - it will hang
      supabase.auth.signOut().catch(err => {
        console.error('[AuthContext] signOut failed (expected):', err);
      });
    } catch (error) {
      console.error('[AuthContext] Erro ao limpar sessão:', error);
    }

    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    // WORKAROUND: Use user_metadata.role as fallback while profile loads from DB
    // This prevents access denial while fetchProfile is running in background
    role: profile?.user_role || user?.user_metadata?.role || null,  // 'direcao' | 'professor' | 'aluno'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
