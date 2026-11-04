import { HopService } from './../../../services/hop.service';
import { AuthService } from './../../../services/auth.service';
import { UserService } from './../../../services/user.service';
import { Component, NO_ERRORS_SCHEMA, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { Page } from "@nativescript/core/ui/page";
import { ApplicationStateService } from "../../../../app/common/application-state-service";
import * as appversion from "@nativescript/appversion";
import { gte as newerVersionCheck } from "semver";
import { isAndroid } from "../../../../app/utils/platform";
import { AppMinVersion } from "../../../../app/entities/app-setting-response.model";
import { FieldAgent } from "../../../../app/entities";
import { FieldAgentService } from "../../../../app/services/fieldagent.service";
import { AppSettingService } from "../../../../app/services/app-settings.service";
import { DesignationType, HopStatus, UserStatus } from '../../../common/enums';
import { ReturnRepository } from "../../../../app/store/return.repository";

@Component({
    moduleId: module.id,
    selector: "login",
    templateUrl: "login.html",
    standalone: true,
    imports: [NativeScriptCommonModule],
    schemas: [NO_ERRORS_SCHEMA],
})
export class LoginComponent implements OnInit {

    showLoading : boolean = false;

    constructor(
        private page: Page,
        private router: Router,
        private appState: ApplicationStateService,
        private userService : UserService,
        private fieldAgentService : FieldAgentService,
        private appSettingService : AppSettingService,
        private authService : AuthService,
        private hopService : HopService,
        private returnRepository : ReturnRepository

    ) {
        this.page.actionBarHidden = true;
    }


    async ngOnInit(): Promise<void> {

        this.showLoading = true;

		const loggedInUser: string | null = this.userService.loggedInUser();
        if (loggedInUser) {
            const fieldAgent : FieldAgent = await this.fieldAgentService.userByMobileNumber(loggedInUser)
            await this.navigateAfterVerification(fieldAgent)
        }else {
          this.router.navigate(['/mobile-number-component']);
        }

    }

    async navigateAfterVerification(fieldAgent: FieldAgent) {
        try {
            await this.appSettingService.getAppSettings();
            const appVersion = await appversion.getVersionName();
            this.appState.deviceAppVersion = appVersion;
            const fetchAppMinVersion = this.getMinOrderVersion(this.appState?.appSettings?.appMinVersion);
            const isOldVersion = !newerVersionCheck(appVersion, fetchAppMinVersion);
            this.userService.setLoggedInNumber(fieldAgent.mobileNumber);
            this.appState.fieldAgent = fieldAgent;
            if (isOldVersion) {
                this.showLoading = false;
                this.router.navigate(['/app-version-check']);
                return;
            }
			await this.authService.generateApiToken(fieldAgent.id);
            if (+fieldAgent.status == UserStatus.Active) {
                this.navigateActiveFieldAgent(fieldAgent);
            } else {
                this.showLoading = false;
                this.router.navigate(['/greeting']);
                return;
            }
        } catch (error) {
            console.log('Navigation verification error:', error);
            this.showLoading = false;
            this.router.navigate(['/launch']);
        }
    }


	private async navigateActiveFieldAgent(fieldAgent: FieldAgent) {
        let route: string[] = ['/trip-list'];

        if (
            fieldAgent?.designation === DesignationType.DeliveryBoy ||
            fieldAgent?.designation === DesignationType.Driver
        ) {
            route = ['/hop-list'];
        }

        try {

        const cacheReturnData = await this.returnRepository.getAllReturns();
            if (cacheReturnData.length > 0) {
                const hopData = await this.hopService.getHopSummary(cacheReturnData[0].hopId);

                if (hopData != null) {
                    const hopStatus = hopData?.hopStatus;
                    if (hopStatus === HopStatus.NotStarted) {
                        this.appState.hop = hopData;
                        route = ['/hop-details'];
                    }
                }
            }

            // Navigate to the determined route
            this.router.navigate(route);
        } catch (error) {
            console.error('Error during navigation:', error);
            this.router.navigate(['/mobile-number-component']);
        }
    }

    private getMinOrderVersion(appMinVersion: AppMinVersion) {
        const { android, ios } = appMinVersion;
        return isAndroid() ? android.toString() : ios.toString();
    }


}
