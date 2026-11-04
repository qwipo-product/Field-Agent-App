import { OrdersCardComponent } from './../orders-card/orders-card.component';
import { FieldAgent } from "./../../../entities/fieldAgent";
import { Component, Input, NO_ERRORS_SCHEMA, OnInit, ViewContainerRef } from "@angular/core";
import { Router } from "@angular/router";
import { NativeScriptCommonModule, NativeScriptFormsModule } from "@nativescript/angular";
import { Page } from "@nativescript/core";
import { TNSFancyAlert } from "@nstudio/nativescript-fancyalert";
import { Action, ApplicationStateService, DesignationType, HopStatus, LocationType, OrderStatus, PointMode, PointType, TripSource, TripStatus, getItemQtyInCasesPieces, showToast } from "../../../../app/common";
import { ItemsView } from "../../../../app/entities";
import { DEOrderProduct, DEOrderView, HopFilters, HopItems, IHopOrders, ReturnOrderInput, TripHopMappedResponse } from "../../../../app/entities/hop";
import { HopReturnItems, OrderReturn, OrderReturnApiInput, Resource, WholeOrderReturn, partialReturn } from "../../../../app/entities/returns";
import { HopReturnsCache, ReturnRepository } from "../../../../app/store/return.repository";
import { FieldAgentService } from "../../../services/fieldagent.service";
import { HopService } from "../../../services/hop.service";
import { OrderService } from "../../../services/orders.service";
import { ReturnsService } from "../../../services/returns.service";
import { UIService } from "../../../services/ui-service";
import { ModifyService } from "../../../services/modify.service"
import { ReactiveFormsModule } from '@angular/forms';
import { TripListMappedResponse } from '~/app/entities/trip';
import { HopAttemptHistoryRequest } from '~/app/entities/hop-re-attempt';

@Component({
    selector: "de-product-view",
    templateUrl: "de-product-view-component.html",
    standalone: true,
    imports: [NativeScriptCommonModule, OrdersCardComponent, ReactiveFormsModule, NativeScriptFormsModule],
    schemas: [NO_ERRORS_SCHEMA]
})
export class DEProductsViewComponent implements OnInit {
    @Input() orders: any;
    showLoading: boolean = false;
    isOrderWise: boolean = false;
    searchBtn: boolean = false;
    hopItems: HopItems[] = [];
    hopOrders: IHopOrders[] = [];
    hopProducts: ItemsView[] = [];
    isLoading: boolean = false;
    currentHop: TripHopMappedResponse;
    fieldAgent: FieldAgent;
    hopId: string;
    isQwipoPickUp: boolean;
    isVendorDrop: boolean;
    searchText: string = "";
    cloneHopProducts: ItemsView[] = [];
    closeHopOrders: DEOrderView[] = [];
    hopReturnProducts: HopReturnItems[] = [];
    showAdminDetails: boolean = false;
    ordersWithProducts: DEOrderView[] = [];
    storeReturnValue: HopReturnsCache;
    hopAttemptHistoryId : string = ''

    constructor(
        private router: Router,
        private page: Page,
        private vcRef: ViewContainerRef,
        private uiService: UIService,
        private appState: ApplicationStateService,
        private orderService: OrderService,
        private modifyService: ModifyService,
        private returnsService: ReturnsService,
        private hopService: HopService,
        private fieldAgentService: FieldAgentService,
        private returnRepository: ReturnRepository
    ) {
        this.page.actionBarHidden = true;
        this.fieldAgent = this.appState.fieldAgent;
        this.setShowAdminDetails();
    }

    async ngOnInit() {
        this.currentHop = this.appState.hop;
        this.hopId = this.appState.hop.hopId;
        await this.getHopItems();
    }

    setShowAdminDetails(): void {
        const { designation } = this.fieldAgent;
        this.showAdminDetails =
            designation === DesignationType.Manager ||
            designation === DesignationType.OperationAdmin;
    }

    async getHopItems() {
        try {
            this.isLoading = true;
            this.isQwipoPickUp =
                this.appState.hop?.source == TripSource.Qwipo ? true : false;
            this.isVendorDrop =
                this.appState.hop?.source == TripSource.Vendor ? true : false;
            this.hopItems = await this.orderService.getHopItems(this.hopId);

            this.storeReturnValue = await this.returnRepository.getReturnById(this.hopId);

            let hopReturnItems;
            if (this.storeReturnValue == undefined) {
                hopReturnItems = await this.geReturnProducts(this.hopId);
                hopReturnItems = this.consolidateReturnItems(hopReturnItems);
            }
            else {
                hopReturnItems = this.storeReturnValue.returnOrders;
            }



            const updatedHopItems = this.mapHopItemsReturnItems(
                this.hopItems,
                hopReturnItems
            );

            this.ordersWithProducts =
                this.mapOrdersWithProducts(updatedHopItems);

            this.hopOrders = this.mapToOrders(updatedHopItems);
            this.closeHopOrders = this.ordersWithProducts;
        } catch (error) {
            console.error("HomeComponent ngOnInit Error ::: ", error);
        } finally {
            this.isLoading = false;
        }
    }

    private mapToOrders(orderItems: HopItems[]): IHopOrders[] {
        const uniqueOrders = {};

        orderItems.forEach((item) => {
            if (!uniqueOrders[item.orderNumber]) {
                uniqueOrders[item.orderNumber] = {
                    orderNumber: item.orderNumber,
                    orderAmount: Math.round(+item.orderAmount),
                    orderOutStandingAmount: this.bankersRounding(
                        +item.orderOutstandingAmount,
                        0
                    ),
                    orderStatus:
                        OrderStatus[item.orderStatusId] || item.orderStatusId,
                    orderDate: new Date(item.orderDate),
                    orderStatusId: item.orderStatusId,
                    logisticsStatusId: item.logisticsStatusId,
                    vendorId: item.vendorId,
                };
            }
        });

        return Object.values(uniqueOrders);
    }

    private mapOrdersWithProducts(orderItems: HopItems[]): DEOrderView[] {
        const ordersMap = new Map<string, DEOrderView>();

        for (const item of orderItems) {
            if (ordersMap.has(item.orderNumber)) {
                const existingOrder = ordersMap.get(item.orderNumber)!;
                const orderProduct: DEOrderProduct = {
                    orderNumber: item.orderNumber,
                    itemId: item.itemId,
                    itemName: item.itemName,
                    imageUrl: item.imageUrl,
                    upc: item.upc,
                    quantity: item.quantity,
                    totalReturnQty: item.returnQty || 0,
                    unitWeight: item.unitWeight,
                    saleValue: Math.round(item.sellingPrice * item.quantity),
                    mrp: item.mrp,
                    pieces: item.pieces,
                    cases: item.cases,
                    vendorBusinessName: item.vendorBusinessName,
                    vendorId: item.vendorId,
                    vendorBusinessTypeId: item.vendorBusinessTypeId,
                    vendorName: item.vendorName,
                    invoicedQty:
                        item.orderStatusId >= OrderStatus.OrderInvoiced
                            ? item.quantity
                            : 0,
                    itemKey: item.itemKey,
                    orderStatusId: item.orderStatusId,
                    selling_price: item.sellingPrice,
                    logisticsStatusId: item.logisticsStatusId,
                    shippingChargesCustomerRounded: item.shippingChargesCustomerRounded,
                    couponDiscountAmount: item.couponDiscountAmount
                };

                existingOrder.orderProducts.push(orderProduct);
            } else {
                const newOrder: DEOrderView = {
                    orderNumber: item.orderNumber,
                    orderDate: item.orderDate,
                    orderStatusId: item.orderStatusId,
                    logisticsStatusId: item.logisticsStatusId,
                    orderProducts: [
                        {
                            orderNumber: item.orderNumber,
                            itemId: item.itemId,
                            itemName: item.itemName,
                            imageUrl: item.imageUrl,
                            upc: item.upc,
                            quantity: item.quantity,
                            totalReturnQty: item.returnQty || 0,
                            unitWeight: item.unitWeight,
                            saleValue: Math.round(
                                item.sellingPrice * item.quantity
                            ),
                            mrp: item.mrp,
                            pieces: item.pieces,
                            cases: item.cases,
                            vendorBusinessName: item.vendorBusinessName,
                            vendorId: item.vendorId,
                            vendorBusinessTypeId: item.vendorBusinessTypeId,
                            vendorName: item.vendorName,
                            invoicedQty:
                                item.orderStatusId >= OrderStatus.OrderInvoiced
                                    ? item.quantity
                                    : 0,
                            itemKey: item.itemKey,
                            orderStatusId: item.orderStatusId,
                            selling_price: item.sellingPrice,
                            logisticsStatusId: item.logisticsStatusId,
                            shippingChargesCustomerRounded: item.shippingChargesCustomerRounded,
                            couponDiscountAmount: item.couponDiscountAmount
                        },
                    ],
                };
                ordersMap.set(item.orderNumber, newOrder);
            }
        }

        return Array.from(ordersMap.values());
    }

    clearText() {
        this.searchText = "";
    }

    async geReturnProducts(hopId: string) {
        try {
            return await this.returnsService.getHopReturnProducts(hopId);
        } catch (error) {
            this.isLoading = false;
        }
    }



    private showMessage(message: string) {
        TNSFancyAlert.showWarning("", message, "Okay");
    }

    private showSuccessMessage(message: string) {
        TNSFancyAlert.showSuccess("", message, "Okay");
    }

    private validateProductReturn(): boolean {
        const isVendorToWarehouse = +this.appState.fieldAgent.locationInfo?.type === LocationType.Vendor;
        if (!isVendorToWarehouse && this.appState.hop?.tripStatus !== TripStatus.InProgress) {
            this.showMessage(
                "The return you are trying to add cannot be processed. This trip is not currently active"
            );
            return false;
        }


        if (this.currentHop.hopStatus === HopStatus.Completed) {
            const msg = "You Can't Add Return For Completed Hop.";
            this.showMessage(msg);
            return false;
        }

        if (
            this.currentHop.pointMode === PointMode.RETURN &&
            this.currentHop.pointType === PointType.WAREHOUSE
        ) {
            const msg = "Cannot add return to the return hop.";
            this.showMessage(msg);
            return false;
        }

        return true;
    }

    private async updateItemStock(
        skuId: string,
        vendorId: string,
        returnedQty: number
    ) {
        try {
            const response = await this.modifyService.updateInventory(
                skuId,
                vendorId,
                returnedQty
            );
            return response;
        } catch (error) {
            throw error;
        }
    }

    private consolidateReturnItems(items: HopReturnItems[]): HopReturnItems[] {
        const groupedItems = {};

        items.forEach((item) => {
            const key = `${item.orderNumber}-${item.itemId}`;
            if (groupedItems[key]) {
                groupedItems[key].quantity += item.quantity;
            } else {
                groupedItems[key] = { ...item };
            }
        });

        return Object.values(groupedItems);
    }

    private mapHopItemsReturnItems(
        hopItems: HopItems[],
        returnItems: HopReturnItems[]
    ) {
        returnItems.forEach((returnItem) => {
            const itemToUpdate = hopItems.find(
                (item) =>
                    item.orderNumber === returnItem.orderNumber &&
                    item.itemId === returnItem.itemId
            );

            if (itemToUpdate) {
                const returnQty = returnItem.quantity;
                itemToUpdate.returnQty = returnQty;
                itemToUpdate.qtyAfterEdit = itemToUpdate.quantity - returnQty;
            }
        });

        return hopItems;
    }

    private bankersRounding = (num: number, precision: number) => {
        const multiplier = Math.pow(10, precision);
        const scaledNum = num * multiplier;

        const intermediate = Math.round(num * multiplier);

        let rounded: number;
        if (Math.abs(intermediate - scaledNum) === 0.5) {
            rounded = intermediate % 2 === 0 ? intermediate : intermediate - 1;
        } else {
            rounded = intermediate;
        }

        const difference = (rounded - num * multiplier) / multiplier;
        const roundedDifference = Number(difference.toFixed(4)); // Round difference to 4 digits
        const roundedAmount = rounded / multiplier;
        return roundedAmount;
    };

    // ----------------------------------------------------------------------------

    //NEED TO WRITE CONDITION FOR SHOWING ORDER EDIT BUTTON

    private updateQtyHopReturns(hopOrders: DEOrderView[]): DEOrderView[] {
        const updatedOrders = [...hopOrders];
        hopOrders.forEach((hopItem) => {
            hopItem.orderProducts.map((o) => {
                o.quantity -= o.totalReturnQty;
            });
        });

        return updatedOrders;
    }

    private mapOrdersReturnsEntity(
        items: ReturnOrderInput[],
        reason: string
    ): OrderReturnApiInput[] {
        return items.flatMap((itemOrders) =>
            itemOrders.products.map((order) => ({
                orderNumber: order.orderNumber,
                items: [
                    {
                        reason: reason,
                        quantity: order.quantity,
                        sku_id: order.itemId,
                    },
                ],
            }))
        );
    }

    private async upsertReturnHopOrderWholeOrder(
        orderNeedToReturn: ReturnOrderInput[]
    ) {
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
                    weight: order.unitWeight * order.quantity,
                    item_name: order.itemName,
                    item_image: order.imageUrl,
                    upc: order.upc,
                    maximum_retail_price: order.mrp,
                    selling_price: order.selling_price, //NEED SOME clarity
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

            await this.hopService.createOrdersReturnHopWholeOrder(
                this.appState.hop.tripId,
                orderNeedToReturn,
                resource,
                highestStopNumber
            );
        }
    }

    private checkOrdersQuantityEqualsReturnQty(orders: DEOrderView[]): boolean {
        const allItemsZeroDifference = orders.map((order) =>
            order.orderProducts.every(
                (item) => item.quantity - item.totalReturnQty === 0
            )
        );

        return allItemsZeroDifference.every((isZero) => isZero);
    }

    private async processOrdersWholeOrderReturns(reason: string) {
        try {

            if (this.hopOrders[0].orderStatusId < 5) {
                const msg = "this orders not yet invoiced";
                this.showMessage(msg);
                return;
            }
            if (
                this.hopOrders[0].orderStatusId == 10 ||
                this.hopOrders[0].logisticsStatusId == 6
            ) {
                const msg = "this order already cancelled";
                this.showMessage(msg);
                return;
            }



            this.isLoading = true;
            // NEED TO CHANGE THIS
            if (
                this.checkOrdersQuantityEqualsReturnQty(this.ordersWithProducts)
            ) {
                this.isLoading = false;
                const msg = "These orders have already been returned.";
                this.showMessage(msg);
                return;
            }
            const updatedReturnQty: DEOrderView[] = this.updateQtyHopReturns(
                this.ordersWithProducts
            );
            const returnQtyResponse: ReturnOrderInput[] = updatedReturnQty.map(
                (item) => ({
                    orderNumber: item.orderNumber,
                    products: item.orderProducts.filter((c) => c.quantity > 0),
                })
            );

            const orderToReturn = returnQtyResponse.filter(
                (o) => o.products.length > 0
            );

            if (!this.validateProductReturn()) {
                this.isLoading = false;
                return;
            }
            const returnsInput: OrderReturnApiInput[] =
                this.mapOrdersReturnsEntity(orderToReturn, reason);

            const response = await this.returnsService.returnOrder(
                returnsInput
            );

            await this.upsertReturnHopOrderWholeOrder(orderToReturn);

            this.isLoading = false;
            const msg = "Whole Order Return Added Successfully";
            this.showSuccessMessage(msg);
            const matchedObject: TripHopMappedResponse | undefined = this.appState.hopsList.find(
                (hop) =>
                    hop.pointMode === PointMode.RETURN &&
                    hop.pointType === PointType.WAREHOUSE
            );
            if (matchedObject == undefined) {
                const filters: HopFilters = {
                    tripId: this.appState.hop?.tripId,
                    agentId: '',
                    pointId: '',
                    pageSize: 100,
                    pageNum: 1
                };

                this.appState.hopsList = await this.hopService.getHopsByFilters(filters);


            }
            await this.getHopItems();
        } catch (error) {
            this.isLoading = false;
            const msg = "Whole Order Return Failed";
            this.showMessage(msg);
        }
    }





    private async processOrderReturn(order: DEOrderView[], reason: string) {
        try {

            if (this.checkOrdersQuantityEqualsReturnQty(order)) {
                this.isLoading = false;
                const msg = "This order have already been returned.";
                this.showMessage(msg);
                return;
            }

            const updatedReturnQty: DEOrderView[] =
                this.updateQtyHopReturns(order);

            const returnQtyResponse: ReturnOrderInput[] = updatedReturnQty.map(
                (item) => ({
                    orderNumber: item.orderNumber,
                    products: item.orderProducts.filter((c) => c.quantity > 0),
                })
            );

            const orderToReturn = returnQtyResponse.filter(
                (o) => o.products.length > 0
            );

            const returnsInput: OrderReturnApiInput[] =
                this.mapOrdersReturnsEntity(orderToReturn, reason);

            const response = await this.returnsService.returnOrder(
                returnsInput
            );
            await this.upsertReturnHopOrderWholeOrder(orderToReturn);
            this.isLoading = false;
            const msg = "Whole Order Return Added Successfully";
            this.showSuccessMessage(msg);
            const matchedObject: TripHopMappedResponse | undefined = this.appState.hopsList.find(
                (hop) =>
                    hop.pointMode === PointMode.RETURN &&
                    hop.pointType === PointType.WAREHOUSE
            );
            if (matchedObject == undefined) {
                const filters: HopFilters = {
                    tripId: this.appState.hop?.tripId,
                    agentId: '',
                    pointId: '',
                    pageSize: 100,
                    pageNum: 1
                };

                this.appState.hopsList = await this.hopService.getHopsByFilters(filters);
            }
            await this.getHopItems();
        } catch (error) {
            this.isLoading = false;
            this.showMessage("Order Return Failed");
            throw error;
        }
    }



    orderWiseReturn(order: DEOrderView) {
        if (!this.validateProductReturn()) {
            this.isLoading = false;
            return;
        }
        if (order.orderStatusId < 5) {
            const msg = "this orders not yet invoiced";
            this.showMessage(msg);
            return;
        }

        if (order.logisticsStatusId == 6 || order.orderStatusId == 10) {
            const msg = "this order already cancelled";
            this.showMessage(msg);
            return;
        }

        const input: WholeOrderReturn = {
            id: 0,
            reason: "",
            status: false,
            imageUrl: ""
        };
        const options = {
            context: { details: input, type: 10002 },
            fullscreen: false,
            viewContainerRef: this.vcRef,
        };
        this.uiService.showBottomSheet(
            { type: 10002, items: options.context.details },
            async (res: WholeOrderReturn) => {
                if (res.status) {
                    // await this.processOrderReturn([order], res.reason);
                    await this.raiseOrderWiseReturns([order], res,false);
                }
            }
        );
    }

    returnOrderProduct(product: DEOrderProduct) {
        if (!this.validateProductReturn()) {
            this.isLoading = false;
            return;
        }
        if (product.orderStatusId < 5) {
            const msg = "this orders not yet invoiced";
            this.showMessage(msg);
            return;
        }
        if (product.logisticsStatusId == 6 || product.orderStatusId == 10) {
            const msg = "this order already cancelled";
            this.showMessage(msg);
            return;
        }
        const quantity = product.quantity - product.totalReturnQty;
        if (quantity == 0) {
            const msg = "This product has already been returned";
            this.showMessage(msg);
            return;
        }
        const options = {
            context: {
                details: {
                    quantity,
                    reason: "",
                    itemName: product.itemName,
                },
                type: 10005,
            },
            fullscreen: false,
            viewContainerRef: this.vcRef,
        };
        this.uiService.showReturnBottomSheet(
            { type: 10005, items: options.context.details },
            async (result: partialReturn) => {
                if (result) {
                    // const response = await this.processProductReturn(
                    //     product,
                    //     result.quantity,
                    //     result.reason
                    // );
                    await this.raiseProductReturn(product, result.quantity, result.reason);
                }
            }
        );
    }

    private async upsertHupProductReturnHop(
        orderNeedToReturn: number,
        item: DEOrderProduct
    ) {
        const matchedObject: TripHopMappedResponse | undefined = this.appState.hopsList.find(
            (hop) =>
                hop.pointMode === PointMode.RETURN &&
                hop.pointType === PointType.WAREHOUSE
        );

        if (matchedObject != undefined) {
            const payload = [
                {
                    item_id: item.itemId,
                    quantity: orderNeedToReturn,
                    order_number: item.orderNumber,
                    weight: item.unitWeight * orderNeedToReturn,
                    item_name: item.itemName,
                    item_image: item.imageUrl,
                    upc: item.upc,
                    maximum_retail_price: item.mrp,
                    selling_price: item.selling_price,
                },
            ];
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

            await this.hopService.createProductReturnHop(
                this.appState.hop.tripId,
                orderNeedToReturn,
                resource,
                highestStopNumber,
                item
            );
        }
    }

    private mapProductReturns(
        returnedQty: number,
        reason: string,
        item: DEOrderProduct
    ): OrderReturnApiInput[] {
        return [
            {
                orderNumber: item.orderNumber,
                items: [
                    {
                        reason: reason,
                        quantity: returnedQty,
                        sku_id: item.itemId,
                    },
                ],
            },
        ];
    }

    private async processProductReturn(
        item: DEOrderProduct,
        returnedQty: number,
        reason: string
    ) {
        try {
            const returnsInput: OrderReturnApiInput[] = this.mapProductReturns(
                returnedQty,
                reason,
                item
            );
            const returnQtyResponse = returnsInput
                .map((item) => ({
                    ...item,
                    items: item.items.filter((c) => c.quantity > 0),
                }))
                .filter((item) => item.items.length > 0);


            await this.returnsService.returnOrder(returnQtyResponse);
            // Update Return Hop Items
            await this.upsertHupProductReturnHop(returnedQty, item);
            // TODO Update Stock

            this.isLoading = false;
            this.showSuccessMessage(` Returned Successfully`);
            const matchedObject: TripHopMappedResponse | undefined = this.appState.hopsList.find(
                (hop) =>
                    hop.pointMode === PointMode.RETURN &&
                    hop.pointType === PointType.WAREHOUSE
            );
            if (matchedObject == undefined) {
                const filters: HopFilters = {
                    tripId: this.appState.hop?.tripId,
                    agentId: '',
                    pointId: '',
                    pageSize: 100,
                    pageNum: 1
                };

                this.appState.hopsList = await this.hopService.getHopsByFilters(filters);
            }
            await this.getHopItems();
        } catch (error) {
            this.isLoading = false;
            this.showMessage("Return Failed");
            throw error;
        }
    }
    searchOrderProductDebounce(inputValue) {
        if (inputValue === "" || inputValue.length >= 3) {
            this.showLoading = true;
            this.ordersWithProducts = this.searchOrdersProducts(inputValue);
            this.showLoading = false;
            if (
                this.ordersWithProducts &&
                this.ordersWithProducts.length === 0
            ) {
                showToast("No Products Found");
            } else {
            }
        } else {
            this.ordersWithProducts = this.closeHopOrders;
        }
    }
    searchOrdersProducts(searchText: string) {
        const filteredOrders = this.closeHopOrders.filter(
            (order: DEOrderView) => {
                const search = searchText.toLowerCase();
                return order.orderProducts.some((product: DEOrderProduct) =>
                    product.itemName.toLowerCase().includes(search)
                );
            }
        );

        if (filteredOrders.length === 0) {
            return [];
        }

        return filteredOrders;
    }

    // --------------------------------------------------------------------------------------

    private mapToOrdersStoreReturn(returnItems: DEOrderProduct[], reason: string,hopAttemptHistoryId: string): HopReturnsCache {
        const data = this.storeDictionary();

        const returnOrders = returnItems.map(item => {
            const key = this.generateKey(item.itemId, item.vendorId, item.orderNumber);

            const alreadyReturnedQty = data[key]?.quantity || 0;
            const returnedQty = Math.max(0, item.quantity - alreadyReturnedQty);

            const couponAmountPerQty = item.couponDiscountAmount / item.quantity;
            const totalItemCouponAmount = couponAmountPerQty * returnedQty;

            return {
                orderNumber: item.orderNumber,
                itemId: item.itemId,
                imageUrl: item.imageUrl,
                mrp: item.mrp,
                sellingPrice: item.selling_price,
                upc: item.upc.toString(),
                weightPerUnit: item.unitWeight,
                stockUOM: '',
                packageType: '',
                hsnCode: '',
                totalNetAmount: Math.round(returnedQty * item.selling_price),
                totalWeight: 0, // Assuming totalWeight is 0 or set it accordingly
                quantity: returnedQty,
                itemName: item.itemName,
                pieces: item.pieces,
                cases: item.cases,
                createdTimeStamp: Date.now(),
                vendorName: item.vendorBusinessName,
                vendorId: item.vendorId,
                itemKey: this.generateItemKey(item.itemId, item.vendorId),
                reason: reason,
                originalQuantity: item.quantity,
                shippingChargesCustomerRounded: item.shippingChargesCustomerRounded,
                oldCouponDiscountAmount: item.couponDiscountAmount,
                newCouponDiscountAmount: totalItemCouponAmount
            };
        });

        return {
            hopId: this.hopId,
            returnOrders,
            hopAttemptHistoryId: hopAttemptHistoryId
        };
    }

    async raiseOrderWiseReturns(orders: DEOrderView[], res: WholeOrderReturn,isWholeOrderReturn : boolean) {
        if (!orders || orders.length === 0) {
            this.showMessage("No orders provided for return.");
            return;
        }

        if (this.hopOrders[0].orderStatusId < 5) {
            this.showMessage("These orders are not yet invoiced.");
            return;
        }

        if (
            this.hopOrders[0].orderStatusId === 10 ||
            this.hopOrders[0].logisticsStatusId === 6
        ) {
            this.showMessage("This order is already cancelled.");
            return;
        }

        if (this.checkOrdersQuantityEqualsReturnQty(orders)) {
            this.isLoading = false;
            this.showMessage("These orders have already been returned.");
            return;
        }

        try {
            if(res.id == 15 && res.reason && isWholeOrderReturn){
                const description = {
                    return_reason: res.reason,
                }
                const payload: HopAttemptHistoryRequest = {
                    hop_id: this.appState.hop.hopId,
                    point_id: this.appState.hop.pointId,
                    action: Action.Return,
                    description: JSON.stringify(description),
                    image_url: res.imageUrl ? res.imageUrl : null,
                    attempt_count: 1,

                };

              const response = await this.hopService.createHopAttemptHistory(payload);
              if(response){
                this.hopAttemptHistoryId = response.id;
               }
            }

            for (const order of orders) {
                const orderWiseReturn = this.mapToOrdersStoreReturn(order.orderProducts, res.reason,this.hopAttemptHistoryId);
                await this.returnRepository.upsertStoreReturn(orderWiseReturn);
            }
            this.updateOrderReturnQty();

            this.showSuccessMessage("Whole Order Return Added Successfully");
        } catch (error) {
            console.error("Error while raising order-wise returns:", error);
            this.showMessage("An error occurred while processing returns. Please try again.");
        }
    }

    async raiseProductReturn(item: DEOrderProduct,
        returnedQty: number,
        reason: string) {
        const { pieces, cases } = getItemQtyInCasesPieces(
            +item.upc,
            +returnedQty
        );
        const couponAmountPerQty = item.couponDiscountAmount / item.quantity;
        const totalItemCouponAmount = couponAmountPerQty * returnedQty;

        const data: HopReturnsCache = {
            hopId: this.hopId,
            hopAttemptHistoryId: '',
            // tripInfo: this.appState.trip,
            returnOrders: [{
                orderNumber: item.orderNumber,
                itemId: item.itemId,
                imageUrl: item.imageUrl,
                mrp: item.mrp,
                sellingPrice: item.selling_price,
                upc: item.upc.toString(),
                weightPerUnit: item.unitWeight,
                stockUOM: '',
                packageType: '',
                hsnCode: '',
                totalNetAmount: Math.round(+returnedQty * +item.selling_price),
                totalWeight: 0,
                quantity: returnedQty,
                itemName: item.itemName,
                pieces: pieces,
                cases: cases,
                createdTimeStamp: Date.parse(new Date().toString()),
                vendorName: item.vendorBusinessName,
                vendorId: item.vendorId,
                itemKey: `${item.itemId}-${item.vendorId}`,
                reason: reason,
                originalQuantity: item.quantity,
                shippingChargesCustomerRounded: item.shippingChargesCustomerRounded,
                oldCouponDiscountAmount: item.couponDiscountAmount,
                newCouponDiscountAmount: totalItemCouponAmount
            }]
        }

        await this.returnRepository.upsertStoreReturn(data);
        this.showSuccessMessage(`Product Returned Successfully`);
        this.updateOrderReturnQty();
    }

    private async updateOrderReturnQty() {
        this.storeReturnValue = await this.returnRepository.getReturnById(this.hopId);

        const updatedHopItems = this.mapHopItemsReturnItems(
            this.hopItems,
            this.storeReturnValue.returnOrders
        );

        this.ordersWithProducts =
            this.mapOrdersWithProducts(updatedHopItems);

        this.hopOrders = this.mapToOrders(updatedHopItems);
        this.closeHopOrders = this.ordersWithProducts;
    }

    private storeDictionary(): Record<string, any> {

        if (!this.storeReturnValue) {
            return {};
        }

        return this.storeReturnValue.returnOrders.reduce((acc, item) => {
            const key = this.generateKey(item.itemId, item.vendorId, item.orderNumber);
            acc[key] = item;
            return acc;
        }, {});
    }



    private generateKey(itemId: string, vendorId: string, orderNumber: string): string {
        return `${itemId}-${vendorId}-${orderNumber}`;
    }

    private generateItemKey(itemId: string, vendorId: string): string {
        return `${itemId}-${vendorId}`;
    }


    addWholeOrderReturn() {

        const input: OrderReturn = {
            reason: "",
            status: false,
            type: Action.Return
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
                    await this.raiseOrderWiseReturns(this.ordersWithProducts, res,true);
                    this.isLoading = false;

                }
            }
        );

    }


}
