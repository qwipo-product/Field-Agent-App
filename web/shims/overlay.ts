// DOM stand-ins for native Android UI that sits above the page: toasts, snackbars, the loading
// indicator, alert dialogs and the RootLayout used for bottom sheets. Everything is drawn inside
// the phone screen element so it lines up with the app.

export function screenEl(): HTMLElement {
    return (document.querySelector('.fa-screen') as HTMLElement) ?? document.body;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

// ---- Toast (Android 13+ style: pill with app icon) ----------------------------------------

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function showToast(text: string, durationMs = 2000): void {
    screenEl().querySelector('.ns-toast')?.remove();
    clearTimeout(toastTimer);
    const toast = el('div', 'ns-toast');
    const icon = el('img', 'ns-toast-icon');
    icon.src = 'icon.png';
    icon.alt = '';
    toast.append(icon, el('span', '', text));
    screenEl().append(toast);
    toastTimer = setTimeout(() => {
        toast.classList.add('ns-leaving');
        setTimeout(() => toast.remove(), 250);
    }, durationMs);
}

// ---- Snackbar --------------------------------------------------------------------------------

export function showSnackbar(text: string, actionText?: string, durationMs = 4000): Promise<boolean> {
    return new Promise((resolve) => {
        screenEl().querySelector('.ns-snackbar')?.remove();
        const bar = el('div', 'ns-snackbar');
        bar.append(el('span', '', text));
        const done = (byAction: boolean) => {
            bar.remove();
            resolve(byAction);
        };
        if (actionText) {
            const action = el('button', 'ns-snackbar-action', actionText);
            action.type = 'button';
            action.onclick = () => done(true);
            bar.append(action);
        }
        screenEl().append(bar);
        setTimeout(() => bar.isConnected && done(false), durationMs);
    });
}

// ---- Loading indicator -----------------------------------------------------------------------

export function showLoader(message?: string): void {
    hideLoader();
    const shade = el('div', 'ns-loader');
    const box = el('div', 'ns-loader-box');
    box.append(el('span', 'ns-loader-spinner'));
    if (message) box.append(el('span', 'ns-loader-text', message));
    shade.append(box);
    screenEl().append(shade);
}

export function hideLoader(): void {
    screenEl().querySelectorAll('.ns-loader').forEach((n) => n.remove());
}

// ---- Fancy alert (success / warning / error card with a coloured header) -------------------

const ALERT_ICONS: Record<string, string> = {
    success: '<path d="M30 52l14 14 26-28"/>',
    warning: '<path d="M50 28v30"/><path d="M50 70v2"/>',
    error: '<path d="M36 36l28 28M64 36L36 64"/>',
    info: '<path d="M50 44v28"/><path d="M50 30v2"/>',
};

export function showFancyAlert(kind: 'success' | 'warning' | 'error' | 'info', title: string, message: string, button = 'OK'): Promise<void> {
    return new Promise((resolve) => {
        const shade = el('div', 'ns-dialog-shade');
        const card = el('div', `ns-fancy ns-fancy-${kind}`);
        const head = el('div', 'ns-fancy-head');
        head.innerHTML =
            `<svg viewBox="0 0 100 100" width="64" height="64" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round">` +
            `<path d="M86 64A40 40 0 1 1 78 22"/>${ALERT_ICONS[kind]}</svg>`;
        const body = el('div', 'ns-fancy-body');
        if (title) body.append(el('div', 'ns-fancy-title', title));
        if (message) body.append(el('div', 'ns-fancy-message', message));
        const ok = el('button', 'ns-fancy-button', button || 'OK');
        ok.type = 'button';
        ok.onclick = () => {
            shade.remove();
            resolve();
        };
        body.append(ok);
        card.append(head, body);
        shade.append(card);
        screenEl().append(shade);
    });
}

// ---- Plain Android alert / confirm dialog ----------------------------------------------------

export interface DialogOptions {
    title?: string;
    message?: string;
    okButtonText?: string;
    cancelButtonText?: string;
}

export function showDialog(options: DialogOptions, withCancel: boolean): Promise<boolean> {
    return new Promise((resolve) => {
        const shade = el('div', 'ns-dialog-shade');
        const card = el('div', 'ns-dialog');
        if (options.title) card.append(el('div', 'ns-dialog-title', options.title));
        if (options.message) card.append(el('div', 'ns-dialog-message', options.message));
        const actions = el('div', 'ns-dialog-actions');
        const close = (result: boolean) => {
            shade.remove();
            resolve(result);
        };
        if (withCancel) {
            const cancel = el('button', 'ns-dialog-button', options.cancelButtonText ?? 'Cancel');
            cancel.type = 'button';
            cancel.onclick = () => close(false);
            actions.append(cancel);
        }
        const ok = el('button', 'ns-dialog-button', options.okButtonText ?? 'OK');
        ok.type = 'button';
        ok.onclick = () => close(true);
        actions.append(ok);
        card.append(actions);
        shade.append(card);
        screenEl().append(shade);
    });
}

// ---- RootLayout: overlays (bottom sheets) opened on top of the page ------------------------

interface OpenView {
    shade: HTMLElement;
    exitTo?: any;
}

/** The view a RootLayout animates: component hosts are display:contents, so use their first element. */
function animTarget(view: HTMLElement): HTMLElement {
    return view.classList.contains('ns-proxy') ? ((view.firstElementChild as HTMLElement) ?? view) : view;
}

function keyframe(t: any = {}) {
    const parts: string[] = [];
    if (t.translateX || t.translateY) parts.push(`translate(${t.translateX ?? 0}px, ${t.translateY ?? 0}px)`);
    if (t.scaleX != null || t.scaleY != null) parts.push(`scale(${t.scaleX ?? 1}, ${t.scaleY ?? 1})`);
    if (t.rotate) parts.push(`rotate(${t.rotate}deg)`);
    return { transform: parts.join(' ') || 'none', opacity: t.opacity ?? 1 };
}

/** Set by renderer.ts: settles NativeScript layout for views attached outside Angular's renderer. */
export const layoutHooks: { attached?: (view: HTMLElement) => void } = {};

export class WebRootLayout {
    private open_ = new Map<HTMLElement, OpenView>();

    constructor(private host: HTMLElement) {}

    async open(view: HTMLElement, options: any = {}): Promise<void> {
        const cover = options.shadeCover;
        const shade = document.createElement('div');
        shade.className = 'ns-shade';
        shade.style.backgroundColor = cover?.color ?? '#000';
        if (cover?.tapToClose) shade.onclick = () => this.close(view);
        view.classList.add('ns-root-overlay');
        this.host.append(shade, view);
        layoutHooks.attached?.(view);
        this.open_.set(view, { shade, exitTo: options.animation?.exitTo });
        const duration = options.animation?.enterFrom?.duration ?? 300;
        const easing = options.animation?.enterFrom?.curve ?? 'ease-out';
        const opacity = cover?.opacity ?? 0.5;
        shade.animate([{ opacity: 0 }, { opacity }], { duration, fill: 'forwards' });
        await animTarget(view).animate([keyframe(options.animation?.enterFrom), keyframe()], { duration, easing }).finished;
    }

    async close(view?: HTMLElement): Promise<void> {
        const target = view ?? [...this.open_.keys()].pop();
        const entry = target && this.open_.get(target);
        if (!target || !entry) return;
        this.open_.delete(target);
        const duration = entry.exitTo?.duration ?? 300;
        entry.shade.animate([{ opacity: getComputedStyle(entry.shade).opacity }, { opacity: 0 }], { duration, fill: 'forwards' });
        await animTarget(target).animate([keyframe(), keyframe(entry.exitTo)], { duration, easing: entry.exitTo?.curve ?? 'ease-in', fill: 'forwards' }).finished;
        entry.shade.remove();
        target.remove();
    }

    async closeAll(): Promise<void> {
        await Promise.all([...this.open_.keys()].map((v) => this.close(v)));
    }

    async bringToFront(view: HTMLElement): Promise<void> {
        const entry = this.open_.get(view);
        if (entry) this.host.append(entry.shade, view);
    }
}

let rootLayout: WebRootLayout | undefined;

export function registerRootLayout(host: HTMLElement): void {
    rootLayout ??= new WebRootLayout(host);
}

export function getRootLayout(): WebRootLayout {
    return rootLayout!;
}
