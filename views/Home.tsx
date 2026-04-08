import React from 'react';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface HomeProps {
  onNavigate: (view: ViewState) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Analyseur Énergétique By AHTTAB
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Sélectionnez le type de fichier que vous souhaitez analyser pour extraire les indicateurs de performance.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <button 
          onClick={() => onNavigate('EXCEL_MENU')}
          className="group relative bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-left"
        >
          <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
            Fichiers Excel
          </h2>
          <p className="text-slate-500">
            Analyse des compteurs Clou et Elster. Extraction automatique des heures pleines, pointes et creuses.
          </p>
        </button>

        <button 
          onClick={() => onNavigate('PRN_ANALYSIS')}
          className="group relative bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 text-left"
        >
          <div className="bg-emerald-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileText className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">
            Fichiers PRN
          </h2>
          <p className="text-slate-500">
            Traitement et analyse des fichiers textes formatés PRN pour les rapports techniques.
          </p>
        </button>
      </div>
      <div className="mt-12 max-w-md mx-auto bg-white p-6 rounded-xl shadow-md border border-slate-200 text-center">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Télécharger l'application</h3>
        <a
          href="https://www.mediafire.com/file/on6mzgm0xit8val/Analyseur%20Energetique%20Setup%201.0.0.rar"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors gap-2"
        >
          <Download className="w-5 h-5" />
          Télécharger le Setup
        </a>
      </div>
    </div>
  );
};