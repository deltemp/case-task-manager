import React from 'react';
import { X } from 'lucide-react';
import { TaskForm } from '../forms/TaskForm';
import { Task, CreateTaskData, UpdateTaskData } from '@/types/index';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSubmit: (task: CreateTaskData | UpdateTaskData) => void;
  mode: 'create' | 'edit';
  loading?: boolean;
}

export function TaskModal({ isOpen, onClose, task, onSubmit, mode, loading = false }: TaskModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleSubmit = (taskData: CreateTaskData | UpdateTaskData) => {
    onSubmit(taskData);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" role="dialog">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-white rounded-t-xl">
          <h2 className="text-xl font-semibold text-neutral-800">
            {mode === 'create' ? 'Nova Tarefa' : 'Editar Tarefa'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <TaskForm
            task={task}
            onSubmit={handleSubmit}
            onCancel={onClose}
            mode={mode}
            loading={loading}
            showActions={false}
          />
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-neutral-200 bg-white rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="task-form"
            className="px-6 py-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-lg font-medium hover:from-primary-500 hover:to-primary-600 focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
            disabled={loading}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>
              {loading
                ? 'Salvando...' 
                : mode === 'create' 
                  ? 'Criar Tarefa' 
                  : 'Salvar Alterações'
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}