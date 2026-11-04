import { Component, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { Router } from "@angular/router";
import { ApplicationStateService, DesignationType, NavigatedFrom } from "../../../app/common";
import { FieldAgent } from "../../../app/entities";
import { NativeScriptCommonModule, registerElement } from "@nativescript/angular";
registerElement('SVGImage', () => require('@sergeymell/nativescript-svg').SVGImage);

@Component({
    moduleId: module.id,
    selector: "footer-bar",
    templateUrl: "footer-bar.html",
    standalone: true,
    imports: [NativeScriptCommonModule,],
    schemas: [NO_ERRORS_SCHEMA]
})
export class FooterBarComponent {
    // tslint:disable-next-line: variable-name
    isAgent: boolean;
    fieldAgent: FieldAgent;
    showAdminDetails: boolean = false;
    @Input() isSelected: number;
    constructor(
        private router: Router,
        private appState: ApplicationStateService
    ) { }
    ngOnInit() {
        this.fieldAgent = this.appState.fieldAgent;
        this.showAdminDetails = this.fieldAgent.designation === DesignationType.Manager || this.fieldAgent.designation === DesignationType.OperationAdmin;
        this.isAgent = !this.showAdminDetails;
    }

    navigateTripList(){
        this.router.navigate(['/trip-list']);
    }

    navigateHopsList() {
        this.appState.isNavigatedFrom = NavigatedFrom.Non_Trip;
        this.router.navigate(['/hop-list']);
    }

    navigateAccount() {
        this.router.navigate(['/my-info']);
    }
}
