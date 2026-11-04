import { Component, NO_ERRORS_SCHEMA, OnInit } from "@angular/core";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { Page } from "@nativescript/core";
import { HopReturnItems } from "../../../../app/entities/returns";
import { ReturnsService } from "../../../../app/services/returns.service";
import { HopReturnsCache, ReturnRepository } from "../../../../app/store/return.repository";
import { ApplicationStateService } from "../../../common/application-state-service";

@Component({
    selector: "returns",
    templateUrl: "returns.component.html",
    standalone: true,
    imports: [NativeScriptCommonModule],
    schemas: [NO_ERRORS_SCHEMA]
})
export class ReturnsComponent implements OnInit {
    hopReturnProducts: HopReturnItems[] = [];
    hopId: string;
    isLoading: boolean = false;
    storeReturnValue: HopReturnsCache | undefined;

    constructor(
        private page: Page,
        private returnsService: ReturnsService,
        private appState: ApplicationStateService,
        private returnRepository: ReturnRepository

    ) {
        this.page.actionBarHidden = true;
    }

    async ngOnInit() {
        this.hopId = this.appState.hop.hopId;
        await this.geReturnProducts(this.appState.hop.hopId);
    }

    async geReturnProducts(hopId: string) {
        try {
            this.isLoading = true;

            this.storeReturnValue =await this.returnRepository.getReturnById(this.hopId);

            let hopReturnProducts;

            if (this.storeReturnValue == undefined) {
                hopReturnProducts = await this.returnsService.getHopReturnProducts(hopId);
            }
            else {
                hopReturnProducts = this.storeReturnValue.returnOrders;
            }

            this.hopReturnProducts = this.consolidateReturnItems(hopReturnProducts)
            this.isLoading = false;
        } catch (error) {
            this.isLoading = false;
        }
    }


    private consolidateReturnItems(items: HopReturnItems[]): HopReturnItems[] {
        const groupedItems = {};

        items.forEach((item) => {
            const key = `${item.orderNumber}-${item.itemId}`;
            if (groupedItems[key]) {
                groupedItems[key].quantity += item.quantity;
                groupedItems[key].pieces += item.pieces;
                groupedItems[key].cases += item.cases;
                groupedItems[key].totalNetAmount += item.totalNetAmount;

            } else {
                groupedItems[key] = { ...item };
            }
        });

        return Object.values(groupedItems);
    }
}
