// Campos del layout Usuarios en FileMaker
export interface UsuarioFields {
  id?: string;
  email: string;
  password: string;  // bcrypt hash almacenado en FM
  idSistema: string;
}

// Lo que se guarda en la sesión cifrada
export interface UsuarioSession {
  recordId: string;
  email: string;
  idSistema: string;
  id?: string;
  isLoggedIn: boolean;
}

// Forma de la sesión completa de iron-session
export interface AppSession {
  user?: UsuarioSession;
}
