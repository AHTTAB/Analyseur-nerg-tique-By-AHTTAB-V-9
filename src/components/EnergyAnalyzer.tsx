import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft, 
  Gauge, 
  Activity, 
  Zap, 
  Upload, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  Calendar, 
  Plus, 
  Minus, 
  Files, 
  Printer 
} from 'lucide-react';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

type ViewState = 'HOME' | 'EXCEL_MENU' | 'CLOU_ANALYSIS' | 'ELSTER_ANALYSIS' | 'ACTARIS_ANALYSIS' | 'PRN_ANALYSIS';

interface DataRow {
  date: string;
  time: string;
  value: number;
  originalIndex: number;
  fullRow: any[];
}

interface PeriodResult {
  periodName: string;
  maxValue: number;
  date: string;
  time: string;
}

interface AnalysisResult {
  headers: string[];
  topFiveGlobal: DataRow[];
  heuresPleines: PeriodResult | null;
  heuresPointe: PeriodResult | null;
  heuresCreuses: PeriodResult | null;
}

enum Season {
  WINTER = 'WINTER',
  SUMMER = 'SUMMER',
}

// ==========================================
// 2. UTILS & PARSERS (The "Brain")
// ==========================================

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr || typeof timeStr !== 'string') return -1;
  const cleanTime = timeStr.trim();
  const parts = cleanTime.split(':');
  if (parts.length < 2) return -1;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return -1;
  return hours * 60 + minutes;
};

const getSeason = (date: Date): Season => {
  const month = date.getMonth(); 
  if (month >= 9 || month <= 2) return Season.WINTER;
  return Season.SUMMER;
};

const performSeasonAnalysis = (processedRows: DataRow[]): AnalysisResult => {
    const sortedByValue = [...processedRows].sort((a, b) => b.value - a.value);
    const topFiveGlobal = sortedByValue.slice(0, 5);
  
    let maxHP: DataRow | null = null;
    let maxPointe: DataRow | null = null;
    let maxCreux: DataRow | null = null;
  
    processedRows.forEach(row => {
      const [d, m, y] = row.date.split('/').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const season = getSeason(dateObj);
      const t = parseTimeToMinutes(row.time);
      
      if (t === -1) return;
  
      let isHP = false, isPointe = false, isCreux = false;
  
      if (season === Season.WINTER) {
        if (t >= 430 && t <= 1020) isHP = true;
        else if (t >= 1030 && t <= 1320) isPointe = true;
        else if (t >= 1330 || t <= 420) isCreux = true;
      } else {
        if (t >= 430 && t <= 1080) isHP = true;
        else if (t >= 1090 && t <= 1380) isPointe = true;
        else if (t >= 1390 || t <= 420) isCreux = true;
      }
  
      if (isHP && (!maxHP || row.value > maxHP.value)) maxHP = row;
      if (isPointe && (!maxPointe || row.value > maxPointe.value)) maxPointe = row;
      if (isCreux && (!maxCreux || row.value > maxCreux.value)) maxCreux = row;
    });
  
    const formatPeriodResult = (row: DataRow | null, name: string): PeriodResult | null => {
      if (!row) return null;
      return { periodName: name, maxValue: row.value, date: row.date, time: row.time };
    };
  
    return {
      headers: [],
      topFiveGlobal,
      heuresPleines: formatPeriodResult(maxHP, "Heures Pleines"),
      heuresPointe: formatPeriodResult(maxPointe, "Heures de Pointe"),
      heuresCreuses: formatPeriodResult(maxCreux, "Heures Creuses"),
    };
};

const mergeDatasets = (datasets: DataRow[][]): DataRow[] => {
  if (datasets.length === 0) return [];
  if (datasets.length === 1) return datasets[0];
  const map = new Map<string, DataRow>();
  datasets.forEach(dataset => {
    dataset.forEach(row => {
      const key = `${row.date}|${row.time}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.value += row.value;
      } else {
        map.set(key, { ...row, fullRow: [...row.fullRow] });
      }
    });
  });
  return Array.from(map.values()).map((row, index) => ({ ...row, originalIndex: index + 1 }));
};

const parseExcelDate = (rawDate: any): string => {
    if (typeof rawDate === 'number') {
        const ssfDate = XLSX.SSF.parse_date_code(rawDate);
        if (ssfDate) return `${ssfDate.d.toString().padStart(2, '0')}/${ssfDate.m.toString().padStart(2, '0')}/${ssfDate.y}`;
    } else if (typeof rawDate === 'string') {
        const parts = rawDate.trim().split(/[-/]/);
        if (parts.length === 3) return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
    return "";
};

const parseExcelTime = (rawTime: any): string => {
    if (typeof rawTime === 'number') {
         const totalSeconds = Math.round(rawTime * 24 * 60 * 60);
         const h = Math.floor(totalSeconds / 3600) % 24;
         const m = Math.floor((totalSeconds % 3600) / 60);
         return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    } else if (typeof rawTime === 'string') {
        const parts = rawTime.trim().split(':');
        if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return "";
};

const parseExcelNumber = (rawValue: any): number | null => {
    if (typeof rawValue === 'number') return rawValue;
    if (typeof rawValue === 'string') {
        const cleanStr = rawValue.replace(',', '.').replace(/[^\d.-]/g, '');
        if (cleanStr && !isNaN(parseFloat(cleanStr))) return parseFloat(cleanStr);
    }
    return null;
}

// --- Specific Parsers ---

const extractClouRows = async (file: File): Promise<DataRow[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellDates: false });
  const sheetIndex = workbook.SheetNames.length > 1 ? 1 : 0;
  const sheet = workbook.Sheets[workbook.SheetNames[sheetIndex]];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const processedRows: DataRow[] = [];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length <= 3) continue;
    const value = parseExcelNumber(row[3]);
    if (value === null) continue;
    const dateStr = parseExcelDate(row[0]);
    const timeStr = parseExcelTime(row[1]);
    if (!dateStr || !timeStr) continue;
    const displayRow = [...row];
    displayRow[3] = value;
    processedRows.push({ date: dateStr, time: timeStr, value, originalIndex: i + 1, fullRow: displayRow });
  }
  return processedRows;
};

const extractElsterRows = async (file: File): Promise<DataRow[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellDates: false });
  const sheetIndex = workbook.SheetNames.length > 1 ? 1 : 0;
  const sheet = workbook.Sheets[workbook.SheetNames[sheetIndex]];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const processedRows: DataRow[] = [];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length <= 4) continue;
    const value = parseExcelNumber(row[4]);
    if (value === null) continue;
    const dateStr = parseExcelDate(row[1]);
    const timeStr = parseExcelTime(row[2]);
    if (!dateStr || !timeStr) continue;
    const displayRow = [...row];
    displayRow[4] = value;
    processedRows.push({ date: dateStr, time: timeStr, value, originalIndex: i + 1, fullRow: displayRow });
  }
  return processedRows;
};

const extractActarisRows = async (file: File): Promise<DataRow[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { cellDates: false });
    let sheetName = "Données des Courbes de Charge";
    if (!workbook.Sheets[sheetName]) sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const processedRows: DataRow[] = [];
    let lastValidDate = "";
  
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length <= 2) continue;
      let dateStr = "";
      if (row[0] !== undefined && row[0] !== null && row[0] !== "") dateStr = parseExcelDate(row[0]);
      if (dateStr) lastValidDate = dateStr;
      else dateStr = lastValidDate;
      if (!dateStr) continue;
      const timeStr = parseExcelTime(row[1]);
      const value = parseExcelNumber(row[2]);
      if (!timeStr || value === null) continue;
      processedRows.push({ date: dateStr, time: timeStr, value, originalIndex: i + 1, fullRow: [dateStr, timeStr, value] });
    }
    return processedRows;
};

const extractPrnRows = async (file: File): Promise<DataRow[]> => {
  const text = await file.text();
  const lines = text.split(/\r?\n/);
  const processedRows: DataRow[] = [];
  const regex = /^"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"\s+(\S+)\s+(\S+)\s+(\S+).*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const match = line.match(regex);
    if (!match) continue;
    
    const value = parseExcelNumber(match[5]);
    if (value === null) continue;
    const fullRow: any[] = [match[1], match[2], match[3], match[4], value, parseExcelNumber(match[6])];

    const dateParts = match[2].split(/[-/]/);
    let dateStr = "";
    if (dateParts.length === 3) {
      let year = dateParts[2].length === 2 ? "20" + dateParts[2] : dateParts[2];
      dateStr = `${dateParts[0].padStart(2, '0')}/${dateParts[1].padStart(2, '0')}/${year}`;
    }
    const timeParts = match[3].split(':');
    let timeStr = timeParts.length >= 2 ? `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}` : "";

    if (dateStr && timeStr) {
      processedRows.push({ date: dateStr, time: timeStr, value, originalIndex: i + 1, fullRow });
    }
  }
  return processedRows;
};

// ==========================================
// 3. UI COMPONENTS
// ==========================================

const Button: React.FC<any> = ({ children, variant = 'primary', fullWidth = false, className = '', ...props }) => {
  const baseStyles = "px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants: any = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
    outline: "border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 shadow-none"
  };
  return <button className={`${baseStyles} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`} {...props}>{children}</button>;
};

const Card: React.FC<{children: React.ReactNode, title?: string, className?: string}> = ({ children, title, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden ${className}`}>
    {title && <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h3 className="font-semibold text-slate-800 text-lg">{title}</h3></div>}
    <div className="p-6">{children}</div>
  </div>
);

const OneeLogo = () => {
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
    <svg viewBox="0 0 900 180" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio={preserveAspectRatio}>
      <text x={xPosition} y="60" textAnchor={textAnchor} fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="48" fill="#1d4ed8">المكتب الوطني للكهرباء والماء الصالح للشرب</text>
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" opacity="0" />
          <stop offset="20%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <line x1="50" y1="90" x2="850" y2="90" stroke="url(#lineGrad)" strokeWidth="5" />
      <text x={xPosition} y="145" textAnchor={textAnchor} fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#1e3a8a">Office National de l'Electricité et de l'Eau Potable</text>
    </svg>
  );
};

// ==========================================
// 4. VIEWS
// ==========================================

// Generic Analysis View Component
const AnalysisView: React.FC<{
  title: string,
  icon: React.ReactNode,
  colorClass: string,
  onNavigate: (view: ViewState) => void,
  processFunction: (file: File) => Promise<DataRow[]>,
  processHeaders: (files: File[]) => string[],
  maxFiles?: number,
  instructions?: string
}> = ({ title, icon, colorClass, onNavigate, processFunction, processHeaders, maxFiles = 4, instructions }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [decimals, setDecimals] = useState(3);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    if (files.length > maxFiles) { setError(`Max ${maxFiles} fichiers.`); return; }
    setSelectedFiles(files);
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const allDatasets = await Promise.all(files.map(f => processFunction(f)));
      const merged = mergeDatasets(allDatasets);
      if (!merged.length) throw new Error("Aucune donnée valide.");
      if (files.length > 1) merged.forEach(row => row.fullRow = ["Global", row.date, row.time, "-", row.value, "-"]);
      
      const res = performSeasonAnalysis(merged);
      res.headers = processHeaders(files);
      setResults(res);
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); }
  };

  const renderCell = (val: any) => {
    if (val instanceof Date) return val.toLocaleDateString();
    if (typeof val === 'number') return val.toFixed(decimals).replace('.', ',');
    return val;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 print:py-0 print:px-0">
      <div className="hidden print:block text-center mb-8 pt-4">
        <h1 className="text-2xl font-bold text-slate-900">Analyseur Énergétique By AHTTAB</h1>
        <p className="text-sm text-slate-500">Rapport {title} - {new Date().toLocaleDateString()}</p>
      </div>
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Button variant="ghost" onClick={() => onNavigate(title.includes('PRN') ? 'HOME' : 'EXCEL_MENU')} className="pl-0"><ArrowLeft className="w-5 h-5" /> Retour</Button>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">{icon} Analyse {title}</h1>
      </div>

      {!results && (
        <Card className="max-w-xl mx-auto text-center py-12 print:hidden">
           <div className={`mb-6 flex justify-center p-4 rounded-full bg-${colorClass}-50`}>
             {selectedFiles.length > 0 ? <Files className={`w-12 h-12 text-${colorClass}-600`} /> : <Upload className={`w-12 h-12 text-${colorClass}-600`} />}
           </div>
           <h3 className="text-xl font-semibold mb-2">Importer fichiers</h3>
           <p className="text-slate-500 mb-8 max-w-sm mx-auto">{instructions || "Sélectionnez vos fichiers pour l'analyse."}</p>
           <div className="relative inline-block">
             <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={loading} />
             <Button variant="primary" disabled={loading} className={`pointer-events-none bg-${colorClass}-600`}>{loading ? 'Analyse...' : `Sélectionner (Max ${maxFiles})`}</Button>
           </div>
           {error && <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-center gap-2"><AlertCircle className="w-5 h-5"/>{error}</div>}
        </Card>
      )}

      {results && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-between items-center print:hidden">
             <div className="text-sm text-slate-500"><span className="font-bold">{selectedFiles.length} fichier(s)</span></div>
             <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                  <span className="text-xs font-semibold text-slate-500 px-3 uppercase">Décimales</span>
                  <button onClick={() => setDecimals(d => Math.max(0, d - 1))} className="p-2 hover:bg-slate-100 rounded text-slate-600 border-r"><Minus className="w-4 h-4" /></button>
                  <button onClick={() => setDecimals(d => d + 1)} className="p-2 hover:bg-slate-100 rounded text-slate-600"><Plus className="w-4 h-4" /></button>
                </div>
                <Button onClick={() => window.print()} variant="outline" className="gap-2"><Printer className="w-4 h-4" /> Imprimer</Button>
             </div>
           </div>
           
           <div className="hidden print:block text-sm text-slate-600 mb-4"><p className="font-bold">Fichiers:</p><ul className="list-disc list-inside">{selectedFiles.map((f, i) => <li key={i}>{f.name}</li>)}</ul></div>

           <Card title={`Top 5 - Global`} className="print:shadow-none print:border print:border-slate-300">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse whitespace-nowrap">
                 <thead>
                   <tr className="border-b border-slate-200 bg-slate-50/50 print:bg-slate-100">
                     <th className="py-3 px-4 font-semibold text-slate-600">Rang</th>
                     {results.headers.map((h, i) => <th key={i} className="py-3 px-4 font-semibold text-slate-600">{h}</th>)}
                   </tr>
                 </thead>
                 <tbody>
                   {results.topFiveGlobal.map((row, idx) => (
                     <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 print:break-inside-avoid">
                       <td className="py-3 px-4 font-medium text-slate-500">#{idx + 1}</td>
                       {results.headers.map((_, colIdx) => <td key={colIdx} className="py-3 px-4 text-slate-700">{renderCell(row.fullRow[colIdx])}</td>)}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </Card>

           <div className="grid md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
            {[results.heuresPleines, results.heuresPointe, results.heuresCreuses].map((period, idx) => {
               if (!period) return null;
               const colors = ["blue", "rose", "emerald"];
               const icons = [<Clock className="w-6 h-6"/>, <TrendingUp className="w-6 h-6"/>, <Calendar className="w-6 h-6"/>];
               return (
                <Card key={idx} className="relative overflow-hidden print:shadow-none print:border print:border-slate-300 print:break-inside-avoid">
                  <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rotate-45 opacity-10 bg-${colors[idx]}-500 print:opacity-0`} />
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg text-white bg-${colors[idx]}-500 print:text-black print:bg-transparent print:p-0`}><span className="print:hidden">{icons[idx]}</span></div>
                    <h3 className="font-bold text-lg text-slate-800">{period.periodName}</h3>
                  </div>
                  <div className="space-y-4">
                    <div><div className="text-sm text-slate-500 font-semibold">Max</div><div className={`text-3xl font-bold text-${colors[idx]}-600 print:text-black`}>{period.maxValue.toFixed(decimals).replace('.', ',')}</div></div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div><div className="text-xs text-slate-400">Date</div><div className="font-medium">{period.date}</div></div>
                      <div><div className="text-xs text-slate-400">Heure</div><div className="font-medium font-mono">{period.time}</div></div>
                    </div>
                  </div>
                </Card>
               );
            })}
          </div>
          <div className="flex justify-center pt-8 pb-8 print:hidden"><Button variant="outline" onClick={() => { setResults(null); setSelectedFiles([]); }}>Analyser d'autres fichiers</Button></div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. MAIN COMPONENT (EXPORTED)
// ==========================================

export default function EnergyAnalyzer() {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');

  const Home = () => (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Analyseur Énergétique By AHTTAB</h1>
        <p className="text-lg text-slate-600">Sélectionnez le type de fichier pour extraire les indicateurs.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <button onClick={() => setCurrentView('EXCEL_MENU')} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all group text-left">
          <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6"><FileSpreadsheet className="w-8 h-8 text-blue-600" /></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-blue-600">Fichiers Excel</h2>
          <p className="text-slate-500">Compteurs Clou et Elster.</p>
        </button>
        <button onClick={() => setCurrentView('PRN_ANALYSIS')} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all group text-left">
          <div className="bg-emerald-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6"><FileText className="w-8 h-8 text-emerald-600" /></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-emerald-600">Fichiers PRN</h2>
          <p className="text-slate-500">Traitement des fichiers textes formatés.</p>
        </button>
      </div>
    </div>
  );

  const ExcelMenu = () => (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Button variant="ghost" onClick={() => setCurrentView('HOME')} className="mb-8 pl-0"><ArrowLeft className="w-5 h-5" /> Retour</Button>
      <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Type de Compteur Excel</h2>
      <div className="grid gap-6">
        <button onClick={() => setCurrentView('CLOU_ANALYSIS')} className="flex items-center p-6 bg-white rounded-xl shadow-md border hover:ring-2 hover:ring-blue-500"><div className="bg-blue-100 p-4 rounded-full mr-6"><Gauge className="w-8 h-8 text-blue-600"/></div><div><h3 className="text-xl font-bold text-slate-800">Compteur Clou</h3></div></button>
        <button onClick={() => setCurrentView('ELSTER_ANALYSIS')} className="flex items-center p-6 bg-white rounded-xl shadow-md border hover:ring-2 hover:ring-indigo-500"><div className="bg-indigo-100 p-4 rounded-full mr-6"><Activity className="w-8 h-8 text-indigo-600"/></div><div><h3 className="text-xl font-bold text-slate-800">Compteur Elster</h3></div></button>
        <button onClick={() => setCurrentView('ACTARIS_ANALYSIS')} className="flex items-center p-6 bg-white rounded-xl shadow-md border hover:ring-2 hover:ring-amber-500"><div className="bg-amber-100 p-4 rounded-full mr-6"><Zap className="w-8 h-8 text-amber-600"/></div><div><h3 className="text-xl font-bold text-slate-800">Compteur Actaris</h3></div></button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-32 py-4 md:py-0 gap-4 md:gap-0">
            <div className="flex items-center gap-3 cursor-pointer shrink-0 w-full md:w-auto justify-center md:justify-start" onClick={() => setCurrentView('HOME')}>
              <div className="bg-blue-600 p-2 rounded-lg shrink-0"><FileText className="w-8 h-8 text-white" /></div>
              <div className="flex flex-col items-center md:items-start">
                <span className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight leading-tight text-center md:text-left">Analyseur Énergétique</span>
                <span className="text-sm text-slate-500 font-medium">By AHTTAB</span>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-end w-full md:flex-1 md:ml-4 h-24 md:h-full py-0 md:py-2">
                <div className="h-full w-full max-w-[650px] flex items-center justify-center md:justify-end"><OneeLogo /></div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {currentView === 'HOME' && <Home />}
        {currentView === 'EXCEL_MENU' && <ExcelMenu />}
        {currentView === 'CLOU_ANALYSIS' && <AnalysisView 
            title="Compteur Clou" icon={<FileSpreadsheet className="w-6 h-6 text-blue-600"/>} colorClass="blue" onNavigate={setCurrentView} processFunction={extractClouRows} 
            processHeaders={() => ["Date", "Heure", "Info", "Total P. Active (kW)", "Info"]} 
            instructions="Feuille 'Profil de charge moyen'." />}
        {currentView === 'ELSTER_ANALYSIS' && <AnalysisView 
            title="Compteur Elster" icon={<Activity className="w-6 h-6 text-indigo-600"/>} colorClass="indigo" onNavigate={setCurrentView} processFunction={extractElsterRows} 
            processHeaders={() => ["Nom", "Date", "Heure", "Info 1", "Total P. Active (kW)", "Info 2"]} 
            instructions="Données de la 2ème feuille (P. Active)." />}
        {currentView === 'ACTARIS_ANALYSIS' && <AnalysisView 
            title="Compteur Actaris" icon={<Zap className="w-6 h-6 text-amber-600"/>} colorClass="amber" onNavigate={setCurrentView} processFunction={extractActarisRows} 
            processHeaders={() => ["Date", "Heure", "P. Active (kW)"]} 
            instructions="Feuille 'Données des Courbes de Charge'." />}
        {currentView === 'PRN_ANALYSIS' && <AnalysisView 
            title="Fichier PRN" icon={<FileText className="w-6 h-6 text-emerald-600"/>} colorClass="emerald" onNavigate={setCurrentView} processFunction={extractPrnRows} 
            processHeaders={() => ["Nom", "Date", "Heure", "ID", "Total P. Active (kW)", "P. Réactive"]} 
            instructions="Fichiers textes formatés PRN." />}
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