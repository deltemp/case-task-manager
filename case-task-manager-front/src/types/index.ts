// User types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  bio?: string;
  role?: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  userId: string;
  dueDate?: string;
  assigneeId?: string;
  assignee?: User; // Populated user object
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user?: User;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CreateTaskData {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter and search types
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}

// Loading and UI state types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

// Component prop types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}