import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { masterDataService } from '../../services/masterDataService';
import { historicalHoursService } from '../../services/historicalHoursService';
import { Project, Building, Discipline, WorkPackage, DayStatus, HistoricalHoursEntry, ParsedRemarks } from '../../types/database';
import { Loader2, ArrowLeft, Save, Send, Copy, Layers } from 'lucide-react';
import { format, parseISO, getDaysInMonth, endOfMonth } from 'date-fns';
import { EntryRow } from './EntryRow';
import { BulkFillModal } from './BulkFillModal';

export interface DailyEntry {
  id?: number;
  date: string;
  day_status: DayStatus;
  project_id: number | null;
  building_id: number | null;
  discipline_id: number | null;
  work_package_id: number | null;
  hours_worked: number | '';
  status: 'Draft' | 'Submitted';
}

export const MonthEntry: React.FC = () => {
  const { month } = useParams<{ month: string }>(); // Format: YYYY-MM
  const { employee } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingDay, setSubmittingDay] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [month, employee]);

  const loadData = async () => {
    if (!month || !employee) return;
    setLoading(true);
    
    try {
      const [yearStr, monthStr] = month.split('-');
      const yearNum = parseInt(yearStr);
      const monthNum = parseInt(monthStr);

      const [proj, bldg, disc, wp, existingEntries] = await Promise.all([
        masterDataService.getProjects(),
        masterDataService.getBuildings(),
        masterDataService.getDisciplines(),
        masterDataService.getWorkPackages(),
        historicalHoursService.getEntriesForMonth(employee.id, yearNum, monthNum)
      ]);

      setProjects(proj);
      setBuildings(bldg);
      setDisciplines(disc);
      setWorkPackages(wp);

      // Generate all days for the month
      const daysCount = getDaysInMonth(new Date(yearNum, monthNum - 1));
      
      const dailyEntries: DailyEntry[] = [];
      let monthSubmitted = false;
      
      for (let i = 1; i <= daysCount; i++) {
        const dateStr = `${yearStr}-${monthStr}-${String(i).padStart(2, '0')}`;
        const existing = existingEntries.find(e => e.entry_date === dateStr);
        
        if (existing) {
          const remarks = historicalHoursService.decodeRemarks(existing.remarks);
          if (remarks.status === 'Submitted') {
            monthSubmitted = true;
          }
          
          // Find discipline from work package
          let discId: number | null = null;
          if (existing.work_package_id) {
            const pkg = wp.find(w => w.id === existing.work_package_id);
            if (pkg) discId = pkg.discipline_id;
          }

          dailyEntries.push({
            id: existing.id,
            date: dateStr,
            day_status: remarks.day_status,
            project_id: existing.project_id,
            building_id: existing.building_id,
            discipline_id: discId,
            work_package_id: existing.work_package_id,
            hours_worked: existing.hours_worked ?? '',
            status: remarks.status
          });
        } else {
          dailyEntries.push({
            date: dateStr,
            day_status: 'No Entry',
            project_id: null,
            building_id: null,
            discipline_id: null,
            work_package_id: null,
            hours_worked: '',
            status: 'Draft'
          });
        }
      }
      
      setEntries(dailyEntries);
      setIsSubmitted(monthSubmitted);
    } catch (err) {
      console.error(err);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = (index: number, field: keyof DailyEntry, value: any) => {
    if (isSubmitted) return;
    // Block editing days that have been individually submitted
    if (entries[index]?.status === 'Submitted') return;
    const newEntries = [...entries];
    
    // Reset dependent fields
    if (field === 'project_id') {
      newEntries[index].building_id = null;
    }
    if (field === 'discipline_id') {
      newEntries[index].work_package_id = null;
    }
    if (field === 'day_status') {
      // Only clear project fields for 'No Entry' — Leave and Holiday can still have project details
      if (value === 'No Entry') {
        newEntries[index].project_id = null;
        newEntries[index].building_id = null;
        newEntries[index].discipline_id = null;
        newEntries[index].work_package_id = null;
        newEntries[index].hours_worked = '';
      }
    }
    
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const copyPrevious = (index: number) => {
    if (index === 0 || isSubmitted) return;
    const prev = entries[index - 1];
    
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      project_id: prev.project_id,
      building_id: prev.building_id,
      discipline_id: prev.discipline_id,
      work_package_id: prev.work_package_id,
    };
    setEntries(newEntries);
  };

  const handleBulkFill = (startDate: string, endDate: string, data: Partial<DailyEntry>) => {
    if (isSubmitted) return;
    
    const newEntries = entries.map(entry => {
      if (entry.date >= startDate && entry.date <= endDate) {
        return {
          ...entry,
          day_status: data.day_status || entry.day_status,
          project_id: data.project_id !== undefined ? data.project_id : entry.project_id,
          building_id: data.building_id !== undefined ? data.building_id : entry.building_id,
          discipline_id: data.discipline_id !== undefined ? data.discipline_id : entry.discipline_id,
          work_package_id: data.work_package_id !== undefined ? data.work_package_id : entry.work_package_id,
        };
      }
      return entry;
    });
    setEntries(newEntries);
    setBulkModalOpen(false);
  };

  const buildPayload = (submit: boolean): HistoricalHoursEntry[] => {
    if (!employee) return [];
    const status: 'Draft' | 'Submitted' = submit ? 'Submitted' : 'Draft';
    
    return entries
      .filter(e => {
        // Only save if it's explicitly set or has data
        if (e.id) return true; // Existing record
        if (e.day_status === 'Working' && (e.project_id || e.hours_worked !== '')) return true;
        if (e.day_status === 'Leave' || e.day_status === 'Holiday') return true;
        return false;
      })
      .map(e => {
        const entry: HistoricalHoursEntry = {
          employee_id: employee.id,
          entry_date: e.date,
          project_id: e.project_id || null,
          building_id: e.building_id || null,
          work_package_id: e.work_package_id || null,
          hours_worked: e.hours_worked === '' ? null : Number(e.hours_worked),
          remarks: historicalHoursService.encodeRemarks(status, e.day_status)
        };
        if (e.id) entry.id = e.id;
        return entry;
      });
  };

  const validateForSubmit = () => {
    let isValid = true;
    entries.forEach(e => {
      if (e.day_status === 'Working') {
        if (!e.project_id || !e.building_id || !e.discipline_id || !e.work_package_id || e.hours_worked === '' || Number(e.hours_worked) <= 0) {
          isValid = false;
        }
      }
    });
    return isValid;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = buildPayload(false);
      await historicalHoursService.saveEntries(payload);
      alert('Draft saved successfully!');
      await loadData();
    } catch (err: any) {
      alert('Failed to save draft: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDay = async (index: number) => {
    if (!employee) return;
    const e = entries[index];
    if (e.day_status === 'No Entry') {
      alert('Please select a status for this day before submitting.');
      return;
    }
    if (e.day_status === 'Working') {
      if (!e.project_id || !e.building_id || !e.discipline_id || !e.work_package_id || e.hours_worked === '' || Number(e.hours_worked) <= 0) {
        alert('Please fill all required fields (Project, Building, Discipline, Work Package, Hours) before submitting this day.');
        return;
      }
    }
    if (!window.confirm(`Submit ${e.date}? This day will be locked and cannot be edited again.`)) return;

    setSubmittingDay(e.date);
    try {
      const dbEntry: HistoricalHoursEntry = {
        employee_id: employee.id,
        entry_date: e.date,
        project_id: e.project_id || null,
        building_id: e.building_id || null,
        work_package_id: e.work_package_id || null,
        hours_worked: e.hours_worked === '' ? null : Number(e.hours_worked),
        remarks: historicalHoursService.encodeRemarks('Submitted', e.day_status)
      };
      if (e.id) dbEntry.id = e.id;
      await historicalHoursService.saveEntries([dbEntry]);
      // Lock this day in local state
      const newEntries = [...entries];
      newEntries[index] = { ...newEntries[index], status: 'Submitted' };
      setEntries(newEntries);
    } catch (err: any) {
      alert('Failed to submit day: ' + err.message);
    } finally {
      setSubmittingDay(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateForSubmit()) {
      alert('Please fill all required fields (Project, Building, Discipline, Work Package, Hours) for all Working days.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to submit this month? You will not be able to edit it later.')) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload(true);
      await historicalHoursService.saveEntries(payload);
      alert('Month submitted successfully!');
      navigate('/');
    } catch (err: any) {
      alert('Failed to submit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const [yearStr, monthStr] = month?.split('-') || [];
  const monthName = format(new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1), 'MMMM yyyy');

  const stats = {
    working: entries.filter(e => e.day_status === 'Working').length,
    leave: entries.filter(e => e.day_status === 'Leave').length,
    holiday: entries.filter(e => e.day_status === 'Holiday').length,
    totalHours: entries.reduce((acc, e) => acc + (Number(e.hours_worked) || 0), 0)
  };

  return (
    <div className="py-6 px-2 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{monthName}</h1>
          <p className="text-sm text-gray-500">
            {isSubmitted ? 'This month is submitted and read-only.' : 'Fill in your daily hours.'}
          </p>
        </div>
        
        {!isSubmitted && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setBulkModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Layers className="w-4 h-4" />
              Bulk Fill
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Save Draft</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">Submit</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
          <p className="text-sm text-gray-500 font-medium">Total Hours</p>
          <p className="text-2xl font-bold text-primary-600">{stats.totalHours}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
          <p className="text-sm text-gray-500 font-medium">Working Days</p>
          <p className="text-2xl font-bold text-gray-900">{stats.working}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
          <p className="text-sm text-gray-500 font-medium">Leave Days</p>
          <p className="text-2xl font-bold text-amber-500">{stats.leave}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
          <p className="text-sm text-gray-500 font-medium">Holidays</p>
          <p className="text-2xl font-bold text-green-500">{stats.holiday}</p>
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden lg:block bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Date</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discipline</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Package</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Hours</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry, index) => (
                <EntryRow 
                  key={entry.date}
                  entry={entry}
                  index={index}
                  updateEntry={updateEntry}
                  copyPrevious={copyPrevious}
                  onSubmitDay={handleSubmitDay}
                  submittingDay={submittingDay}
                  projects={projects}
                  buildings={buildings}
                  disciplines={disciplines}
                  workPackages={workPackages}
                  isSubmitted={isSubmitted}
                  view="desktop"
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4 mb-6">
        {!isSubmitted && (
          <button
            onClick={() => setBulkModalOpen(true)}
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 shadow-sm"
          >
            <Layers className="w-5 h-5" />
            Bulk Fill Multiple Days
          </button>
        )}
        {entries.map((entry, index) => (
          <EntryRow 
            key={entry.date}
            entry={entry}
            index={index}
            updateEntry={updateEntry}
            copyPrevious={copyPrevious}
            onSubmitDay={handleSubmitDay}
            submittingDay={submittingDay}
            projects={projects}
            buildings={buildings}
            disciplines={disciplines}
            workPackages={workPackages}
            isSubmitted={isSubmitted}
            view="mobile"
          />
        ))}
      </div>

      <BulkFillModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onApply={handleBulkFill}
        entries={entries}
        projects={projects}
        buildings={buildings}
        disciplines={disciplines}
        workPackages={workPackages}
      />
    </div>
  );
};
