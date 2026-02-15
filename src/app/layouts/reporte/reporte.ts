import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

type EstadoReporte = 'idle' | 'loading' | 'preview';

@Component({
  selector: 'app-reporte',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './reporte.html',
  styleUrl: './reporte.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reporte {
  private router = inject(Router);
  
  estado: EstadoReporte = 'idle';
  archivo: File | null = null;

  volver() {
    this.router.navigate(['/herramientas']);
  }

  seleccionarArchivo(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.archivo = file;
    this.estado = 'loading';

    // Simulación carga preview
    setTimeout(() => {
      this.estado = 'preview';
    }, 2000);
  }

  generarReporte() {
    if (this.estado !== 'preview') return;

    console.log('Reporte generado');
  }

  cancelar() {
    this.estado = 'idle';
    this.archivo = null;
  }
}