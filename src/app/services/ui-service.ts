import {
    Injectable,
    Injector,
    NgZone,
    ApplicationRef,
    ComponentRef,
} from "@angular/core";
import { generateNativeScriptView } from "@nativescript/angular";
import { BottomsheetComponent } from "../../app/shared/bottomsheet/bottomsheet.component";
import { View, CoreTypes } from "@nativescript/core";
import { GenericParams } from "../tokens";
import {
    getRootLayout,
    RootLayoutOptions,
    ShadeCoverOptions,
    TransitionAnimation,
} from "@nativescript/core/ui/layouts/root-layout";
import { ApplicationStateService } from "../common";
import { Router } from "@angular/router";
import { PaymentBottomSheetComponent } from "../pages/delivery/payment-bottom-sheet/payment-bottom-sheet.component";
import { ReturnsBottomSheetComponent } from "../pages/delivery/returns-bottom-sheet/returns-bottom-sheet.component";
import { OrderModifyBottomSheetComponent } from "../pages/delivery/order-modify-bottom-sheet/order-modify-bottom-sheet.component";
import { ReAttemptComponent } from "../shared/re-attempt/re-attempt.component";

export const DEFAULT_ANIMATION_CURVE = CoreTypes.AnimationCurve.cubicBezier(
    0.17,
    0.89,
    0.24,
    1.11
);

@Injectable({
    providedIn: "root",
})
export class UIService {
    constructor(
        private zone: NgZone,
        private injector: Injector,
        private appState: ApplicationStateService,
        private router: Router
    ) {}

    private callbackI;
    private _bottomSheetView;
    isBottomSheetOpen = false;

    private openBottomSheet(viewComponent: any, input: any, callback: any) {
        this.callbackI = callback;

        this.getView(viewComponent, input).then((v) => {
            this._bottomSheetView = v;

            const shadeCover: ShadeCoverOptions = {
                color: "#000",
                opacity: 0.7,
                tapToClose: false,
            };

            const options: RootLayoutOptions = {
                shadeCover,
                animation: {
                    enterFrom: {
                        translateY: 500,
                        duration: 300,
                        curve: DEFAULT_ANIMATION_CURVE,
                    },
                    exitTo: {
                        translateY: 500,
                        duration: 300,
                        curve: DEFAULT_ANIMATION_CURVE,
                    },
                },
            };

            getRootLayout()
                .open(this._bottomSheetView, options)
                .then(() => {
                    this.isBottomSheetOpen = true;
                    this.appState.isBottomSheetOpen = this.isBottomSheetOpen;
                })
                .catch((err) => {
                    console.log("error opening", err);
                });
        });
    }

    showBottomSheet(input: any = {}, callback) {
        this.openBottomSheet(BottomsheetComponent, input, callback);
    }
    showBottomPayments(input: any = {}, callback) {
        this.openBottomSheet(PaymentBottomSheetComponent, input, callback);
    }
    showReturnBottomSheet(input: any = {}, callback) {
        this.openBottomSheet(ReturnsBottomSheetComponent, input, callback);
    }
    showModifyOrderBottomSheet(input: any = {}, callback) {
        this.openBottomSheet(OrderModifyBottomSheetComponent, input, callback);
    }
    showReAttemptBottomSheet(input: any = {}, callback) {
        this.openBottomSheet(ReAttemptComponent, input, callback);
    }

    closeRoute(routeName) {
        if (this.isBottomSheetOpen) {
            getRootLayout().closeAll();
            this.appState.isBottomSheetOpen = false;
            this.router.navigate(routeName);
        } else {
            return;
        }
    }

    bringBottomSheetToFront(): Promise<void> {
        return getRootLayout().bringToFront(this._bottomSheetView);
    }

    closeBottomSheet(data): void {
        if (this._bottomSheetView) {
            getRootLayout()
                .close(this._bottomSheetView)
                .then(() => {
                    this.destroyNgRef(this._bottomSheetView);
                    this.callbackI(data);
                    console.log("closed");
                })
                .catch((err) => {
                    console.log("error closing", err);
                });
        }
    }

    closeAll(): void {
        getRootLayout().closeAll();
    }

    destroyNgRef(view: View) {
        if ((<any>view).__ngRef) {
            ((<any>view).__ngRef as ComponentRef<View>).destroy();
        }
    }

    getView(component, input?: any): Promise<View> {
        return new Promise((resolve) => {
            const injector = Injector.create({
                providers: [
                    { provide: GenericParams, useValue: input },
                    { provide: "inputData", useValue: input }, // Optional: You can also provide a custom token for the input data
                ],
                parent: this.injector,
            });
            const cmpRef = generateNativeScriptView(component, {
                injector,
            });
            (<any>cmpRef.firstNativeLikeView).__ngRef = cmpRef.ref;
            resolve(cmpRef.firstNativeLikeView);
        });
    }
}
