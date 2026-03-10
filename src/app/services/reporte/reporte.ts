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

  /** Sube uno o más archivos TXT al backend */
  enviarArchivo(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return this.http.post(`${this.API}upload-txt/`, formData);
  }

  /** Obtiene métricas con filtros opcionales */
  obtenerMetricas(filtros?: {
    area?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Observable<any> {
    let params = new HttpParams();
    if (filtros?.area) params = params.set('area', filtros.area);
    if (filtros?.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
    return this.http.get(`${this.API}metrics-dashboard/`, { params });
  }
}