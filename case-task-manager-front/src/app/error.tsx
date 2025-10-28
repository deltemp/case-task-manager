'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log do erro para monitoramento
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-neutral-800 mb-4">
          Ops! Algo deu errado
        </h1>
        
        <p className="text-neutral-600 mb-6">
          Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-red-800 mb-2">Detalhes do erro (desenvolvimento):</h3>
            <p className="text-sm text-red-700 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">
                ID do erro: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
          className="flex-1 bg-gradient-to-r from-primary-400 to-primary-500 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-500 hover:to-primary-600 focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          onClick={reset}
        >
            <RefreshCw size={18} />
            <span>Tentar Novamente</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-neutral-100 text-neutral-700 py-3 px-4 rounded-lg font-medium hover:bg-neutral-200 focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Home size={18} />
            <span>Ir para Início</span>
          </button>
        </div>
      </div>
    </div>
  );
}