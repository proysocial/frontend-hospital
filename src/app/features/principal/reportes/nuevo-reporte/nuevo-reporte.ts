import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Reporte } from '../../../../services/reporte/reporte';

type EstadoReporte = 'idle' | 'loading' | 'preview';

@Component({
  selector: 'app-nuevo-reporte',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './nuevo-reporte.html',
  styleUrl: './nuevo-reporte.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevoReporte {

  private router = inject(Router);
  private reporteService = inject(Reporte);
  private cdr = inject(ChangeDetectorRef);

  estado: EstadoReporte = 'idle';
  archivos: File[] = [];   // ← ahora es array

  volver() {
    this.router.navigate(['/principal/herramientas']);
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.archivos = Array.from(input.files);
    this.estado = 'preview';
    this.cdr.markForCheck();
  }

  generarReporte() {
    if (this.archivos.length === 0) return;

    this.estado = 'loading';
    this.cdr.markForCheck();

    this.reporteService.enviarArchivo(this.archivos).subscribe({
      next: () => {
        this.router.navigate(['/principal/reportes/dashboard']);
      },
      error: () => {
        this.estado = 'preview';
        this.cdr.markForCheck();
      }
    });
  }

  cancelar() {
    this.estado = 'idle';
    this.archivos = [];
    this.cdr.markForCheck();
  }
}