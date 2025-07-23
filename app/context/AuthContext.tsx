import React, { createContext, ReactNode, useContext, useState } from 'react';

interface User {
  username: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DUMMY_USERS: User[] = [
  { username: 'user1', role: 'user' },
  { username: 'admin1', role: 'admin' },
];

const PASSWORDS: Record<string, string> = {
  user1: '1234',
  admin1: 'admin123',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string) => {
    const found = DUMMY_USERS.find(u => u.username === username);
    if (found && PASSWORDS[found.username] === password) {
      setUser(found);
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials' };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
