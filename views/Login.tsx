import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { FileText } from 'lucide-react';

export const Login: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await login(username, password)) {
      onLoginSuccess();
    } else {
      setError("Nom d'utilisateur ou mot de passe incorrect");
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    if (provider === 'google') {
      await loginWithGoogle();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mb-4">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-blue-900 text-center">Analyseur Énergétique</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Email" 
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

        <div className="mt-6 space-y-3">
          <Button onClick={() => handleSocialLogin('google')} className="w-full bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 py-3 rounded-lg font-bold">
            Connexion avec Google
          </Button>
        </div>
      </div>
    </div>
  );
};
