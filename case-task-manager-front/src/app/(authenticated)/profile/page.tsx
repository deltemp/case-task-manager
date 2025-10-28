'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usersApi } from '@/lib/api';
import { Edit, Save, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SuccessMessage } from '@/components/ui/SuccessMessage';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  role: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  role?: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    role: '',
  });
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    role: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (user) {
      const userProfile: UserProfile = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        role: user.role || '',
      };
      setProfile(userProfile);
      setEditedProfile(userProfile);
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!editedProfile.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!editedProfile.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(editedProfile.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
    setErrors({});
    setError(null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (user?.id) {
        const updatedUser = await usersApi.updateProfile(user.id, {
          name: editedProfile.name,
          email: editedProfile.email,
          phone: editedProfile.phone,
          location: editedProfile.location,
          bio: editedProfile.bio,
        });
        
        setProfile({ ...editedProfile });
        setIsEditing(false);
        setErrors({});
        setSuccessMessage('Perfil atualizado com sucesso!');
        
        updateUser(updatedUser);
        
        console.log('Profile saved:', updatedUser);
      } else {
        throw new Error('ID do usuário não encontrado');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getInputClassName = (fieldName: keyof UserProfile) => {
    const baseClasses = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors";
    const errorClasses = "border-red-500 focus:ring-red-400";
    const normalClasses = "border-neutral-300";
    
    return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6 mobile-padding">
      <div className="flex flex-col gap-4 max-w-4xl mx-auto">
        {authLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
            variant="destructive"
          />
        )}
            
            {successMessage && (
               <SuccessMessage
                 message={successMessage}
                 onDismiss={() => setSuccessMessage(null)}
               />
             )}
            
            <div className="bg-white rounded-lg card-shadow lg:p-8 p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-8 animate-slide-in">
                <h1 className="text-3xl font-bold text-neutral-900">Perfil do Usuário</h1>
                <div className="flex space-x-3">
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all hover-lift focus-ring cursor-pointer"
                      disabled={loading}
                    >
                      <Edit size={20} />
                      <span>Editar Perfil</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 bg-neutral-200 text-neutral-700 px-4 py-2 rounded-lg font-medium hover:bg-neutral-300 transition-all hover-lift focus-ring cursor-pointer"
                        disabled={loading}
                      >
                        <X size={20} />
                        <span>Cancelar</span>
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all hover-lift focus-ring cursor-pointer"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <Save size={20} />
                            <span>Salvar</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg card-shadow p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">Informações Pessoais</h3>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Nome Completo
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus-ring transition-colors"
                        />
                      ) : (
                        <p className="text-neutral-900 py-2">{profile.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editedProfile.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus-ring transition-colors"
                        />
                      ) : (
                        <p className="text-neutral-900 py-2">{profile.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Telefone
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedProfile.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus-ring transition-colors"
                        />
                      ) : (
                        <p className="text-neutral-900 py-2">{profile.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Localização
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus-ring transition-colors"
                        />
                      ) : (
                        <p className="text-neutral-900 py-2">{profile.location}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedProfile.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus-ring transition-colors"
                      />
                    ) : (
                      <p className="text-neutral-900 py-2">{profile.bio}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Cargo
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus-ring transition-colors"
                      />
                    ) : (
                      <p className="text-neutral-900 py-2">{profile.role}</p>
                    )}
                  </div>
              </form>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl card-shadow border border-neutral-200 p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Configurações da Conta</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div>
                <h4 className="font-medium text-neutral-800">Alterar Senha</h4>
                <p className="text-sm text-neutral-600">Atualize sua senha para manter sua conta segura</p>
              </div>
              <button className="px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors hover-lift focus-ring cursor-pointer">
                  <Edit size={16} />
                </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div>
                <h4 className="font-medium text-neutral-800">Notificações</h4>
                <p className="text-sm text-neutral-600">Configure como você deseja receber notificações</p>
              </div>
              <button className="px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors hover-lift focus-ring">
                Configurar
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h4 className="font-medium text-red-800">Excluir Conta</h4>
                <p className="text-sm text-red-600">Remova permanentemente sua conta e todos os dados</p>
              </div>
              <button className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors hover-lift focus-ring cursor-pointer">
                  Excluir Conta
                </button>
            </div>
          </div>
         </div>
           </>
         )}
       </div>
     </div>
   );
 }