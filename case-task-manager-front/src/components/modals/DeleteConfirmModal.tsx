'use client';

import { AlertTriangle, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
  loading?: boolean;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, taskTitle, loading = false }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-800">
              Confirmar Exclusão
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-neutral-600 mb-2">
            Tem certeza que deseja excluir a tarefa:
          </p>
          <p className="font-medium text-neutral-800 mb-4">
            "{taskTitle}"
          </p>
          <p className="text-sm text-neutral-500">
            Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-neutral-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            {loading ? 'Excluindo...' : 'Excluir Tarefa'}
          </button>
        </div>
      </div>
    </div>
  );
}