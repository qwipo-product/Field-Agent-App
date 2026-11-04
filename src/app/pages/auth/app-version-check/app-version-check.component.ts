import { Component, OnInit } from "@angular/core";
import { Page } from "@nativescript/core/ui/page";
import { isAndroid, isIOS } from "@nativescript/core";
import * as utils from "@nativescript/core/utils";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { SubFooterComponent } from "../../../../app/shared/sub-footer/sub-footer-bar";

@Component({
    moduleId: module.id,
    selector: "app-version-check",
    templateUrl: "app-version-check.component.html",
    standalone: true,
    imports: [NativeScriptCommonModule,SubFooterComponent],
    schemas: [NO_ERRORS_SCHEMA]
})
export class AppVersionCheckComponent implements OnInit {
    isAccepted = true;

    constructor(
        private page: Page,
    ) {
        this.page.actionBarHidden = true;
    }

    ngOnInit() {
        // Initialization logic, if any
    }

    goToPlayStore() {
        if (isAndroid) {
            utils.openUrl("https://play.google.com/store/apps/details?id=com.qwipo.fa");
        }
        if (isIOS) {
            utils.openUrl("https://itunes.apple.com/us/app/id1444169919");
        }
    }

}
