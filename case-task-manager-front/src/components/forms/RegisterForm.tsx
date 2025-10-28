'use client';

import { useState } from 'react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onSubmit: (data: Omit<RegisterFormData, 'confirmPassword'>) => Promise<void>;
  isLoading?: boolean;
}

export function RegisterForm({ onSubmit, isLoading = false }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const { confirmPassword, ...submitData } = formData;
      await onSubmit(submitData);
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-6 h-6 text-primary-600" />
        </div>
        <CardTitle className="text-2xl">Criar Conta</CardTitle>
        <CardDescription>
          Preencha os dados para criar sua conta
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            name="name"
            label="Nome Completo"
            placeholder="Seu nome completo"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            disabled={isLoading}
          />

          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            disabled={isLoading}
          />

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`flex h-10 w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.password ? 'border-red-500 focus:ring-red-400' : 'border-neutral-300'
                }`}
                placeholder="Sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`flex h-10 w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.confirmPassword ? 'border-red-500 focus:ring-red-400' : 'border-neutral-300'
                }`}
                placeholder="Confirme sua senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}