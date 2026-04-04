import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Settings as SettingsIcon, ArrowLeft, Download } from 'lucide-react';
import { ViewState, User } from '../types';
import { exportToExcel } from '../utils/excelExporter';

export const Settings: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => {
  const { user, users, archive, addUser, updateUser } = useAuth();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleAddUser = () => {
    if (newUsername && newPassword) {
      addUser({ username: newUsername, password: newPassword, role: 'USER', isOnline: false });
      setNewUsername('');
      setNewPassword('');
    }
  };

  const handleUpdateUser = (username: string) => {
    if (editingUser) {
      updateUser(username, editingUser);
      setEditingUser(null);
    }
  };

  const handleExportArchive = () => {
    exportToExcel(archive, 'Archive_Analyses');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => onNavigate('HOME')} className="mb-8 pl-0"><ArrowLeft className="w-5 h-5" /> Retour à l'accueil</Button>
      
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3"><SettingsIcon /> Paramètres</h1>

      {user?.role === 'ADMIN' ? (
        <div className="grid gap-8">
          <Card title="Gestion des utilisateurs">
            <div className="space-y-4">
              {users.map((u, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                  {editingUser?.username === u.username ? (
                    <div className="flex gap-2">
                      <input value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="p-1 border rounded" />
                      <input value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="p-1 border rounded" />
                      <Button onClick={() => handleUpdateUser(u.username)} className="text-sm">Enregistrer</Button>
                    </div>
                  ) : (
                    <>
                      <span>{u.username} ({u.role})</span>
                      <Button variant="outline" className="text-sm" onClick={() => setEditingUser(u)}>Modifier</Button>
                    </>
                  )}
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <input placeholder="Nom d'utilisateur" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="p-2 border rounded w-full" />
                <input placeholder="Mot de passe" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="p-2 border rounded w-full" />
                <Button onClick={handleAddUser}>Ajouter</Button>
              </div>
            </div>
          </Card>

          <Card title="Archive de connexion" className="relative">
            <Button onClick={handleExportArchive} className="absolute top-4 right-4 gap-2">
                <Download className="w-4 h-4" /> Exporter Excel
            </Button>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Utilisateur</th>
                    <th className="p-2">IP</th>
                    <th className="p-2">Nom de l'ordinateur</th>
                    <th className="p-2">Heure</th>
                    <th className="p-2">EN LIGNE</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className="border-b cursor-pointer hover:bg-slate-100" onClick={() => setSelectedUser(u)}>
                      <td className="p-2">{u.username}</td>
                      <td className="p-2">192.168.1.1</td>
                      <td className="p-2">PC-ADMIN</td>
                      <td className="p-2">{new Date().toLocaleString()}</td>
                      <td className="p-2">{u.isOnline ? 'Oui' : 'Non'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          
          {selectedUser && (
            <Card title={`Fichiers analysés par ${selectedUser.username}`}>
              {selectedUser.filesAnalyzed && selectedUser.filesAnalyzed.length > 0 ? (
                <ul className="list-disc list-inside">
                  {selectedUser.filesAnalyzed.map((file, i) => <li key={i}>{file}</li>)}
                </ul>
              ) : (
                <p>Aucun fichier analysé.</p>
              )}
            </Card>
          )}
        </div>
      ) : (
        <Card title="Mon Profil">
           <div className="flex flex-col gap-4">
              <input 
                value={user?.username || ''} 
                onChange={e => updateUser(user!.username, {...user!, username: e.target.value})} 
                className="p-2 border rounded w-full" 
                placeholder="Nouveau nom d'utilisateur"
              />
              <input 
                type="password"
                value={user?.password || ''} 
                onChange={e => updateUser(user!.username, {...user!, password: e.target.value})} 
                className="p-2 border rounded w-full" 
                placeholder="Nouveau mot de passe"
              />
              <Button onClick={() => alert('Profil mis à jour !')}>Enregistrer les modifications</Button>
           </div>
        </Card>
      )}
    </div>
  );
};
