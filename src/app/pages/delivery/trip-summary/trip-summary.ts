import { ApplicationStateService, DesignationType, HopStatus, showError, showSuccess, showWarning, TripStatus } from "../../../../app/common";
import { HopService } from "../../../../app/services/hop.service";
import { TripService } from "../../../../app/services/trip.service";
import { Component, NO_ERRORS_SCHEMA, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Page } from "@nativescript/core";
import { FieldAgent } from "../../../../app/entities";
import { TripSummaryMappedResponse } from "../../../../app/entities/trip";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { HopFilters, TripHopMappedResponse } from "../../../entities/hop";
import { ReplaceCommasPipe } from "~/app/shared/value-converters/currency-pipe";

@Component({
    moduleId: module.id,
    selector: "trip-summary",
    templateUrl: "trip-summary.html",
    standalone: true,
    imports: [NativeScriptCommonModule, ReplaceCommasPipe],
    schemas: [NO_ERRORS_SCHEMA]
})
export class TripSummaryComponent implements OnInit {
    isLoading = false;
    hopsList: TripHopMappedResponse[] = [];
    fieldAgent: FieldAgent;
    tripSummary!: TripSummaryMappedResponse;
    balance = 0;
    isPickUpFromWarehouse = false;
    showAdminDetails = false;

    constructor(
        private appState: ApplicationStateService,
        private router: Router,
        private page: Page,
        private tripService: TripService,
        private hopService: HopService
    ) {
        this.fieldAgent = this.appState.fieldAgent;
        this.showAdminDetails = [DesignationType.Manager, DesignationType.OperationAdmin].includes(this.fieldAgent.designation);
    }

    async ngOnInit() {
        this.page.actionBarHidden = true;
        await this.loadTripDetails();
    }

    async loadTripDetails() {
        try {
            this.isLoading = true;
            const tripId = this.appState.tripId ? this.appState.tripId : this.appState.hop.tripId;
            this.tripSummary = await this.tripService.getTripSummary(tripId);
            this.calculateBalance();
            await this.loadHops();
        } catch (error) {
            showError('Error', 'Failed to load trip details.', 'OK');
        } finally {
            this.isLoading = false;
        }
    }

    calculateBalance() {
        this.balance = this.tripSummary?.dispatchValue - (this.tripSummary?.cashCollections + this.tripSummary?.onlinePayments + this.tripSummary?.customerReturns);
    }

    async loadHops() {
        const filters: HopFilters = { tripId: this.appState.tripId, agentId: '', pointId: '', pageSize: 100, pageNum: 1 };
        this.hopsList = await this.hopService.getHopsByFilters(filters);
        this.isPickUpFromWarehouse = this.hopsList.some(hop => hop.pointMode === 2 && hop.pointType === 2);
        this.appState.hopsList = this.hopsList;
    }

    async changeTripStatus(tripId: string, tripStatus: TripStatus) {
        try {
            this.isLoading = true;
            if (tripStatus === TripStatus.NotStarted) {
                await this.startTrip(tripId);
            } else if (tripStatus === TripStatus.InProgress) {
                await this.completeTrip(tripId);
            } else {
                showWarning('Warning', 'Invalid trip status', 'Okay');
            }
        } catch (error) {
            showError('Error', 'Failed to update trip status.', 'OK');
        } finally {
            this.isLoading = false;
        }
    }

    async startTrip(tripId: string) {
        if (await this.tripService.startTrip(tripId, this.appState.fieldAgent.id)) {
            showSuccess('Success', 'Trip Started Successfully', 'Okay');
            this.updateTripStatus(TripStatus.InProgress);
        } else {
            showWarning('Warning', 'Failed to start trip.', 'OK');
        }
    }

    async completeTrip(tripId: string) {
        const filters: HopFilters = { tripId, agentId: '', pointId: '', pageSize: 100, pageNum: 1 };
        const hopsList = await this.hopService.getHopsByFilters(filters);

        if (this.checkAllHopsCompleted(hopsList)) {
            if (await this.tripService.completeTrip(tripId, this.appState.fieldAgent.id)) {
                showSuccess('Success', 'Trip Completed Successfully', 'Okay');
                this.updateTripStatus(TripStatus.Completed);
            } else {
                showWarning('Warning', 'Failed to complete trip.', 'OK');
            }
        } else {
            showWarning('Warning', 'Some hops are not yet completed.', 'OK');
        }
    }

    checkAllHopsCompleted(hops: TripHopMappedResponse[]): boolean {
        return hops.every(hop => hop.hopStatus === HopStatus.Completed);
    }

    updateTripStatus(status: TripStatus) {
        this.tripSummary.tripStatus = status;
        this.loadTripDetails();
    }

    goBack() {
        this.router.navigate(['/trip-list']);
    }
}
