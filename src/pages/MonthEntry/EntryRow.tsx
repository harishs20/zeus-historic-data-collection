import React from 'react';
import { format, parseISO } from 'date-fns';
import { DailyEntry } from './index';
import { Project, Building, Discipline, WorkPackage } from '../../types/database';
import { Copy, Send, Loader2, Lock } from 'lucide-react';

interface EntryRowProps {
  entry: DailyEntry;
  index: number;
  updateEntry: (index: number, field: keyof DailyEntry, value: any) => void;
  copyPrevious: (index: number) => void;
  onSubmitDay: (index: number) => void;
  submittingDay: string | null;
  projects: Project[];
  buildings: Building[];
  disciplines: Discipline[];
  workPackages: WorkPackage[];
  isSubmitted: boolean;
  view: 'desktop' | 'mobile';
}

export const EntryRow: React.FC<EntryRowProps> = ({
  entry,
  index,
  updateEntry,
  copyPrevious,
  onSubmitDay,
  submittingDay,
  projects,
  buildings,
  disciplines,
  workPackages,
  isSubmitted,
  view
}) => {
  const isWorking = entry.day_status === 'Working';
  const isDaySubmitted = entry.status === 'Submitted';
  const isDaySubmitting = submittingDay === entry.date;
  const availableBuildings = buildings.filter(b => b.project_id === entry.project_id);
  const availableWorkPackages = workPackages.filter(wp => wp.discipline_id === entry.discipline_id);

  const displayDate = format(parseISO(entry.date), 'dd MMM');
  const dayName = format(parseISO(entry.date), 'EEE');

  const baseInputClass = `block w-full border border-gray-300 bg-white rounded-md text-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500`;

  if (view === 'mobile') {
    return (
      <div className={`bg-white rounded-xl shadow-sm border ${isWorking ? 'border-primary-200' : 'border-gray-200'} p-4`}>
        <div className="flex justify-between items-center mb-3">
          <div className="font-medium text-gray-900">
            {displayDate} <span className="text-gray-500 text-sm ml-1">{dayName}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={entry.day_status}
              onChange={(e) => updateEntry(index, 'day_status', e.target.value)}
              disabled={isSubmitted || isDaySubmitted}
              className={`${baseInputClass} w-auto py-1 pl-3 pr-8`}
            >
              <option value="Working">Working</option>
              <option value="Leave">Leave</option>
              <option value="Holiday">Holiday</option>
              <option value="No Entry">No Entry</option>
            </select>
            {isDaySubmitted && <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />}
          </div>
        </div>
        
        {isWorking && (
          <div className="space-y-3">
            {!isSubmitted && !isDaySubmitted && index > 0 && (
              <button 
                onClick={() => copyPrevious(index)}
                className="w-full py-1.5 flex justify-center items-center gap-1 text-xs font-medium text-primary-600 bg-primary-50 rounded border border-primary-100"
              >
                <Copy className="w-3 h-3" /> Copy Previous Row
              </button>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
              <select
                value={entry.project_id || ''}
                onChange={(e) => updateEntry(index, 'project_id', e.target.value ? Number(e.target.value) : null)}
                disabled={isSubmitted || isDaySubmitted}
                className={baseInputClass}
              >
                <option value="">Select...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Building</label>
              <select
                value={entry.building_id || ''}
                onChange={(e) => updateEntry(index, 'building_id', e.target.value ? Number(e.target.value) : null)}
                disabled={!entry.project_id || isSubmitted || isDaySubmitted}
                className={baseInputClass}
              >
                <option value="">Select...</option>
                {availableBuildings.map(b => <option key={b.id} value={b.id}>{b.building_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Discipline</label>
                <select
                  value={entry.discipline_id || ''}
                  onChange={(e) => updateEntry(index, 'discipline_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={isSubmitted || isDaySubmitted}
                  className={baseInputClass}
                >
                  <option value="">Select...</option>
                  {disciplines.map(d => <option key={d.id} value={d.id}>{d.discipline_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Package</label>
                <select
                  value={entry.work_package_id || ''}
                  onChange={(e) => updateEntry(index, 'work_package_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={!entry.discipline_id || isSubmitted || isDaySubmitted}
                  className={baseInputClass}
                >
                  <option value="">Select...</option>
                  {availableWorkPackages.map(wp => <option key={wp.id} value={wp.id}>{wp.package_name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={entry.hours_worked}
                onChange={(e) => updateEntry(index, 'hours_worked', e.target.value)}
                disabled={isSubmitted || isDaySubmitted}
                className={baseInputClass}
                placeholder="0"
              />
            </div>
          </div>
        )}
        {/* Per-day submit / lock indicator */}
        {!isSubmitted && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {isDaySubmitted ? (
              <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                <Lock className="w-3.5 h-3.5" /> Day Submitted & Locked
              </div>
            ) : (
              <button
                onClick={() => onSubmitDay(index)}
                disabled={isDaySubmitting}
                className="w-full py-1.5 flex justify-center items-center gap-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
              >
                {isDaySubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Submit Day
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop view
  return (
    <tr className={`${isWorking ? 'bg-white' : 'bg-gray-50'} ${isDaySubmitted ? 'opacity-80' : ''}`}>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{displayDate}</div>
        <div className="text-xs text-gray-500">{dayName}</div>
      </td>
      <td className="px-4 py-2">
        <select
          value={entry.day_status}
          onChange={(e) => updateEntry(index, 'day_status', e.target.value)}
          disabled={isSubmitted || isDaySubmitted}
          className={`${baseInputClass} py-1.5`}
        >
          <option value="Working">Working</option>
          <option value="Leave">Leave</option>
          <option value="Holiday">Holiday</option>
          <option value="No Entry">No Entry</option>
        </select>
      </td>
      <td className="px-4 py-2">
        <select
          value={entry.project_id || ''}
          onChange={(e) => updateEntry(index, 'project_id', e.target.value ? Number(e.target.value) : null)}
          disabled={!isWorking || isSubmitted || isDaySubmitted}
          className={`${baseInputClass} py-1.5`}
        >
          <option value="">-</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select
          value={entry.building_id || ''}
          onChange={(e) => updateEntry(index, 'building_id', e.target.value ? Number(e.target.value) : null)}
          disabled={!isWorking || !entry.project_id || isSubmitted || isDaySubmitted}
          className={`${baseInputClass} py-1.5`}
        >
          <option value="">-</option>
          {availableBuildings.map(b => <option key={b.id} value={b.id}>{b.building_name}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select
          value={entry.discipline_id || ''}
          onChange={(e) => updateEntry(index, 'discipline_id', e.target.value ? Number(e.target.value) : null)}
          disabled={!isWorking || isSubmitted || isDaySubmitted}
          className={`${baseInputClass} py-1.5`}
        >
          <option value="">-</option>
          {disciplines.map(d => <option key={d.id} value={d.id}>{d.discipline_name}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select
          value={entry.work_package_id || ''}
          onChange={(e) => updateEntry(index, 'work_package_id', e.target.value ? Number(e.target.value) : null)}
          disabled={!isWorking || !entry.discipline_id || isSubmitted || isDaySubmitted}
          className={`${baseInputClass} py-1.5`}
        >
          <option value="">-</option>
          {availableWorkPackages.map(wp => <option key={wp.id} value={wp.id}>{wp.package_name}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={entry.hours_worked}
          onChange={(e) => updateEntry(index, 'hours_worked', e.target.value)}
          disabled={!isWorking || isSubmitted || isDaySubmitted}
          className={`${baseInputClass} py-1.5`}
        />
      </td>
      <td className="px-4 py-2 text-center">
        {isDaySubmitted ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
            <Lock className="w-3 h-3" /> Locked
          </span>
        ) : !isSubmitted ? (
          <div className="flex items-center justify-center gap-1">
            {index > 0 && isWorking && (
              <button
                onClick={() => copyPrevious(index)}
                title="Copy previous row"
                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onSubmitDay(index)}
              disabled={isDaySubmitting}
              title="Submit this day"
              className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50"
            >
              {isDaySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        ) : null}
      </td>
    </tr>
  );
};
