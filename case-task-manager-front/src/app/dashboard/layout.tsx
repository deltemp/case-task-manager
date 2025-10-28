'use client';

import { ReactNode, useState } from 'react';
import { LogOut, Menu, X, User, Settings, Bell, BarChart3, Badge } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200 h-16 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-4 py-3 h-full">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-neutral-100 lg:hidden cursor-pointer"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-semibold text-neutral-800 ml-2 lg:ml-0">
              Case Task Manager
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-lg hover:bg-neutral-100 relative cursor-pointer">
              <Bell size={20} className="text-neutral-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-400 rounded-full"></span>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-400 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium text-neutral-700 hidden sm:block">
                Usuário
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-red-600 transition-colors cursor-pointer"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        <aside
          className={`fixed left-0 top-16 bottom-0 w-full lg:w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 flex flex-col lg:translate-x-0 lg:static lg:top-0 lg:h-full ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="flex flex-col flex-1 overflow-y-auto">
            <Link
              href="/dashboard"
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer ${
                pathname === '/dashboard' ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : ''
              }`}
            >
              <BarChart3 size={20} />
              <span>Minhas Tarefas</span>
            </Link>
            
            <Link
              href="/profile"
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer ${
                pathname === '/profile' ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : ''
              }`}
            >
              <User size={20} />
              <span>Perfil</span>
            </Link>
            
            <Link
              href=""
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer ${
                pathname === '/dashboard/settings' ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : ''
              }`}
            >
              <Settings size={20} />
              <span>Configurações</span>
              <span className="bg-primary-400 text-white text-xs font-medium px-2 rounded-full whitespace-nowrap">
                Em breve
              </span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 lg:p-6 p-0">
          {children}
        </main>
      </div>
    </div>
  );
}