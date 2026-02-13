import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../services/device';
import { Reporte } from '../../../interfaces/Reporte';
import { MatIconModule } from '@angular/material/icon';
import { LayoutService } from '../../../services/layout.service';
import { ReportesLista } from '../../../components/reportes-lista/reportes-lista';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule, MatIconModule, ReportesLista],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
  changeDetection: ChangeDetectionStrategy.Default,
})

export class Reportes {
  //Inyección de dependencia de servicios 
  private layoutService = inject(LayoutService);
  private device = inject(Device) 

  isHandset$ = this.device.isHandset$
  isTablet$ = this.device.isTablet$
  isDesktop$ = this.device.isDesktop$

  // Función de inicio
  ngOnInit(): void {
    
    // Titulo para Mobile
    this.layoutService.setTituloMobile('Panel de Registros de Reportes');
  }
 }
