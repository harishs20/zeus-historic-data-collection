import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../services/employeeService';
import { historicalHoursService } from '../services/historicalHoursService';
import { Employee, HistoricalHoursEntry } from '../types/database';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { parseISO } from 'date-fns';

const MONTHS = [
  { year: 2026, month: 1, name: 'Jan' },
  { year: 2026, month: 2, name: 'Feb' },
  { year: 2026, month: 3, name: 'Mar' },
  { year: 2026, month: 4, name: 'Apr' },
  { year: 2026, month: 5, name: 'May' },
  { year: 2026, month: 6, name: 'Jun' },
  { year: 2026, month: 7, name: 'Jul' },
  { year: 2026, month: 8, name: 'Aug' },
];

export const Admin: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<HistoricalHoursEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [emp, ent] = await Promise.all([
        employeeService.getAllEmployees(),
        historicalHoursService.getAllEntries()
      ]);
      setEmployees(emp);
      setEntries(ent);
    } catch (err) {
      console.error(err);
      alert('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const getMonthStatus = (employeeId: string, year: number, month: number) => {
    const monthEntries = entries.filter((e) => {
      if (e.employee_id !== employeeId) return false;
      const d = parseISO(e.entry_date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    if (monthEntries.length === 0) return 'Not Started';

    let isSubmitted = false;
    monthEntries.forEach(entry => {
      const remarksData = historicalHoursService.decodeRemarks(entry.remarks);
      if (remarksData.status === 'Submitted') {
        isSubmitted = true;
      }
    });

    if (isSubmitted) return 'Submitted';
    
    // In progress
    const totalDays = month === 8 ? 12 : new Date(year, month, 0).getDate();
    const uniqueDays = new Set(monthEntries.map(e => e.entry_date)).size;
    return `${Math.round((uniqueDays / totalDays) * 100)}%`;
  };

  const filteredEmployees = employees.filter(e => 
    e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">Track historical data collection progress across all employees.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Employee
                </th>
                {MONTHS.map(m => (
                  <th key={`${m.year}-${m.month}`} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{emp.full_name}</div>
                    <div className="text-xs text-gray-500">{emp.email}</div>
                  </td>
                  {MONTHS.map(m => {
                    const status = getMonthStatus(emp.id, m.year, m.month);
                    let badgeClass = 'bg-gray-100 text-gray-800';
                    let display = status;
                    
                    if (status === 'Submitted') {
                      badgeClass = 'bg-green-100 text-green-800';
                      display = '✓';
                    } else if (status === 'Not Started') {
                      badgeClass = 'bg-red-50 text-red-700';
                      display = '0%';
                    } else {
                      badgeClass = 'bg-amber-100 text-amber-800';
                    }

                    return (
                      <td key={`${emp.id}-${m.month}`} className="px-4 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                          {display}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={MONTHS.length + 1} className="px-6 py-10 text-center text-gray-500">
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
