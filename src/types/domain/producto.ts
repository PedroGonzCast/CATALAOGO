// ─── Campos del layout Tabla_Productos en FileMaker ──────────────────────────
// Nombres deben coincidir exactamente con los campos del layout en FM.
// FM devuelve precioVenta y cantidad como número (no string).

export interface ProductoFields {
  nombre: string;
  descripcion: string;
  precioVenta: number;
  cantidad: number;
  idSistema: string;
  idCategoria?: string;
  urlImagen?: string;
  id?: string;
}

// Vista del producto con metadata de FileMaker
export interface ProductoView {
  recordId: string;
  modId: string;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  cantidad: number;
  idSistema: string;
  idCategoria?: string;
  urlImagen?: string;
  id?: string;
}

// Payload para crear — FM espera números, no strings
export interface CreateProductoPayload {
  nombre: string;
  descripcion: string;
  precioVenta: number;
  cantidad: number;
  idSistema?: string;
  idCategoria?: string;
  urlImagen?: string;
}

// Payload para actualizar — todos los campos opcionales
export type UpdateProductoPayload = Partial<CreateProductoPayload>;
