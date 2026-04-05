import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { logDataToSheet, getUsers, deleteUser as deleteUserFromSheet } from '../src/services/googleSheetService';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (newUser: User) => void;
  updateUser: (username: string, updatedUser: User) => void;
  deleteUser: (username: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    };
    loadUsers();
  }, []);

  const login = async (username: string, password: string) => {
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      logDataToSheet({
        type: 'LOGIN',
        username,
        timestamp: new Date().toISOString(),
      });
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

  const deleteUser = async (username: string) => {
    await deleteUserFromSheet(username);
    setUsers(users.filter(u => u.username !== username));
  };

  return (
    <AuthContext.Provider value={{ user, users, login, logout, addUser, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
