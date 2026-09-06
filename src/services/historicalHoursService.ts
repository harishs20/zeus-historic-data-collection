import { supabase } from '../lib/supabase';
import { HistoricalHoursEntry, ParsedRemarks, EntryStatus, DayStatus } from '../types/database';

export const historicalHoursService = {
  async getEntriesForMonth(employeeId: string, year: number, month: number): Promise<HistoricalHoursEntry[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
    
    const { data, error } = await supabase
      .from('historical_hours_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate);
      
    if (error) throw new Error(error.message);
    return data;
  },

  async getEntriesByEmployeeId(employeeId: string): Promise<HistoricalHoursEntry[]> {
    const { data, error } = await supabase
      .from('historical_hours_entries')
      .select('*')
      .eq('employee_id', employeeId);
    if (error) throw new Error(error.message);
    return data;
  },

  async getAllEntries(): Promise<HistoricalHoursEntry[]> {
    const { data, error } = await supabase
      .from('historical_hours_entries')
      .select('*');
    if (error) throw new Error(error.message);
    return data;
  },

  async saveEntries(entries: HistoricalHoursEntry[]): Promise<void> {
    if (entries.length === 0) return;

    const toInsert = entries.filter(e => !e.id);
    const toUpdate = entries.filter(e => e.id);

    if (toInsert.length > 0) {
      const insertData = toInsert.map(({ id, ...rest }) => rest);
      const { error } = await supabase
        .from('historical_hours_entries')
        .insert(insertData);
      if (error) throw new Error(error.message);
    }

    if (toUpdate.length > 0) {
      const { error } = await supabase
        .from('historical_hours_entries')
        .upsert(toUpdate, { onConflict: 'id' });
      if (error) throw new Error(error.message);
    }
  },
  
  async deleteEntry(id: number): Promise<void> {
    const { error } = await supabase
      .from('historical_hours_entries')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  encodeRemarks(status: EntryStatus, dayStatus: DayStatus, note?: string): string {
    const data: ParsedRemarks = { status, day_status: dayStatus, note };
    return JSON.stringify(data);
  },

  decodeRemarks(remarks: string | null): ParsedRemarks {
    if (!remarks) {
      return { status: 'Draft', day_status: 'Working' };
    }
    try {
      return JSON.parse(remarks) as ParsedRemarks;
    } catch {
      return { status: 'Draft', day_status: 'Working', note: remarks };
    }
  }
};
