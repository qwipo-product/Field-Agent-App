import { TripSummaryComponent } from './../../delivery/trip-summary/trip-summary';
import { ApplicationStateService } from "~/app/common";
import { Component, NO_ERRORS_SCHEMA, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import * as utils from "@nativescript/core/utils";
import { Page } from "@nativescript/core";
import * as TNSPhone from "nativescript-phone";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { HopsListComponent } from '../hops-list/hops-list';

@Component({
    moduleId: module.id,
    selector: "trip-details",
    templateUrl: "trip-details.html",
    standalone: true,
    imports: [NativeScriptCommonModule,TripSummaryComponent,HopsListComponent],
    schemas: [NO_ERRORS_SCHEMA]
})
export class TripDetailsComponent implements OnInit {
    isLoading: boolean = true;
    isTripSummary: boolean;
    showTripDetails: boolean = true;

    constructor(
        private appState: ApplicationStateService,
        private router: Router,
        private page: Page,
    ) { }
    ngOnInit() {
        this.isTripSummary = this.appState.isHopDetailsPage;
        this.page.actionBarHidden = true;
        this.isLoading = true;
        this.isLoading = false;
    }

    showTripSummary() {
        this.isTripSummary = false;
        this.showTripDetails = true;
    }
    showStopsList() {
        this.isTripSummary = true;
        this.showTripDetails = true;
    }

    openUrl(lat: any, long: any) {
        utils.openUrl(`https://maps.google.com/maps?q=${lat},${long}`);
    }

    contactUser(mobileNumber: string) {
        TNSPhone.dial(mobileNumber, true);
    }

    goBack() {
        this.router.navigate(['/trip-list']);
    }
}
