import { Component, NO_ERRORS_SCHEMA, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Page } from "@nativescript/core";
import { ApplicationStateService } from "../../../../app/common/application-state-service";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { FieldAgent } from "../../../entities/fieldAgent";
import { getFormattedAddress } from "~/app/common/utility";

@Component({
    standalone : true,
    moduleId: module.id,
    selector: "profile",
    templateUrl: "profile.html",
    imports: [NativeScriptCommonModule],
    schemas: [NO_ERRORS_SCHEMA],
})
export class ProfileComponent implements OnInit {
    fieldAgent : FieldAgent
    fieldAgentAddress: string = '';
    appVersion: string = '';

    constructor(
        private router: Router,
        private appState: ApplicationStateService,
        private page: Page
    ) {
        this.page.actionBarHidden = true;
        this.fieldAgent = this.appState.fieldAgent;
        this.fieldAgentAddress = getFormattedAddress(this.appState.fieldAgent);
        this.appVersion = this.appState.deviceAppVersion;
    }

    ngOnInit() {
    }

    myInfo() {
        this.router.navigate(['/my-info']);
    }
}
