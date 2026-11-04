import { Component, Inject, NgZone, NO_ERRORS_SCHEMA, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { IHopOrders, TripHopMappedResponse } from "~/app/entities/hop";
import { TNSFancyAlert } from "@nstudio/nativescript-fancyalert";
import {
    ApplicationStateService,
    GateWayType,
    LocationType,
    PaymentOptions,
    PaymentType,
    PaysharpPaymentStatus,
    getCollectionSubFilters,
    getPaymentCollectionFilters,
} from "../../../../app/common";
import { GenericParams } from "../../../../app/tokens";
import { NativeScriptCommonModule, NativeScriptFormsModule } from "@nativescript/angular";
import { UIService } from "~/app/services/ui-service";
import { PaymentService } from "~/app/services/payment.service";
import { ReactiveFormsModule } from "@angular/forms";
@Component({
    selector: "payment-bottom-sheet",
    templateUrl: "payment-bottom-sheet.component.html",
    standalone: true,
    imports: [NativeScriptCommonModule,ReactiveFormsModule,NativeScriptFormsModule],
    schemas: [NO_ERRORS_SCHEMA]
})
export class PaymentBottomSheetComponent implements OnInit {
    type: number;
    popupHeight = 700;

    amount: number;
    orderOutStandingAmount: number;
    hopOrders: IHopOrders[] = [];
    cashAmount: number;
    onlinePaymentAmount: number;

    mainFilters: Array<any> = [];
    subFilters: { id: number; name: string; isSelected: boolean }[];
    selectedFilter: number;
    isQrScreen: boolean = false;
    isLoading: boolean = false;
    qrCodeData: any;
    paymentStatus: {
        amount: number;
        status: string;
        message: string;
        icons: string;
    } = { amount: 0, status: "null", message: "", icons: "" };
    timer: { mins: number; sec: number } = {
        mins: 0,
        sec: 0,
    };
    clearInterval: boolean = false;
    isStatusShow: boolean = false;
    isPending: boolean;
    isVffAgent: boolean=false;
    vendor:any;

    constructor(
        private uiService: UIService,
        private appState: ApplicationStateService,
        private router: Router,
        private paymentService: PaymentService,
        private zone: NgZone,
        @Inject(GenericParams)
        private input: {
            type: number;
            from: string;
            paymentInfo: {
                cashAmount: number;
                ordersOutStandingAmount: number;
                onlineAmount: number;
                orders: IHopOrders[];
                vendor:any
            };
        }
    ) {

        const { fieldAgent } = this.appState;
        const { locationInfo } = fieldAgent || {};
        this.isVffAgent = +locationInfo?.type === LocationType.Vendor
        this.vendor = this.input.paymentInfo.vendor;
        this.popupHeight = 650;
        this.mainFilters = getPaymentCollectionFilters();
        this.onFilterChange();
        this.amount = this.input.paymentInfo.ordersOutStandingAmount || 0;
        this.orderOutStandingAmount =
            this.input.paymentInfo.ordersOutStandingAmount || 0;
        this.hopOrders = this.input.paymentInfo.orders || [];
        this.cashAmount = this.input.paymentInfo.cashAmount;
        this.onlinePaymentAmount = this.input.paymentInfo.onlineAmount;


    }

    async ngOnInit() {

    }

    onFilterChange() {
        this.subFilters = getCollectionSubFilters(this.vendor);
        this.selectedFilter = this.subFilters[0].id;
    }

    updateSelectedSubFilter(selectedId: number) {
        this.subFilters = getCollectionSubFilters(this.vendor).map((subFilter) => ({
            ...subFilter,
            isSelected: subFilter.id === selectedId,
        }));
    }

    close(data): void {
        this.uiService.closeBottomSheet(data);
    }

    selectSubFilter(subFilter: any) {
        this.updateSelectedSubFilter(subFilter.id);
    }

    isSubFilterSelected(subFilterId: number): boolean {
        return this.subFilters.some(
            (filter) => filter.isSelected && filter.id === subFilterId
        );
    }

    async paymentsStatus() {
        try {
            this.isLoading = true;
            const response: any =
                await this.paymentService.getPaymentGatewayStatus(
                    this.qrCodeData.request_id,
                    this.qrCodeData.payment_id
                );

            this.paymentStatus = {
                amount: +response?.amount,
                status: PaysharpPaymentStatus[response?.status],
                message:
                    this.mapToStatusIcons(response?.status)?.message || "N/A",
                icons: this.mapToStatusIcons(response?.status).icon || "",
            };
            this.isPending = true;
            if (response && response.status == "PENDING") {
                this.isPending = false;
                // this.qrCodeData = null;
            }
            this.isStatusShow = true;
            this.isLoading = false;
        } catch (error) {
            console.log("Error In paymentStatus :::: ", error);
            const message = "Something went wrong try after some time.";
            TNSFancyAlert.showWarning("Oya...!", message, "Okay");
            this.isLoading = false;
        }
    }

    async generateQr() {
        if (!this.amount) {
            this.showMessage("You Haven't Entered Anything");
            return false;
        }

        if (this.amount < 0) {
            this.showMessage("Negative Values Should Not be Entered");
            return;
        }

        if (this.amount < 10) {
            alert("Please enter a value greater than or equal to 10");
            return;
        }



        if (this.amount > this.orderOutStandingAmount) {
            this.showMessage("Entered Amount Exceeds Due");
            return;
        }
        try {
            this.isLoading = true;
            this.clearInterval = false;
            const payLoad = this.mapToGenerateQrPayLoad(
                this.appState.hop,
                this.hopOrders
            );

            console.log("payLoad ::: ", payLoad);

            const response: any = await this.paymentService.generateQrPaySharp(
                payLoad
            );

            this.isLoading = false;

            this.zone.run(() => {
                this.qrCodeData = response;
                this.isQrScreen = this.qrCodeData?.urls?.qr_code.length > 0;
                this.countDown();
            });

            if (this.qrCodeData?.urls?.qr_code.length === 0) {
                this.isLoading = false;
                const message = "Something went wrong try after some time.";
                TNSFancyAlert.showWarning("Oya...!", message, "Okay");

                return;
            }
            this.zone.run(() => (this.isLoading = false));
        } catch (error) {
            console.log("error ::: generateQr", error);
            this.zone.run(() => (this.isLoading = false));
            const message = "Something went wrong try after some time.";
            TNSFancyAlert.showWarning("Oya...!", message, "Okay");
        }
    }

    private mapToStatusIcons(status: number) {
        return {
            SUCCESS: {
                icon: `~/images/success.png`,
                message: `Transaction Successful`,
            },
            FAILED: {
                icon: `~/images/cancel-icon.png`,
                message: `Transaction Failed`,
            },
            TIMEOUT: {
                icon: `~/images/clock.png`,
                message: `Transaction TimeOut`,
            },
            PENDING: {
                message: `Transaction Pending`,
            },
            EXPIRED: {
                icon: `~/images/expired.png`,
                message: `Transaction Expired`,
            },
        }[status];
    }

    private adjustOrderAmounts(orderData: IHopOrders[], dueAmount: number) {
        const adjustedOrders = [];
        const sortedData = orderData.filter(o => o.orderOutStandingAmount > 0).sort(
            (a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
        );
        let remainingDueAmount = dueAmount;

        for (let i = 0; i < sortedData.length; i++) {
            const order = sortedData[i];
            const adjustedAmount = Math.min(
                order.orderOutStandingAmount,
                remainingDueAmount
            );
            remainingDueAmount -= adjustedAmount;

            adjustedOrders.push({
                orderNumber: order.orderNumber,
                amount: adjustedAmount,
                orderDate: order.orderDate,
            });

            if (remainingDueAmount <= 0) {
                break;
            }
        }

        return adjustedOrders;
    }

    private mapToGenerateQrPayLoad(hop: TripHopMappedResponse, order: IHopOrders[]) {
        const parts = hop.pointAddress.split(",").map((part) => part.trim());
        return {
            customer: {
                id: hop.pointId,
                name: hop.pointName,
                mobileNumber: hop.pointMobileNumber,
                email: "customer@example.com",
                address: {
                    addressLine1: parts[0],
                    addressLine2: parts[1],
                    city: parts[0],
                    state: parts[4],
                    landmark: "",
                    pincode: parts[2],
                    country: parts[3],
                },
            },
            orders: this.adjustOrderAmounts(order, this.amount),
            amount: +this.amount,
            gateway: GateWayType.PaySharp,
            vendorId: order[0].vendorId,
            paymentType: PaymentType.QrCode,
        };
    }

    addCashEntry(amount: number) {
        if (amount == null) {
            this.showMessage("You Haven't Entered Anything");
            return false;
        }

        if (amount < 0) {
            this.showMessage("Negative Values Should Not be Entered");
            return;
        }

         if (amount > this.orderOutStandingAmount + +this.cashAmount) {
            this.showMessage("Entered Amount Exceeds Available Amount");
            return;
        }

        // // if (amount < this.orderOutStandingAmount + +this.cashAmount - 2) {
        // //     this.showMessage("Entered Amount Too Low ");
        // //     return;
        // // }

        // if (amount > this.orderOutStandingAmount + +this.cashAmount) {
        //     this.showMessage("Temp ");
        //     return;
        // }
        const inputObj = {
            amount: amount,
            paymentType: PaymentOptions.CashEntry,
        };

        this.close(inputObj);
    }

    sendPaymentReqToCustomer(amount: number) {
        try {
            if (!amount) {
                this.showMessage("You Haven't Entered Anything");
                return false;
            }

            if (amount < 0) {
                this.showMessage("Negative Values Should Not be Entered");
                return;
            }

            if (amount < 10) {
                alert("Please enter a value greater than or equal to 10");
                return;
            }

            if (amount > this.orderOutStandingAmount) {
                this.showMessage("Entered Amount Exceeds Due");
                return;
            }

            const inputObj = {
                amount: amount,
                paymentType: PaymentOptions.PaymentRequest,
            };

            this.close(inputObj);
        } catch (error) {
            console.log("sendNotificationToCustomer Error ::: ", error);
        }
    }

    showMessage(message: string) {
        TNSFancyAlert.showWarning("", message, "Okay");
    }

    private countDown(duration: number = 180) {
        this.paymentStatus = {
            amount: 0,
            status: "Expired",
            message: "",
            icons: "",
        };
        if (!isNaN(duration)) {
            let timer = duration;
            let minutes: number = 0;
            let seconds: number = 0;

            const interVal = setInterval(() => {
                minutes = Math.floor(timer / 60);
                seconds = Math.floor(timer % 60);

                minutes = minutes < 10 ? 0 + minutes : minutes;
                seconds = seconds < 10 ? 0 + seconds : seconds;
                // console.log(`Mins : ${minutes} : Sec ${seconds}`);
                this.zone.run(() => {
                    this.timer.mins = minutes;
                    this.timer.sec = seconds;
                });
                if (--timer < 0 || this.clearInterval) {
                    this.isPending = true;
                    timer = duration;
                    clearInterval(interVal);
                    this.makeQrCodeEmptyAfterTimeOut();
                }
            }, 1000);
        }
    }
    private makeQrCodeEmptyAfterTimeOut() {
        this.qrCodeData = {
            qrCode: "",
            paymentReqId: "",
        };
        this.qrCodeData = null;
        this.isLoading = false;
    }
}
