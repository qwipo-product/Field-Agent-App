// Browser stand-in for "@nativescript/angular": the modules, ListView, form value accessors,
// page-router-outlet and helpers the app imports. Layout tags themselves are handled by renderer.ts.
import { CommonModule, Location, NgFor, NgTemplateOutlet } from '@angular/common';
import {
    ApplicationRef,
    Component,
    ContentChild,
    Directive,
    ElementRef,
    EnvironmentInjector,
    EventEmitter,
    Injectable,
    Injector,
    Input,
    NgModule,
    Output,
    TemplateRef,
    createComponent,
    forwardRef,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NavigationExtras, Router, RouterOutlet } from '@angular/router';

/** NativeScript's ListView: renders every item with the projected <ng-template>. */
@Component({
    selector: 'ListView',
    standalone: true,
    imports: [NgFor, NgTemplateOutlet],
    template: `<div
        class="ns-lv-item"
        *ngFor="let item of rows; let i = index; let even = even; let odd = odd"
        [style.border-bottom-color]="separatorColor"
        (click)="onItemTap(item, i)"
    >
        <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item, item: item, index: i, even: even, odd: odd }"></ng-container>
    </div>`,
})
export class ListViewComponent {
    @Input() items: any;
    @Input() separatorColor = '#e0e0e0';
    @Output() itemTap = new EventEmitter<any>();
    @Output() loadMoreItems = new EventEmitter<any>();
    @ContentChild(TemplateRef) itemTemplate: TemplateRef<any>;

    constructor(private host: ElementRef<HTMLElement>) {}

    get rows(): any[] {
        const items = this.items;
        if (!items) return [];
        if (Array.isArray(items)) return items;
        if (typeof items.getItem === 'function') return Array.from({ length: items.length }, (_, i) => items.getItem(i));
        return Array.from(items);
    }

    onItemTap(item: any, index: number) {
        this.itemTap.emit({ eventName: 'itemTap', index, item, object: this.host.nativeElement, view: this.host.nativeElement });
    }

    refresh(): void {}
}

/** Two-way binding for TextField / TextView (rendered as <input> / <textarea>). */
@Directive({
    selector:
        'TextField[ngModel],TextField[formControlName],TextField[formControl],textField[ngModel],textField[formControlName],textField[formControl],' +
        'TextView[ngModel],TextView[formControlName],TextView[formControl],textView[ngModel],textView[formControlName],textView[formControl]',
    standalone: true,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextValueAccessor), multi: true }],
    host: { '(input)': 'onChange($event.target.value)', '(blur)': 'onTouched()' },
})
export class TextValueAccessor implements ControlValueAccessor {
    onChange = (_: any) => {};
    onTouched = () => {};
    constructor(private el: ElementRef<HTMLInputElement>) {}
    writeValue(value: any): void {
        const text = value == null ? '' : String(value);
        if (this.el.nativeElement.value !== text) this.el.nativeElement.value = text;
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
    setDisabledState(disabled: boolean): void {
        this.el.nativeElement.disabled = disabled;
    }
}

/** Two-way binding for Switch (rendered as a checkbox). */
@Directive({
    selector: 'Switch[ngModel],Switch[formControlName],Switch[formControl],switch[ngModel],switch[formControlName],switch[formControl]',
    standalone: true,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckedValueAccessor), multi: true }],
    host: { '(blur)': 'onTouched()' },
})
export class CheckedValueAccessor implements ControlValueAccessor {
    onChange = (_: any) => {};
    onTouched = () => {};
    constructor(private el: ElementRef<HTMLInputElement>) {
        // Listen directly: the renderer drops "change" on views, as NativeScript has no such event.
        el.nativeElement.addEventListener('change', () => this.onChange(el.nativeElement.checked));
    }
    writeValue(value: any): void {
        this.el.nativeElement.checked = !!value;
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
}

/** Two-way binding for DatePicker (rendered as <input type="date">). */
@Directive({
    selector: 'DatePicker[ngModel],DatePicker[formControlName],DatePicker[formControl],datePicker[ngModel]',
    standalone: true,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateValueAccessor), multi: true }],
    host: { '(blur)': 'onTouched()' },
})
export class DateValueAccessor implements ControlValueAccessor {
    onChange = (_: any) => {};
    onTouched = () => {};
    constructor(private el: ElementRef<HTMLInputElement>) {
        el.nativeElement.addEventListener('change', () => this.onChange(el.nativeElement.value ? new Date(el.nativeElement.value) : null));
    }
    writeValue(value: any): void {
        const d = value ? new Date(value) : null;
        this.el.nativeElement.value = d && !isNaN(+d) ? d.toISOString().slice(0, 10) : '';
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
}

@NgModule({
    imports: [CommonModule, ListViewComponent],
    exports: [CommonModule, ListViewComponent],
})
export class NativeScriptCommonModule {}

@NgModule({
    imports: [FormsModule, TextValueAccessor, CheckedValueAccessor, DateValueAccessor],
    exports: [FormsModule, TextValueAccessor, CheckedValueAccessor, DateValueAccessor],
})
export class NativeScriptFormsModule {}

/** The page outlet: routed pages are laid out full-screen inside it (see styles.css). */
@Component({
    selector: 'page-router-outlet',
    standalone: true,
    imports: [RouterOutlet],
    template: '<router-outlet></router-outlet>',
})
export class PageRouterOutlet {}

@Injectable({ providedIn: 'root' })
export class RouterExtensions {
    constructor(
        private router: Router,
        private location: Location,
    ) {}
    navigate(commands: any[], extras?: NavigationExtras & { clearHistory?: boolean }): Promise<boolean> {
        return this.router.navigate(commands, { ...extras, replaceUrl: extras?.clearHistory || extras?.replaceUrl });
    }
    navigateByUrl(url: string, extras?: NavigationExtras & { clearHistory?: boolean }): Promise<boolean> {
        return this.router.navigateByUrl(url, { ...extras, replaceUrl: extras?.clearHistory || extras?.replaceUrl });
    }
    back(): void {
        this.location.back();
    }
    backToPreviousPage(): void {
        this.location.back();
    }
    canGoBack(): boolean {
        return history.length > 1;
    }
    canGoBackToPreviousPage(): boolean {
        return history.length > 1;
    }
}

/** Custom elements are mapped by the web renderer, so registration has nothing to do. */
export function registerElement(_name: string, _resolver: () => any, _meta?: any): void {}

/** Creates a component outside any template (used for bottom sheets opened in the RootLayout). */
export function generateNativeScriptView(component: any, options: { injector: Injector }) {
    const appRef = options.injector.get(ApplicationRef);
    const ref = createComponent(component, {
        environmentInjector: options.injector.get(EnvironmentInjector),
        elementInjector: options.injector,
    });
    appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
    return { ref, firstNativeLikeView: ref.location.nativeElement as any };
}
