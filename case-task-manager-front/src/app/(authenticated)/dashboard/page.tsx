'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Clock, CheckCircle, AlertCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SuccessMessage } from '@/components/ui/SuccessMessage';
import { TaskModal } from '@/components/modals/TaskModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { Task, TaskStatus, TaskPriority, UpdateTaskData, CreateTaskData } from '@/types';
import { tasksApi } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasks = await tasksApi.getTasks();
      setTasks(tasks);
    } catch (err) {
      setError('Erro ao carregar tarefas. Tente novamente.');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
    setDropdownOpen(null);
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
    setDropdownOpen(null);
  };

  const handleTaskSubmit = async (taskData: CreateTaskData | UpdateTaskData) => {
    try {
      setError(null);
      
      if (editingTask) {
        const updatedTask = await tasksApi.updateTask(editingTask.id, taskData as UpdateTaskData);
        setTasks(tasks.map(task => 
          task.id === editingTask.id ? updatedTask : task
        ));
        setSuccessMessage('Tarefa atualizada com sucesso!');
      } else {
        const newTask = await tasksApi.createTask(taskData as CreateTaskData);
        setTasks([...tasks, newTask]);
        setSuccessMessage('Tarefa criada com sucesso!');
      }
      
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      setError('Erro ao salvar tarefa. Tente novamente.');
      console.error('Error saving task:', err);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      setError(null);
      await tasksApi.deleteTask(taskToDelete.id);
      setTasks(tasks.filter(task => task.id !== taskToDelete.id));
      setSuccessMessage('Tarefa excluída com sucesso!');
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      setError('Erro ao excluir tarefa. Tente novamente.');
      console.error('Error deleting task:', err);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'in_progress':
        return <AlertCircle size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em Progresso';
      case 'completed':
        return 'Concluída';
      default:
        return status;
    }
  };

  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return 'Baixa';
      case 'medium':
        return 'Média';
      case 'high':
        return 'Alta';
      default:
        return priority;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Minhas Tarefas
          </h1>
          <p className="text-neutral-600 mt-1">
            Gerencie suas tarefas de forma eficiente
          </p>
        </div>
        <button
          onClick={handleCreateTask}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nova Tarefa
        </button>
      </div>

      {/* Messages */}
      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => setError(null)} 
        />
      )}
      {successMessage && (
        <SuccessMessage 
          message={successMessage} 
          onDismiss={() => setSuccessMessage(null)} 
        />
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-[150px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Progresso</option>
              <option value="completed">Concluída</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="min-w-[150px]">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTasks?.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-neutral-900 line-clamp-2">
                {task.title}
              </h3>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(dropdownOpen === task.id ? null : task.id)}
                  className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <MoreVertical size={16} className="text-neutral-500" />
                </button>
                {dropdownOpen === task.id && (
                  <div className="absolute right-0 top-8 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="flex items-center w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <Edit size={14} className="mr-2" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task)}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
              {task.description}
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                  <span className="ml-1">{getStatusText(task.status)}</span>
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {getPriorityText(task.priority)}
                </span>
              </div>

              {task.dueDate && (
                <div className="flex items-center text-xs text-neutral-500">
                  <Calendar size={12} className="mr-1" />
                  Vence em: {formatDate(task.dueDate)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-neutral-400 mb-4">
            <CheckCircle size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Nenhuma tarefa encontrada
          </h3>
          <p className="text-neutral-600 mb-4">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Tente ajustar os filtros para encontrar suas tarefas.'
              : 'Comece criando sua primeira tarefa.'}
          </p>
          {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
            <button
              onClick={handleCreateTask}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Criar Primeira Tarefa
            </button>
          )}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        task={editingTask}
        mode={editingTask ? 'edit' : 'create'}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={confirmDeleteTask}
        taskTitle={taskToDelete?.title || ''}
      />
    </div>
  );
}