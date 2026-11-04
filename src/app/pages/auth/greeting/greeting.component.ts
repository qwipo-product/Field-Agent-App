import { Component, OnInit } from "@angular/core";
import { Page } from "@nativescript/core/ui/page";
import { ApplicationStateService } from "../../../../app/common";
import * as TNSPhone from 'nativescript-phone';
import { ContactInfo } from "../../../../app/entities/app-setting-response.model";
import { FieldAgent } from "../../../../app/entities";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { SubFooterComponent } from "../../../../app/shared/sub-footer/sub-footer-bar";
import { UIService } from "~/app/services/ui-service";

@Component({
    moduleId: module.id,
    selector: "greeting-component",
    templateUrl: "greeting.component.html",
    standalone: true,
    imports: [NativeScriptCommonModule,SubFooterComponent],
    schemas: [NO_ERRORS_SCHEMA]
})
export class GreetingsComponent implements OnInit {
    contactSettings: ContactInfo;
    qwipoContactNumber: string;
    opsUser: FieldAgent


    constructor(
        private page: Page,
        private uiService: UIService,
        private appState: ApplicationStateService,
    ) {
        this.page.actionBarHidden = true;
    }

    ngOnInit() {
        this.contactSettings = this.appState.appSettings.contact;
        this.qwipoContactNumber = this.contactSettings?.number;
        this.opsUser = this.appState.fieldAgent

    }

    contactUser(mobileNumber: string): void {
        TNSPhone.dial(mobileNumber, true);
    }

   
}
