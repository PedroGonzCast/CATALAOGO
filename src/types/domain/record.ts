// Campos del layout en FileMaker — ajustar a tu esquema real
export interface RecordFields {
  Nombre: string;
  Email: string;
  Telefono: string;
  Activo: string;
  FechaCreacion?: string;
  Notas?: string;
}

// Vista del registro con metadata de FileMaker incluida
export interface RecordView extends RecordFields {
  recordId: string;
  modId: string;
}

// Payload para crear un registro (todos los campos requeridos)
export type CreateRecordPayload = Pick<RecordFields, 'Nombre' | 'Email' | 'Telefono' | 'Activo'>;

// Payload para actualizar (todos opcionales)
export type UpdateRecordPayload = Partial<RecordFields>;
