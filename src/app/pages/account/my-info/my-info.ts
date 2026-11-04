import { Component, NgZone } from "@angular/core";
import { NavigationExtras, Router } from "@angular/router";
import { ApplicationStateService, showSuccess, showWarning, webViewSrcAssets } from '../../../../app/common';
import { Page } from "@nativescript/core";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { FooterBarComponent } from "../../../../app/shared/footer-bar/footer-bar";
import { SubFooterComponent } from "../../../../app/shared/sub-footer/sub-footer-bar";
import { UIService } from "../../../../app/services/ui-service";
import { UserService } from "~/app/services/user.service";
import { HopService } from "~/app/services/hop.service";


@Component({
    moduleId: module.id,
    selector: "my-info",
    templateUrl: "my-info.html",
    standalone: true,
    imports: [NativeScriptCommonModule, FooterBarComponent, SubFooterComponent],
    schemas: [NO_ERRORS_SCHEMA]
})

export class MyInfoComponent {
    name: string;
    mobileNumber: any;
    subFooter: boolean;
    isLoading: boolean = false;

    constructor(
        private router: Router,
        private page: Page,
        private uiService: UIService,
        public appState: ApplicationStateService,
        private userService: UserService,
        private hopService: HopService
    ) {
    }
    async ngOnInit() {
        this.page.actionBarHidden = true;
        this.name = this.appState?.fieldAgent?.name || "Not Avaliable";
        this.mobileNumber = this.appState?.fieldAgent?.mobileNumber || "Not Avaliable";
        this.subFooter = this.appState.subFooter;

    }
    logout() {
        this.uiService.showBottomSheet({ type: 10001 }, () => console.log('logged out'))
    }

    profile() {
        this.router.navigate(['/profile']);
    }


    contactUs() {
        this.router.navigate(['/contact-us']);
    }

    navigate(viewId: number) {
        const navigationExtras: NavigationExtras = {
            queryParams: webViewSrcAssets[viewId],
        };
        this.router.navigate(['/web-view'], navigationExtras);
    }




    async optimizeRoute() {
        this.isLoading = true;

        try {
            const location = await this.userService.getCurrentLocation();

            if (!location.isEnableLocation) {
                showWarning("Warning", "Please enable your location");
                return;
            }
            if (!location.lat || !location.long) {
                showWarning("Warning", "Please enable your location");
                return;
            }

            if (location.isMockLocation) {
                showWarning("Warning", "You are using Fake GPS app. Please uninstall it and try again.");
                return;
            }
            const payLoad = {
                point_lat: +location.lat,
                point_lng: +location.long,
                deliveryAgentId: this.appState.fieldAgent.id
            }

            const response = await this.hopService.optimizeRoute(payLoad);

            if (response) {
                showSuccess("Success", "Route Optimized Successfully, Please check in Hops List", "Ok");
            } else {
                showWarning("Warning", "Something Went Wrong", "Please try again later");
            }

        } catch (error) {
            showWarning("Warning", "Something Went Wrong", "Please try again later");
        } finally {
            this.isLoading = false;
        }


    }

}
