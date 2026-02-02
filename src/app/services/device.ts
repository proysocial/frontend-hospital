import { inject, Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Device {
  
  private breakpoint = inject(BreakpointObserver)

  // Modo de vista: Celular
  isHandset$ = this.breakpoint.observe(Breakpoints.Handset).pipe(
    map(state => state.matches),
    shareReplay(1)
  )

  // Modo de vista: Tablet
  isTablet$ = this.breakpoint.observe(Breakpoints.Tablet).pipe(
    map(state => state.matches), 
    shareReplay(1)
  )

  // Modo de vista: Web
  isDesktop$ = this.breakpoint.observe(Breakpoints.Web).pipe(
    map(state => state.matches),
    shareReplay(1)
  )

}
