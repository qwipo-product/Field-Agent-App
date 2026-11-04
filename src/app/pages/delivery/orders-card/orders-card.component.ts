import { Component, Input, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { CurrencyPipe } from '../../../shared/value-converters/currency';
import { DateDDMMMYYYPipe } from '../../../shared/value-converters/date-ddmmmyyyy';


@Component({
    selector: 'orders-card',
    templateUrl: 'orders-card.component.html',
    standalone: true,
    imports: [NativeScriptCommonModule, CurrencyPipe,DateDDMMMYYYPipe],
    schemas: [NO_ERRORS_SCHEMA]
})

export class OrdersCardComponent implements OnInit {
    @Input() order: any;
    constructor() { }

    ngOnInit() {
    }
}
