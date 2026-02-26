'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import { User, UserRole, UpdateUserDto } from '@/lib/api/users';
import { useAuthStore } from '@/stores/auth-store';

const userSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .optional()
    .or(z.literal('')),
  role: z.enum([
    'ADMIN',
    'ONCOLOGIST',
    'DOCTOR',
    'NURSE_CHIEF',
    'NURSE',
    'COORDINATOR',
  ]),
  mfaEnabled: z.boolean().default(false),
});

type UserFormData = z.infer<typeof userSchema>;

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'ONCOLOGIST', label: 'Oncologista' },
  { value: 'DOCTOR', label: 'Médico' },
  { value: 'NURSE_CHIEF', label: 'Enfermeiro Chefe' },
  { value: 'NURSE', label: 'Enfermeiro' },
  { value: 'COORDINATOR', label: 'Coordenador' },
];

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) {
  const isEditing = !!user;
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const { user: currentUser } = useAuthStore();

  // Apenas ADMIN pode alterar roles
  const canChangeRole = currentUser?.role === 'ADMIN';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'NURSE',
      mfaEnabled: false,
    },
  });

  // Ao criar usuário, se não for admin, fixar role em NURSE
  useEffect(() => {
    if (!isEditing && !canChangeRole) {
      setValue('role', 'NURSE');
    }
  }, [isEditing, canChangeRole, setValue]);

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: '', // Não preencher senha ao editar
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      });
    } else {
      // Ao criar, se não for admin, fixar role em NURSE
      reset({
        name: '',
        email: '',
        password: '',
        role: canChangeRole ? 'NURSE' : 'NURSE', // Sempre NURSE como padrão
        mfaEnabled: false,
      });
    }
  }, [user, reset, open, canChangeRole]);

  const onSubmit = async (data: UserFormData): Promise<void> => {
    try {
      if (isEditing) {
        // Remover password se estiver vazio (não atualizar senha)
        const updateData: UpdateUserDto = {
          name: data.name,
          email: data.email,
          role: data.role,
          mfaEnabled: data.mfaEnabled,
        };
        if (data.password && data.password.length > 0) {
          updateData.password = data.password;
        }
        await updateUserMutation.mutateAsync({
          id: user!.id,
          data: updateData,
        });
      } else {
        if (!data.password || data.password.length < 6) {
          alert('Senha é obrigatória e deve ter no mínimo 6 caracteres');
          return;
        }
        await createUserMutation.mutateAsync({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          mfaEnabled: data.mfaEnabled,
        });
      }
      onOpenChange(false);
      reset();
    } catch (error: unknown) {
      console.error('Erro ao salvar usuário:', error);
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : 'Erro ao salvar usuário. Tente novamente.';
      alert(errorMessage);
    }
  };

  const isLoading =
    createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Nome completo"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">
              Senha {isEditing && '(deixe em branco para não alterar)'}
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder={isEditing ? 'Nova senha (opcional)' : 'Senha'}
            />
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
            {!isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de 6 caracteres
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Função</Label>
            <select
              id="role"
              {...register('role')}
              disabled={!canChangeRole}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                !canChangeRole
                  ? 'bg-gray-100 cursor-not-allowed opacity-60'
                  : ''
              }`}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {!canChangeRole && (
              <p className="text-xs text-gray-500 mt-1">
                {isEditing
                  ? 'Apenas administradores podem alterar a função do usuário'
                  : 'Apenas administradores podem criar usuários com outras funções além de Enfermeiro'}
              </p>
            )}
            {errors.role && (
              <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mfaEnabled"
              {...register('mfaEnabled')}
              className="h-4 w-4"
            />
            <Label htmlFor="mfaEnabled" className="cursor-pointer">
              Habilitar autenticação de dois fatores (MFA)
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar Alterações'
                  : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
