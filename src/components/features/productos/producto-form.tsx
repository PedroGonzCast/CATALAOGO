'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { ProductoView, CreateProductoPayload, UpdateProductoPayload } from '@/types/domain/producto';

interface ProductoFormProps {
  defaultValues?: Partial<ProductoView>;
  onSubmit: (data: CreateProductoPayload | UpdateProductoPayload) => Promise<boolean>;
  onCancel: () => void;
  isEdit?: boolean;
}

interface FieldState {
  nombre: string;
  descripcion: string;
  precioVenta: string;
  cantidad: string;
}

type FieldErrors = Partial<Record<keyof FieldState | 'imagen', string>>;

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (error?: string) =>
  cn(
    'block w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2',
    'bg-white text-zinc-900 placeholder:text-zinc-400',
    'dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500',
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-700 dark:focus:ring-red-900/30'
      : 'border-zinc-300 focus:border-blue-400 focus:ring-blue-100 dark:border-zinc-700 dark:focus:border-blue-500 dark:focus:ring-blue-900/30'
  );

export function ProductoForm({ defaultValues, onSubmit, onCancel, isEdit = false }: ProductoFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fields, setFields] = useState<FieldState>({
    nombre:      defaultValues?.nombre ?? '',
    descripcion: defaultValues?.descripcion ?? '',
    precioVenta: defaultValues?.precioVenta != null ? String(defaultValues.precioVenta) : '',
    cantidad:    defaultValues?.cantidad    != null ? String(defaultValues.cantidad)    : '',
  });

  // URL del objeto en S3 (existente en FM al editar, o asignada tras subir)
  const [urlImagen, setUrlImagen]           = useState<string>(defaultValues?.urlImagen ?? '');
  // Archivo local seleccionado — se sube a S3 solo al guardar el producto
  const [imageFile, setImageFile]           = useState<File | null>(null);
  // Preview local (ObjectURL) antes de guardar
  const [imagePreview, setImagePreview]     = useState<string>(defaultValues?.urlImagen ?? '');
  const [uploadProgress, setUploadProgress] = useState(false);

  const [errors, setErrors]         = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!fields.nombre.trim()) {
      next.nombre = 'El nombre del producto es requerido';
    } else if (fields.nombre.length > 100) {
      next.nombre = 'Máximo 100 caracteres';
    }

    if (!fields.precioVenta) {
      next.precioVenta = 'El precio de venta es requerido';
    } else if (isNaN(Number(fields.precioVenta)) || Number(fields.precioVenta) < 0) {
      next.precioVenta = 'Ingresa un precio válido mayor o igual a 0';
    }

    if (!fields.cantidad) {
      next.cantidad = 'La cantidad es requerida';
    } else if (
      isNaN(Number(fields.cantidad)) ||
      Number(fields.cantidad) < 0 ||
      !Number.isInteger(Number(fields.cantidad))
    ) {
      next.cantidad = 'Ingresa un número entero mayor o igual a 0';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, imagen: 'Solo se permiten imágenes (JPG, PNG, WEBP, GIF)' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, imagen: 'La imagen no puede superar 5 MB' }));
      return;
    }

    setErrors((prev) => ({ ...prev, imagen: undefined }));
    setImageFile(file);
    // Preview local — la imagen aún no se ha subido a S3
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview('');
    setUrlImagen('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError('');

    let finalUrl = urlImagen;

    // Si hay un archivo nuevo seleccionado, subirlo a S3 ahora que se va a guardar
    if (imageFile) {
      try {
        setUploadProgress(true);
        const form = new FormData();
        form.append('file', imageFile);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const json = (await res.json()) as { ok: boolean; url?: string; error?: string };
        if (!json.ok || !json.url) throw new Error(json.error ?? 'Error al subir la imagen');
        finalUrl = json.url;
        setUrlImagen(finalUrl);
      } catch (err) {
        setServerError(err instanceof Error ? err.message : 'Error al subir la imagen a S3');
        setIsLoading(false);
        setUploadProgress(false);
        return;
      } finally {
        setUploadProgress(false);
      }
    }

    // Enviar el registro a FileMaker con urlImagen = URL del objeto en S3
    const ok = await onSubmit({
      nombre:      fields.nombre,
      descripcion: fields.descripcion,
      precioVenta: Number(fields.precioVenta),
      cantidad:    Number(fields.cantidad),
      ...(finalUrl ? { urlImagen: finalUrl } : {}),
    });

    setIsLoading(false);
    if (!ok) setServerError('No se pudo guardar el registro. Intenta de nuevo.');
  }

  function set(field: keyof FieldState, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Nombre del producto" required error={errors.nombre}>
        <input
          className={inputClass(errors.nombre)}
          value={fields.nombre}
          onChange={(e) => set('nombre', e.target.value)}
          placeholder="Ej: Teclado Mecánico RGB"
          maxLength={100}
          autoFocus
        />
      </FormField>

      <FormField label="Descripción" error={errors.descripcion}>
        <textarea
          className={cn(inputClass(errors.descripcion), 'min-h-[80px] resize-none')}
          value={fields.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
          placeholder="Descripción opcional del producto..."
          rows={3}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Precio de venta" required error={errors.precioVenta}>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
            <input
              className={cn(inputClass(errors.precioVenta), 'pl-7')}
              value={fields.precioVenta}
              onChange={(e) => set('precioVenta', e.target.value)}
              placeholder="0"
              inputMode="decimal"
            />
          </div>
        </FormField>

        <FormField label="Cantidad en stock" required error={errors.cantidad}>
          <input
            className={inputClass(errors.cantidad)}
            value={fields.cantidad}
            onChange={(e) => set('cantidad', e.target.value)}
            placeholder="0"
            inputMode="numeric"
          />
        </FormField>
      </div>

      {/* ── Imagen del producto ── */}
      <FormField label="Imagen del producto" error={errors.imagen}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />

        {imagePreview ? (
          <div className="relative w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Vista previa"
              className="h-48 w-full object-cover"
            />
            <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/50 to-transparent p-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                Cambiar imagen
              </button>
              <button
                type="button"
                onClick={removeImage}
                className="rounded-lg bg-red-500/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-red-600/80 transition-colors"
              >
                Quitar
              </button>
            </div>
            {uploadProgress && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2 text-white">
                  <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-xs font-medium">Subiendo imagen...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors',
              errors.imagen
                ? 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/20'
                : 'border-zinc-200 bg-zinc-50 hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-blue-600 dark:hover:bg-blue-950/20'
            )}
          >
            <svg className="h-8 w-8 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Haz clic para subir una imagen</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">JPG, PNG, WEBP o GIF · máx. 5 MB</p>
            </div>
          </button>
        )}
      </FormField>

      {serverError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-400 dark:ring-red-900">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {serverError}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  );
}
