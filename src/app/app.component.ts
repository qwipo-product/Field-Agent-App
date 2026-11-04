import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { Application, Device, Color, iOSApplication, ApplicationEventData } from "@nativescript/core";
import { SnackBar, SnackBarOptions } from "@nstudio/nativescript-snackbar";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription } from "rxjs";
import * as connectivity from "@nativescript/core/connectivity";
import { isIOS, isAndroid } from "~/app/utils";
import { ReturnRepository } from "./store/return.repository";
import { ApplicationStateService, HopStatus, PointMode, PointType } from "./common";
import { CommonModule } from "@angular/common";
import { PageRouterOutlet } from "@nativescript/angular";
import { filter } from 'rxjs/operators';
import { exit } from "nativescript-exit";
import * as dialogs from "@nativescript/core/ui/dialogs";
import { HopService } from "./services/hop.service";
import { UIService } from "./services/ui-service";
import { setString } from "@nativescript/core/application-settings";
import { UserService } from "./services/user.service";
import { FieldAgent } from "./entities";
import { FieldAgentService } from "./services/fieldagent.service";


@Component({
    moduleId: module.id,
    selector: "ns-app",
    templateUrl: "app.component.html",
    imports: [PageRouterOutlet, CommonModule],
    schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
    providers: [],
})
export class AppComponent implements OnInit, OnDestroy {
    private linkSubscription: Subscription;
    private currentRoute: string = '';
    private routerSubscription: Subscription;
    private backButtonCallback: any;

    isLoading : boolean;

    constructor(
        private router: Router,
        private returnRepository: ReturnRepository,
        private hopService: HopService,
        private appState: ApplicationStateService,
        private uiService: UIService,
        private userService : UserService,
        private fieldAgentService : FieldAgentService,


    ) { }

    ngOnInit(): void {
        this.startConnectionMonitoring();
        this.registerAppEvents();
        this.initBackEvents();
    }

    private startConnectionMonitoring(): void {
        connectivity.startMonitoring((newConnectionType: number) => {
            if (newConnectionType === connectivity.connectionType.none) {
                const snackbar = new SnackBar();
                snackbar.action(this.getInactiveConnectionOptions()).then();
            }
        });
    }

    private getInactiveConnectionOptions(): SnackBarOptions {
        return {
            actionText: "Check Connection",
            actionTextColor: "#ff4081",
            snackText: "Internet Connection Lost.",
            hideDelay: 4000,
            textColor: "#ffffff",
            backgroundColor: "#000000",
        };
    }

    private registerAppEvents(): void {
        if (isAndroid() && Device.sdkVersion >= "21") {
            Application.android.on(Application.AndroidApplication.activityCreatedEvent, (args: any) => {
                const activity = args.activity;
                const themeId = activity
                    .getResources()
                    .getIdentifier("AppTheme", "style", activity.getPackageName());
                activity.setTheme(themeId);

                // Set status bar color after theme is applied
                setTimeout(() => {
                    if (activity && !activity.isFinishing()) {
                        const window = activity.getWindow();
                        if (window) {
                            window.setStatusBarColor(new Color("#000000").android);
                        }
                    }
                }, 0);
            });
        }

        const appEvents = [
            Application.launchEvent,
            Application.suspendEvent,
            Application.resumeEvent,
            Application.lowMemoryEvent,
        ];

        appEvents.forEach((event) =>
            Application.on(event, (args: ApplicationEventData) => this.handleAppEvent(args, event))
        );

        if (isAndroid()) {
            this.setupAndroidHandlers();
        } else if (isIOS()) {
            this.setupIOSHandlers();
        }
    }

    private async setupAndroidHandlers() {
        Application.android.on(Application.AndroidApplication.activityResumedEvent, async (args) => {
            const loggedInUser: string | null = this.userService.loggedInUser();
            const fieldAgent : FieldAgent = await this.fieldAgentService.userByMobileNumber(loggedInUser);
            this.appState.fieldAgent = fieldAgent;
            const cacheReturnData = await this.returnRepository.getAllReturns();

            if (cacheReturnData.length > 0) {
                const hopData = await this.hopService.getHopSummary(cacheReturnData[0].hopId);
                if (hopData != null) {
                    const hopStatus = hopData?.hopStatus;
                    if (hopStatus === HopStatus.NotStarted) {
                        this.appState.hop = hopData//this.appState.hopsList.filter((c)=> c.hopId == cacheReturnData[0].hopId)[0];
                        this.router.navigate(['/hop-details']);
                    }

                }
            }

        });

        Application.android.on(Application.AndroidApplication.activityStoppedEvent, (args) => {

        });
    }

    private setupIOSHandlers(): void {
        const iosApp = Application.ios as iOSApplication;

        iosApp.on(UIApplicationDelegate.prototype.applicationDidFinishLaunchingWithOptions.name, (args) => {
        });

        iosApp.on(UIApplicationDelegate.prototype.applicationDidBecomeActive.name, (args) => {

        });

        iosApp.on(UIApplicationDelegate.prototype.applicationDidEnterBackground.name, (args) => {
        });
    }

    private async handleAppEvent(args: ApplicationEventData, eventType: string): Promise<void> {
        if (args.ios || args.android) {
        }
    }

    ngOnDestroy(): void {
        this.linkSubscription?.unsubscribe();
        [Application.launchEvent, Application.suspendEvent, Application.resumeEvent, Application.lowMemoryEvent].forEach((event) =>
            Application.off(event)
        );
    }




    private initBackEvents() {
        this.routerSubscription = this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: NavigationEnd) => {
            this.currentRoute = event.urlAfterRedirects;
            console.log("Updated this.currentRoute:", this.currentRoute);
            setString("currentRoute", this.currentRoute);
        });

        if (isAndroid()) {
            this.backButtonCallback = (data) => this.onBackPressed(data, this.currentRoute);
            Application.android.on(
                Application.AndroidApplication.activityBackPressedEvent,
                this.backButtonCallback
            );
        }
    }

    private async onBackPressed(data: any, currentNavigationRoute: string) {
        try {
            data.cancel = true;
            const currentRoute = currentNavigationRoute ? currentNavigationRoute.split("?")[0] : "";
            let routeChanged = true;
            switch (currentRoute) {
                case "/mobile-number-component": {
                    exit();
                    break;
                }
                case "/mobile-otp-component": {
                    this.router.navigate(['/mobile-number-component']);
                    break;
                }

                case "/trip-list": {
                    if (this.appState.isBottomSheetOpen) {
                        this.uiService.closeRoute(['/trip-list']);
                        data.cancel = true;
                        return;
                    } else {
                        this.router.navigate(['/my-info']);
                    }
                    routeChanged = false;
                    break;
                }

                case "/profile": {
                    this.router.navigate(['/my-info']);
                    routeChanged = false;
                    break;
                }

                case "/my-info": {

                    if (this.appState.isBottomSheetOpen) {
                        this.uiService.closeRoute(['/my-info']);
                        data.cancel = true;
                        return;
                    }else{
                        const options = {
                            message: "Do you want to exit from Qwipo?",
                            okButtonText: "Yes",
                            cancelButtonText: "No"
                        };
                        dialogs.confirm(options).then((result: boolean) => {
                            if (result) {
                                exit();
                            }
                        });
                        routeChanged = false;
                        break;
                    }
                }
                case "/hop-list": {
                    if (this.appState.isBottomSheetOpen) {
                        this.uiService.closeRoute(['/hop-list']);
                        data.cancel = true;
                        return;
                    } else {
                        this.router.navigate(['/my-info']);
                    }
                    routeChanged = false;
                    break;
                }
                case "/hop-details": {
                    const storeCache = await this.returnRepository.getReturnById(this.appState.hop?.hopId);
                    if (storeCache != undefined && this.appState.hop?.pointMode == PointMode.DELIVERY && this.appState.hop?.pointType == PointType.CUSTOMER) {
                        if (this.appState.isBottomSheetOpen) {
                            this.uiService.closeRoute(['/hop-details']);
                            data.cancel = true;
                            return;
                        }else{
                            this.uiService.showBottomSheet({ type: 10007 }, (res) => {
                                this.appState.isBottomSheetOpen = false;
                                if (res) {
                                    this.returnRepository.deleteCacheReturnByHopId(this.appState.hop?.hopId);
                                    this.appState.isHopDetailsPage = true;
                                    this.router.navigate(['/trip-details']);
                                }
                            });
                        }
                    } else {

                        if (this.appState.isBottomSheetOpen) {
                            this.uiService.closeRoute(['/hop-details']);
                            data.cancel = true;
                            return;
                        } else {
                            this.appState.isHopDetailsPage = true;
                            this.router.navigate(['/trip-details']);
                        }
                    }
                    routeChanged = false;
                    break;
                }
                case "/trip-details": {
                    if (this.appState.isBottomSheetOpen) {
                        this.uiService.closeRoute(['/trip-details']);
                        data.cancel = true;
                        return;
                    } else {
                        this.router.navigate(['/trip-list']);
                    }
                    routeChanged = false;
                    break;
                }
            }
        } catch (error) {
            console.log("error:::", error);
        }

    }

}
