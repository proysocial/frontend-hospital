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
    // AQUI LA LOGICA DE LOS REPORTES
  }

  cancelar() {
    this.estado = 'idle';
    this.archivo = null;
  }
}