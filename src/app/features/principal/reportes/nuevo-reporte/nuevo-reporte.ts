import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

  // Inyección de dependencias
  private router = inject(Router);
  private reporteService = inject(Reporte)

  estado: EstadoReporte = 'idle';
  archivo: File | null = null;
  datosReporte: any

  volver() {
    this.router.navigate(['/principal/herramientas']);
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    this.archivo = input.files[0];
    this.estado = 'loading';

    console.log("Documento cargado: ", this.archivo)

    if(this.archivo){
      this.estado = "preview"
    }

    // Simulación de carga
    /* setTimeout(() => {
      this.estado = 'preview';
    }, 1); */
  }


  // Código Brittany:

  /* generarReporte() {
    if (this.estado !== 'preview') return;

    console.log('Reporte generado:', this.archivo?.name);

    // Después de generar, regresar a la lista
    this.router.navigate(['/principal/reportes']);
  } */

  generarReporte() {
    if(!this.archivo) return

    this.estado = 'loading'

    this.reporteService.enviarArchivo(this.archivo).subscribe(
      {
        next: (data) => {
          // console.log("Data procesado :D", data)
          // this.datosReporte = data
          // this.estado = 'preview'
          this.router.navigate(['/principal/reportes/dashboard']);
        }, 
        error: (err) => {
          // Interceptor consume el error 
        }
      }
    )

  }  

  cancelar() {
    this.estado = 'idle';
    this.archivo = null;
  }
}
