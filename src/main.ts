import {
    bootstrapApplication,
    provideNativeScriptHttpClient,
    provideNativeScriptNgZone,
    provideNativeScriptRouter,
    runNativeScriptAngularApp,
  } from '@nativescript/angular';
  import { provideExperimentalZonelessChangeDetection } from '@angular/core';
  import { HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';
  import { routes } from './app/app-routes';
  import { AppComponent } from './app/app.component';
  import { MockBackendInterceptor } from './app/mock/mock-backend.interceptor';
  import { MockPdfService } from './app/mock/mock-pdf.service';
  import { PdfService } from './app/services/pdf.service';

  /**
   * Disable zone by setting this to true
   * Then also adjust polyfills.ts (see note there)
   */
  const EXPERIMENTAL_ZONELESS = false;

  runNativeScriptAngularApp({
    appModuleBootstrap: () => {
      return bootstrapApplication(AppComponent, {
        providers: [
          provideNativeScriptHttpClient(withInterceptorsFromDi()),
          provideNativeScriptRouter(routes),
          EXPERIMENTAL_ZONELESS
            ? provideExperimentalZonelessChangeDetection()
            : provideNativeScriptNgZone(),
          // There is no real backend: every API call is answered from synthetic data in app/mock.
          { provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true },
          { provide: PdfService, useClass: MockPdfService },
        ],
      });
    },
  });
