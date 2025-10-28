'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/forms/LoginForm';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SuccessMessage } from '@/components/ui/SuccessMessage';
import { useAuth } from '@/hooks/useAuth';
import { LoginData } from '@/types';

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (data: LoginData) => {
    try {
      clearError();
      setSuccessMessage(null);
      
      await login(data);
      
      setSuccessMessage('Login realizado com sucesso!');
      
      // Redirecionar para dashboard após sucesso
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      // Error is handled by useAuth hook
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={clearError}
          variant="destructive"
        />
      )}
      
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
      
      <LoginForm onSubmit={handleLogin} isLoading={loading} />
      
      <div className="text-center">
        <p className="text-neutral-600">
          Não tem uma conta?{' '}
          <Link
                href="/register"
                className="text-primary-500 hover:text-primary-600 font-medium transition-colors cursor-pointer"
              >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}