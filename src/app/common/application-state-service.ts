import { Injectable } from "@angular/core";
import { FieldAgent } from "~/app/entities";
import { HopOrder, TripHopMappedResponse } from "../entities/hop";
import { AppConfiguration } from "../entities/app-setting-response.model";
@Injectable({
    providedIn: "root"
})
export class ApplicationStateService {
    appSettings: AppConfiguration;
    deviceAppVersion: string;
    isBottomSheetOpen: boolean = false;
    fieldAgent: FieldAgent;
    hop: TripHopMappedResponse | null;
    hopsList: TripHopMappedResponse[] = [];
    hopOrders: HopOrder[] = [];
    loginMobileNumber: string | any;
    isHopDetailsPage: boolean;
    subFooter: boolean = false;
    isNavigatedFrom: number = 2;
    tripId : string = '';

    constructor() {
        this.fieldAgent = new FieldAgent();
    }
}
