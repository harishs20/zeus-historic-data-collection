import React, { useState } from 'react';
import { DailyEntry } from './index';
import { Project, Building, Discipline, WorkPackage } from '../../types/database';
import { format, parseISO } from 'date-fns';
import { X } from 'lucide-react';

interface BulkFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (startDate: string, endDate: string, data: Partial<DailyEntry>) => void;
  entries: DailyEntry[];
  projects: Project[];
  buildings: Building[];
  disciplines: Discipline[];
  workPackages: WorkPackage[];
}

export const BulkFillModal: React.FC<BulkFillModalProps> = ({
  isOpen,
  onClose,
  onApply,
  entries,
  projects,
  buildings,
  disciplines,
  workPackages
}) => {
  const [startDate, setStartDate] = useState(entries[0]?.date || '');
  const [endDate, setEndDate] = useState(entries[entries.length - 1]?.date || '');
  
  const [dayStatus, setDayStatus] = useState<string>('Working');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [buildingId, setBuildingId] = useState<number | ''>('');
  const [disciplineId, setDisciplineId] = useState<number | ''>('');
  const [workPackageId, setWorkPackageId] = useState<number | ''>('');

  if (!isOpen) return null;

  const availableBuildings = buildings.filter(b => b.project_id === (projectId || -1));
  const availableWorkPackages = workPackages.filter(wp => wp.discipline_id === (disciplineId || -1));

  const handleApply = () => {
    onApply(startDate, endDate, {
      day_status: dayStatus as any,
      project_id: projectId === '' ? undefined : (projectId || null),
      building_id: buildingId === '' ? undefined : (buildingId || null),
      discipline_id: disciplineId === '' ? undefined : (disciplineId || null),
      work_package_id: workPackageId === '' ? undefined : (workPackageId || null),
    });
  };

  const baseInputClass = `mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Bulk Fill Data
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-4 text-sm text-gray-500 mb-6">
              Select a date range and the fields you want to update. Blank fields will not overwrite existing data. Hours are not bulk-filled.
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">From Date</label>
                  <select 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className={baseInputClass}
                  >
                    {entries.map(e => <option key={`start-${e.date}`} value={e.date}>{format(parseISO(e.date), 'MMM dd')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">To Date</label>
                  <select 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className={baseInputClass}
                  >
                    {entries.map(e => <option key={`end-${e.date}`} value={e.date}>{format(parseISO(e.date), 'MMM dd')}</option>)}
                  </select>
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              <div>
                <label className="block text-sm font-medium text-gray-700">Day Status</label>
                <select 
                  value={dayStatus} 
                  onChange={e => setDayStatus(e.target.value)}
                  className={baseInputClass}
                >
                  <option value="Working">Working</option>
                  <option value="Leave">Leave</option>
                  <option value="Holiday">Holiday</option>
                  <option value="No Entry">No Entry</option>
                </select>
              </div>

              {dayStatus !== 'No Entry' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project</label>
                    <select 
                      value={projectId} 
                      onChange={e => {
                        setProjectId(e.target.value ? Number(e.target.value) : '');
                        setBuildingId('');
                      }}
                      className={baseInputClass}
                    >
                      <option value="">Do not change</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Building</label>
                    <select 
                      value={buildingId} 
                      onChange={e => setBuildingId(e.target.value ? Number(e.target.value) : '')}
                      disabled={!projectId}
                      className={baseInputClass}
                    >
                      <option value="">Do not change</option>
                      {availableBuildings.map(b => <option key={b.id} value={b.id}>{b.building_name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Discipline</label>
                      <select 
                        value={disciplineId} 
                        onChange={e => {
                          setDisciplineId(e.target.value ? Number(e.target.value) : '');
                          setWorkPackageId('');
                        }}
                        className={baseInputClass}
                      >
                        <option value="">Do not change</option>
                        {disciplines.map(d => <option key={d.id} value={d.id}>{d.discipline_name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Work Package</label>
                      <select 
                        value={workPackageId} 
                        onChange={e => setWorkPackageId(e.target.value ? Number(e.target.value) : '')}
                        disabled={!disciplineId}
                        className={baseInputClass}
                      >
                        <option value="">Do not change</option>
                        {availableWorkPackages.map(wp => <option key={wp.id} value={wp.id}>{wp.package_name}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleApply}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Apply to Range
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
