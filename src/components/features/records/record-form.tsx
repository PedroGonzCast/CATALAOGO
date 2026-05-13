'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CreateRecordPayload, RecordView, UpdateRecordPayload } from '@/types/domain/record';

interface RecordFormProps {
  defaultValues?: Partial<RecordView>;
  onSubmit: (data: CreateRecordPayload | UpdateRecordPayload) => Promise<boolean>;
  onCancel: () => void;
  isEdit?: boolean;
}

export function RecordForm({ defaultValues, onSubmit, onCancel, isEdit = false }: RecordFormProps) {
  const [fields, setFields] = useState({
    Nombre: defaultValues?.Nombre ?? '',
    Email: defaultValues?.Email ?? '',
    Telefono: defaultValues?.Telefono ?? '',
    Activo: defaultValues?.Activo ?? 'Sí',
    Notas: defaultValues?.Notas ?? '',
  });
  const [errors, setErrors] = useState<Partial<typeof fields>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  function validate(): boolean {
    const next: Partial<typeof fields> = {};
    if (!fields.Nombre.trim()) next.Nombre = 'El nombre es requerido';
    if (!fields.Email.trim()) next.Email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.Email)) next.Email = 'Email inválido';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError('');

    const ok = await onSubmit(fields);
    setIsLoading(false);

    if (!ok) {
      setServerError('Ocurrió un error. Intenta de nuevo.');
    }
  }

  function handleChange(field: keyof typeof fields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre"
        required
        value={fields.Nombre}
        onChange={(e) => handleChange('Nombre', e.target.value)}
        error={errors.Nombre}
        placeholder="Juan Pérez"
      />
      <Input
        label="Email"
        type="email"
        required
        value={fields.Email}
        onChange={(e) => handleChange('Email', e.target.value)}
        error={errors.Email}
        placeholder="juan@ejemplo.com"
      />
      <Input
        label="Teléfono"
        type="tel"
        value={fields.Telefono}
        onChange={(e) => handleChange('Telefono', e.target.value)}
        error={errors.Telefono}
        placeholder="3001234567"
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Activo</label>
        <select
          value={fields.Activo}
          onChange={(e) => handleChange('Activo', e.target.value)}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="Sí">Sí</option>
          <option value="No">No</option>
        </select>
      </div>
      <Input
        label="Notas"
        value={fields.Notas}
        onChange={(e) => handleChange('Notas', e.target.value)}
        placeholder="Observaciones adicionales..."
      />

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Guardar cambios' : 'Crear registro'}
        </Button>
      </div>
    </form>
  );
}
