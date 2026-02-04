import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Device } from '../../services/device';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-herramientas',
  imports: [CommonModule,MatIconModule],
  templateUrl: './herramientas.html',
  styleUrl: './herramientas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Herramientas { 
  //Inyección de dependencia de servicios 
  private device = inject(Device) 

  isHandset$ = this.device.isHandset$
  isTablet$ = this.device.isTablet$
  isDesktop$ = this.device.isDesktop$
}
