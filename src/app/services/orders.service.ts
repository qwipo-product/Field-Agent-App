import { HttpClient } from "@angular/common/http";
import { BaseConfig } from "../../app/base-config";
import { Injectable } from "@angular/core";
import {
    ApplicationStateService,
    OrderStatus,
    convertToYYYYMMDD,
    getItemQtyInCasesPieces,
} from "../common";
import { HopItems, HopItemsResponse } from "../entities/hop";
import { BaseService } from "./base.service";
import { lastValueFrom } from "rxjs";
@Injectable({
    providedIn: "root"
})
export class OrderService extends BaseService {
    controller: string;
    constructor(
        http: HttpClient,
        baseConfig: BaseConfig,
        appState: ApplicationStateService
    ) {
        super(http, baseConfig);
    }

    async getHopItems(id: string): Promise<HopItems[]> {
        try {
            const url = `${this.config.logisticsBaseUrl}/hops/${id}/hop_items`;
            const response: HopItemsResponse[] = await lastValueFrom(
                this.get(url, {})
            );

            const res = this.mapToHopItems(response);

            return res;
        } catch (error) {
            console.log("Error in getHopsByTripId: ", error);
            return [];
        }
    }

    private mapToHopItems(response: HopItemsResponse[]): HopItems[] {
        const res = response.map((hopItem) => {
            const { pieces, cases } = getItemQtyInCasesPieces(
                +hopItem.upc,
                +hopItem.quantity
            );

            const hopOrderStatus = {
                [OrderStatus.OrderPlaced]: "Order Placed",
                [OrderStatus.OrderPreparation]: "Order Preparation",
                [OrderStatus.OrderConfirmed]: "Order Confirmed",
                [OrderStatus.ReadyForPickup]: "Ready For Pickup",
                [OrderStatus.OrderInvoiced]: "Picked UpOrder",
                [OrderStatus.ReadyForShipment]: "Ready For Shipment",
                [OrderStatus.OutForDelivery]: "Out For Delivery",
                [OrderStatus.Delivered]: "Delivered",
                [OrderStatus.Cancelled]: "Cancelled",
                [OrderStatus.None]: "None",
            };
            const key = `${hopItem.item_id}***${hopItem.vendor_id}`;
            return {
                id: hopItem.id,
                itemId: hopItem.item_id,
                itemName: hopItem.item_name,
                imageUrl: hopItem.item_image,
                upc: +hopItem.upc,
                mrp: +hopItem.maximum_retail_price,
                sellingPrice: +hopItem.selling_price,
                orderNumber: hopItem.order_number,
                vendorId: hopItem.vendor_id,
                unitWeight: +hopItem.weight / +hopItem.quantity,
                customerId: hopItem.customer_id,
                quantity: +hopItem.quantity,
                weight: +hopItem.weight,
                pieces: Math.round(pieces),
                cases: Math.round(cases),
                createdTimeStamp: Date.parse(hopItem.created_at),
                createdDate: convertToYYYYMMDD(hopItem.created_at),
                updatedDate: convertToYYYYMMDD(hopItem.updated_at),
                orderStatusId: +hopItem.order_status_id,
                orderStatusLabel: hopOrderStatus[+hopItem.order_status_id],
                transitMode: +hopItem.transit_mode,
                fulfillmentType: +hopItem.fulfilment_type,
                returnQty: 0,
                qtyAfterEdit: 0,
                modifiedQty: 0,
                vendorName: hopItem.vendor_name,
                vendorBusinessName: hopItem.vendor_business_name,
                orderDate: convertToYYYYMMDD(hopItem.order_date),
                itemKey: key,
                vendorBusinessTypeId: +hopItem.vendor_business_type_id,
                orderAmount: +(+hopItem.order_amount).toFixed(2),
                orderOutstandingAmount: +hopItem.outstanding_amount,
                logisticsStatusId: +hopItem.logistics_status_id,
                shippingChargesCustomerRounded: +hopItem.shipping_charges_customer_rounded,
                shippingChargesCustomerTotal: +hopItem.shipping_charges_customer_total,
                couponDiscountAmount:+hopItem.coupon_discount_amount || 0,
            };
        });

        return res.filter((i) => i.quantity > 0);
    }
}
