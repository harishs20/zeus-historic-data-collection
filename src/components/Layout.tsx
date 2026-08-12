import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, History, ShieldAlert } from 'lucide-react';

export const Layout: React.FC = () => {
  const { employee, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-gray-900 tracking-tight hidden sm:block">
                ZEUS Project Constants Pvt Ltd
              </span>
              <span className="font-semibold text-lg text-gray-900 tracking-tight sm:hidden">
                ZEUS
              </span>
              <span className="ml-2 text-sm text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                Historical
              </span>
            </div>
            
            {employee && (
              <div className="flex items-center gap-4">
                {employee.role_id === 1 && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="text-sm font-medium text-gray-600 hover:text-primary-600 flex items-center gap-1"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
                <div className="text-sm">
                  <p className="text-gray-900 font-medium truncate max-w-[120px] sm:max-w-[200px]">
                    {employee.full_name}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} ZEUS Project Constants Pvt Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
