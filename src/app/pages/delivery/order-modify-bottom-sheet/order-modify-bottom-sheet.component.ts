import { Component, Inject, NO_ERRORS_SCHEMA, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ApplicationStateService } from "~/app/common";
import { OrderModifyInput, OrderModifyToBottomSheet } from "~/app/entities/order";
import { UIService } from "../../../services/ui-service";
import { GenericParams } from "~/app/tokens";
import { TNSFancyAlert } from "@nstudio/nativescript-fancyalert";
import { NativeScriptCommonModule, NativeScriptFormsModule } from "@nativescript/angular";
import { ReactiveFormsModule } from "@angular/forms";

@Component({
    selector: "order-modify-bottom-sheet",
    templateUrl: "order-modify-bottom-sheet.component.html",
    standalone: true,
    imports: [NativeScriptCommonModule,ReactiveFormsModule,NativeScriptFormsModule],
    schemas: [NO_ERRORS_SCHEMA]
})
export class OrderModifyBottomSheetComponent implements OnInit {
    items: any;
    type: number;
    popupHeight = 650;
    modifyOrder: OrderModifyToBottomSheet;
    ActualQuantity: number;
    DamageQuantity: number;
    NoPhysicalStock: number;
    isCasesZero: boolean = true;
    constructor(
        private uiService: UIService,
        private appState: ApplicationStateService,
        private router: Router,
        @Inject(GenericParams) private inputData: any
    ) {
        this.type = inputData.type;
        this.items = inputData.items;
        if (this.type == 101) {
            this.modifyOrder = this.items;
            this.isCasesZero = this.modifyOrder.upc == 0 ? false : true;
        }

        console.log("this.modifyOrder :----", this.modifyOrder);
    }

    ngOnInit() {}

    close(data): void {
        this.uiService.closeBottomSheet(data);
    }

    // convertCasesPicesToPices(cases, pieces, upc) {
    //     return cases * upc + pieces;
    // }
    save() {
        const {
            availableCss,
            availablePcs,
            availableDamageCss,
            availableDamagePcs,
            upc,
        } = this.modifyOrder;

        const availableQty = this.convertCasesPicesToPices(
            +availableCss,
            +availablePcs,
            +upc
        );
        const damageQty = this.convertCasesPicesToPices(
            +availableDamageCss,
            +availableDamagePcs,
            upc
        );

        if (!this.modifyOrder.isVendorDrop) {
            if (!this.validation(availableQty, damageQty)) {
                return;
            }
        } else {
            if (!this.vendorValidation(availableQty, damageQty)) {
                return;
            }
        }
        // WHEN U FIXING BUG CONVERT ENTERED availableCss INTO PCS ITS A BIG BUG use convertCasesPicesToPices

        const input: OrderModifyInput = {
            availableQty: +availableQty,
            damageQty: +damageQty,
        };
        this.close(input);
    }

    //PRIVATE FUNCTIONS

    private showMessage(message: string) {
        TNSFancyAlert.showWarning("", message, "Okay");
    }

    private validateNumberField(input: string): boolean {
        return input !== "" && /^\d+$/.test(input);
    }

    private validation(availableQty: number, damageQty: number): boolean {
        if (
            !this.validateNumberField(this.modifyOrder.availableCss.toString())
        ) {
            this.showMessage(
                "Available Css quantity should not be empty or negative or decimal value"
            );
            return false;
        }

        if (
            !this.validateNumberField(this.modifyOrder.availablePcs.toString())
        ) {
            this.showMessage(
                "Available Pcs should not be empty or negative or decimal value"
            );
            return false;
        }

        if (
            !this.validateNumberField(
                this.modifyOrder.availableDamageCss.toString()
            )
        ) {
            this.showMessage(
                "Damage Css quantity should not be empty or negative or decimal value"
            );
            return false;
        }

        if (
            !this.validateNumberField(
                this.modifyOrder.availableDamagePcs.toString()
            )
        ) {
            this.showMessage(
                "Damage Pcs quantity should not be empty or negative or decimal value"
            );
            return false;
        }

        const qty = availableQty + damageQty;

        if (+this.modifyOrder.requestedQuantity < qty) {
            this.showMessage(
                "Your enter quantity should not more than requested quantity(The Requested quantity must be equal to entered quantity)"
            );
            return false;
        }

        return true;
    }

    private convertCasesPicesToPices(
        cases: number,
        pieces: number,
        upc: number
    ) {
        return cases * upc + pieces;
    }

    private vendorValidation(availableQty: number, damageQty: number): boolean {
        if (
            !this.validateNumberField(this.modifyOrder.availableCss.toString())
        ) {
            this.showMessage(
                "Available Css quantity should not be empty or negative or decimal value"
            );
            return false;
        }

        if (
            !this.validateNumberField(this.modifyOrder.availablePcs.toString())
        ) {
            this.showMessage(
                "Available Pcs should not be empty or negative or decimal value"
            );
            return false;
        }

        const qty = availableQty + damageQty;

        if (+this.modifyOrder.requestedQuantity < qty) {
            this.showMessage(
                "Your enter quantity should not more then requested quantity"
            );
            return false;
        }

        return true;
    }
}
