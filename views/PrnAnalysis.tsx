import React, { useState } from 'react';
import { ArrowLeft, Upload, AlertCircle, FileText, TrendingUp, Clock, Calendar, Plus, Minus, Files, Printer } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { ViewState, AnalysisResult } from '../types';
import { processPrnFiles } from '../utils/excelParser';

interface PrnAnalysisProps {
  onNavigate: (view: ViewState) => void;
}

export const PrnAnalysis: React.FC<PrnAnalysisProps> = ({ onNavigate }) => {
  const { user, updateUser, saveAnalysis } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [decimals, setDecimals] = useState(3);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files) as File[];

    if (files.length > 4) {
      setError("Vous ne pouvez sélectionner que 4 fichiers maximum.");
      return;
    }

    setSelectedFiles(files);
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await processPrnFiles(files);
      setResults(data);
      
      // Add files to user profile
      if (user) {
        const newFiles = files.map(f => f.name);
        const currentFiles = user.filesAnalyzed || [];
        updateUser(user.username, {
          ...user,
          filesAnalyzed: [...new Set([...currentFiles, ...newFiles])]
        });
        
        // Save to archive
        await saveAnalysis(user.username, data, newFiles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderCell = (val: any) => {
      if (val === null || val === undefined) return "";
      if (val instanceof Date) return val.toLocaleDateString();
      if (typeof val === 'number') return val.toFixed(decimals).replace('.', ',');
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 print:py-0 print:px-0">
      
      {/* Print-only Header */}
      <div className="hidden print:block text-center mb-8 pt-4">
        <h1 className="text-2xl font-bold text-slate-900">Analyseur Énergétique By AHTTAB</h1>
        <p className="text-sm text-slate-500">Rapport d'analyse Fichiers PRN - {new Date().toLocaleDateString()}</p>
      </div>

      <div className="flex items-center justify-between mb-8 print:hidden">
        <Button 
          variant="ghost" 
          onClick={() => onNavigate('HOME')}
          className="pl-0"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-600" />
          Analyse Fichier PRN
        </h1>
      </div>

      {!results && (
        <Card className="max-w-xl mx-auto text-center py-12 print:hidden">
          <div className="mb-6 flex justify-center">
            <div className="bg-emerald-50 p-4 rounded-full">
              {selectedFiles.length > 0 ? <Files className="w-12 h-12 text-emerald-500" /> : <Upload className="w-12 h-12 text-emerald-500" />}
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Importer des fichiers PRN</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            Sélectionnez 1 à 4 fichiers. Les valeurs P. Active seront additionnées pour l'analyse globale.
          </p>
          
          <div className="relative inline-block">
             <input
              type="file"
              accept=".prn, .txt, .csv"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            <Button variant="primary" disabled={loading} className="pointer-events-none bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500">
              {loading ? 'Analyse en cours...' : 'Sélectionner fichiers (Max 4)'}
            </Button>
          </div>

          {selectedFiles.length > 0 && !loading && (
             <div className="mt-4 text-sm text-slate-600">
                <p className="font-semibold">Fichiers sélectionnés:</p>
                <ul className="list-disc list-inside">
                  {selectedFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                </ul>
             </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
        </Card>
      )}

      {results && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex justify-between items-center print:hidden">
             <div className="text-sm text-slate-500">
                <span className="font-bold">{selectedFiles.length} fichier(s) analysé(s)</span>
                {selectedFiles.length > 1 && <span> (Somme des puissances)</span>}
             </div>

             <div className="flex items-center gap-4">
               <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                  <span className="text-xs font-semibold text-slate-500 px-3 uppercase tracking-wider">Décimales</span>
                  <button 
                    onClick={() => setDecimals(d => Math.max(0, d - 1))} 
                    className="p-2 hover:bg-slate-100 rounded text-slate-600 border-r border-slate-100"
                    title="Réduire les décimales"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDecimals(d => d + 1)} 
                    className="p-2 hover:bg-slate-100 rounded text-slate-600"
                    title="Ajouter une décimale"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <Button onClick={handlePrint} variant="outline" className="gap-2">
                  <Printer className="w-4 h-4" />
                  Imprimer
                </Button>
             </div>
          </div>
          
          {/* File List for Print */}
          <div className="hidden print:block text-sm text-slate-600 mb-4">
             <p className="font-bold">Fichiers analysés :</p>
             <ul className="list-disc list-inside">
               {selectedFiles.map((f, i) => <li key={i}>{f.name}</li>)}
             </ul>
          </div>

          {/* Top 5 Table */}
          <Card title={`Top 5 - Valeurs les plus élevées (${selectedFiles.length > 1 ? 'Global / Somme' : 'PRN'})`} className="print:shadow-none print:border print:border-slate-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 print:bg-slate-100">
                    <th className="py-3 px-4 font-semibold text-slate-600 sticky left-0 bg-slate-50 z-10 print:static">Rang</th>
                    <th className="py-3 px-4 font-semibold text-slate-600">Nom</th>
                    <th className="py-3 px-4 font-semibold text-slate-600">Date</th>
                    <th className="py-3 px-4 font-semibold text-slate-600">Heure</th>
                    <th className="py-3 px-4 font-semibold text-slate-600">Info 1</th>
                    <th className="py-3 px-4 font-semibold text-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-100 print:bg-transparent print:ring-0 print:text-slate-800">P. Active (kW)</th>
                    <th className="py-3 px-4 font-semibold text-slate-600 text-right">Ligne</th>
                  </tr>
                </thead>
                <tbody>
                  {results.topFiveGlobal.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 print:break-inside-avoid">
                      <td className="py-3 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100 print:static">#{idx + 1}</td>
                      <td className="py-3 px-4 text-slate-700">{renderCell(row.fullRow[0])}</td>
                      <td className="py-3 px-4 text-slate-700">{renderCell(row.fullRow[1])}</td>
                      <td className="py-3 px-4 text-slate-700 font-mono">{renderCell(row.fullRow[2])}</td>
                      <td className="py-3 px-4 text-slate-400 text-sm">{renderCell(row.fullRow[3])}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 bg-emerald-50/10 print:bg-transparent print:text-black">{renderCell(row.fullRow[4])}</td>
                      <td className="py-3 px-4 text-right text-slate-400 text-sm">{row.originalIndex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Seasonal Analysis Cards */}
          <div className="grid md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
            {[results.heuresPleines, results.heuresPointe, results.heuresCreuses].map((period, idx) => {
               if (!period) return null;
               
               let icon = <Clock className="w-6 h-6" />;
               let bgClass = "bg-blue-500";
               let textClass = "text-blue-600";
               
               if (idx === 1) { 
                   icon = <TrendingUp className="w-6 h-6" />; 
                   bgClass = "bg-rose-500"; 
                   textClass = "text-rose-600";
               }
               if (idx === 2) { 
                   icon = <Calendar className="w-6 h-6" />; 
                   bgClass = "bg-emerald-500"; 
                   textClass = "text-emerald-600";
               }

               return (
                <Card key={idx} className="relative overflow-hidden print:shadow-none print:border print:border-slate-300 print:break-inside-avoid">
                  <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rotate-45 opacity-10 ${bgClass} print:opacity-0`} />
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg text-white ${bgClass} print:text-black print:bg-transparent print:p-0`}>
                      <span className="print:hidden">{icon}</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">{period.periodName}</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Valeur Max {selectedFiles.length > 1 ? '(Somme)' : ''}</div>
                      <div className={`text-3xl font-bold ${textClass} print:text-black`}>
                        {period.maxValue.toFixed(decimals).replace('.', ',')}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Date</div>
                        <div className="font-medium text-slate-700">{period.date}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Heure</div>
                        <div className="font-medium text-slate-700 font-mono">{period.time}</div>
                      </div>
                    </div>
                  </div>
                </Card>
               );
            })}
          </div>
          
          <div className="flex justify-center pt-8 pb-8 print:hidden">
            <Button variant="outline" onClick={() => { setResults(null); setSelectedFiles([]); }}>
              Analyser d'autres fichiers
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};