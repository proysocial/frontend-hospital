import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Device } from '../../services/device'; 
import { Reporte } from '../../interfaces/Reporte';

@Component({
  selector: 'app-reportes-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './reportes-lista.html',
  styleUrl: './reportes-lista.css',
  changeDetection: ChangeDetectionStrategy.Default,
})

export class ReportesLista implements OnInit {
  //Inyección de dependencia de servicios 
  private device = inject(Device);

  isHandset$ = this.device.isHandset$
  isTablet$ = this.device.isTablet$
  isDesktop$ = this.device.isDesktop$

  vistaActual: 'list' | 'grid' = 'list';
  busqueda: string = '';

  reportesOriginales: Reporte[] = [
    {
      id: 1,
      nombre: 'Reporte de laboratorio emergencia',
      creadoPor: 'Jorge Lopez',
      periodo: 'Enero 2026',
      actualizado: '31/01/2026',
      descripcion: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry'
    },
    {
      id: 2,
      nombre: 'Reporte de emergencia',
      creadoPor: 'Jorge Lopez',
      periodo: 'Diciembre 2025 - Enero 2026',
      actualizado: '31/01/2026',
      descripcion: 'abcd'
    },
    {
      id: 3,
      nombre: 'Reporte de imagenografía',
      creadoPor: 'Jorge Lopez',
      periodo: 'Diciembre 2025 - Enero 2026',
      actualizado: '31/01/2026',
      descripcion: 'efgh'
    },
    {
      id: 4,
      nombre: 'Reporte de laboratorio',
      creadoPor: 'Carlos Torres',
      periodo: 'Noviembre 2025 - Enero 2026',
      actualizado: '31/01/2026',
      descripcion: 'ijkl'
    }
  ];
  
  reportes: Reporte[] = [];
  
  //Función de Inicio
  ngOnInit() {
    this.reportes = [...this.reportesOriginales];
    this.obtenerReportes();
  }
  
  //Funciones auxiliares 
  cambiarVista(vista: 'list' | 'grid') {
    this.vistaActual = vista;
  }

  obtenerReportes() {
    console.log('Solicitando reportes a backend...');
    // TODO: Implementar llamada al servicio
  }

  filtrarReportesPorNombre() {
    const termino = this.busqueda.toLowerCase().trim();
    if (termino === '') {
      this.reportes = [...this.reportesOriginales];
      return;
    }

    this.reportes = this.reportesOriginales.filter(reporte => 
      reporte.nombre.toLowerCase().includes(termino) || 
      reporte.creadoPor.toLowerCase().includes(termino) ||
      reporte.descripcion.toLowerCase().includes(termino)
    );
  }

  abrirFiltros() {
    console.log('Abriendo modal de filtros...');
    // TODO: Hacer modal de filtros
  }
}