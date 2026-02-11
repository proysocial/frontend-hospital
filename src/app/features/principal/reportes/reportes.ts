import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../services/device';
import { Reporte } from '../../../interfaces/Reporte';
import { MatIconModule } from '@angular/material/icon';
import { LayoutService } from '../../../services/layout.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
  changeDetection: ChangeDetectionStrategy.Default,
})

export class Reportes {
  //Inyección de dependencia de servicios 
  private device = inject(Device);
  private layoutService = inject(LayoutService);

  isHandset$ = this.device.isHandset$
  isTablet$ = this.device.isTablet$
  isDesktop$ = this.device.isDesktop$

  vistaActual: 'list' | 'grid' = 'list';
  busqueda: string = '';

  //Datos temporales para simular
  reportes: Reporte[] = [
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

  // Función de inicio
  ngOnInit(): void {
    this.obtenerReportes();
    this.layoutService.setTituloMobile('Panel de Registros de Reportes');
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
    console.log('Filtrando reportes por nombre:', this.busqueda);
    // TODO: Implementar lógica de filtrado
  }

  abrirFiltros() {
    console.log('Abriendo modal de filtros...');
    // TODO: Hacer modal de filtros
  }
 }
