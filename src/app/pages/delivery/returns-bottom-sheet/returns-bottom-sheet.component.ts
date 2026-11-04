import { Component, Inject, NO_ERRORS_SCHEMA, OnInit } from "@angular/core";
import { NativeScriptCommonModule, NativeScriptFormsModule } from "@nativescript/angular";
import { TNSFancyAlert } from "@nstudio/nativescript-fancyalert";
import { dismissSoftKeybaord } from "~/app/common";
import { partialReturn } from "~/app/entities";
import { UIService } from "~/app/services/ui-service";
import { GenericParams } from "~/app/tokens";
import { ReturnsService } from "~/app/services/returns.service";
import { ReactiveFormsModule } from "@angular/forms";

@Component({
    selector: "returns-bottom-sheet",
    templateUrl: "returns-bottom-sheet.component.html",
    standalone: true,
    imports: [NativeScriptCommonModule,ReactiveFormsModule,NativeScriptFormsModule],
    schemas: [NO_ERRORS_SCHEMA]
})
export class ReturnsBottomSheetComponent implements OnInit {
    items: any;
    type: number;
    popupHeight = 450;
    partialReturnSku: partialReturn;
    showReturnRequestList: boolean = false;
    returns: { id: number; name: string; isSelected: boolean }[] = [];
    selectedReason: { id: number; name: string };
    isSelectedReason: boolean = false;
    changedQuantity: number;
    originalOrder: partialReturn;
    POPUP_HEIGHT_LARGE = 800;
    POPUP_HEIGHT_SMALL = 450;

    constructor(
        private uiService: UIService,
        public returnsService: ReturnsService,
        @Inject(GenericParams) inputData: any
    ) {
        this.type = inputData.type;
        this.items = inputData.items;

        if (this.type == 10005) {
            this.originalOrder = { ...this.items };
            this.partialReturnSku = this.items;
            this.changedQuantity = this.partialReturnSku.quantity;
        }
    }

    ngOnInit() {}

    close(data): void {
        this.uiService.closeBottomSheet(data);
    }

    async openReturnRequestList() {
        dismissSoftKeybaord();
        this.popupHeight = this.POPUP_HEIGHT_LARGE;
        this.showReturnRequestList = true;

        if (this.returns.length === 0) {
            this.returns = await this.returnsService.getReturnReasons();

            // console.log("this.returns", this.returns);
            // this.returns = getReturnRequestReasons();
        }
    }
    onTextFieldTap() {
        this.showReturnRequestList = false;
    }

    selectSubFilter(returnItem: any) {
        this.selectedReason = this.returns.find(
            (subFilter) => subFilter.id === returnItem.id
        );

        // this.popupHeight = this.POPUP_HEIGHT_SMALL;
        this.isSelectedReason = true;

        this.returns = this.returns.map((subFilter) => ({
            ...subFilter,
            isSelected: subFilter.id === returnItem.id,
        }));

        this.showReturnRequestList = false;

    }

    validateNumberField(input: string): boolean {
        return input !== "" && /^\d+$/.test(input);
    }

    validation(): boolean {
        if (!this.changedQuantity) {
            this.showMessage("You Haven't Entered Any Quantity");
            return false;
        }
        if (!this.validateNumberField(this.changedQuantity.toString())) {
            this.showMessage(
                "Quantity Should Not Be Negative or Decimal Value"
            );
            return false;
        }

        if (+this.changedQuantity > this.originalOrder.quantity) {
            this.showMessage(
                "Return Quantity Should Not be More than Actual Quantity"
            );
            return false;
        }

        if (!this.selectedReason) {
            this.showMessage("Please Select the Reason");
            return false;
        }

        return true;
    }

    productReturn() {
        if (!this.validation()) {
            return;
        }

        this.partialReturnSku.quantity = +this.changedQuantity;
        this.partialReturnSku.reason = this.selectedReason.name;
        this.close(this.partialReturnSku);
    }

    showMessage(message: string) {
        TNSFancyAlert.showWarning("", message, "Okay");
    }
}
