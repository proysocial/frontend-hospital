import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

type EstadoReporte = 'idle' | 'loading' | 'preview';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reportes {

  private router = inject(Router);

  estado: EstadoReporte = 'idle';
  archivo: File | null = null;

  volver() {
    this.router.navigate(['/principal/herramientas']);
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.archivo = input.files[0];
    this.estado = 'loading';

    setTimeout(() => {
      this.estado = 'preview';
    }, 1500);
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
