// Browser entry point. Boots the same AppComponent, routes, services and mock backend as the
// Android app (src/main.ts), with NativeScript replaced by the shims in web/shims.
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RendererFactory2, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from '~/app/app-routes';
import { AppComponent } from '~/app/app.component';
import { MockBackendInterceptor } from '~/app/mock/mock-backend.interceptor';
import { MockPdfService } from '~/app/mock/mock-pdf.service';
import { PdfService } from '~/app/services/pdf.service';
import { clear, emitAndroidEvent } from './shims/core';
import { NsWebRendererFactory } from './shims/renderer';

// An app always launches at its start page (which loads settings and the signed-in agent), so a
// reload starts there too rather than deep inside a stale route.
if (location.hash) history.replaceState(null, '', location.pathname + location.search);

bootstrapApplication(AppComponent, {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes, withHashLocation()),
        provideHttpClient(withInterceptorsFromDi()),
        { provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true },
        { provide: PdfService, useClass: MockPdfService },
        { provide: RendererFactory2, useClass: NsWebRendererFactory },
    ],
})
    .then(() => {
        // Android resumes the activity right after launch, and the app listens for that.
        emitAndroidEvent('activityResumed');
        document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && emitAndroidEvent('activityResumed'));
        wireDemoChrome();
    })
    .catch((err) => console.error(err));

/** The page around the phone: Android back button, restart, persona numbers. */
function wireDemoChrome() {
    const back = () => {
        const data = emitAndroidEvent('activityBackPressed', { cancel: false });
        if (!data.cancel) history.back();
    };
    document.querySelector('.fa-back')?.addEventListener('click', back);
    document.addEventListener('keydown', (e) => {
        const typing = (e.target as HTMLElement)?.matches?.('input, textarea');
        if (e.key === 'Escape' && !typing) back();
    });
    document.querySelector('.fa-home')?.addEventListener('click', () => location.reload());
    document.querySelector('.fa-reset')?.addEventListener('click', () => {
        clear();
        try {
            localStorage.removeItem('fa-demo:sqlite:qwipoKeys');
        } catch {
            /* nothing stored */
        }
        location.hash = '';
        location.reload();
    });
    const panel = document.querySelector('.fa-panel');
    document.querySelector('.fa-info-toggle')?.addEventListener('click', () => panel?.classList.toggle('fa-open'));
    document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) =>
        btn.addEventListener('click', async () => {
            const original = btn.textContent;
            try {
                await navigator.clipboard.writeText(btn.dataset.copy!);
                btn.textContent = 'Copied';
            } catch {
                btn.textContent = btn.dataset.copy!;
            }
            setTimeout(() => (btn.textContent = original), 1200);
        }),
    );
    const clock = document.querySelector('.fa-clock');
    const tick = () => clock && (clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, ''));
    tick();
    setInterval(tick, 30_000);
}
