import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Reporte {
  private API = environment.API_URL;

  constructor(private http: HttpClient) {}

  enviarArchivo(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach((f) => formData.append('file', f));
    return this.http.post(`${this.API}upload-txt/`, formData);
  }

  obtenerMetricas(filtros?: {
    area?: string;
    servicio?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Observable<any> {
    let params = new HttpParams();
    if (filtros?.area) params = params.set('area', filtros.area);
    if (filtros?.servicio) params = params.set('servicio', filtros.servicio);
    if (filtros?.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
    return this.http.get(`${this.API}metrics-dashboard/`, { params });
  }

  guardarReporte(payload: any): Observable<any> {
    return this.http.post(`${this.API}reportes/`, payload);
  }

  obtenerReportesGuardados(): Observable<any> {
    return this.http.get(`${this.API}reportes/`);
  }

  eliminarReporte(id: number): Observable<any> {
    return this.http.delete(`${this.API}reportes/${id}/`);
  }

  obtenerReportePorId(id: number): Observable<any> {
    return this.http.get(`${this.API}reportes/${id}/`);
  }

  obtenerMisReportes(): Observable<any> {
    return this.http.get(`${this.API}reportes/mis-reportes/`);
  }

  actualizarReporte(id: number, payload: { nombre?: string; descripcion?: string; datos?: any }): Observable<any> {
    return this.http.put(`${this.API}reportes/${id}/`, payload);
  }

  publicarReporte(id: number, publicado?: boolean): Observable<any> {
    const body = publicado !== undefined ? { publicado } : {};
    return this.http.patch(`${this.API}reportes/${id}/publicar/`, body);
  }

  obtenerReportesPublicos(): Observable<any> {
    return this.http.get(`${this.API}reportes/publicos/`);
  }

  obtenerReportePublicoPorId(id: number): Observable<any> {
    return this.http.get(`${this.API}reportes/publicos/${id}/`);
  }

  obtenerAreas(): Observable<any> {
    return this.http.get(`${this.API}areas/`);
  }

  obtenerDetalleArea(area: string, servicio?: string): Observable<any> {
    let params = new HttpParams().set('area', area);
    if (servicio) params = params.set('servicio', servicio);
    return this.http.get(`${this.API}area-detalle/`, { params });
  }

  limpiarRegistros(): Observable<any> {
    return this.http.delete(`${this.API}clear-registros/`);
  }
}
