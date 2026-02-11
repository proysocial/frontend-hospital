import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Device } from '../../services/device';
import { filter } from 'rxjs';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterOutlet, Sidebar, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  //Inyección de servicio para detectar si es celular o web 
  private device = inject(Device)
  private router = inject(Router);
  public layoutService = inject(LayoutService);

  isHandset$ = this.device.isHandset$
  isTablet$ = this.device.isTablet$
  isDesktop$ = this.device.isDesktop$

  //Signal para controlar el estado del menú móvil
  menuAbierto = signal(false);

  constructor() {
    // Cerrar el menú al cambiar de vista
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.menuAbierto.set(false);
    });
  }

  toggleMenu() {
    this.menuAbierto.update(v => !v);
  }

  cerrarMenu() {
    this.menuAbierto.set(false);
  }

 }
