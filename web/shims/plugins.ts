// Browser stand-ins for the NativeScript plugins the app uses. One module serves every plugin
// import path (see web/tsconfig.json "paths"); each section is named after the plugin it replaces.
import { hideLoader, showFancyAlert, showLoader, showSnackbar, showToast } from './overlay';

// ---- @nstudio/nativescript-fancyalert ----------------------------------------------------------

export const TNSFancyAlert = {
    showSuccess: (title: string, subTitle?: string, closeBtnTitle?: string) => showFancyAlert('success', title, subTitle, closeBtnTitle),
    showError: (title: string, subTitle?: string, closeBtnTitle?: string) => showFancyAlert('error', title, subTitle, closeBtnTitle),
    showWarning: (title: string, subTitle?: string, closeBtnTitle?: string) => showFancyAlert('warning', title, subTitle, closeBtnTitle),
    showNotice: (title: string, subTitle?: string, closeBtnTitle?: string) => showFancyAlert('info', title, subTitle, closeBtnTitle),
    showInfo: (title: string, subTitle?: string, closeBtnTitle?: string) => showFancyAlert('info', title, subTitle, closeBtnTitle),
};

// ---- @nstudio/nativescript-loading-indicator ---------------------------------------------------

export enum Mode {
    Indeterminate = 0,
    Determinate = 1,
    DeterminateHorizontalBar = 2,
    AnnularDeterminate = 3,
    CustomView = 4,
    Text = 5,
}
export type OptionsCommon = any;
export class LoadingIndicator {
    show(options?: OptionsCommon): void {
        showLoader(options?.message);
    }
    hide(): void {
        hideLoader();
    }
}

// ---- @nstudio/nativescript-snackbar -------------------------------------------------------------

export type SnackBarOptions = any;
export class SnackBar {
    simple(snackText: string): Promise<boolean> {
        return showSnackbar(snackText);
    }
    action(options: SnackBarOptions): Promise<boolean> {
        return showSnackbar(options.snackText, options.actionText, options.hideDelay);
    }
    dismiss(): Promise<void> {
        return Promise.resolve();
    }
}

// ---- @triniwiz/nativescript-toasty --------------------------------------------------------------

export enum ToastDuration {
    SHORT = 'short',
    LONG = 'long',
}
export class Toasty {
    constructor(private options: { text: string; duration?: ToastDuration }) {}
    show(): this {
        showToast(this.options.text, this.options.duration === ToastDuration.LONG ? 3500 : 2000);
        return this;
    }
    cancel(): void {}
}

// ---- @nativescript/camera: a file picker (phones open the camera) ------------------------------

export function isAvailable(): boolean {
    return true;
}
export function requestPermissions(): Promise<boolean> {
    return Promise.resolve(true);
}
export function takePicture(_options?: any): Promise<{ dataUrl: string }> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture', 'environment');
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return reject(new Error('cancelled'));
            const img = new Image();
            img.onload = () => {
                // Re-encode as a JPEG of at most 1280px, like the camera plugin's output.
                const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(img.src);
                resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.85) });
            };
            img.onerror = () => reject(new Error('Unsupported image'));
            img.src = URL.createObjectURL(file);
        };
        input.click();
    });
}

// ---- @nativescript/geolocation: a fixed position at the Alwal hub, like the emulator's GPS ------

const HUB = { latitude: 17.502, longitude: 78.5113 };
export function isEnabled(): Promise<boolean> {
    return Promise.resolve(true);
}
export function enableLocationRequest(): Promise<void> {
    return Promise.resolve();
}
export function getCurrentLocation(_options?: any): Promise<any> {
    return Promise.resolve({
        ...HUB,
        altitude: 540,
        horizontalAccuracy: 5,
        verticalAccuracy: 5,
        speed: 0,
        direction: 0,
        timestamp: new Date(),
        android: { isFromMockProvider: () => false, isMock: () => false },
    });
}
export function distance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
    const rad = (d: number) => (d * Math.PI) / 180;
    const dLat = rad(b.latitude - a.latitude);
    const dLon = rad(b.longitude - a.longitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// ---- @nativescript/appversion -------------------------------------------------------------------

/** Keep in step with versionName in App_Resources/Android/app.gradle. */
const APP_VERSION = '1.0.0';
export function getVersionName(): Promise<string> {
    return Promise.resolve(APP_VERSION);
}
export function getVersionNameSync(): string {
    return APP_VERSION;
}
export function getVersionCode(): Promise<string> {
    return Promise.resolve('1');
}
export function getAppId(): Promise<string> {
    return Promise.resolve('com.qwipo.fieldagent.demo');
}

// ---- nativescript-exit: closing the app restarts it -------------------------------------------

export function exit(): void {
    location.hash = '';
    location.reload();
}

// ---- nativescript-phone -------------------------------------------------------------------------

export function dial(number: string, _confirm?: boolean): boolean {
    if (matchMedia('(pointer: coarse)').matches) location.href = `tel:${number}`;
    else showToast(`Calling ${number}`);
    return true;
}

// ---- @sergeymell/nativescript-svg: rendered as <img> by the web renderer ------------------------

export class SVGImage {}
