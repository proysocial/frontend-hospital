import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Loader {
  loading = signal(false) //Observa cualquier cambio pero inicia en falso 

  show(){
    this.loading.set(true)
  }

  hide(){
    this.loading.set(false)
  }
}
