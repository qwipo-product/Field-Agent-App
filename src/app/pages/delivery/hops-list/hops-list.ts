
import { HopFilters, TripHopMappedResponse } from "../../../entities/hop";
import { ApplicationStateService, DesignationType, NavigatedFrom, showToast, showWarning } from "~/app/common";
import { Component, OnInit, NO_ERRORS_SCHEMA } from "@angular/core";
import { Router } from "@angular/router";
import * as utils from "@nativescript/core/utils";
import { Page } from "@nativescript/core";
import * as TNSPhone from "nativescript-phone";
import { FieldAgent } from "~/app/entities";
import { containsSpecialChars, validateOnlyNumbers, validateSpecialCharacters, validateText } from "~/app/utils/validations";
import { NativeScriptCommonModule, NativeScriptFormsModule } from "@nativescript/angular";
import { HopService } from "~/app/services/hop.service";
import { FooterBarComponent } from "~/app/shared/footer-bar/footer-bar";
import { ReactiveFormsModule } from "@angular/forms";
import { PointModeLabelValueConverter } from "~/app/shared/value-converters/point-mode-label.pipe";
import { ConcatenateLabelValueConverter } from "~/app/shared/value-converters/concatenate-label.pipe";
import { PointTypeLabelValueConverter } from "~/app/shared/value-converters/point-type-label.pipe";
import { HopStatusLabelValueConverter } from "~/app/shared/value-converters/hop-status-label.pipe";

@Component({
    moduleId: module.id,
    selector: "hops-list",
    templateUrl: "hops-list.html",
    standalone: true,
    imports: [NativeScriptCommonModule, FooterBarComponent, ReactiveFormsModule, NativeScriptFormsModule,PointModeLabelValueConverter,ConcatenateLabelValueConverter,PointTypeLabelValueConverter,HopStatusLabelValueConverter],
    schemas: [NO_ERRORS_SCHEMA]

})

export class HopsListComponent implements OnInit {
    isLoading: boolean = true;
    hops: Array<TripHopMappedResponse> = [];
    mainHops: Array<TripHopMappedResponse> = [];
    fieldAgent: FieldAgent;
    showAdminDetails: boolean = false;
    maxInputLength: number = 100;
    searchText: string = "";
    warningTimer: any = null;


    constructor(
        private appState: ApplicationStateService,
        private router: Router,
        private page: Page,
        private hopService: HopService,

    ) {
        this.page.actionBarHidden = true;
        this.fieldAgent = this.appState.fieldAgent;
        this.showAdminDetails = this.fieldAgent.designation === DesignationType.Manager || this.fieldAgent.designation === DesignationType.OperationAdmin;
    }

    async ngOnInit(): Promise<void> {
        this.isLoading = true;
        try {
            this.hops = this.mainHops = await this.getHops();
            this.appState.hopsList = this.hops;
        } catch (error) {
            this.hops = this.mainHops = [];
        } finally {
            this.isLoading = false;
        }
    }

    async getHops(): Promise<TripHopMappedResponse[] | []> {
        try {
            const filters: HopFilters = {
                tripId: this.appState.isNavigatedFrom === NavigatedFrom.Trip ? this.appState.tripId : '',
                agentId: this.appState.isNavigatedFrom === NavigatedFrom.Non_Trip ? this.fieldAgent.id : '',
                pointId : '',
                pageSize: 100,
                pageNum: 1
            };

            return await this.hopService.getHopsByFilters(filters);
        } catch (error) {
            console.log("Error in getHops ::::: ", error);
            return [];
        }
    }

    navigateToHopDetails(hop: TripHopMappedResponse) {
        this.appState.hop = hop;
        this.router.navigate(['/hop-details']);
    }

    openUrl(lat: number, long: number) {
        utils.openUrl(`https://maps.google.com/maps?q=${lat},${long}`);
    }

    contactUser(mobileNumber: string) {
        TNSPhone.dial(mobileNumber, true);
    }

    searchDebounce(inputValue: string) {
        inputValue = inputValue.trim();
        this.maxInputLength = validateOnlyNumbers(inputValue) ? 10 : 100;
        this.searchHops(inputValue);
    }

    async searchHops(searchText: string) {
        try {
            if (containsSpecialChars(searchText) && !searchText.startsWith('0')) {
                showToast("Search Valid Text or Mobile Number.");
                return;
            }

            if (validateSpecialCharacters(searchText)) {
                showToast("Search Either By Business Name or Mobile Number.");
                return;
            }

            if (validateText(searchText)) {
                if (searchText.length > 1 && searchText.length != 0) {
                    if (searchText.length < 2) {
                        showToast("At least 2 letters are required for searching the Business name.");
                        return;
                    }
                    this.isLoading = true;
                    this.hops = this.searchHopMobileNumberAndBusinessName(searchText, true);
                    return;
                }
            }

            if (validateOnlyNumbers(searchText) && !searchText.startsWith('0')) {
                if (searchText.length > 8) {
                    if (searchText.length !== 10 && searchText.length > 8 && searchText !== '0') {
                        showToast("Please Enter 10 Digit Mobile Number.");
                        return;
                    }

                    this.isLoading = true;
                    this.hops = this.searchHopMobileNumberAndBusinessName(searchText, false);
                    return;
                }
            }
            if (searchText.trim() === '') {
                this.hops = this.mainHops;
                return;
            }
        } catch (error) {
            this.hops = this.mainHops;
        } finally {
            this.isLoading = false;
        }
    }

    private searchHopMobileNumberAndBusinessName(searchText: string, isBusinessNameSearch: boolean): TripHopMappedResponse[] {
        return this.mainHops.filter(hop =>
            isBusinessNameSearch
                ? hop.pointBusinessName.toLowerCase().includes(searchText.toLowerCase())
                : hop.pointMobileNumber.includes(searchText)
        );
    }

    clearSearchText() {
        this.searchText = "";
        this.hops = this.mainHops;
    }


}