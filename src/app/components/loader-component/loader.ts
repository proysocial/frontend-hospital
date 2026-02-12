import { ChangeDetectionStrategy, Component } from '@angular/core';
import { computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Loader } from '../../services/loader';
import { inject } from '@angular/core';

@Component({
  selector: 'app-loader',
  imports: [],
  templateUrl: './loader.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderComponent { 

  loader = inject(Loader)

  loading = computed(() => this.loader.loading())

  constructor(private loaderService: Loader){}
}
