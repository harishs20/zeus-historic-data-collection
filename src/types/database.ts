export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  designation: string | null;
  role_id: number;
  discipline_id: number;
  phone_number: string | null;
  is_active: boolean;
}

export interface Project {
  id: number;
  project_code: string;
  project_name: string;
  description: string | null;
  status: string;
  is_active: boolean;
}

export interface Building {
  id: number;
  project_id: number;
  building_name: string;
  description: string | null;
  is_active: boolean;
}

export interface Discipline {
  id: number;
  discipline_name: string;
}

export interface WorkPackage {
  id: number;
  discipline_id: number;
  package_name: string;
  description: string | null;
  is_active: boolean;
}

export type DayStatus = 'Working' | 'Leave' | 'Holiday' | 'No Entry';
export type EntryStatus = 'Draft' | 'Submitted';

export interface HistoricalHoursEntry {
  id?: number;
  employee_id: string;
  project_id: number | null;
  building_id: number | null;
  work_package_id: number | null;
  entry_date: string;
  hours_worked: number | null;
  remarks: string | null;
  created_at?: string;
}

export interface ParsedRemarks {
  status: EntryStatus;
  day_status: DayStatus;
  note?: string;
}
