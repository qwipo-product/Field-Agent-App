import { FieldAgent } from "./../../../entities/fieldAgent";
import { Component, Input, NO_ERRORS_SCHEMA, OnInit, ViewContainerRef } from "@angular/core";
import { Router } from "@angular/router";
import { NativeScriptCommonModule, NativeScriptFormsModule } from "@nativescript/angular";
import { Page } from "@nativescript/core";
import { TNSFancyAlert } from "@nstudio/nativescript-fancyalert";
import { ApplicationStateService, DesignationType, HopStatus, OrderStatus, TripSource, TripStatus, getItemQtyInCasesPieces, showToast } from "../../../../app/common";
import { ItemsView, OrderToModify } from "../../../../app/entities";
import { HopItems, IHopOrders, TripHopMappedResponse, ValidateStockUpdate } from "../../../../app/entities/hop";
import { OrderModifyToBottomSheet } from "../../../../app/entities/order";
import { UIService } from "../../../services/ui-service";
import { OrderService } from "../../../services/orders.service";
import { ModifyService } from "../../../services/modify.service";
import { OrdersCardComponent } from "../orders-card/orders-card.component";
import { ReactiveFormsModule } from "@angular/forms";
import { TripListMappedResponse } from "~/app/entities/trip";

@Component({
    selector: "admin-product-view",
    templateUrl: "admin-product-view-component.html",
    standalone: true,
    imports: [NativeScriptCommonModule,OrdersCardComponent,ReactiveFormsModule,NativeScriptFormsModule],
    schemas: [NO_ERRORS_SCHEMA]
})
export class AdminProductsViewComponent implements OnInit {
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
    tripDetails: TripListMappedResponse | null;
    isQwipoPickUp: boolean;
    isVendorDrop: boolean;
    isQwipoLite:boolean;
    searchText: string = "";
    cloneHopProducts: ItemsView[] = [];
    showAdminDetails: boolean = false;

    constructor(
        private router: Router,
        private page: Page,
        private vcRef: ViewContainerRef,
        private uiService: UIService,
        private appState: ApplicationStateService,
        private orderService: OrderService,
        private modifyService: ModifyService
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
            this.isQwipoLite = this.appState.hop?.source == TripSource.Qwipo_Lite ? true : false;
            this.hopItems = await this.orderService.getHopItems(this.hopId);
            this.hopProducts = this.mapProducts(this.hopItems).filter(
                (c) => c.quantity > 0
            );
            this.hopOrders = this.mapToOrders(this.hopItems);
            this.cloneHopProducts = this.hopProducts;
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
                    orderAmount: +item.orderAmount,
                    orderOutStandingAmount: +item.orderOutstandingAmount,
                    orderStatus:
                        OrderStatus[item.orderStatusId] || item.orderStatusId,
                    orderDate: new Date(item.orderDate),
                    orderStatusId: item.orderStatusId,
                    vendorId: item.vendorId,
                };
            }
        });

        return Object.values(uniqueOrders);
    }

    private getItemQtyInCasesPieces(upc: number, qty: number) {
        if (upc == 0) {
            return { pieces: qty, cases: 0 };
        }

        const roundedUpc = Math.round(upc);

        let pieces = Math.abs(qty) % roundedUpc;
        let cases = Math.floor(Math.abs(qty) / roundedUpc);

        if (qty < 0) {
            pieces = -pieces;
            cases = -cases;
        }

        return { pieces, cases };
    }

    private mapProducts(orderItems: HopItems[]) {
        const productsMap = new Map<string, ItemsView>();

        for (const item of orderItems) {
            if (productsMap.has(item.itemKey)) {
                const existingItem: ItemsView | any = productsMap.get(
                    item.itemKey
                );
                if (item.orderStatusId >= OrderStatus.OrderInvoiced) {
                    existingItem.invoicedQty += item.quantity;
                }
                existingItem.quantity += item.quantity;
                const { pieces, cases } = this.getItemQtyInCasesPieces(
                    existingItem.upc,
                    existingItem.quantity
                );
                existingItem.pieces = pieces;
                existingItem.cases = cases;
                if (item.orderStatusId >= OrderStatus.OrderInvoiced) {
                    existingItem.invoicedQty += item.quantity;
                }

                (existingItem.saleValue += item.sellingPrice * item.quantity),
                    existingItem.orders.push({
                        orderNumber: item.orderNumber,
                        orderDate: item.orderDate,
                        qty: item.quantity,
                        orderStatusId: item.orderStatusId,
                    });
                productsMap.set(item.itemKey, existingItem);
            } else {
                const mappedItem: ItemsView = {
                    itemId: item.itemId,
                    itemName: item.itemName,
                    imageUrl: item.imageUrl,
                    upc: item.upc,
                    quantity: item.quantity,
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
                    orders: [
                        {
                            orderNumber: item.orderNumber,
                            orderDate: item.orderDate,
                            qty: item.quantity,
                            orderStatusId: item.orderStatusId,
                        },
                    ],
                    itemKey: item.itemKey,
                };
                productsMap.set(item.itemKey, mappedItem);
            }
        }
        return Array.from(productsMap.values());
    }

    searchDebounce(inputValue) {
        if (inputValue === "" || inputValue.length >= 3) {
            this.showLoading = true;
            this.hopProducts = this.searchOrderProducts(inputValue);
            this.showLoading = false;
            if (this.hopProducts && this.hopProducts.length === 0) {
                showToast("No Products Found");
                //this.showErrorDisplay = true;
            } else {
                //this.showErrorDisplay = false;
            }
        } else {
            //this.showErrorDisplay = false;
            this.hopProducts = this.cloneHopProducts;
        }
    }
    searchOrderProducts(searchText: string) {
        const filteredProducts = this.cloneHopProducts.filter((product) => {
            const itemName = product.itemName.toLowerCase();
            const search = searchText.toLowerCase();
            return itemName.includes(search);
        });

        if (filteredProducts.length === 0) {
            return [];
        }

        return filteredProducts;
    }

    clearText() {
        this.searchText = "";
    }

    modifyOrderProduct(product: ItemsView) {
        if (!this.validateProductModify()) {
            return;
        }
        const orderModifyInput = this.initializeModify(product);
        const options = {
            context: {
                details: orderModifyInput,
                type: 101,
            },
            fullscreen: false,
            viewContainerRef: this.vcRef,
        };
        this.uiService.showModifyOrderBottomSheet(
            { type: 101, items: options.context.details },
            async (res: { availableQty: number; damageQty: number }) => {
                if (res) {
                    const response = await this.processModifyItem(
                        product,
                        res.availableQty,
                        res.damageQty
                    );
                }
            }
        );
    }
    private showMessage(message: string) {
        TNSFancyAlert.showWarning("", message, "Okay");
    }

    private showSuccessMessage(message: string) {
        TNSFancyAlert.showSuccess("", message, "Okay");
    }
    private initializeModify(product: ItemsView) {
        const isVendorDrop =
        this.appState.hop?.source == TripSource.Vendor ? true : false;
        const qtyAvailableToModify = +product.quantity - +product.invoicedQty;
        const { pieces, cases } = getItemQtyInCasesPieces(
            +product.upc,
            +qtyAvailableToModify
        );

        const orderModifyInput: OrderModifyToBottomSheet = {
            itemName: product.itemName,
            itemId: product.itemId,
            requestedQuantity: qtyAvailableToModify,
            availableQuantity: "0",
            damageQuantity: "0",
            isVendorDrop: isVendorDrop,
            invoicedQty: +product.invoicedQty,
            upc: +product.upc,
            requestCss: cases,
            requestPcs: pieces,
            availableCss: "0",
            availablePcs: "0",
            availableDamageCss: "0",
            availableDamagePcs: "0",
        };

        return orderModifyInput;
    }

    private validateProductModify(): boolean {
        if (this.currentHop.hopStatus == HopStatus.Completed) {
            const msg =
                "The Modification you are trying to add cannot be processed. This Hop Already Completed";
            this.showMessage(msg);
            return false;
        }
        if (this.appState.hop.tripStatus === TripStatus.Completed) {
            const msg =
                "The Modification you are trying to add cannot be processed. This trip Already Completed";
            this.showMessage(msg);
            return false;
        }
        if (this.hopItems[0].orderStatusId > 7) {
            const msg =
                "You can't modify an order once it is out for delivery.";
            this.showMessage(msg);
            return false;
        }

        return true;
    }

    private async processModifyItem(
        item: ItemsView,
        availableQty: number,
        damageQty: number = 0
    ) {
        try {
            //damageQty NEED TO HANDEL DAMAGES
            // const qtyToDecrees = item.quantity - availableQty;
            const qtyToDecrees =
                item.quantity - item.invoicedQty - availableQty;
            // Orders to be modified
            // const orderToBeModified = this.ordersToModify(item, qtyToDecrees);
            let orderToBeModified = this.ordersToModify(item, qtyToDecrees);
            orderToBeModified = orderToBeModified.filter((o) => o.quantity > 0);
            // Modify Order

            let inventoryUpdateRequired = {
                inventoryQty: 0,
                tripsQty: 0,
                updateRequired: false,
            };

            if (this.appState.hop?.source === TripSource.Qwipo) {
                const inventoryCheckPayload: ValidateStockUpdate = {
                    vendor_id: item.vendorId,
                    sku_id: item.itemId,
                    date: this.appState.hop?.targetDate ? new Date(this.appState.hop?.targetDate) : new Date(),
                };
                inventoryUpdateRequired =
                    await this.modifyService.inventoryUpdateCheck(
                        inventoryCheckPayload
                    );
            }

            const orderUpdateRes = await this.modifyOrders(orderToBeModified);

            // Update Hop Items
            const updateHopRes = await this.modifyHopItems(
                orderToBeModified,
                item
            );

            // Update Stock
            if (
                this.appState.hop?.source === TripSource.Qwipo &&
                inventoryUpdateRequired.updateRequired
            ) {
                const updateStockRes = await this.updateItemStock(
                    item.itemId,
                    item.vendorId,
                    // availableQty,
                    qtyToDecrees,
                    damageQty
                );
            }

            this.showSuccessMessage(` Modified Successfully`);
            await this.getHopItems();
        } catch (error) {
            this.showMessage("Modify Failed");
            throw error;
        }
    }
    private ordersToModify(item: ItemsView, qtyToDecrees: number) {
        const sortedOrders = item.orders
            .filter((o) => o.orderStatusId < OrderStatus.OrderInvoiced)
            .sort((a, b) => b.qty - a.qty);
        let remainingQty = qtyToDecrees;
        const fulfilledOrders: OrderToModify[] = [];

        for (const order of sortedOrders) {
            if (order.qty <= remainingQty) {
                remainingQty -= order.qty;
                fulfilledOrders.push({
                    orderNumber: order.orderNumber,
                    skuId: item.itemId,
                    quantity: order.qty,
                });
            } else {
                fulfilledOrders.push({
                    orderNumber: order.orderNumber,
                    skuId: item.itemId,
                    quantity: remainingQty,
                });
                remainingQty = 0;
                break;
            }
        }

        item.quantity -= qtyToDecrees; // Update overall item quantity
        return fulfilledOrders; // Return an array of fulfilled orders
    }

    private async modifyOrders(ordersToBeModified: OrderToModify[]) {
        try {
            const mappedOrderModify = ordersToBeModified.map((order) => {
                return {
                    orderNumber: order.orderNumber,
                    modifiedItems: [
                        {
                            reason: `Modified by ${this.fieldAgent.name} for hop item`,
                            quantity: order.quantity,
                            sku_id: order.skuId,
                        },
                    ],
                };
            });
            const response = await this.modifyService.orderModifyBulk(
                mappedOrderModify
            );

            return response;
        } catch (error) {
            throw error;
        }
    }

    private async modifyHopItems(
        ordersToBeModified: OrderToModify[],
        item: ItemsView
    ) {
        try {
            const payload = ordersToBeModified.map((order) => {
                const itemOrder = item.orders.find(
                    (o) => o.orderNumber == order.orderNumber
                );

                const qty: number = itemOrder?.qty
                    ? itemOrder?.qty - order.quantity
                    : itemOrder?.qty || order.quantity;
                return {
                    item_id: order.skuId,
                    quantity: qty,
                    order_number: order.orderNumber,
                    weight: item.unitWeight * qty,
                };
            });

            const updateHopItemsRes = await this.modifyService.updateHopItems(
                this.hopId,
                payload
            );
            return updateHopItemsRes;
        } catch (error) {
            // TODO log the error
            throw error;
        }
    }

    private async updateItemStock(
        skuId: string,
        vendorId: string,
        // availableQty: number,
        qtyToDecrees: number,
        damage: number
    ) {
        try {
            // Not handling Damage now.
            const response = await this.modifyService.decrementQtyByOrderModify(
                skuId,
                vendorId,
                // availableQty
                qtyToDecrees
            );

            return response;
        } catch (error) {
            throw error;
        }
    }
}
