import { ReturnsComponent } from './../returns/returns.component';
import { DEProductsViewComponent } from './../de-orders/de-product-view-component';
import { AdminProductsViewComponent } from './../admin-orders/admin-product-view-component';
import { StopSummaryComponent } from './../stop-summary/stop-summary';
import { Component, NO_ERRORS_SCHEMA, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { Page } from "@nativescript/core";
import { ApplicationStateService, DesignationType, PointMode, PointType } from "~/app/common";
import { FieldAgent } from "~/app/entities";
import { HopItems, HopProducts, Order, TripHopMappedResponse } from "~/app/entities/hop";
import { UIService } from "../../../services/ui-service";
import { ReturnRepository } from "~/app/store/return.repository";

@Component({
    selector: "hop-details",
    templateUrl: "./hop-details.html",
    standalone: true,
    imports: [NativeScriptCommonModule,StopSummaryComponent,AdminProductsViewComponent,DEProductsViewComponent,ReturnsComponent],
    schemas: [NO_ERRORS_SCHEMA]
})
export class HopDetailsComponent implements OnInit {
    isLoading: boolean = true;
    isProducts: boolean = true;
    showOrderDetails: boolean = false;
    isSummary: boolean = false;
    showStopDetails: boolean = true;
    orderProducts: any[] = [];
    isCompleted: boolean = false;
    fieldAgent: FieldAgent;

    isSummaryActive: boolean = true;
    isProductsActive: boolean = false;
    isReturnsActive: boolean = false;
    showAdminDetails: boolean = false;
    hopItems: HopItems[] = [];
    hopDetails: TripHopMappedResponse;
    hopOrders: Order[] = [];
    hopProducts: HopProducts[] = [];
    isCustomerDelivery: boolean;
    constructor(
        private router: Router,
        private page: Page,
        private appState: ApplicationStateService,
        private uiService : UIService,
        private returnRepository: ReturnRepository,
    ) {
        this.page.actionBarHidden = true;
        this.fieldAgent = this.appState.fieldAgent;
        this.setShowAdminDetails();
    }

    async ngOnInit() {
        this.isLoading = true;
        this.hopDetails = this.appState.hop;
        this.isCustomerDelivery =
            this.fieldAgent.designation == 3 &&
            this.hopDetails.pointMode == 2 &&
            this.hopDetails.pointType == 2;
        this.isLoading = false;
    }

    setShowAdminDetails(): void {
        const { designation } = this.fieldAgent;
        this.showAdminDetails =
            designation === DesignationType.Manager ||
            designation === DesignationType.OperationAdmin;
    }

    showSummary() {
        this.isSummaryActive = true;
        this.isProductsActive = false;
        this.isReturnsActive = false;
    }

    showProducts() {
        this.isSummaryActive = false;
        this.isProductsActive = true;
        this.isReturnsActive = false;
    }

    showReturns() {
        this.isSummaryActive = false;
        this.isProductsActive = false;
        this.isReturnsActive = true;
    }

    showProductWise() {
        this.isProducts = true;
        this.showOrderDetails = true;
    }

    showOrderWise() {
        this.isProducts = false;
        this.showOrderDetails = true;
    }

    async goBack() {
        const storeCache = await this.returnRepository.getReturnById(this.appState.hop?.hopId);

        if(storeCache != undefined &&this.appState.hop?.pointMode == PointMode.DELIVERY && this.appState.hop?.pointType==PointType.CUSTOMER){
            this.uiService.showBottomSheet({ type: 10007 }, (res) => {
                this.appState.isBottomSheetOpen = false;
                if (res) {
                    this.returnRepository.deleteCacheReturnByHopId(this.appState.hop?.hopId);
                    this.appState.isHopDetailsPage = true;
                    this.router.navigate(['/trip-details']);
                }
            });
        }else{
            this.appState.isHopDetailsPage = true;
            this.router.navigate(['/trip-details']);
        }
    }


}
