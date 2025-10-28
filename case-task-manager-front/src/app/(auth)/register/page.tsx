'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SuccessMessage } from '@/components/ui/SuccessMessage';
import { useAuth } from '@/hooks/useAuth';
import { RegisterData } from '@/types';

export default function RegisterPage() {
  const { register, loading, error, clearError } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (data: RegisterData) => {
    try {
      clearError();
      setSuccessMessage(null);
      
      await register(data);
      
      setSuccessMessage('Conta criada com sucesso! Redirecionando para o login...');
      
      // Redirecionar para login após sucesso
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Register error:', error);
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
      
      <RegisterForm onSubmit={handleRegister} isLoading={loading} />
      
      <div className="text-center">
        <p className="text-neutral-600">
          Já tem uma conta?{' '}
          <Link
                href="/login"
                className="text-primary-500 hover:text-primary-600 font-medium transition-colors cursor-pointer"
              >
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}