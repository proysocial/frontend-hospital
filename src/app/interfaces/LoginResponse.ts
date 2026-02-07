interface LoginResponse {
  mensaje: string;
  access: string;
  refresh: string;
  usuario: {
    id: number;
    correo: string;
    nombre: string;
    apellido: string;
  }
}