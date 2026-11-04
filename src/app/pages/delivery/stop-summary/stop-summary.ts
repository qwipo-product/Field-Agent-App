import { FieldAgent } from "../../../../app/entities";
import { Component, NO_ERRORS_SCHEMA, OnInit, ViewContainerRef } from "@angular/core";
import { Router } from "@angular/router";
import { Page } from "@nativescript/core";
import { Action, ApplicationStateService, DesignationType, GenerateOptions, HopDownloadOptions, HopMainFilter, LocationType, MerchantBusinessType, OrderStatus, PaymentOptions, PointMode, PointType, showError, showSuccess, showWarning, TripSource, TripStatus } from "../../../../app/common";
import { HopFilters, HopItems, IHopOrders, QFFReturnSummery, StoreReturnOrderInput, TripHopMappedResponse, TripHopSummaryMappedResponse } from "../../../../app/entities/hop";
import { AdminHopFilter, TripListMappedResponse } from "../../../../app/entities/trip";
import { MESSAGE_QUEUE_TYPE } from "../../../../app/constants/db-path";
import { HopReturnItems, OrderReturn, OrderReturnApiInput, Resource, WholeOrderReturn } from "../../../../app/entities/returns";
import { HopReturnsCache, ReturnRepository } from "../../../../app/store/return.repository";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { UIService } from "../../../../app/services/ui-service";
import { OrderService } from "../../../../app/services/orders.service";
import { HopService } from "../../../../app/services/hop.service";
import { PaymentService } from "../../../../app/services/payment.service";
import { PdfService } from "../../../../app/services/pdf.service";
import { MessageQueueService } from "../../../../app/services/message-queue.service";
import { FieldAgentService } from "../../../../app/services/fieldagent.service";
import { ReturnsService } from "../../../../app/services/returns.service";
import { HopStatusLabelValueConverter } from "~/app/shared/value-converters/hop-status-label.pipe";
import { PointModeLabelValueConverter } from "~/app/shared/value-converters/point-mode-label.pipe";
import { UserService } from "~/app/services/user.service";
import { TNSFancyAlert } from "@nstudio/nativescript-fancyalert";
import { HopAttemptHistoryRequest } from "~/app/entities/hop-re-attempt";
import { AppSettingService } from "~/app/services/app-settings.service";
import { AppConfiguration } from "~/app/entities/app-setting-response.model";


@Component({
    selector: "stop-summary",
    templateUrl: "./stop-summary.html",
    standalone: true,
    imports: [NativeScriptCommonModule, HopStatusLabelValueConverter, PointModeLabelValueConverter],
    schemas: [NO_ERRORS_SCHEMA]
})
export class StopSummaryComponent implements OnInit {
    isLoading: boolean = false;
    isProducts: boolean = true;
    showOrderDetails: boolean = false;
    isSummary: boolean = false;
    showStopDetails: boolean = true;
    isSummaryActive: boolean = true;
    isProductsActive: boolean = false;
    isCompleted: boolean = false;
    // hopSummary: TripHopSummaryMappedResponse | null;
    showBtn: boolean = false;
    isVendorDrop: boolean;
    fieldAgent: FieldAgent;
    appSettings: AppConfiguration;
    hopItems: HopItems[] = [];
    hopOrders: IHopOrders[] = [];
    hopOrdersTotal: number;
    showRefreshing: boolean = false;
    showAdminDetails: boolean = false;
    storeReturnValue: HopReturnsCache | undefined;

    balance: number;
    customerDeliverySummary: {
        orderAmount: number;
        returnAmount: number;
        onlinePayment: number;
        cod: number;
        balance: number;
    };
    qffReturnHopSummary: QFFReturnSummery = {
        dispatchValue: 0,
        returnValue: 0,
        onlinePayment: 0,
        cash: 0,
        balance: 0,
    };





    hopSummary: TripHopSummaryMappedResponse | null;

    constructor(
        private router: Router,
        private page: Page,
        private uiService: UIService,
        private vcRef: ViewContainerRef,
        private orderService: OrderService,
        private appState: ApplicationStateService,
        private hopService: HopService,
        private paymentService: PaymentService,
        private pdfService: PdfService,
        private messageQueueService: MessageQueueService,
        private fieldAgentService: FieldAgentService,
        private returnRepository: ReturnRepository,
        private returnsService: ReturnsService,
        private userService: UserService,
        private appSettingService : AppSettingService,
    ) {
        this.page.actionBarHidden = true;
        this.fieldAgent = this.appState.fieldAgent;
        this.showAdminDetails = this.fieldAgent.designation === DesignationType.Manager || this.fieldAgent.designation === DesignationType.OperationAdmin;
    }

    async ngOnInit() {
        try {
            this.isLoading = true;
            this.appSettings = await this.appSettingService.getAppSettings();
            this.hopSummary = await this.hopService.getHopSummary(this.appState.hop.hopId);
            this.hopItems = await this.orderService.getHopItems(this.appState.hop.hopId);
            this.isVendorDrop = this.appState.hop?.source === TripSource.Vendor;
            this.hopOrders = this.mapToOrders(this.hopItems);
            if (this.appState.hop?.source === TripSource.Qwipo_Lite && this.hopSummary.pointMode === PointMode.RETURN && this.hopSummary.pointType === PointType.VENDOR) {
                this.qffReturnHopSummary = await this.hopService.getHopsQFFByTripId(this.hopSummary.tripId, this.hopSummary.pointId);
            }
            this.storeReturnValue = await this.returnRepository.getReturnById(this.appState.hop.hopId);
            if (this.hopSummary.pointMode === PointMode.DELIVERY && this.hopSummary.pointType === PointType.CUSTOMER) {
                await this.refreshCollections();
            }
        } catch (error) {
            showError("Error", "Failed to load trip details.", "Okay");
        } finally {
            this.isLoading = false;
        }
    }

    async refreshCollections() {
        try {
            this.isLoading = true;
            this.showRefreshing = true;
            this.hopSummary = await this.hopService.getHopSummary(this.appState.hop.hopId);
            this.calculateBalanceAmount();
        } catch (error) {
            showError("Error", "Something went wrong.", "Okay");
        } finally {
            this.showRefreshing = false;
            this.isLoading = false;
        }
    }

    private calculateBalanceAmount() {

        const totalStoreReturnAmount = this.storeReturnValue?.returnOrders ? this.calculateReturnItems(this.storeReturnValue.returnOrders) : 0;
        const returnProductsAmount = this.storeReturnValue ? totalStoreReturnAmount : this.hopSummary?.customerReturns ?? 0;
        const grossProductAmount = this.hopSummary?.dispatchValue ?? 0;
        const customerOnlinePayment = this.hopSummary?.onlinePayments ?? 0;
        const customerCod = this.hopSummary?.cashCollections ?? 0;
        const customerBalance = grossProductAmount - (+returnProductsAmount + customerOnlinePayment + customerCod);
        this.customerDeliverySummary = {
            orderAmount: +grossProductAmount,
            returnAmount: +returnProductsAmount,
            onlinePayment: +customerOnlinePayment,
            cod: +customerCod,
            balance: customerBalance === 0 ? 0 : +customerBalance.toFixed(2),
        };

    }

    async updateHopStatus(hopId: string, hopStatus: number, hopOtp: any) {
        try {
        this.isLoading = true;
       
        const isVendorToWarehouse = +this.fieldAgent?.locationInfo?.type === LocationType.Vendor && (this.hopSummary.pointType === PointType.VENDOR || this.hopSummary.pointType === PointType.WAREHOUSE);
        const isCustomerHop = this.hopSummary.pointType === PointType.CUSTOMER;

        if (isVendorToWarehouse) {
            await this.handleVendorToWarehouseHop(hopId, hopStatus);
            this.isLoading = false;
            return;
        }

        if (isCustomerHop && +this.fieldAgent?.locationInfo?.type === LocationType.Vendor) {
            await this.updateCustomerHopStatus(hopId, hopStatus + 1);
            this.isLoading = false;
            return;
        }

        if (this.appState.hop?.tripStatus === TripStatus.InProgress) {

            if (this.hopSummary.pointType === PointType.CUSTOMER && this.hopSummary.pointMode === PointMode.DELIVERY) {
                const distance=this.appSettings?.restrictions?.hopCloseDistance;
                const isDistanceRestricted=this.appSettings?.restrictions?.isHopCloseDistanceRestricted;
                if (isDistanceRestricted && !(await this.checkHopLocation(distance))) {
                    this.isLoading = false;
                    return;
                }
            }

            const inputObj = { id: hopId, status: hopStatus, otp: hopOtp };

            if (isCustomerHop) {
                await this.updateCustomerHopStatus(hopId, hopStatus + 1);
                this.isLoading = false;
            } else {
                this.isLoading = false;// WE ARE SETTING LOADING FALSE HERE BECAUSE WE ARE OPENING BOTTOM SHEET
                this.openBottomSheet(hopId, hopStatus, inputObj);
            }
        } else {
            this.isLoading = false;
            showWarning("Warning", "Trip is not yet started", "Okay")
        }
        } catch (error) {
            this.isLoading = false;
            console.error("Error updating hop status:", error);
            showError("Error", "Failed to update hop status.", "Okay");
        }
        finally{
            this.isLoading = false;
        }

    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const earthRadius = 6371;
        const dLat = this.degToRad(lat2 - lat1);
        const dLon = this.degToRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceInKm = earthRadius * c;
        const distanceInMeters = distanceInKm * 1000;

        return distanceInMeters;
    }

    private degToRad(deg: number): number {

        return deg * (Math.PI / 180);
    }

    private async handleVendorToWarehouseHop(hopId: string, hopStatus: number) {
        try {
            const response = await this.hopService.updateHopStatus(hopId, hopStatus + 1);
            if (response) {
                showSuccess("Success", "Hop Completed Successfully", "Okay");
                this.router.navigate(['/hop-list']);
            }
        } catch (error) {
            console.error("Error updating vendor to warehouse hop:", error);
            showError("Error", "Failed to update the hop status. Please try again.", "Okay");
        } finally {
            this.isLoading = false;
        }
    }

    async openBottomSheet(hopId: string, hopStatus: number, inputObj: any) {
        try {
            this.uiService.showBottomSheet(
                { type: 10003, items: inputObj },
                async (res: any) => {
                    if (!res) return;

                    try {
                        const response = await this.hopService.updateHopStatus(hopId, hopStatus + 1);
                        if (response) {
                            showSuccess("Success", "Hop Completed Successfully", "Okay");
                            this.router.navigate(['/hop-list']);
                        }
                    } catch (error) {
                        showError("Error", "Failed to update hop status.", "Okay");
                        console.error("Error updating hop status:", error);
                    }
                }
            );
        } catch (error) {
            showError("Error", "Something went wrong.", "Okay");
            console.error("Error opening bottom sheet:", error);
        }
    }


    goBack() {
        this.router.navigate(['/hop-list']);
    }

    async openCollectionBottomSheet() {


        const vendor = await this.paymentService.getVendorPaymentOptions(
            this.hopOrders[0].vendorId
        );

        const inputData = {
            cashAmount: +this.customerDeliverySummary.cod,
            ordersOutStandingAmount: +this.customerDeliverySummary.balance,
            onlineAmount: +this.customerDeliverySummary.onlinePayment,
            orders: this.hopOrders,
            vendor: vendor,
        };


        this.uiService.showBottomPayments(
            {
                type: 10004,
                paymentInfo: inputData,
            },

            async (res: { amount: number; paymentType: PaymentOptions }) => {
                if (res) {
                    if (!this.validatePayment()) {
                        return;
                    }
                    this.isLoading = true;
                    const ordersWithAdjustedAmounts = this.adjustOrderAmounts(
                        this.hopOrders,
                        res.amount
                    );

                    if (res.paymentType == PaymentOptions.PaymentRequest) {
                        const requestForPaymentObj = {
                            delivery_agent_id: this.appState.fieldAgent.id,
                            customer_id: this.hopSummary.pointId || "",
                            trip_id: this.appState.hop.tripId,
                            hop_id: this.appState.hop.hopId,
                            currency: "INR",
                            amount: res.amount,
                            orders: ordersWithAdjustedAmounts,
                        };
                        await this.paymentService.insertRequestForPayment(
                            requestForPaymentObj
                        );
                        this.isLoading = false;
                        showSuccess("Success", "Successfully Updated.", "Okay");
                    } else if (res.paymentType == PaymentOptions.CashEntry) {
                        const ordersWithAdjustedAmounts =
                            this.adjustOrderAmounts(this.hopOrders, res.amount);

                        const codPaymentRequestObj = {
                            trip_id: this.appState.hop.tripId,
                            delivery_agent_id: this.appState.fieldAgent.id,
                            customer_id: this.hopSummary.pointId || "",
                            hop_id: this.appState.hop.hopId,
                            collected_by: this.appState.fieldAgent.id,
                            currency: "INR",
                            orders: ordersWithAdjustedAmounts.map((o) => {
                                return {
                                    order_id: o.order_id,
                                    amount: o.amount,
                                };
                            }),
                        };
                        const response =
                            await this.paymentService.updatePaymentCodStatus(
                                codPaymentRequestObj
                            );

                        await this.refreshCollections();
                        this.isLoading = false;
                        showSuccess("Success", "Successfully Updated.", "Okay");
                    } else {
                        this.isLoading = false;
                    }
                }
            }
        );
    }

    private validatePayment(): boolean {
        if (this.appState.hop.tripStatus !== TripStatus.InProgress) {
            showWarning("Warning", "This trip is not currently active. The Payment cannot be processed.", "Okay");
            return false;
        }

        if (
            this.appState.hop.pointMode === PointMode.RETURN &&
            this.appState.hop.pointType === PointType.WAREHOUSE
        ) {
            showWarning("Warning", "Cannot add Payment to the return hop.", "Okay");
            return false;
        }

        return true;
    }

    adjustOrderAmounts(
        hopOrders: IHopOrders[],
        enteredAmount: number
    ): { order_id: string; amount: number }[] {
        const orders = hopOrders
            .map((order) => ({
                ...order,
                createdDate: new Date(order.orderDate).getTime(),
            }))
            .sort((a, b) => a.createdDate - b.createdDate);

        let remainingAmount = enteredAmount;
        const modifiedOrdersAmount: Array<{
            order_id: string;
            amount: number;
            order_date: Date | string;
        }> = [];

        // Process orders and deduct amounts
        for (const order of orders) {
            if (remainingAmount <= 0) {
                break;
            }

            if (order.orderOutStandingAmount <= remainingAmount) {
                // Deduct the entire outstanding amount from the remaining amount
                modifiedOrdersAmount.push({
                    order_id: order.orderNumber,
                    amount: order.orderOutStandingAmount,
                    order_date: order.orderDate,
                });
                remainingAmount -= order.orderOutStandingAmount;
            } else {
                // Deduct only the remaining amount from the outstanding amount
                modifiedOrdersAmount.push({
                    order_id: order.orderNumber,
                    amount: remainingAmount,
                    order_date: order.orderDate,
                });
                remainingAmount = 0;
            }
        }

        return modifiedOrdersAmount;
    }


    private mapToOrders(orderItems: HopItems[]): IHopOrders[] {
        const uniqueOrders = {};

        orderItems.forEach((item) => {
            if (!uniqueOrders[item.orderNumber]) {
                uniqueOrders[item.orderNumber] = {
                    orderNumber: item.orderNumber,
                    orderAmount: +item.orderAmount,
                    orderOutStandingAmount: +item.orderOutstandingAmount,
                    orderStatus:
                        OrderStatus[item.orderStatusId] || item.orderStatusId,
                    orderDate: new Date(item.orderDate),
                    vendorId: item.vendorId,
                };
            }
        });

        return Object.values(uniqueOrders);
    }

    async adminFilter() {
        const initialFilters: AdminHopFilter = {
            selectedMainOption: "",
            selectedOptions: [],
        };

        const bottomSheetOptions = {
            context: { details: initialFilters, type: 10005 },
            fullscreen: false,
            viewContainerRef: this.vcRef,
        };

        this.uiService.showBottomSheet(
            { type: 10005, items: bottomSheetOptions.context.details },
            async (res: AdminHopFilter) => {
                if (res) {
                    await this.handleSelectedFilters(res);
                }
            }
        );
    }

    private async handleSelectedFilters(filters: AdminHopFilter) {
        if (+filters.selectedMainOption === HopMainFilter.Generate) {
            await this.generate(filters.selectedOptions);
        } else if (+filters.selectedMainOption === HopMainFilter.Download) {
            await this.downloads(filters.selectedOptions);
        }
    }

    generate(options: number[]) {
        const generatePromises = options.map((option) => {
            switch (option) {
                case GenerateOptions.Invoices:
                    return this.generateInvoice();
                case GenerateOptions.E_WayBill:
                // NEED TO IMPLEMENT
                default:
                    console.log("Invalid option");
                    return Promise.resolve();
            }
        });

        Promise.all(generatePromises)
            .then(() =>
                showSuccess("Success", "Invoice Generated successfully", "Okay")
            )
            .catch(() => showWarning("Warning", "Something went wrong.", "Okay"));
    }

    downloads(options: number[]) {
        const downloadPromises = options.map((option) => {
            switch (option) {
                case HopDownloadOptions.Invoices:
                    return this.downloadInvoices();
                case HopDownloadOptions.Pick_upIndent:
                    return this.downloadPickUpIndent();
                default:
                    console.log("Invalid option");
                    return Promise.resolve();
            }
        });

        Promise.all(downloadPromises)
            .then(() =>
                showSuccess("Success", "PDF downloaded successfully In Downloads Qwipo Folder.", "Okay")
            )
            .catch(() => showWarning("Warning", "Something went wrong.", "Okay"));
    }

    private async generateInvoice() {
        try {
            let filteredData = this.hopItems.filter(
                (item) => item.vendorBusinessTypeId === MerchantBusinessType.Inventory
            );

            const orderNumbers = [
                ...new Set(filteredData.map((item) => item.orderNumber)),
            ];
            const input = {
                orderNumbers: orderNumbers,
            };

            await this.messageQueueService.postMessageToMessageQueue(
                MESSAGE_QUEUE_TYPE.GENERATE_INVOICE,
                input
            );
        } catch (error) { }
    }

    private async downloadInvoices() {
        const orderNumbers = [
            ...new Set(this.hopItems.map((item) => item.orderNumber)),
        ];

        const input = {
            type: [1, 2],
            order_numbers: orderNumbers,
        };
        try {
            const message: string | undefined | null = await this.pdfService.downloadInvoice(
                input
            );
        } catch (error) { }
    }

    private async downloadPickUpIndent() {
        try {
            const indentName = "Pick Up Indent";
            const type = 2;
            const tripIds = [this.appState.hop?.tripId];
            const inputObj = {
                type: type,
                tripIds,
            };
            await this.pdfService.downloadIndent(inputObj, indentName);
        } catch (error) {
            console.log("error::", error);
        }
    }




    // ----------------------------------

    private mapOrdersReturnsEntity(
        returns: HopReturnItems[]
    ): OrderReturnApiInput[] {
        return returns
            .filter((order) => order.quantity > 0) // Filter for quantity > 0
            .map((order) => ({
                orderNumber: order.orderNumber,
                items: [
                    {
                        reason: order.reason,
                        quantity: order.quantity,
                        sku_id: order.itemId,
                    },
                ],
            }));
    }

    async updateCustomerHopStatus(hopId: string, status: number) {
        try {
            const balance = +this.customerDeliverySummary?.balance || 0;
            const isBalanceSettled: boolean = balance >= -2 && balance <= 2;

            if (
                +this.appState.fieldAgent?.locationInfo?.type ===
                LocationType.Logistic &&
                !isBalanceSettled
            ) {
                this.isLoading = false;
                showWarning("Warning", "The customer hasn't paid the total amount yet. Hop status cannot be updated.", "Okay");
                return;
            }

            if (this.storeReturnValue?.returnOrders && this.storeReturnValue?.returnOrders.length > 0) {
                const returnInput = this.mapOrdersReturnsEntity(this.storeReturnValue.returnOrders);

                await this.returnsService.returnOrder(
                    returnInput
                );
                const returnQtyResponse: StoreReturnOrderInput[] =
                    this.storeReturnValue.returnOrders.map((item) => ({
                        vendorId: item.vendorId,
                        orderNumber: item.orderNumber,
                        products: [item],
                    }));
                if (+this.appState.hop?.source === TripSource.Qwipo_Lite) {
                    await this.upsertThreePLReturnWarehouse(returnQtyResponse);
                }
                else

                if (+this.appState.hop?.source === TripSource.Qwipo || +this.appState.hop?.source === TripSource.Vendor) {
                    if(+this.appState.hop?.source === TripSource.Qwipo){
                          const hopAttemptHistoryId = this.storeReturnValue?.hopAttemptHistoryId;
                            if(hopAttemptHistoryId){
                                await this.hopService.createHopAttemptHistoryWithTransaction(
                                  hopAttemptHistoryId
                                );
                            }

                    }
                    await this.upsertReturnWarehouse(returnQtyResponse);
                }

                await this.returnRepository.deleteCacheReturnByHopId(hopId);
            }

            const response = await this.hopService.updateHopStatus(
                hopId,
                +status
            );

            if (response) {
                showSuccess("Success", "Hop Completed Successfully", "Okay");
                this.router.navigate(['/hop-list']);
            }
        } catch (error) {
            this.isLoading = false;
            showWarning("Warning", "Hop Complete Failed", "Okay");
            console.log("error::", error);
        } finally {
            this.isLoading = false;
        }
    }

    private async upsertThreePLReturnWarehouse(
        orderNeedToReturn: StoreReturnOrderInput[]
    ) {

        const groupeOrdersByVendor = orderNeedToReturn.reduce((acc, order) => {
            const vendorId = order.vendorId;
            if (!acc[vendorId]) {
                acc[vendorId] = [];
            }
            acc[vendorId].push(order);
            return acc;
        }, {});

        for (const vendorId in groupeOrdersByVendor) {
            const orders = groupeOrdersByVendor[vendorId];

            let vendorReturnHop = await this.hopService.getVendorReturnHop(
                this.appState.hop?.tripId,
                vendorId
            );

            if (vendorReturnHop != null) {
                const payload = orders.flatMap((itemOrders) =>
                    itemOrders.products.map((order) => ({
                        item_id: order.itemId,
                        quantity: order.quantity,
                        order_number: order.orderNumber,
                        weight: order.weightPerUnit * order.quantity,
                        item_name: order.itemName,
                        item_image: order.imageUrl,
                        upc: order.upc,
                        maximum_retail_price: order.mrp,
                        selling_price: order.sellingPrice,
                    }))
                );

                await this.hopService.updateHopItemsReturn(
                    vendorReturnHop.id,
                    payload
                );

            } else {
                if (this.appState.hopsList.length === 0) {
                    const filters: HopFilters = {
                        tripId: this.appState.hop?.tripId,
                        agentId: '',
                        pointId: '',
                        pageSize: 100,
                        pageNum: 1
                    };

                    this.appState.hopsList = await this.hopService.getHopsByFilters(
                        filters
                    );
                }

                const highestStopNumber = this.appState.hopsList.reduce(
                    (prevStopNumber, current) => {
                        return Math.max(prevStopNumber, current.stopNumber);
                    },
                    -Infinity
                );
                const vendorPickupHop = this.appState.hopsList.filter(hop =>
                    hop.pointType == PointType.VENDOR &&
                    hop.pointMode == PointMode.PICKUP &&
                    hop.pointId == vendorId
                );

                await this.hopService.createQFFReturnToWareHouse(
                    this.appState.hop.tripId,
                    orders,
                    vendorPickupHop[0],
                    highestStopNumber
                );

            }
        }
    }

    private async upsertReturnWarehouse(
        orderNeedToReturn: StoreReturnOrderInput[]
    ) {
        if (this.appState.hopsList.length === 0) {
            const filters: HopFilters = {
                tripId: this.appState.hop?.tripId,
                agentId: '',
                pointId: '',
                pageSize: 100,
                pageNum: 1
            };

            this.appState.hopsList = await this.hopService.getHopsByFilters(
                filters
            );
        }

        const matchedObject: TripHopMappedResponse | undefined = this.appState.hopsList.find(
            (hop) =>
                hop.pointMode === PointMode.RETURN &&
                hop.pointType === PointType.WAREHOUSE
        );

        if (matchedObject != undefined) {
            const payload = orderNeedToReturn.flatMap((itemOrders) =>
                itemOrders.products.map((order) => ({
                    item_id: order.itemId,
                    quantity: order.quantity,
                    order_number: order.orderNumber,
                    weight: order.weightPerUnit * order.quantity,
                    item_name: order.itemName,
                    item_image: order.imageUrl,
                    upc: order.upc,
                    maximum_retail_price: order.mrp,
                    selling_price: order.sellingPrice, //NEED SOME clarity
                }))
            );

            await this.hopService.updateHopItemsReturn(
                matchedObject.hopId,
                payload
            );
        } else {
            const resource: Resource =
                await this.fieldAgentService.getAgentTaggedWareHouse(
                    this.appState.fieldAgent.id
                );

            const highestStopNumber = this.appState.hopsList.reduce(
                (prevStopNumber, current) => {
                    return Math.max(prevStopNumber, current.stopNumber);
                },
                -Infinity
            );

            await this.hopService.createReturnToWareHouse(
                this.appState.hop.tripId,
                orderNeedToReturn,
                resource,
                highestStopNumber
            );
        }
    }

    private mapHopItemsReturnItems(
        hopItems: HopItems[],
        returnItems: HopReturnItems[]
    ): HopItems[] {
        return hopItems.map((item) => {
            const returnItem = returnItems.find(
                (ri) =>
                    ri.orderNumber === item.orderNumber &&
                    ri.itemId === item.itemId
            );

            return returnItem
                ? {
                    ...item,
                    returnQty: returnItem.quantity,
                    couponDiscountAmount: returnItem.newCouponDiscountAmount,
                    qtyAfterEdit: item.quantity - returnItem.quantity,
                }
                : item;
        });
    }


    private calculateReturnItems(data: HopReturnItems[]): number {
        if (data.length === 0) return 0;

        const ordersWithReturns = this.mapHopItemsReturnItems(this.hopItems, data);

        const orderDetails = ordersWithReturns.reduce((acc, order) => {
            const orderNumber = order.orderNumber;

            if (!acc[orderNumber]) {
                acc[orderNumber] = {
                    items: [],
                    totalShipping: order.shippingChargesCustomerRounded || 0,
                    hasCoupon: (order.couponDiscountAmount || 0) > 0
                };
            }

            acc[orderNumber].items.push(order);
            return acc;
        }, {} as Record<string, {
            items: HopItems[];
            totalShipping: number;
            hasCoupon: boolean;
        }>);

        const calculatedOrders = Object.entries(orderDetails).map(
            ([orderNumber, orderData]) => {
                // For orders without coupon
                if (!orderData.hasCoupon) {
                    const totalNetAmount = orderData.items.reduce(
                        (totalSum, order) => {
                            const quantity = order?.returnQty || 0;
                            const unitPrice = order?.sellingPrice || 0;
                            return totalSum + (quantity * unitPrice);
                        },
                        0
                    );

                    const quantityDiff = orderData.items.reduce(
                        (sum, order) => sum + (order?.quantity - (order?.returnQty || 0)),
                        0
                    );

                    const allSkusZeroDiff = orderData.items.every(
                        (order) => (order?.quantity || 0) - (order?.returnQty || 0) === 0
                    );

                    const amount = Math.round(totalNetAmount);
                    return {
                        amount,
                        totalShipping: orderData.totalShipping,
                        quantityDiff,
                        totalCalculation:
                            amount + (allSkusZeroDiff ? orderData.totalShipping : 0),
                    };
                }
                // For orders with coupon
                else {
                    const totalNetAmount = orderData.items.reduce(
                        (totalSum, order) => {
                            const quantity = order?.returnQty || 0;
                            const unitPrice = order?.sellingPrice || 0;
                            const originalQty = order?.quantity || 0;
                            const originalDiscount = order?.couponDiscountAmount || 0;

                            // Calculate discount per unit for this item
                            const unitDiscount = originalQty > 0
                                ? originalDiscount / originalQty
                                : 0;

                            // Apply discount to returned quantity
                            const discountedAmount = (quantity * unitPrice) - (quantity * unitDiscount);

                            return totalSum + discountedAmount;
                        },
                        0
                    );

                    const quantityDiff = orderData.items.reduce(
                        (sum, order) => sum + (order?.quantity - (order?.returnQty || 0)),
                        0
                    );

                    const allSkusZeroDiff = orderData.items.every(
                        (order) => (order?.quantity || 0) - (order?.returnQty || 0) === 0
                    );

                    const amount = Math.round(totalNetAmount);
                    return {
                        amount,
                        totalShipping: orderData.totalShipping,
                        quantityDiff,
                        totalCalculation:
                            amount + (allSkusZeroDiff ? orderData.totalShipping : 0),
                    };
                }
            }
        );

        return calculatedOrders.reduce(
            (sum, order) => sum + order.totalCalculation,
            0
        );
    }


    async checkHopLocation(distance: number) {
        const location = await this.userService.getCurrentLocation();
        if (!location.isEnableLocation) {
            const message = "Please enable your location";
            TNSFancyAlert.showWarning("Oya...!", message, "Okay");
            return false;
        }

        if (location.isMockLocation) {
            const message = "You are using Fake GPS app. Please Uninstall app and try again later";
            TNSFancyAlert.showWarning("Oya...!", message, "Okay");
            return false;
        }

        const checkDistance = this.calculateDistance(
            location.lat,
            location.long,
            this.hopSummary.pointLat,
            this.hopSummary.pointLng
        );

        if (checkDistance > distance) {
            this.isLoading = false;
            const message = `Please go to a shop nearby, within ${distance} meters`;
            TNSFancyAlert.showWarning("Oya...!", message, "Okay");
            return false;
        }
        return true;
    }


   async reAttempt() {
        const distance=this.appSettings?.restrictions?.reattemptDistance;
        const isDistanceRestricted=this.appSettings?.restrictions?.isReattemptRestricted;
        if (isDistanceRestricted && !(await this.checkHopLocation(distance))) {
            return;
        }

        const input: OrderReturn = {
            reason: "",
            status: false,
            type: Action.ReAttempt
        };
        const options = {
            context: { details: input, type: 10008 },
            fullscreen: true,
            viewContainerRef: this.vcRef,
        };
        this.uiService.showReAttemptBottomSheet(
            { type: 10008, items: options.context.details },
            async (res: WholeOrderReturn) => {
                if (res.status) {
                    this.isLoading = true;
                    const description = {
                        return_reason: res.reason,
                    }
                    const payload: HopAttemptHistoryRequest = {
                        hop_id: this.appState.hop.hopId,
                        point_id: this.appState.hop.pointId,
                        action: Action.ReAttempt,
                        description: JSON.stringify(description),
                        image_url: res.imageUrl ? res.imageUrl : null,
                        attempt_count: 1,

                    };

                    await this.hopService.createHopAttemptHistory(payload);
                    this.isLoading = false;
                    showSuccess("Success", "Hop Reattempted Successfully", "Okay");
                }
            }
        );

    }


}
