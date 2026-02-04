import { ChangeDetectionStrategy, Component , inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Device } from '../../services/device';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterOutlet, Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  //Inyección de servicio para detectar si es celular o web 
  private device = inject(Device)

  isHandset$ = this.device.isHandset$
  isTablet$ = this.device.isTablet$
  isDesktop$ = this.device.isDesktop$


 }
