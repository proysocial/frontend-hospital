import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideEchartsCore } from 'ngx-echarts';
import { provideSweetAlert2 } from "@sweetalert2/ngx-sweetalert2";
import { tokenInterceptor } from './interceptor/Token-interceptor';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { httpInterceptor } from './interceptor/http-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptor]),
      withInterceptors([httpInterceptor])
    ),

    provideClientHydration(withEventReplay()),

    provideEchartsCore({
      echarts: () => import('echarts')
    }),

    provideSweetAlert2({
      fireOnInit: false,
      dismissOnDestroy: true,
    }),
  ]
};