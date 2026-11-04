import { Component, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { Router } from "@angular/router";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { ApplicationStateService } from "~/app/common";

@Component({
    moduleId: module.id,
    selector: "sub-footer-bar",
    templateUrl: "sub-footer-bar.html",
    standalone: true,
    imports: [NativeScriptCommonModule],
    schemas: [NO_ERRORS_SCHEMA]
})
export class SubFooterComponent {


    @Input() isSelected: number;


    showGreetingScreen: boolean;
    subFooter: boolean;

    constructor(
        private router: Router,
        private appState: ApplicationStateService

    ) {
    }

    ngOnInit() {
        this.appState.subFooter = true;

        this.showGreetingScreen = false;

    }


    navigationToAppVersion() {
        this.router.navigate(['/app-version-check']);

    }

    navigationToGreeting() {
        this.router.navigate(['/greeting']);
    }


    navigationToInfo() {
        this.router.navigate(['/my-info']);
    }
}
