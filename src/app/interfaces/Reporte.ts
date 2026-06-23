export interface Reporte {
  id: number;
  nombre: string;
  creadoPor: string;
  periodo: string;
  actualizado: string;
  descripcion: string;
  publicado?: boolean;
  fecha_inicio_datos?: string;
  fecha_fin_datos?: string;
  fecha_creacion?: string;
}
