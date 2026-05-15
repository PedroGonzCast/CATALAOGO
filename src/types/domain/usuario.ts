/**
 * Sesión de usuario autenticado — devuelta por getSession().
 * idSistema es el UUID generado por FileMaker en confSistema.
 */
export interface UsuarioSession {
  id:         string; // Supabase auth.users.id (UUID)
  email:      string;
  idSistema:  string; // FK al tenant en FileMaker (confSistema.id)
  empresa:    string;
  isLoggedIn: true;
}
