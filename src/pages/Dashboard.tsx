import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { historicalHoursService } from '../services/historicalHoursService';
import { HistoricalHoursEntry } from '../types/database';
import { format, parseISO, isBefore, endOfMonth } from 'date-fns';
import { CalendarDays, CheckCircle2, Circle, Loader2 } from 'lucide-react';

const MONTHS_TO_COLLECT = [
  { year: 2025, month: 12, name: 'December' },
  { year: 2026, month: 1, name: 'January' },
  { year: 2026, month: 2, name: 'February' },
  { year: 2026, month: 3, name: 'March' },
  { year: 2026, month: 4, name: 'April' },
  { year: 2026, month: 5, name: 'May' },
  { year: 2026, month: 6, name: 'June' },
  { year: 2026, month: 7, name: 'July' },
  { year: 2026, month: 8, name: 'August' },
  { year: 2026, month: 9, name: 'September' },
];

export const Dashboard: React.FC = () => {
  const { employee } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HistoricalHoursEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employee) {
      loadEntries();
    }
  }, [employee]);

  const loadEntries = async () => {
    try {
      const data = await historicalHoursService.getEntriesByEmployeeId(employee!.id);
      setEntries(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthProgress = (year: number, month: number) => {
    const monthEntries = entries.filter((e) => {
      const d = parseISO(e.entry_date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    if (monthEntries.length === 0) return { status: 'Not Started', totalHours: 0, percentage: 0 };

    let isSubmitted = false;
    let totalHours = 0;
    
    monthEntries.forEach(entry => {
      const remarksData = historicalHoursService.decodeRemarks(entry.remarks);
      if (remarksData.status === 'Submitted') {
        isSubmitted = true;
      }
      totalHours += (entry.hours_worked || 0);
    });

    if (isSubmitted) return { status: 'Complete', totalHours, percentage: 100 };

    // Calculate approximate progress (days filled / total days in month)
    const totalDays = endOfMonth(new Date(year, month - 1)).getDate();
    const uniqueDays = new Set(monthEntries.map(e => e.entry_date)).size;
    const percentage = Math.round((uniqueDays / totalDays) * 100);

    return { status: 'In Progress', totalHours, percentage };
  };

  const totalHistoricalHours = entries.reduce((sum, e) => sum + (e.hours_worked || 0), 0);
  const completedMonths = MONTHS_TO_COLLECT.filter(m => getMonthProgress(m.year, m.month).status === 'Complete').length;
  const overallProgress = Math.round((completedMonths / MONTHS_TO_COLLECT.length) * 100);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {employee?.full_name}</h1>
        <p className="mt-2 text-gray-600">Please complete your historical hours data entry for 2026.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Historical Data Progress</h2>
            <p className="text-sm text-gray-500 mt-1">
              Overall Progress: {overallProgress}% &middot; Total Hours: {totalHistoricalHours}
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <ul className="divide-y divide-gray-200">
          {MONTHS_TO_COLLECT.map((m) => {
            const progress = getMonthProgress(m.year, m.month);
            
            return (
              <li key={`${m.year}-${m.month}`}>
                <button
                  onClick={() => navigate(`/month/${m.year}-${String(m.month).padStart(2, '0')}`)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{m.name} {m.year}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {progress.status === 'Complete' ? `${progress.totalHours} hours total` : `${progress.percentage}% completed`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${
                      progress.status === 'Complete' ? 'text-green-600' :
                      progress.status === 'In Progress' ? 'text-amber-600' :
                      'text-gray-400'
                    }`}>
                      {progress.status}
                    </span>
                    {progress.status === 'Complete' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className={`w-5 h-5 ${progress.status === 'In Progress' ? 'text-amber-500' : 'text-gray-300'}`} />
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
