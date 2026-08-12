import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { employeeService } from '../services/employeeService';
import { Employee } from '../types/database';

interface AuthContextType {
  user: any;
  employee: Employee | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshEmployee: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  employee: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refreshEmployee: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployee = async (userId: string) => {
    try {
      const emp = await employeeService.getEmployeeById(userId);
      setEmployee(emp);
      setError(null);
    } catch (err: any) {
      setEmployee(null);
      setError(err.message || 'Failed to load employee details');
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const session = await authService.getCurrentSession();
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchEmployee(session.user.id);
          }
        }
      } catch (err) {
        console.error('Session error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    const { data: authListener } = authService.onAuthStateChange(async (session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true);
          await fetchEmployee(session.user.id);
          setLoading(false);
        } else {
          setEmployee(null);
        }
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await authService.signOut();
  };

  const refreshEmployee = async () => {
    if (user) {
      await fetchEmployee(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, employee, loading, error, signOut, refreshEmployee }}>
      {children}
    </AuthContext.Provider>
  );
};
