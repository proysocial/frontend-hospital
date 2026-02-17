import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Reporte {
  private API = environment.API_URL
  
  // Constructor para crear peticiones Http
  constructor(private http: HttpClient) {}

  enviarArchivo(file: File): Observable<any> {
    const formData = new FormData()
    formData.append('file', file)
    
    return this.http.post(`${this.API}upload-txt/`, formData)
  }

  obtenerMetricas(): Observable<any> {
    return this.http.get(`${this.API}metrics-dashboard/`)
  }

}
