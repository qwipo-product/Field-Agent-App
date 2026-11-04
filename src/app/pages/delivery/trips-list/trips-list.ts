import { Component, NO_ERRORS_SCHEMA, OnInit, ViewContainerRef } from "@angular/core";
import { Router } from "@angular/router";
import { ApplicationStateService, DesignationType, DownLoadTripIndent, NavigatedFrom, showSuccess, showWarning, TripIndentMainFilter, YYYYMMDD } from "~/app/common";
import { Page } from "@nativescript/core";
import { TripService } from "~/app/services/trip.service";
import { TripFilters, TripListMappedResponse, TripPayload } from "~/app/entities/trip";
import { FieldAgent } from "~/app/entities";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { UIService } from "~/app/services/ui-service";
import { PdfService } from "~/app/services/pdf.service"
import { FooterBarComponent } from "~/app/shared/footer-bar/footer-bar";
import { VehicleTypePipe } from "~/app/shared/value-converters/vehicle-type";
import { TripStatusPipe } from "~/app/shared/value-converters/trip-status-label.pipe";
@Component({
    moduleId: module.id,
    selector: "trips-list",
    templateUrl: "trips-list.html",
    standalone: true,
    imports: [NativeScriptCommonModule,FooterBarComponent,VehicleTypePipe, TripStatusPipe],
    schemas: [NO_ERRORS_SCHEMA]
})
export class TripsListComponent implements OnInit {
    isLoading = true;
    tripList: TripListMappedResponse[] = [];
    fieldAgent: FieldAgent;
    showAdminDetails: boolean = false;

    constructor(
        private router: Router,
        private page: Page,
        private uiService: UIService,
        private vcRef: ViewContainerRef,
        private tripService: TripService,
        public appState: ApplicationStateService,
        private pdfService: PdfService
    ) {
        this.page.actionBarHidden = true;
        this.fieldAgent = this.appState.fieldAgent;
        this.showAdminDetails = this.fieldAgent.designation === DesignationType.Manager || this.fieldAgent.designation === DesignationType.OperationAdmin;
    }

    async ngOnInit(): Promise<void> {
        this.isLoading = true;
        try {
            this.tripList = await this.getTrips();
            console.log(this.tripList);
        } finally {
            this.isLoading = false;
        }
    }

    async getTrips(startDate?: string, endDate?: string): Promise<TripListMappedResponse[] | []> {
        const payload: TripPayload = {
            agent_mobile: "",
            trip_status: null,
            trip_name: "",
            start_date: startDate ? startDate : YYYYMMDD(),
            end_date: endDate ? endDate : YYYYMMDD(),
            page_number: 1,
            page_size: 50,
            trip_number: "",
            location_id: this.showAdminDetails ? this.fieldAgent.location : "",
            delivery_agent_id: this.showAdminDetails ? "" : this.fieldAgent.id
        };

        try {
            return await this.tripService.getTrips(payload);
        } catch (error) {
            console.error("Error fetching trips:", error);
            return [];
        }
    }

    navigateToHops(tripId: string): void {
        this.appState.hopsList = [];
        this.appState.tripId = tripId;
        this.appState.isHopDetailsPage = false;
        this.appState.isNavigatedFrom = NavigatedFrom.Trip;
        this.router.navigate(['/trip-details']);
    }

    async openTripFilters() {
        const initialFilters: TripFilters = {
            selectedMainOption: "",
            selectedSubOption: "",
            startDate: "",
            endDate: "",
        };

        const bottomSheetOptions = {
            context: { details: initialFilters, type: 10004 },
            fullscreen: false,
            viewContainerRef: this.vcRef,
        };

        this.uiService.showBottomSheet(
            { type: 10004, items: bottomSheetOptions.context.details },
            async (selectedFilters: TripFilters) => {
                if (selectedFilters) {
                    await this.handleSelectedFilters(selectedFilters);
                }
            }
        );
    }

    private async handleSelectedFilters(filters: TripFilters) {
        const { selectedMainOption, startDate, endDate } = filters;
        if (+selectedMainOption === TripIndentMainFilter.date) {
            await this.getTrips(startDate, endDate);
        } else if (+selectedMainOption === TripIndentMainFilter.download) {
            const indentType = {
                [DownLoadTripIndent.VendorIndent]: "Vendor-Indent",
                [DownLoadTripIndent.wareHouseIndent]: "wareHouse-Indent",
            };
            const indentName = indentType[+filters.selectedSubOption];
            const type = +filters.selectedSubOption;
            await this.downloadIndent(type, indentName);
        }
    }

    private async downloadIndent(type: number, indentName: string) {
        try {
            const tripIds = [...new Set(this.tripList.map((trip) => trip.id))];
            const inputObj = {
                type: type,
                tripIds,
            };

            if (tripIds.length == 0) {
                showWarning("Warning", "you have no trips to download sheet", "Okay");
                return;
            }
            await this.pdfService.downloadIndent(inputObj, indentName);
            showSuccess("Success","PDF downloaded successfully, check in the Downloads folder in the Qwipo directory.","Okay");
        } catch (error) {
            showWarning("Error", "Failed to download PDF", "Okay");
            console.log("Error downloading PDF:", error);
        }
    }

}
