import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

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

  estado: EstadoReporte = 'idle';
  archivo: File | null = null;

  volver() {
    this.router.navigate(['/principal/reportes']);
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    this.archivo = input.files[0];
    this.estado = 'loading';

    // Simulación de carga
    setTimeout(() => {
      this.estado = 'preview';
    }, 1500);
  }

  generarReporte() {
    if (this.estado !== 'preview') return;

    console.log('Reporte generado:', this.archivo?.name);

    // Después de generar, regresar a la lista
    this.router.navigate(['/principal/reportes']);
  }

  cancelar() {
    this.estado = 'idle';
    this.archivo = null;
  }
}
