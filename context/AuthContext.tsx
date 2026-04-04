import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AnalysisResult } from '../types';

interface AnalysisRecord {
  username: string;
  date: string;
  result: AnalysisResult;
  files: string[];
}

interface AuthContextType {
  user: User | null;
  users: User[];
  archive: AnalysisRecord[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (newUser: User) => void;
  updateUser: (username: string, updatedUser: User) => void;
  saveAnalysis: (username: string, result: AnalysisResult, files: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : [
      { username: '1', password: '1', role: 'ADMIN', isOnline: true },
      { username: 'user1', password: '123', role: 'USER', isOnline: false }
    ];
  });
  const [archive, setArchive] = useState<AnalysisRecord[]>(() => {
    const saved = localStorage.getItem('archive');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('archive', JSON.stringify(archive));
  }, [archive]);

  const login = (username: string, password: string) => {
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const addUser = (newUser: User) => {
    setUsers([...users, newUser]);
  };

  const updateUser = (username: string, updatedUser: User) => {
    setUsers(users.map(u => u.username === username ? updatedUser : u));
    if (user?.username === username) {
      setUser(updatedUser);
    }
  };

  const saveAnalysis = (username: string, result: AnalysisResult, files: string[]) => {
    const newRecord: AnalysisRecord = {
      username,
      date: new Date().toLocaleString(),
      result,
      files
    };
    setArchive([...archive, newRecord]);
  };

  return (
    <AuthContext.Provider value={{ user, users, archive, login, logout, addUser, updateUser, saveAnalysis }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
