import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { FileText } from 'lucide-react';

export const Login: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      onLoginSuccess();
    } else {
      setError("Nom d'utilisateur ou mot de passe incorrect");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-blue-900 to-blue-700">
      {/* Content */}
      <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mb-4">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-blue-900 text-center">Analyseur Énergétique</h1>
          <p className="text-slate-600 text-sm font-medium">Office National de l'Electricité et de l'Eau Potable</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Nom d'utilisateur" 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Mot de passe" 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            onChange={(e) => setPassword(e.target.value)} 
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold">Connexion</Button>
        </form>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 text-white text-center text-sm bg-black/20 p-4 rounded-lg backdrop-blur-sm">
        <p className="font-bold">Analyseur Énergétique By AHTTAB</p>
        <p>ahttab1999@hotmail.fr | 0661933842</p>
      </div>
    </div>
  );
};
