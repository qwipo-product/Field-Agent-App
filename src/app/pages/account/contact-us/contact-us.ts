import { Component, NO_ERRORS_SCHEMA } from "@angular/core";
import * as TNSPhone from 'nativescript-phone';
import { Page } from "@nativescript/core";
import * as utils from "@nativescript/core/utils";
import { Router } from "@angular/router";
import { ApplicationStateService } from "../../../../app/common/application-state-service";
import { NativeScriptCommonModule } from "@nativescript/angular";

@Component({
    moduleId: module.id,
    templateUrl: "contact-us.html",
    standalone : true,
    imports: [NativeScriptCommonModule],
    schemas: [NO_ERRORS_SCHEMA],
})

export class ContactUsComponent {
    contactEmail: string = "";
    contactNumber: string = "";
    contactMessage: string = "";

    constructor(
        private page: Page,
        private router: Router,
        private appState: ApplicationStateService,
       ) {
    }

    async ngOnInit() {
        this.page.actionBarHidden = true;
        this.contactEmail = this.appState.appSettings && this.appState.appSettings.contact && this.appState.appSettings.contact.email || "info@qwipo.com";
        this.contactMessage = this.appState.appSettings && this.appState.appSettings.contact && this.appState.appSettings.contact.message || "Contact us through this email ID.We will respond in 3 to 4 business days.";
        this.contactNumber = this.appState.appSettings && this.appState.appSettings.contact && this.appState.appSettings.contact.number || "";
    }

    openURL() {
        utils.openUrl("https://play.google.com/store/apps/details?id=com.qwipo.b2b")
    }
    contactUser(mobileNumber) {
        TNSPhone.dial(mobileNumber, true);
    }

    back() {
        this.router.navigate(['/my-info']);
    }


}
