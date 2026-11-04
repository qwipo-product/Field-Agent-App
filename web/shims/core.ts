// Browser stand-in for "@nativescript/core" and every subpath the app imports
// (application-settings, platform, connectivity, http, utils, ui/page, ui/dialogs, ui/layouts/root-layout).
// Only the surface the Field Agent app actually uses is implemented; the browser behaves like an
// Android phone (isAndroid is true) so the same code paths run as on the device.
import { Injectable } from '@angular/core';
import { hideLoader, showDialog, showToast, type DialogOptions } from './overlay';

export { getRootLayout } from './overlay';
export type RootLayoutOptions = any;
export type ShadeCoverOptions = any;
export type TransitionAnimation = any;

// ---- platform --------------------------------------------------------------------------------

export const platformNames = { android: 'Android', ios: 'iOS', visionos: 'visionOS' };
export const isAndroid = true;
export const isIOS = false;
export const Device = {
    os: platformNames.android,
    osVersion: '14',
    sdkVersion: '34',
    model: 'Browser',
    manufacturer: 'Web',
    deviceType: 'Phone',
    uuid: 'browser-demo',
    language: 'en',
    region: 'IN',
};
export const Screen = { mainScreen: { widthDIPs: 412, heightDIPs: 915, scale: 1 } };

// ---- application settings (localStorage, so a reload behaves like reopening the app) -------

const memory = new Map<string, string>();
const storage = {
    get(key: string): string | null {
        try {
            return localStorage.getItem('fa-demo:' + key);
        } catch {
            return memory.get(key) ?? null;
        }
    },
    set(key: string, value: string) {
        try {
            localStorage.setItem('fa-demo:' + key, value);
        } catch {
            memory.set(key, value);
        }
    },
    remove(key: string) {
        try {
            localStorage.removeItem('fa-demo:' + key);
        } catch {
            memory.delete(key);
        }
    },
};

export function getString(key: string, defaultValue?: string): string {
    return storage.get(key) ?? defaultValue;
}
export function setString(key: string, value: string): void {
    storage.set(key, String(value));
}
export function getNumber(key: string, defaultValue?: number): number {
    const v = storage.get(key);
    return v == null ? defaultValue : Number(v);
}
export function setNumber(key: string, value: number): void {
    storage.set(key, String(value));
}
export function getBoolean(key: string, defaultValue?: boolean): boolean {
    const v = storage.get(key);
    return v == null ? defaultValue : v === 'true';
}
export function setBoolean(key: string, value: boolean): void {
    storage.set(key, String(!!value));
}
export function hasKey(key: string): boolean {
    return storage.get(key) != null;
}
export function remove(key: string): void {
    storage.remove(key);
}
export function clear(): void {
    try {
        Object.keys(localStorage)
            .filter((k) => k.startsWith('fa-demo:'))
            .forEach((k) => localStorage.removeItem(k));
    } catch {
        memory.clear();
    }
}
export const ApplicationSettings = { getString, setString, getNumber, setNumber, getBoolean, setBoolean, hasKey, remove, clear };

// ---- Application events ----------------------------------------------------------------------

type Listener = (args: any) => void;
const appListeners = new Map<string, Set<Listener>>();
const androidListeners = new Map<string, Set<Listener>>();

function addListener(map: Map<string, Set<Listener>>, event: string, cb: Listener) {
    if (!map.has(event)) map.set(event, new Set());
    map.get(event)!.add(cb);
}
function removeListener(map: Map<string, Set<Listener>>, event: string, cb?: Listener) {
    if (cb) map.get(event)?.delete(cb);
    else map.delete(event);
}

/** Fires an Android activity event (used by the demo shell for "resumed" and the back button). */
export function emitAndroidEvent(event: string, data: any = {}): any {
    const args = { eventName: event, ...data };
    androidListeners.get(event)?.forEach((cb) => cb(args));
    return args;
}

export const Application = {
    launchEvent: 'launch',
    suspendEvent: 'suspend',
    resumeEvent: 'resume',
    lowMemoryEvent: 'lowMemory',
    exitEvent: 'exit',
    AndroidApplication: {
        activityCreatedEvent: 'activityCreated',
        activityResumedEvent: 'activityResumed',
        activityStoppedEvent: 'activityStopped',
        activityBackPressedEvent: 'activityBackPressed',
    },
    on: (event: string, cb: Listener) => addListener(appListeners, event, cb),
    off: (event: string, cb?: Listener) => removeListener(appListeners, event, cb),
    android: {
        on: (event: string, cb: Listener) => addListener(androidListeners, event, cb),
        off: (event: string, cb?: Listener) => removeListener(androidListeners, event, cb),
    },
    ios: { on() {}, off() {} },
};
export type ApplicationEventData = any;
export type iOSApplication = any;

// ---- connectivity ----------------------------------------------------------------------------

export const connectionType = { none: 0, wifi: 1, mobile: 2, ethernet: 3, bluetooth: 4, vpn: 5 };
export function getConnectionType(): number {
    return navigator.onLine ? connectionType.wifi : connectionType.none;
}
export function startMonitoring(cb: (type: number) => void): void {
    window.addEventListener('offline', () => cb(connectionType.none));
    window.addEventListener('online', () => cb(connectionType.wifi));
}
export function stopMonitoring(): void {}

// ---- dialogs ---------------------------------------------------------------------------------

function dialogOptions(arg: string | DialogOptions): DialogOptions {
    return typeof arg === 'string' ? { message: arg } : arg ?? {};
}
export function confirm(options: string | DialogOptions): Promise<boolean> {
    return showDialog({ okButtonText: 'OK', cancelButtonText: 'Cancel', ...dialogOptions(options) }, true);
}
export function alert(options: string | DialogOptions): Promise<void> {
    return showDialog(dialogOptions(options), false).then(() => undefined);
}
export const Dialogs = { confirm, alert };

// ---- utils -----------------------------------------------------------------------------------

export function openUrl(url: string): boolean {
    window.open(url, '_blank', 'noopener');
    return true;
}
export const Utils = { openUrl };

// ---- http / files (PDF downloads write to Android storage, which a browser doesn't have) -----

export type HttpResponse = any;
const noDownloads = () => Promise.reject(new Error('File downloads are not available in the browser demo.'));
export function request(_options: any): Promise<HttpResponse> {
    hideLoader();
    showToast('Downloads are not available in the browser demo.');
    return noDownloads();
}
export function getFile(_url: any, _path?: string): Promise<any> {
    return request(_url);
}
export const path = {
    join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
    normalize: (p: string) => p,
};
export const File = {
    fromPath: (_p: string) => ({ writeSync() {}, readSync() {}, remove() {} }),
    exists: (_p: string) => false,
};

// ---- views and types referenced by app code --------------------------------------------------

export class View {
    [key: string]: any;
}
export class TextField extends View {}

/** One Page per app (the browser shows one page at a time); pages only toggle its action bar. */
@Injectable({ providedIn: 'root' })
export class Page {
    [key: string]: any;
    actionBarHidden = false;
    on(): void {}
    off(): void {}
}

export class Color {
    constructor(public hex: string) {}
    get android(): number {
        return 0;
    }
}

export const CoreTypes = {
    AnimationCurve: {
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        linear: 'linear',
        spring: 'cubic-bezier(0.17, 0.89, 0.24, 1.11)',
        cubicBezier: (x1: number, y1: number, x2: number, y2: number) => `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`,
    },
    Accuracy: { high: 3, any: 300 },
    Visibility: { visible: 'visible', collapse: 'collapse', hidden: 'hidden' },
};

/** Holds a photo as a data URL; produced by the camera stand-in. */
export class ImageSource {
    constructor(public dataUrl = '') {}
    static async fromAsset(asset: { dataUrl?: string }): Promise<ImageSource> {
        return new ImageSource(asset?.dataUrl ?? '');
    }
    toBase64String(_format?: string, _quality?: number): string {
        return this.dataUrl.split(',')[1] ?? '';
    }
}
