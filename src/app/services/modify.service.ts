import { Injectable } from "@angular/core";
import { ApplicationStateService } from "../common";
import { HttpClient } from "@angular/common/http";
import { BaseConfig } from "../base-config";
import { lastValueFrom } from "rxjs";
import {
    getInventoryUrl,
    getLogisticsApiUrl,
    getOrdersApiUrl,
    coreServiceUrl
} from "../constants/end-points";
import { OrderModifyBulk } from "../entities";
import { BaseService } from "./base.service";
import { ValidateStockUpdate } from "../entities/hop";
@Injectable({
    providedIn: "root"
})
export class ModifyService extends BaseService {
    baseUrl: string;
    ordersServiceUrl: string;
    inventoryUrl: string;
    coreServiceUrl: string;

    constructor(
        http: HttpClient,
        baseConfig: BaseConfig,
        appState: ApplicationStateService
    ) {
        super(http, baseConfig);
        this.baseConfig = baseConfig;
        this.baseUrl = getLogisticsApiUrl(this.baseConfig.ENV);
        this.ordersServiceUrl = getOrdersApiUrl(this.baseConfig.ENV);
        this.inventoryUrl = getInventoryUrl(this.baseConfig.ENV);
        this.coreServiceUrl = coreServiceUrl(this.baseConfig.ENV);

    }

    async orderModifyBulk(payload: OrderModifyBulk[]) {
        try {
            const url: string = `${this.ordersServiceUrl}/orders/bulk_orders_modify`;
            const response = await lastValueFrom(this.post(url, payload));

            return response;
        } catch (error) {
            throw error;
        }
    }
    async updateHopItems(
        hopId: string,
        payload: {
            item_id: string;
            order_number: string;
            quantity: number;
            weight: number;
        }[]
    ) {
        try {
            const url: string = `${this.baseUrl}/hops/${hopId}/hop_items`;
            const response = await lastValueFrom(this.put(url, payload));

            return response;
        } catch (error) {
            throw error;
        }
    }

    async decrementQtyByOrderModify(
        skuId: string,
        vendorId: string,
        qty: number
    ) {
        try {
            const payload = [
                {
                    sku_id: skuId,
                    vendor_id: vendorId,
                    qty: qty,
                },
            ];
            const response = await lastValueFrom(
                this.post(
                    `${this.inventoryUrl}/api/inventory/decrement/stock`,
                    payload
                )
            );
            return response;
        } catch (error) {
            throw error;
        }
    }

    async updateInventory(skuId: string, vendorId: string, qty: number) {
        try {
            const payload = {
                sku_id: skuId,
                vendor_id: vendorId,
                quantity: qty,
            };
            const response = await lastValueFrom(
                this.post(`${this.inventoryUrl}/api/inventory/insert`, payload)
            );
            return response;
        } catch (error) {
            throw error;
        }
    }

    async inventoryUpdateCheck(payload: ValidateStockUpdate) {
        try {
            const response = await lastValueFrom(
                this.post(
                    `${this.coreServiceUrl}/stock/validate_update`,
                    payload
                )
            );

            return response;
        } catch (error) {
            console.log('inventory check error ::::: ', error)
            return {
                inventoryQty: 0,
                tripsQty: 0,
                updateRequired: false,
            }
        }
    }
}
