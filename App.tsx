
import React, { useState, useEffect } from 'react';
import { Home } from './views/Home';
import { ExcelSelection } from './views/ExcelSelection';
import { ClouAnalysis } from './views/ClouAnalysis';
import { PrnAnalysis } from './views/PrnAnalysis';
import { ElsterAnalysis } from './views/ElsterAnalysis';
import { ActarisAnalysis } from './views/ActarisAnalysis';
import { Login } from './views/Login';
import { Settings } from './views/Settings';
import { ViewState } from './types';
import { FileText, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Button } from './components/Button';

const OneeLogo = () => {
  // ... (keep existing OneeLogo)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const textAnchor = isMobile ? "middle" : "end";
  const xPosition = isMobile ? "450" : "890";
  const preserveAspectRatio = isMobile ? "xMidYMid meet" : "xMaxYMid meet";

  return (
    <svg 
      viewBox="0 0 900 180" 
      className="h-full w-full" 
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio={preserveAspectRatio}
    >
      <text x={xPosition} y="60" textAnchor={textAnchor} fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="48" fill="#1d4ed8">
        المكتب الوطني للكهرباء والماء الصالح للشرب
      </text>
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" opacity="0" />
          <stop offset="20%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <line x1="50" y1="90" x2="850" y2="90" stroke="url(#lineGrad)" strokeWidth="5" />
      <text x={xPosition} y="145" textAnchor={textAnchor} fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#1e3a8a">
        Office National de l'Electricité et de l'Eau Potable
      </text>
    </svg>
  );
};

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-32 py-4 md:py-0 gap-4 md:gap-0"> 
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity shrink-0 w-full md:w-auto justify-center md:justify-start" 
              onClick={() => setCurrentView('HOME')}
            >
              <div className="bg-blue-600 p-2 rounded-lg shrink-0">
                 <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight leading-tight text-center md:text-left">
                  Analyseur Énergétique
                </span>
                <span className="text-sm text-slate-500 font-medium">By AHTTAB</span>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-end w-full md:flex-1 md:ml-4 h-24 md:h-full py-0 md:py-2 gap-2">
                <div className="h-full w-full max-w-[650px] flex items-center justify-center md:justify-end">
                   <OneeLogo />
                </div>
                {user ? (
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800">Bienvenue, {user.username}</span>
                    <Button variant="outline" onClick={() => setCurrentView('SETTINGS')} className="ml-2 h-8 w-8 p-0 rounded-full border-slate-300 hover:bg-slate-100"><SettingsIcon className="w-4 h-4 text-slate-600" /></Button>
                    <Button variant="ghost" onClick={logout} className="p-2"><LogOut className="w-5 h-5" /></Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setCurrentView('LOGIN')} className="rounded-full px-6">
                    Connexion
                  </Button>
                )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {currentView === 'HOME' && <Home onNavigate={setCurrentView} />}
        {currentView === 'EXCEL_MENU' && <ExcelSelection onNavigate={setCurrentView} />}
        {currentView === 'CLOU_ANALYSIS' && <ClouAnalysis onNavigate={setCurrentView} />}
        {currentView === 'ELSTER_ANALYSIS' && <ElsterAnalysis onNavigate={setCurrentView} />}
        {currentView === 'ACTARIS_ANALYSIS' && <ActarisAnalysis onNavigate={setCurrentView} />}
        {currentView === 'PRN_ANALYSIS' && <PrnAnalysis onNavigate={setCurrentView} />}
        {currentView === 'SETTINGS' && <Settings onNavigate={setCurrentView} />}
        {currentView === 'LOGIN' && <Login onLoginSuccess={() => setCurrentView('HOME')} />}
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto print:border-t-0">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Analyseur Énergétique By AHTTAB. Tous droits réservés.</p>
          <p className="mt-1 font-medium text-slate-600">ahttab1999@hotmail.fr | 0661933842</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
