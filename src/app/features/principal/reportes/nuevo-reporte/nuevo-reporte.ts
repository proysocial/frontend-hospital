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
  archivos: File[] = [];
  alerta: string | null = null;

  volver() {
    this.router.navigate(['/principal/herramientas']);
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.alerta = 'Debes seleccionar al menos un archivo.';
      this.cdr.markForCheck();
      return;
    }

    const files = Array.from(input.files);

    // Validar máximo 2 archivos
    if (files.length > 2) {
      this.alerta = 'Solo puedes subir máximo 2 archivos.';
      this.archivos = [];
      this.estado = 'idle';
      this.cdr.markForCheck();
      return;
    }

    // Validar extensión .txt
    const invalidFile = files.find(file => !file.name.toLowerCase().endsWith('.txt'));

    if (invalidFile) {
      this.alerta = 'Solo se permiten archivos con extensión .txt';
      this.archivos = [];
      this.estado = 'idle';
      this.cdr.markForCheck();
      return;
    }

    // Todo correcto
    this.alerta = null;
    this.archivos = files;
    this.estado = 'preview';
    this.cdr.markForCheck();
  }

  generarReporte() {

    if (this.archivos.length === 0) {
      this.alerta = 'Debes seleccionar al menos un archivo TXT.';
      this.cdr.markForCheck();
      return;
    }

    this.estado = 'loading';
    this.alerta = null;
    this.cdr.markForCheck();

    this.reporteService.enviarArchivo(this.archivos).subscribe({
      next: () => {
        this.router.navigate(['/principal/reportes/dashboard']);
      },
      error: () => {
        this.alerta = 'Error al procesar los archivos.';
        this.estado = 'preview';
        this.cdr.markForCheck();
      }
    });
  }

  cancelar() {
    this.estado = 'idle';
    this.archivos = [];
    this.alerta = null;
    this.cdr.markForCheck();
  }
}