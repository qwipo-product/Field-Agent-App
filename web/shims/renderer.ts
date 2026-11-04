// Renders NativeScript templates in the browser. It wraps Angular's DOM renderer: NativeScript tags
// (StackLayout, GridLayout, Label, TextField, ...) become HTML elements with "ns-*" classes, and
// NativeScript properties (row, col, horizontalAlignment, text, hint, tap, ...) become DOM
// properties, inline styles and listeners. Layout rules live in web/styles.css.
import { Injectable, Renderer2, RendererFactory2, RendererStyleFlags2, RendererType2 } from '@angular/core';
import { ɵDomRendererFactory2 as DomRendererFactory2 } from '@angular/platform-browser';
import { FIXED_HEIGHT_CLASSES, FIXED_WIDTH_CLASSES } from '../gen/sizing';
import { registerRootLayout } from './overlay';

type Kind =
    | 'stack' | 'grid' | 'flex' | 'wrap' | 'dock' | 'absolute' | 'root' | 'content' | 'scroll' | 'proxy'
    | 'label' | 'span' | 'fs' | 'button' | 'textfield' | 'textview' | 'image' | 'activity' | 'switch'
    | 'date' | 'webview' | 'actionbar' | 'actionitem' | 'navbutton' | 'listview';

interface NsData {
    kind: Kind;
    text?: string;
    formatted?: boolean;
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
}

type NsElement = HTMLElement & { __ns?: NsData; [key: string]: any };

const TAGS: Record<string, [Kind, string]> = {
    stacklayout: ['stack', 'div'],
    gridlayout: ['grid', 'div'],
    flexboxlayout: ['flex', 'div'],
    wraplayout: ['wrap', 'div'],
    docklayout: ['dock', 'div'],
    absolutelayout: ['absolute', 'div'],
    rootlayout: ['root', 'div'],
    contentview: ['content', 'div'],
    page: ['content', 'div'],
    scrollview: ['scroll', 'div'],
    proxyviewcontainer: ['proxy', 'div'],
    label: ['label', 'div'],
    span: ['span', 'span'],
    formattedstring: ['fs', 'span'],
    button: ['button', 'button'],
    textfield: ['textfield', 'input'],
    textview: ['textview', 'textarea'],
    image: ['image', 'img'],
    svgimage: ['image', 'img'],
    activityindicator: ['activity', 'div'],
    switch: ['switch', 'input'],
    datepicker: ['date', 'input'],
    webview: ['webview', 'iframe'],
    actionbar: ['actionbar', 'div'],
    actionitem: ['actionitem', 'div'],
    navigationbutton: ['navbutton', 'div'],
    listview: ['listview', 'div'],
    // Not registered in the Android app either, so NativeScript shows them as invisible containers.
    gif: ['proxy', 'div'],
    imagecache: ['proxy', 'div'],
    cardview: ['proxy', 'div'],
};

const H_ALIGN: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end', stretch: 'stretch' };
const V_ALIGN: Record<string, string> = { top: 'flex-start', center: 'center', middle: 'center', bottom: 'flex-end', stretch: 'stretch' };
const FIT: Record<string, string> = { aspectFit: 'contain', aspectFill: 'cover', fill: 'fill', none: 'none' };
const SCROLLERS = '.ns-listview, .ns-scroll, .ns-webview';

const truthy = (v: any) => v === true || v === 'true';

/** NativeScript lengths are device-independent pixels; bare numbers become px. */
export function px(value: any): string {
    if (value == null || value === '') return '';
    if (typeof value === 'number') return `${value}px`;
    const s = String(value).trim();
    if (s === 'auto') return '';
    if (/^-?[\d.]+$/.test(s)) return `${s}px`;
    if (/^-?[\d.]+-?(dip|px)$/.test(s)) return `${parseFloat(s)}px`;
    return s;
}

/** NativeScript resolves a percentage width against the space a parent offers; see .ns-cq in styles.css. */
const widthLength = (value: any) => (/^\s*-?[\d.]+%\s*$/.test(String(value)) ? `${parseFloat(value)}cqw` : px(value));

const sides = (value: any) => String(value).trim().split(/[\s,]+/).map(px).join(' ');

function gridTracks(spec: string): string {
    return String(spec)
        .split(',')
        .map((t) => t.trim())
        .map((t) => (t === 'auto' ? 'auto' : t.endsWith('*') ? `minmax(0, ${parseFloat(t) || 1}fr)` : px(t)))
        .join(' ');
}

/** Resolves NativeScript image paths ("~/images/x.png") against the web build's assets. */
function resolveSrc(value: any): string {
    if (!value) return '';
    const s = String(value);
    if (s.startsWith('~/')) return s.slice(2);
    if (s.startsWith('res://')) return '';
    return s;
}

/** Walks up through component hosts (display: contents) to the element that lays this one out. */
function layoutParent(el: Element): NsElement | null {
    let p = el.parentElement as NsElement | null;
    while (p && p.classList.contains('ns-proxy')) p = p.parentElement as NsElement | null;
    return p;
}

function placeInGrid(el: NsElement) {
    const d = el.__ns;
    if (!d) return;
    const grid = layoutParent(el);
    let { row, col } = d;
    // NativeScript clamps out-of-range cells to the last row/column instead of adding tracks.
    if (grid?.__ns?.kind === 'grid') {
        const rows = (grid.dataset.rows ?? '*').split(',').length;
        const cols = (grid.dataset.columns ?? '*').split(',').length;
        row = Math.min(row, rows - 1);
        col = Math.min(col, cols - 1);
    }
    el.style.gridRow = `${row + 1} / span ${d.rowSpan}`;
    el.style.gridColumn = `${col + 1} / span ${d.colSpan}`;
    if (grid?.__ns?.kind === 'grid') {
        // NativeScript measures "auto" rows by content alone, so nothing inside them stretches.
        const rowTrack = (grid.dataset.rows ?? '*').split(',')[row]?.trim();
        el.toggleAttribute('data-ns-autorow', rowTrack === 'auto');
        const pct = el.className.match(/(?:^|\s)h-\[([\d.]+)%\]/)?.[1] ?? el.style.height.match(/^([\d.]+)%$/)?.[1];
        // Only when the grid's height comes from outside; for a content-sized grid it would be circular.
        if (pct && (grid.classList.contains('ns-grow') || grid.hasAttribute('data-ns-fh'))) {
            observeGridHeight(grid);
            el.style.height = `calc(var(--ns-gh, 0px) * ${+pct / 100})`;
        }
    }
}

/** A GridLayout child's percentage height is a share of the whole grid, not of its row (as on the device). */
const gridHeights = new ResizeObserver((entries) => {
    for (const e of entries) (e.target as HTMLElement).style.setProperty('--ns-gh', `${(e.target as HTMLElement).clientHeight}px`);
});
const observedGrids = new WeakSet<Element>();
function observeGridHeight(grid: HTMLElement) {
    if (observedGrids.has(grid)) return;
    observedGrids.add(grid);
    gridHeights.observe(grid);
}

const LAYOUTS = new Set<Kind>(['stack', 'grid', 'flex', 'wrap', 'dock', 'absolute', 'content', 'scroll', 'listview']);

/**
 * True when this view's width comes from its parent rather than its content. Such layouts become
 * CSS size containers (.ns-cq) so a child's percentage width ("cqw") means a share of the space
 * on offer, like NativeScript, even inside a parent that shrinks to fit.
 */
function widthFromParent(el: NsElement): boolean {
    if (el.hasAttribute('data-ns-fw')) return true;
    const ha = el.style.getPropertyValue('--ns-ha');
    if (ha && ha !== 'stretch') return false;
    const p = layoutParent(el);
    if (!p?.__ns) return true;
    if (p.__ns.kind === 'root' || p.__ns.kind === 'content') return true;
    if (!p.classList.contains('ns-cq')) return false;
    switch (p.__ns.kind) {
        case 'stack':
            return p.classList.contains('ns-vstack') || el.classList.contains('ns-hgrow');
        case 'scroll':
            return p.classList.contains('ns-vscroll');
        case 'listview':
            return true;
        case 'grid': {
            const cols = (p.dataset.columns ?? '*').split(',');
            const first = Math.min(el.__ns!.col, cols.length - 1);
            return cols.slice(first, first + el.__ns!.colSpan).every((t) => t.trim() !== 'auto');
        }
        case 'dock':
            return p.classList.contains('ns-dock-v') || el.classList.contains('ns-dock-fill');
        default:
            return false;
    }
}

function refreshContainment(node: Node) {
    if (!(node instanceof HTMLElement)) return;
    const views = [node, ...Array.from(node.querySelectorAll<HTMLElement>('.ns-view'))] as NsElement[];
    for (const v of views) if (v.__ns && LAYOUTS.has(v.__ns.kind)) v.classList.toggle('ns-cq', widthFromParent(v));
}

/** DockLayout: docked children keep their side in declaration order; the last one fills. */
function layoutDock(dock: NsElement) {
    const kids = Array.from(dock.children) as NsElement[];
    const fill = dock.dataset.stretchLast === 'false' ? undefined : kids[kids.length - 1];
    const vertical = kids.some((k) => k !== fill && /top|bottom/.test(k.dataset.dock ?? ''));
    dock.classList.toggle('ns-dock-v', vertical);
    dock.classList.toggle('ns-dock-h', !vertical);
    const trailing = kids.filter((k) => k !== fill && /bottom|right/.test(k.dataset.dock ?? ''));
    let lead = 0;
    for (const k of kids) {
        k.classList.toggle('ns-dock-fill', k === fill);
        if (k === fill) k.style.order = '1000';
        else if (trailing.includes(k)) k.style.order = String(3000 - trailing.indexOf(k));
        else k.style.order = String(lead++);
    }
}

/**
 * NativeScript stacks offer each child the space that is left, so a ListView/ScrollView inside nested
 * stacks ends up bounded by the screen. Mark the chain from a scroller up to the page as shrinkable.
 */
function markScrollPath(node: Node) {
    if (!(node instanceof HTMLElement)) return;
    if (!node.matches(SCROLLERS) && !node.querySelector(SCROLLERS) && !node.classList.contains('ns-shrink')) return;
    let p: HTMLElement | null = node;
    while (p && p.localName !== 'page-router-outlet' && !p.classList.contains('ns-root')) {
        p.classList.add('ns-shrink');
        p = p.parentElement;
    }
}

/**
 * Inside a vertical stack NativeScript stretches a GridLayout with "*" rows over the remaining height,
 * and the stacks around it grow with it. Mark that chain so styles.css can let it grow.
 */
function markGrowPath(node: Node) {
    if (!(node instanceof HTMLElement)) return;
    const roots = node.classList.contains('ns-proxy') ? (Array.from(node.children) as HTMLElement[]) : [node];
    for (const el of roots) {
        if (el.matches('.ns-grid[data-ns-star]:not([data-ns-fh]):not([data-ns-va])')) el.classList.add('ns-grow');
        if (!el.classList.contains('ns-grow')) continue;
        let p = layoutParent(el);
        while (p && p.classList.contains('ns-vstack') && !p.hasAttribute('data-ns-fh')) {
            p.classList.add('ns-grow');
            p = layoutParent(p);
        }
    }
}

/** The same across a horizontal stack: a GridLayout with "*" columns takes the remaining width. */
function markHGrowPath(node: Node) {
    if (!(node instanceof HTMLElement)) return;
    const roots = node.classList.contains('ns-proxy') ? (Array.from(node.children) as HTMLElement[]) : [node];
    for (const el of roots) {
        if (el.matches('.ns-grid[data-ns-starcol]:not([data-ns-fw]):not([data-ns-ha])')) el.classList.add('ns-hgrow');
        if (!el.classList.contains('ns-hgrow')) continue;
        let p = layoutParent(el);
        while (p && p.classList.contains('ns-stack') && !p.hasAttribute('data-ns-fw') && !p.hasAttribute('data-ns-ha')) {
            p.classList.add('ns-hgrow');
            p = layoutParent(p);
        }
    }
}

function markFixedSize(el: NsElement, classes: string) {
    const tokens = classes.split(/\s+/);
    if (tokens.some((t) => FIXED_WIDTH_CLASSES.has(t))) el.dataset.nsFw = '';
    if (tokens.some((t) => FIXED_HEIGHT_CLASSES.has(t))) el.dataset.nsFh = '';
}

function initElement(el: NsElement, kind: Kind) {
    switch (kind) {
        case 'stack':
            el.classList.add('ns-vstack');
            break;
        case 'scroll':
            el.classList.add('ns-vscroll');
            break;
        case 'wrap':
            el.classList.add('ns-hwrap');
            break;
        case 'root':
            registerRootLayout(el);
            break;
        case 'grid':
            el.setAttribute('data-ns-star', '');
            el.setAttribute('data-ns-starcol', '');
            break;
        case 'button':
            (el as HTMLButtonElement).type = 'button';
            break;
        case 'textfield':
        case 'textview': {
            const input = el as unknown as HTMLInputElement;
            if (kind === 'textfield') input.type = 'text';
            input.autocomplete = 'off';
            input.spellcheck = false;
            Object.defineProperty(el, 'text', { get: () => input.value, set: (v) => (input.value = v ?? '') });
            el.dismissSoftInput = () => input.blur();
            requestAnimationFrame(() => {
                const cs = getComputedStyle(el);
                el.classList.toggle('ns-underline', cs.backgroundColor === 'rgba(0, 0, 0, 0)' && cs.borderBottomWidth === '0px' && !el.classList.contains('no-underline'));
            });
            break;
        }
        case 'switch':
            (el as HTMLInputElement).type = 'checkbox';
            el.setAttribute('role', 'switch');
            break;
        case 'date':
            (el as HTMLInputElement).type = 'date';
            break;
        case 'image':
            (el as HTMLImageElement).alt = '';
            (el as HTMLImageElement).draggable = false;
            break;
    }
    if (kind === 'label' || kind === 'button' || kind === 'span') {
        Object.defineProperty(el, 'text', { get: () => el.__ns!.text ?? '', set: (v) => applyNsProp(el, 'text', v) });
    }
}

/** Applies a NativeScript property; returns false when it should fall through to the DOM. */
function applyNsProp(el: NsElement, rawName: string, value: any): boolean {
    const d = el.__ns!;
    const name = rawName.startsWith('android:') ? rawName.slice(8) : rawName;
    if (name.startsWith('ios:') || name.startsWith('ios.') || name.startsWith('android.')) return true;
    const s = el.style;
    switch (name) {
        case 'text':
            d.text = value == null ? '' : String(value);
            if (d.kind === 'textfield' || d.kind === 'textview') {
                if ((el as any).value !== d.text) (el as any).value = d.text;
            } else if (!d.formatted) el.textContent = d.text;
            return true;
        case 'hint':
            (el as any).placeholder = value ?? '';
            return true;
        case 'src': {
            const src = resolveSrc(value);
            if (d.kind === 'image') {
                el.classList.toggle('ns-nosrc', !src);
                if (src) (el as HTMLImageElement).src = src;
                else el.removeAttribute('src');
            } else if (d.kind === 'webview') (el as HTMLIFrameElement).src = src;
            return true;
        }
        case 'stretch':
            s.objectFit = FIT[value] ?? 'contain';
            return true;
        case 'textWrap':
            el.classList.toggle('ns-wrap', truthy(value));
            return true;
        case 'orientation': {
            const horizontal = value === 'horizontal';
            const [h, v] = d.kind === 'scroll' ? ['ns-hscroll', 'ns-vscroll'] : d.kind === 'wrap' ? ['ns-hwrap', 'ns-vwrap'] : ['ns-hstack', 'ns-vstack'];
            el.classList.toggle(h, horizontal);
            el.classList.toggle(v, !horizontal);
            return true;
        }
        case 'rows':
        case 'columns':
            if (d.kind !== 'grid') return true;
            el.dataset[name] = String(value);
            if (name === 'rows') el.toggleAttribute('data-ns-star', String(value).includes('*'));
            if (name === 'columns') el.toggleAttribute('data-ns-starcol', String(value).includes('*'));
            if (name === 'rows') s.gridTemplateRows = gridTracks(value);
            else s.gridTemplateColumns = gridTracks(value);
            Array.from(el.children).forEach((c) => placeInGrid(c as NsElement));
            return true;
        case 'row':
        case 'col':
        case 'rowSpan':
        case 'colSpan':
            d[name] = Math.max(name.endsWith('Span') ? 1 : 0, parseInt(value, 10) || 0);
            placeInGrid(el);
            return true;
        case 'dock':
            el.dataset.dock = String(value);
            if (layoutParent(el)?.__ns?.kind === 'dock') layoutDock(layoutParent(el)!);
            return true;
        case 'stretchLastChild':
            el.dataset.stretchLast = String(value);
            if (d.kind === 'dock') layoutDock(el);
            return true;
        case 'horizontalAlignment':
            s.setProperty('--ns-ha', H_ALIGN[value] ?? 'stretch');
            el.dataset.nsHa = '';
            return true;
        case 'verticalAlignment':
            s.setProperty('--ns-va', V_ALIGN[value] ?? 'stretch');
            el.dataset.nsVa = '';
            return true;
        case 'visibility':
            el.classList.toggle('ns-collapsed', value === 'collapse' || value === 'collapsed');
            el.classList.toggle('ns-hidden', value === 'hidden');
            return true;
        case 'width':
        case 'height':
        case 'minWidth':
        case 'minHeight':
            s[name] = name.endsWith('idth') ? widthLength(value) : px(value);
            if (name === 'width') el.toggleAttribute('data-ns-fw', !!px(value));
            if (name === 'height') el.toggleAttribute('data-ns-fh', !!px(value));
            return true;
        case 'margin':
        case 'padding':
            s[name] = sides(value);
            return true;
        case 'marginTop':
        case 'marginRight':
        case 'marginBottom':
        case 'marginLeft':
        case 'paddingTop':
        case 'paddingRight':
        case 'paddingBottom':
        case 'paddingLeft':
        case 'fontSize':
        case 'left':
        case 'top':
            s[name] = px(value);
            return true;
        case 'borderWidth':
            s.borderWidth = sides(value);
            return true;
        case 'borderRadius':
            s.borderRadius = sides(value);
            return true;
        case 'backgroundColor':
        case 'color':
        case 'borderColor':
        case 'fontWeight':
        case 'fontStyle':
        case 'textDecoration':
        case 'textTransform':
        case 'opacity':
        case 'flexDirection':
        case 'flexWrap':
        case 'justifyContent':
        case 'alignItems':
        case 'alignContent':
        case 'alignSelf':
        case 'flexGrow':
        case 'flexShrink':
        case 'order':
            s[name] = value == null ? '' : String(value);
            return true;
        case 'background':
            s.background = value ?? '';
            return true;
        case 'fontFamily':
            s.fontFamily = value ? `${value}, ns-system, sans-serif` : '';
            return true;
        case 'textAlignment':
            s.textAlign = value ?? '';
            return true;
        case 'letterSpacing':
            s.letterSpacing = value ? `${parseFloat(value)}em` : '';
            return true;
        case 'isEnabled': {
            const disabled = value === false || value === 'false';
            el.classList.toggle('ns-disabled', disabled);
            if ('disabled' in el) (el as any).disabled = disabled;
            return true;
        }
        case 'isUserInteractionEnabled':
            el.classList.toggle('ns-nointeract', value === false || value === 'false');
            return true;
        case 'editable':
            (el as any).readOnly = value === false || value === 'false';
            return true;
        case 'secure':
            if (d.kind === 'textfield') (el as HTMLInputElement).type = truthy(value) ? 'password' : 'text';
            return true;
        case 'keyboardType': {
            const mode: Record<string, string> = { number: 'decimal', integer: 'numeric', phone: 'tel', email: 'email', url: 'url', datetime: 'numeric' };
            el.inputMode = mode[value] ?? 'text';
            return true;
        }
        case 'maxLength':
        case 'maxlength':
            if (+value > 0) (el as HTMLInputElement).maxLength = +value;
            return true;
        case 'returnKeyType':
            el.enterKeyHint = value === 'done' ? 'done' : value === 'next' ? 'next' : value === 'search' ? 'search' : value === 'go' ? 'go' : 'enter';
            return true;
        case 'busy':
            el.classList.toggle('ns-busy', truthy(value));
            return true;
        case 'checked':
            (el as HTMLInputElement).checked = truthy(value);
            return true;
        case 'date':
            (el as HTMLInputElement).value = value ? new Date(value).toISOString().slice(0, 10) : '';
            return true;
        case 'minDate':
        case 'maxDate':
            el.setAttribute(name === 'minDate' ? 'min' : 'max', value ? new Date(value).toISOString().slice(0, 10) : '');
            return true;
        case 'title':
            if (d.kind === 'actionbar') el.dataset.title = value ?? '';
            return true;
        // Android only draws an elevation shadow for views with a background; the app's elevated views have none.
        case 'elevation':
        case 'separatorColor':
        case 'items':
        case 'scrollBarIndicatorVisible':
        case 'iosOverflowSafeAreaEnabled':
        case 'autocorrect':
        case 'autocapitalizationType':
        case 'radius':
        case 'pattern':
        case 'type':
            return true;
        default:
            return false;
    }
}

/** Inline NativeScript styles allow bare numbers ("margin: 10"); give them px. */
function fixStyleText(css: string): string {
    return css.replace(/(^|;)\s*([a-z-]+)\s*:\s*([^;]+)/g, (m, sep, prop, val) => {
        if (/^(opacity|z-index|font-weight|flex|flex-grow|flex-shrink|order|line-height)$/.test(prop)) return m;
        return `${sep}${prop}:${val.replace(/(^|\s)(-?\d*\.?\d+)(?=\s|$)/g, (_: string, a: string, n: string) => `${a}${n === '0' ? '0' : n + 'px'}`)}`;
    });
}

class NsWebRenderer implements Renderer2 {
    constructor(private delegate: Renderer2) {}

    get data() {
        return this.delegate.data;
    }
    destroy(): void {
        this.delegate.destroy();
    }
    get destroyNode() {
        return this.delegate.destroyNode;
    }

    createElement(name: string, namespace?: string | null): any {
        const def = TAGS[name.toLowerCase()];
        if (!def) {
            const el = this.delegate.createElement(name, namespace);
            if (name !== 'router-outlet' && name !== 'page-router-outlet') el.classList.add('ns-proxy');
            return el;
        }
        const [kind, tag] = def;
        const el = document.createElement(tag) as NsElement;
        el.__ns = { kind, row: 0, col: 0, rowSpan: 1, colSpan: 1 };
        el.classList.add('ns-view', `ns-${kind}`);
        initElement(el, kind);
        return el;
    }
    createComment(value: string) {
        return this.delegate.createComment(value);
    }
    createText(value: string) {
        return this.delegate.createText(value);
    }

    private afterInsert(parent: NsElement, child: any) {
        if (child?.__ns?.kind === 'fs' && parent?.__ns && parent.__ns.kind !== 'fs') {
            parent.__ns.formatted = true;
            for (const n of Array.from(parent.childNodes)) if (n.nodeType === Node.TEXT_NODE) n.remove();
        }
        if (child instanceof HTMLElement) {
            if ((child as NsElement).__ns) placeInGrid(child as NsElement);
            child.querySelectorAll(':scope > .ns-view, :scope > .ns-proxy > .ns-view').forEach((c) => placeInGrid(c as NsElement));
        }
        const host = parent?.classList?.contains('ns-proxy') ? layoutParent(parent) : parent;
        if (host?.__ns?.kind === 'dock') layoutDock(host);
        markScrollPath(child);
        markGrowPath(child);
        markHGrowPath(child);
        refreshContainment(child);
    }
    appendChild(parent: any, newChild: any): void {
        this.delegate.appendChild(parent, newChild);
        this.afterInsert(parent, newChild);
    }
    insertBefore(parent: any, newChild: any, refChild: any, isMove?: boolean): void {
        this.delegate.insertBefore(parent, newChild, refChild, isMove);
        this.afterInsert(parent, newChild);
    }
    removeChild(parent: any, oldChild: any, isHostElement?: boolean): void {
        this.delegate.removeChild(parent, oldChild, isHostElement);
        if (parent?.__ns?.kind === 'dock') layoutDock(parent);
    }
    selectRootElement(selectorOrNode: any, preserveContent?: boolean) {
        return this.delegate.selectRootElement(selectorOrNode, preserveContent);
    }
    parentNode(node: any) {
        return this.delegate.parentNode(node);
    }
    nextSibling(node: any) {
        return this.delegate.nextSibling(node);
    }

    setAttribute(el: any, name: string, value: string, namespace?: string | null): void {
        // Angular writes static class/style after the other attributes; keep what the renderer already set.
        if (name === 'class' && el instanceof HTMLElement) {
            const own = Array.from(el.classList).filter((c) => c.startsWith('ns-'));
            if ((el as NsElement).__ns) markFixedSize(el, value);
            return this.delegate.setAttribute(el, 'class', [value, ...own].join(' '));
        }
        if (el?.__ns) {
            if (namespace) {
                if (namespace !== 'android') return;
                namespace = null;
            }
            if (name === 'style') {
                const current = el.getAttribute('style');
                return this.delegate.setAttribute(el, 'style', `${current ? current + ';' : ''}${fixStyleText(value)}`);
            }
            if (applyNsProp(el, name, value)) return;
        }
        this.delegate.setAttribute(el, name, value, namespace);
    }
    removeAttribute(el: any, name: string, namespace?: string | null): void {
        this.delegate.removeAttribute(el, name, namespace);
    }
    addClass(el: any, name: string): void {
        if (el?.__ns) markFixedSize(el, name);
        this.delegate.addClass(el, name);
    }
    removeClass(el: any, name: string): void {
        this.delegate.removeClass(el, name);
    }
    setStyle(el: any, style: string, value: any, flags?: RendererStyleFlags2): void {
        this.delegate.setStyle(el, style, el?.__ns && typeof value === 'number' ? `${value}px` : value, flags);
    }
    removeStyle(el: any, style: string, flags?: RendererStyleFlags2): void {
        this.delegate.removeStyle(el, style, flags);
    }
    setProperty(el: any, name: string, value: any): void {
        if (el?.__ns && applyNsProp(el, name, value)) return;
        this.delegate.setProperty(el, name, value);
    }
    setValue(node: any, value: string): void {
        this.delegate.setValue(node, value);
    }

    listen(target: any, eventName: string, callback: (event: any) => boolean | void): () => void {
        if (!(target as NsElement)?.__ns) return this.delegate.listen(target, eventName, callback);
        const el = target as NsElement;
        const on = (type: string, handler: (e: Event) => void) => {
            el.addEventListener(type, handler);
            return () => el.removeEventListener(type, handler);
        };
        switch (eventName) {
            case 'tap':
            case 'doubleTap':
            case 'longPress':
                return on(eventName === 'doubleTap' ? 'dblclick' : eventName === 'longPress' ? 'contextmenu' : 'click', (e) => {
                    if (el.classList.contains('ns-disabled') || el.closest('.ns-nointeract')) return;
                    e.stopPropagation();
                    if (eventName === 'longPress') e.preventDefault();
                    callback({ eventName, object: el, view: el });
                });
            case 'loaded': {
                const timer = setTimeout(() => callback({ eventName, object: el }));
                return () => clearTimeout(timer);
            }
            case 'unloaded':
                return () => {};
            case 'textChange':
                return on('input', () => callback({ eventName, object: el, value: (el as any).value }));
            case 'returnPress':
                return on('keydown', (e) => {
                    if ((e as KeyboardEvent).key === 'Enter') callback({ eventName, object: el });
                });
            case 'checkedChange':
                return on('change', () => callback({ eventName, object: el, value: (el as any).checked }));
            case 'dateChange':
                return on('change', () => callback({ eventName, object: el, value: new Date((el as any).value) }));
            case 'scroll':
                return on('scroll', () => callback({ eventName, object: el, scrollX: el.scrollLeft, scrollY: el.scrollTop }));
            case 'change':
                // Not a NativeScript event, so templates binding it never fire on the device either.
                return () => {};
            default:
                return this.delegate.listen(target, eventName, callback);
        }
    }
}

@Injectable()
export class NsWebRendererFactory implements RendererFactory2 {
    private renderers = new WeakMap<Renderer2, NsWebRenderer>();

    constructor(private dom: DomRendererFactory2) {}

    createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
        const delegate = this.dom.createRenderer(hostElement, type);
        let renderer = this.renderers.get(delegate);
        if (!renderer) {
            renderer = new NsWebRenderer(delegate);
            this.renderers.set(delegate, renderer);
        }
        return renderer;
    }
    begin(): void {
        (this.dom as RendererFactory2).begin?.();
    }
    end(): void {
        (this.dom as RendererFactory2).end?.();
    }
    whenRenderingDone(): Promise<any> {
        return (this.dom as RendererFactory2).whenRenderingDone?.() ?? Promise.resolve();
    }
}
