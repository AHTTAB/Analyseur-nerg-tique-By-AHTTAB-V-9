export type ViewState = 'HOME' | 'EXCEL_MENU' | 'CLOU_ANALYSIS' | 'ELSTER_ANALYSIS' | 'ACTARIS_ANALYSIS' | 'PRN_ANALYSIS' | 'LOGIN' | 'SETTINGS';

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  username: string;
  password?: string; // For prototype
  role: UserRole;
  isOnline?: boolean;
  filesAnalyzed?: string[];
}

export interface DataRow {
  date: string;
  time: string;
  value: number;
  originalIndex: number;
  fullRow: any[];
}

export interface PeriodResult {
  periodName: string; // e.g., "Heures Pleines"
  maxValue: number;
  date: string;
  time: string;
}

export interface AnalysisResult {
  headers: string[];
  topFiveGlobal: DataRow[];
  heuresPleines: PeriodResult | null;
  heuresPointe: PeriodResult | null;
  heuresCreuses: PeriodResult | null;
}

// Alias for backward compatibility if needed, or just use AnalysisResult everywhere
export type ClouAnalysisResult = AnalysisResult;
export type ElsterAnalysisResult = AnalysisResult;

export enum Season {
  WINTER = 'WINTER', // Oct - Mar
  SUMMER = 'SUMMER', // Apr - Sep
}