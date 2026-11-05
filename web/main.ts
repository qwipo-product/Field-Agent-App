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

fitPhone();
addEventListener('resize', fitPhone);
visualViewport?.addEventListener('resize', fitPhone);

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

/**
 * Lays the phone out at true Android size and scales it to fit the window (any browser, any size);
 * the notes panel sits beside it when there is room. On an actual phone the app fills the screen.
 */
function fitPhone() {
    const page = document.querySelector<HTMLElement>('.fa-page')!;
    const onPhone = matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 600;
    page.classList.toggle('fa-fullscreen', onPhone);
    if (onPhone) return void page.classList.add('fa-narrow');
    const css = getComputedStyle(document.documentElement);
    const len = (name: string) => parseFloat(css.getPropertyValue(name));
    const phoneW = len('--screen-w') + 2 * len('--bezel');
    const phoneH = len('--statusbar-h') + len('--app-h') + len('--gesturebar-h') + 2 * len('--bezel');
    const pad = 16, gap = 40, panelW = 360, controlsH = 46;
    const height = (visualViewport?.height ?? innerHeight) - 2 * pad - controlsH;
    const width = (visualViewport?.width ?? innerWidth) - 2 * pad;
    const byHeight = height / phoneH;
    const beside = width >= phoneW * Math.min(byHeight, 1) + gap + panelW;
    const scale = Math.max(0.3, Math.min(1.2, byHeight, (beside ? width - gap - panelW : width) / phoneW));
    page.classList.toggle('fa-narrow', !beside);
    document.documentElement.style.setProperty('--phone-scale', scale.toFixed(4));
}

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
