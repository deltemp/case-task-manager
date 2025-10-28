'use client';

import { useState, useEffect } from 'react';
import { Calendar, User, Flag, FileText, AlertCircle } from 'lucide-react';
import { Task, CreateTaskData, UpdateTaskData, User as UserType } from '@/types';
import { usersApi } from '@/lib/api';

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (task: CreateTaskData | UpdateTaskData) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
  loading?: boolean;
  showActions?: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  dueDate?: string;
  assigneeId?: string;
}

export function TaskForm({ task, onSubmit, onCancel, mode, loading = false, showActions = true }: TaskFormProps) {
  const [formData, setFormData] = useState<Task>({
    id: '',
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    userId: '',
    dueDate: '',
    assigneeId: '',
    createdAt: '',
    updatedAt: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (task && mode === 'edit') {
      setFormData(task);
    } else {
      setFormData({
        id: '',
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        userId: '',
        dueDate: '',
        assigneeId: '',
        createdAt: '',
        updatedAt: '',
      });
    }
    setErrors({});
  }, [task, mode]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const usersData = await usersApi.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Título deve ter no máximo 255 caracteres';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Descrição deve ter no máximo 500 caracteres';
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(dueDate.getTime())) {
        newErrors.dueDate = 'Data de vencimento inválida';
      } else if (dueDate < today) {
        newErrors.dueDate = 'Data de vencimento não pode ser no passado';
      }
    }

    if (formData.assigneeId) {
      const assigneeIdNum = typeof formData.assigneeId === 'string' 
        ? Number(formData.assigneeId) 
        : formData.assigneeId;
      
      if (isNaN(assigneeIdNum) || !Number.isInteger(assigneeIdNum) || assigneeIdNum <= 0) {
        newErrors.assigneeId = 'Responsável deve ser selecionado corretamente';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const isSubmittingNow = loading || isSubmitting;
    if (isSubmittingNow) return;

    setIsSubmitting(true);
    
    try {
      const taskData = {
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        assigneeId: formData.assigneeId || undefined,
      };
      
      onSubmit(taskData);
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof Task, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const getInputClassName = (fieldName: keyof FormErrors) => {
    const baseClasses = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors";
    const errorClasses = "border-red-500 focus:ring-red-400";
    const normalClasses = "border-neutral-300";
    
    return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses}`;
  };

  return (
    <form id="task-form" onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          <FileText size={16} className="inline mr-2" />
          Título *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={getInputClassName('title')}
          placeholder="Digite o título da tarefa"
          maxLength={255}
          disabled={isSubmitting}
        />
        {errors.title && (
          <div className="flex items-center mt-1 text-red-500 text-sm">
            <AlertCircle size={14} className="mr-1" />
            {errors.title}
          </div>
        )}
        <div className="text-xs text-neutral-500 mt-1">
          {formData.title.length}/255 caracteres
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Descrição
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className={`${getInputClassName('description')} resize-none`}
          placeholder="Descreva os detalhes da tarefa"
          maxLength={500}
          disabled={isSubmitting}
        />
        {errors.description && (
          <div className="flex items-center mt-1 text-red-500 text-sm">
            <AlertCircle size={14} className="mr-1" />
            {errors.description}
          </div>
        )}
        <div className="text-xs text-neutral-500 mt-1">
          {(formData.description || '').length}/500 caracteres
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="pending">A Fazer</option>
            <option value="in_progress">Em Progresso</option>
            <option value="completed">Concluída</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <Flag size={16} className="inline mr-2" />
            Prioridade
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <Calendar size={16} className="inline mr-2" />
            Data de Vencimento
          </label>
          <input
            type="date"
            value={formData.dueDate || ''}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            className={getInputClassName('dueDate')}
            min={new Date().toISOString().split('T')[0]}
            disabled={isSubmitting}
          />
          {errors.dueDate && (
            <div className="flex items-center mt-1 text-red-500 text-sm">
              <AlertCircle size={14} className="mr-1" />
              {errors.dueDate}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <User size={16} className="inline mr-2" />
            Responsável
          </label>
          
          <select
            value={formData.assigneeId || ''}
            onChange={(e) => handleInputChange('assigneeId', e.target.value)}
            className={getInputClassName('assigneeId')}
            disabled={isSubmitting || loadingUsers}
          >
            <option value="">Selecione um responsável</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          
          {errors.assigneeId && (
            <div className="flex items-center mt-1 text-red-500 text-sm">
              <AlertCircle size={14} className="mr-1" />
              {errors.assigneeId}
            </div>
          )}
          <div className="text-xs text-neutral-500 mt-1">
            {loadingUsers ? 'Carregando usuários...' : 'Selecione o usuário responsável pela tarefa (opcional)'}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            disabled={loading || isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-lg font-medium hover:from-primary-500 hover:to-primary-600 focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
            disabled={loading || isSubmitting}
          >
            {(loading || isSubmitting) && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>
              {(loading || isSubmitting)
                ? 'Salvando...' 
                : mode === 'create' 
                  ? 'Criar Tarefa' 
                  : 'Salvar Alterações'
              }
            </span>
          </button>
        </div>
      )}
    </form>
  );
}