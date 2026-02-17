import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Device } from '../../services/device';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReportesLista } from '../../components/reportes-lista/reportes-lista';
import { LayoutService } from '../../services/layout.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';


@Component({
  selector: 'app-herramientas',
  imports: [CommonModule,MatIconModule,ReportesLista],
  templateUrl: './herramientas.html',
  styleUrl: './herramientas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Herramientas { 
  //Inyección de dependencia de servicios 
  private router = inject(Router);
  private device = inject(Device)
  private layoutService = inject(LayoutService);

  isHandset$ = this.device.isHandset$
  isTablet$ = this.device.isTablet$
  isDesktop$ = this.device.isDesktop$

  // Función de inicio
  ngOnInit(): void {
    // Titulo para Mobile
    this.layoutService.setTituloMobile('Panel de Herramientas');
  }

  // Funciones auxiliares
  crearReporte() {
  this.router.navigate(['/principal/reportes/nuevo']);
}

}
