import * as XLSX from 'xlsx';
import { AnalysisResult, DataRow, PeriodResult, Season } from '../types';

// Helper to parse time string "HH:MM" or "HH:MM:SS" into minutes
const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr || typeof timeStr !== 'string') return -1;
  // Handle "23:50:00" -> "23:50"
  const cleanTime = timeStr.trim();
  const parts = cleanTime.split(':');
  if (parts.length < 2) return -1;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return -1;
  return hours * 60 + minutes;
};

// Helper to determine season
const getSeason = (date: Date): Season => {
  const month = date.getMonth(); // 0 = Jan, 11 = Dec
  // Oct (9) to March (2) is Winter
  if (month >= 9 || month <= 2) {
    return Season.WINTER;
  }
  return Season.SUMMER;
};

// Shared Analysis Logic
const performSeasonAnalysis = (processedRows: DataRow[]): AnalysisResult => {
    // Top 5 Global
    const sortedByValue = [...processedRows].sort((a, b) => b.value - a.value);
    const topFiveGlobal = sortedByValue.slice(0, 5);
  
    // Period Analysis
    let maxHP: DataRow | null = null;
    let maxPointe: DataRow | null = null;
    let maxCreux: DataRow | null = null;
  
    processedRows.forEach(row => {
      const [d, m, y] = row.date.split('/').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const season = getSeason(dateObj);
      const t = parseTimeToMinutes(row.time);
      
      if (t === -1) return;
  
      let isHP = false;
      let isPointe = false;
      let isCreux = false;
  
      // Time logic (Minutes from midnight)
      if (season === Season.WINTER) {
        // Winter (Oct-Mar)
        // HP: 07:10 (430) - 17:00 (1020)
        if (t >= 430 && t <= 1020) isHP = true;
        // Pointe: 17:10 (1030) - 22:00 (1320)
        else if (t >= 1030 && t <= 1320) isPointe = true;
        // Creux: 22:10 (1330) - 07:00 (420)
        else if (t >= 1330 || t <= 420) isCreux = true;
      } else {
        // Summer (Apr-Sep)
        // HP: 07:10 (430) - 18:00 (1080)
        if (t >= 430 && t <= 1080) isHP = true;
        // Pointe: 18:10 (1090) - 23:00 (1380)
        else if (t >= 1090 && t <= 1380) isPointe = true;
        // Creux: 23:10 (1390) - 07:00 (420)
        else if (t >= 1390 || t <= 420) isCreux = true;
      }
  
      if (isHP) {
        if (!maxHP || row.value > maxHP.value) maxHP = row;
      }
      if (isPointe) {
        if (!maxPointe || row.value > maxPointe.value) maxPointe = row;
      }
      if (isCreux) {
        if (!maxCreux || row.value > maxCreux.value) maxCreux = row;
      }
    });
  
    const formatPeriodResult = (row: DataRow | null, name: string): PeriodResult | null => {
      if (!row) return null;
      return {
        periodName: name,
        maxValue: row.value,
        date: row.date,
        time: row.time
      };
    };
  
    return {
      headers: [], // Will be filled by caller
      topFiveGlobal,
      heuresPleines: formatPeriodResult(maxHP, "Heures Pleines"),
      heuresPointe: formatPeriodResult(maxPointe, "Heures de Pointe"),
      heuresCreuses: formatPeriodResult(maxCreux, "Heures Creuses"),
    };
};

// --- DATA AGGREGATION UTILS ---

/**
 * Merges multiple datasets by summing values that share the same Date and Time.
 */
const mergeDatasets = (datasets: DataRow[][]): DataRow[] => {
  if (datasets.length === 0) return [];
  if (datasets.length === 1) return datasets[0];

  // Use a map to aggregate values: Key = "DD/MM/YYYY|HH:MM"
  const map = new Map<string, DataRow>();

  datasets.forEach(dataset => {
    dataset.forEach(row => {
      const key = `${row.date}|${row.time}`;
      
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.value += row.value;
      } else {
        // Clone the row to avoid mutating original
        map.set(key, { ...row, fullRow: [...row.fullRow] });
      }
    });
  });

  // Convert map back to array
  const mergedRows = Array.from(map.values()).map((row, index) => {
    return {
      ...row,
      originalIndex: index + 1, // Re-index
    };
  });

  return mergedRows;
};

// --- HELPER FOR PARSING EXCEL DATE/TIME ---
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
         // Handle Excel fraction of day
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

// --- CLOU PARSING ---

const extractClouRows = async (file: File): Promise<DataRow[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellDates: false });
  const sheetIndex = workbook.SheetNames.length > 1 ? 1 : 0;
  const sheetName = workbook.SheetNames[sheetIndex];
  const sheet = workbook.Sheets[sheetName];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (jsonData.length === 0) throw new Error(`Fichier ${file.name} vide.`);

  const IDX_DATE = 0;
  const IDX_TIME = 1;
  const IDX_VALUE = 3; // Active Power

  const processedRows: DataRow[] = [];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length <= IDX_VALUE) continue;

    const value = parseExcelNumber(row[IDX_VALUE]);
    if (value === null) continue;

    const dateStr = parseExcelDate(row[IDX_DATE]);
    const timeStr = parseExcelTime(row[IDX_TIME]);

    if (!dateStr || !timeStr) continue;

    const displayRow = [...row];
    displayRow[IDX_VALUE] = value;

    processedRows.push({
      date: dateStr,
      time: timeStr,
      value: value,
      originalIndex: i + 1,
      fullRow: displayRow
    });
  }
  return processedRows;
};

export const processClouFiles = async (files: File[]): Promise<AnalysisResult> => {
  if (files.length === 0) throw new Error("Aucun fichier sélectionné.");

  const allDatasets = await Promise.all(files.map(extractClouRows));
  const mergedRows = mergeDatasets(allDatasets);

  if (mergedRows.length === 0) throw new Error("Aucune donnée valide trouvée.");

  if (files.length > 1) {
    mergedRows.forEach(row => {
      row.fullRow = [row.date, row.time, "Somme", row.value, "-"];
    });
  }

  const result = performSeasonAnalysis(mergedRows);
  result.headers = ["Date", "Heure", "Info", "Total P. Active (kW)", "Info"];
  return result;
};


// --- ELSTER PARSING ---

const extractElsterRows = async (file: File): Promise<DataRow[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellDates: false });
  const sheetIndex = workbook.SheetNames.length > 1 ? 1 : 0;
  const sheetName = workbook.SheetNames[sheetIndex];
  const sheet = workbook.Sheets[sheetName];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (jsonData.length === 0) throw new Error(`Fichier ${file.name} vide.`);

  const IDX_DATE = 1;
  const IDX_TIME = 2;
  const IDX_VALUE = 4;

  const processedRows: DataRow[] = [];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length <= IDX_VALUE) continue;

    const value = parseExcelNumber(row[IDX_VALUE]);
    if (value === null) continue;

    const dateStr = parseExcelDate(row[IDX_DATE]);
    const timeStr = parseExcelTime(row[IDX_TIME]);

    if (!dateStr || !timeStr) continue;

    const displayDate = typeof row[IDX_DATE] === 'string' ? row[IDX_DATE] : dateStr;
    const displayTime = typeof row[IDX_TIME] === 'string' ? row[IDX_TIME] : timeStr;
    const displayRow = [...row];
    displayRow[IDX_DATE] = displayDate;
    displayRow[IDX_TIME] = displayTime;
    displayRow[IDX_VALUE] = value;

    processedRows.push({
      date: dateStr,
      time: timeStr,
      value: value,
      originalIndex: i + 1,
      fullRow: displayRow
    });
  }
  return processedRows;
};

export const processElsterFiles = async (files: File[]): Promise<AnalysisResult> => {
    if (files.length === 0) throw new Error("Aucun fichier sélectionné.");
  
    const allDatasets = await Promise.all(files.map(extractElsterRows));
    const mergedRows = mergeDatasets(allDatasets);
  
    if (mergedRows.length === 0) throw new Error("Aucune donnée valide trouvée.");

    if (files.length > 1) {
        mergedRows.forEach(row => {
          row.fullRow = ["Global", row.date, row.time, "-", row.value, "-"];
        });
    }
  
    const result = performSeasonAnalysis(mergedRows);
    result.headers = ["Nom", "Date", "Heure", "Info 1", "Total P. Active (kW)", "Info 2"];
    return result;
};

// --- ACTARIS PARSING ---

const extractActarisRows = async (file: File): Promise<DataRow[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { cellDates: false });
    
    // Attempt to find specific sheet "Données des Courbes de Charge"
    let sheetName = "Données des Courbes de Charge";
    if (!workbook.Sheets[sheetName]) {
        // Fallback to sheet index 0 if specific name not found
        sheetName = workbook.SheetNames[0];
    }
    
    const sheet = workbook.Sheets[sheetName];
    // Use header:1 to get array of arrays
    const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
    if (jsonData.length === 0) throw new Error(`Fichier ${file.name} vide.`);
  
    const IDX_DATE = 0;
    const IDX_TIME = 1;
    const IDX_VALUE = 2; // Puissance Active
  
    const processedRows: DataRow[] = [];
    let lastValidDate = ""; // To handle empty date cells that imply "same as above"
  
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length <= IDX_VALUE) continue;
      
      // Try to parse date from current row
      let dateStr = "";
      if (row[IDX_DATE] !== undefined && row[IDX_DATE] !== null && row[IDX_DATE] !== "") {
          dateStr = parseExcelDate(row[IDX_DATE]);
      }
      
      // If we found a date, update the memory. If not, use the last valid date.
      if (dateStr) {
          lastValidDate = dateStr;
      } else {
          // If the cell is empty, we assume it belongs to the previous date (Actaris logic)
          dateStr = lastValidDate;
      }

      // If we still don't have a date (e.g. header rows before first data), skip
      if (!dateStr) continue;

      const timeStr = parseExcelTime(row[IDX_TIME]);
      if (!timeStr) continue;

      const value = parseExcelNumber(row[IDX_VALUE]);
      if (value === null) continue;
  
      // Construct a clean row for display
      const displayRow = [dateStr, timeStr, value];
  
      processedRows.push({
        date: dateStr,
        time: timeStr,
        value: value,
        originalIndex: i + 1,
        fullRow: displayRow
      });
    }
    return processedRows;
};

export const processActarisFiles = async (files: File[]): Promise<AnalysisResult> => {
    if (files.length === 0) throw new Error("Aucun fichier sélectionné.");
  
    const allDatasets = await Promise.all(files.map(extractActarisRows));
    const mergedRows = mergeDatasets(allDatasets);
  
    if (mergedRows.length === 0) throw new Error("Aucune donnée valide trouvée.");
  
    if (files.length > 1) {
      mergedRows.forEach(row => {
        row.fullRow = [row.date, row.time, row.value];
      });
    }
  
    const result = performSeasonAnalysis(mergedRows);
    // Actaris only really has Date, Time, Value. 
    result.headers = ["Date", "Heure", "P. Active (kW)"];
    return result;
};


// --- PRN PARSING ---

const extractPrnRows = async (file: File): Promise<DataRow[]> => {
  const text = await file.text();
  const lines = text.split(/\r?\n/);
  console.log(`Processing PRN file: ${file.name}, total lines: ${lines.length}`);
  const processedRows: DataRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // تقسيم السطر بناءً على المسافات المتعددة
    const parts = line.split(/\s+/);
    
    // نتوقع على الأقل 6 أجزاء (Name, Date, Time, ID, Value1, Value2)
    if (parts.length < 6) {
        if (i < 5) console.log(`Line ${i} has insufficient parts (${parts.length}): ${line}`, parts);
        continue;
    }

    // بناءً على التنسيق: NORMAL TR2 01/06/2025 00:10 10 0 0
    // parts[0] = NORMAL, parts[1] = TR2, parts[2] = 01/06/2025, parts[3] = 00:10, parts[4] = 10, parts[5] = 0, parts[6] = 0
    // قد يختلف عدد الأجزاء إذا كان الاسم يحتوي مسافات.
    
    // محاولة استخراج التاريخ والوقت والقيمة بناءً على التنسيق الملاحظ
    const rawDate = parts[parts.length - 5];
    const rawTime = parts[parts.length - 4];
    const rawValue = parts[parts.length - 3];
    const rawReactive = parts[parts.length - 2];

    const value = parseExcelNumber(rawValue);
    if (value === null) continue;

    const fullRow: any[] = parts;
    fullRow[parts.length - 3] = value; // تحديث القيمة

    // Parse Date (DD/MM/YY or DD/MM/YYYY)
    const dateParts = rawDate.split(/[-/]/);
    let dateStr = "";
    if (dateParts.length === 3) {
      const day = dateParts[0].padStart(2, '0');
      const month = dateParts[1].padStart(2, '0');
      let year = dateParts[2];
      if (year.length === 2) year = "20" + year;
      if (!isNaN(Number(day)) && !isNaN(Number(month))) dateStr = `${day}/${month}/${year}`;
    }

    const timeParts = rawTime.split(':');
    let timeStr = "";
    if (timeParts.length >= 2) {
      const h = timeParts[0].padStart(2, '0');
      const m = timeParts[1].padStart(2, '0');
      if (!isNaN(Number(h)) && !isNaN(Number(m))) timeStr = `${h}:${m}`;
    }

    if (!dateStr || !timeStr) continue;

    processedRows.push({
      date: dateStr,
      time: timeStr,
      value: value,
      originalIndex: i + 1,
      fullRow: fullRow
    });
  }
  return processedRows;
};

export const processPrnFiles = async (files: File[]): Promise<AnalysisResult> => {
  if (files.length === 0) throw new Error("Aucun fichier sélectionné.");

  const allDatasets = await Promise.all(files.map(extractPrnRows));
  const mergedRows = mergeDatasets(allDatasets);

  if (mergedRows.length === 0) throw new Error("Aucune donnée valide trouvée.");

  if (files.length > 1) {
    mergedRows.forEach(row => {
      row.fullRow = ["Global", row.date, row.time, "-", row.value, "-"];
    });
  }

  const result = performSeasonAnalysis(mergedRows);
  result.headers = ["Nom", "Date", "Heure", "ID", "Total P. Active (kW)", "P. Réactive"];
  return result;
};