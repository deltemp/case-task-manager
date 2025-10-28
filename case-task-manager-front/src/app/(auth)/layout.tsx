import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800 mb-2">
            Case Task Manager
          </h1>
          <p className="text-neutral-600">
            Gerencie suas tarefas de forma eficiente
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}