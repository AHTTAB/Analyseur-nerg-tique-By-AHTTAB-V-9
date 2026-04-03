import React from 'react';
import { ArrowLeft, Gauge, Activity, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface ExcelSelectionProps {
  onNavigate: (view: ViewState) => void;
}

export const ExcelSelection: React.FC<ExcelSelectionProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Button 
        variant="ghost" 
        onClick={() => onNavigate('HOME')} 
        className="mb-8 pl-0 text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour à l'accueil
      </Button>

      <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
        Type de Compteur Excel
      </h2>

      <div className="grid gap-6">
        <button 
          onClick={() => onNavigate('CLOU_ANALYSIS')}
          className="flex items-center p-6 bg-white rounded-xl shadow-md border border-slate-200 hover:ring-2 hover:ring-blue-500 hover:bg-blue-50 transition-all"
        >
          <div className="bg-blue-100 p-4 rounded-full mr-6">
            <Gauge className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-slate-800">Compteur Clou</h3>
            <p className="text-slate-500">Profil de charge moyen et analyse temporelle</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('ELSTER_ANALYSIS')}
          className="flex items-center p-6 bg-white rounded-xl shadow-md border border-slate-200 hover:ring-2 hover:ring-indigo-500 hover:bg-indigo-50 transition-all"
        >
          <div className="bg-indigo-100 p-4 rounded-full mr-6">
            <Activity className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-slate-800">Compteur Elster</h3>
            <p className="text-slate-500">Analyse standard Elster</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('ACTARIS_ANALYSIS')}
          className="flex items-center p-6 bg-white rounded-xl shadow-md border border-slate-200 hover:ring-2 hover:ring-amber-500 hover:bg-amber-50 transition-all"
        >
          <div className="bg-amber-100 p-4 rounded-full mr-6">
            <Zap className="w-8 h-8 text-amber-600" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-slate-800">Compteur Actaris</h3>
            <p className="text-slate-500">Feuille "Données des Courbes de Charge" avec dates implicites</p>
          </div>
        </button>
      </div>
    </div>
  );
};