import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BaseConfig } from "../base-config";
import { getItemQtyInCasesPieces } from "../common";
import { getCacheApiUrl, getOrdersApiUrl } from "../constants/end-points";
import { lastValueFrom, map } from "rxjs";
import {
    HopReturnItems,
    HopReturnItemsResponse,
    ReturnEntity,
    OrderReturnApiInput,
    getReturnReason,
} from "../entities/returns";
import { OrderModifyEntity } from "../entities/order";

import { request, HttpResponse } from "@nativescript/core/http";
import { path } from "@nativescript/core";
import { BaseService } from "./base.service";

@Injectable({
    providedIn: "root"
})
export class ReturnsService extends BaseService {
    controller: string;
    baseUrl: string;
    cacheUrl: string;
    constructor(http: HttpClient, baseConfig: BaseConfig) {
        super(http, baseConfig);
        this.baseConfig = baseConfig;
        this.baseUrl = getOrdersApiUrl(this.baseConfig.ENV);
        this.cacheUrl = getCacheApiUrl(this.baseConfig.ENV);
    }

    async getReturnReasons(): Promise<getReturnReason[]> {
        try {
            const url = `${this.cacheUrl}/core/return-reasons`;
            const response = await lastValueFrom(this.get(url, {}));

            if (response && response.data.length == 0) {
                return [];
            }
            const result: getReturnReason[] = response && response.data;

            return result;
        } catch (error) {
            console.log("response :");
            return [];
        }
    }
    // ReturnEntity
    async hopItemReturn(orderNumber: string, body: ReturnEntity): Promise<any> {
        try {
            const url: string = `${this.baseUrl}/orders/${orderNumber}/returns`;
            console.log("body :", body);

            const response = await lastValueFrom(this.post(url, body, {}));

            if (!response.success) {
                return [];
            }

            return response;
        } catch (error) {
            console.log("createPayment error", error);
            return [];
            // throw error;
        }
    }

    async returnOrder(body: OrderReturnApiInput[]): Promise<any> {
        try {
            const url: string = `${this.baseUrl}/orders/returns/bulk_orders`;

            const response = await lastValueFrom(this.post(url, body, {}));

            if (!response.success) {
                return [];
            }

            return response;
        } catch (error) {
            console.log("wholeOrdersReturn error", error);
            throw error;
        }
    }

    mapToReturnProducts(products: HopReturnItemsResponse[]): HopReturnItems[] {
        let res = products.map((r) => {
            const { pieces, cases } = getItemQtyInCasesPieces(
                +r.upc,
                +r.quantity
            );
            const key = `${r.sku_id}-${r.vendor_id}`;
            return {
                orderNumber: r.order_number,
                itemId: r.sku_id,
                mrp: r.mrp,
                sellingPrice: +r.selling_price,
                upc: r.upc,
                weightPerUnit: r.weight_per_unit,
                stockUOM: r.stock_uom,
                packageType: r.package_type,
                hsnCode: r.hsn_code,
                totalNetAmount: Math.round(+r.quantity * +r.selling_price), // + r.total_net_amount,
                totalWeight: +r.total_weight,
                imageUrl: r.image_url,
                quantity: +r.quantity,
                vendorName: r.vendor_name,
                createdTimeStamp: Date.parse(r.created_at),
                itemName: r.sku_name,
                pieces: pieces,
                cases: cases,
                vendorId: r.vendor_id,
                itemKey: key,
                originalQuantity: 0,// dummy value not required
                shippingChargesCustomerRounded:0,// dummy value not required
                oldCouponDiscountAmount:0,// dummy value not required
                newCouponDiscountAmount:0,// dummy value not required
            };
        });

        res.sort((a, b) => a.createdTimeStamp - b.createdTimeStamp);

        return res;
    }

    async getHopReturnProducts(id: string): Promise<HopReturnItems[]> {
        try {
            const url = `${this.config.logisticsBaseUrl}/hops/${id}/hop_returns`;
            const response: HopReturnItemsResponse[] = await lastValueFrom(
                this.get(url, {})
            );
            if (response.length == 0) {
                return [];
            }
            const result: HopReturnItems[] = this.mapToReturnProducts(response);

            return result;
        } catch (error) {
            console.log("response :");
            return [];
        }
    }

    async orderModify(
        orderId: string,
        body: OrderModifyEntity[]
    ): Promise<any> {
        try {
            const url: string = `${this.baseUrl}/orders/${orderId}/items_modify`;
            console.log("body :", body);
            return await lastValueFrom(
                this.post(url, body).pipe(
                    map((response: any) => {
                        console.log("orderModify orderModify:-----", response);
                        if (!response.success) {
                            return [];
                        }

                        return response;
                    })
                )
            );
        } catch (error) {
            console.log("orderModify error", error);
            throw error;
        }
        // downloadsFolder = new Folder("/storage/emulated/0/Download");
    }

    async downloadIndent(input: any) {
        try {
            const url: string =
                getOrdersApiUrl(this.baseConfig.ENV) +
                "/invoice/download_invoices";
            console.log("Requesting file download with input:", input);

            const response: HttpResponse = await request({
                url: url,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                content: JSON.stringify(input),
            });

            console.log("Response headers:", response.headers);
            console.log(
                "Response content length:",
                response.content ? response.content : 0
            );

            if (response.statusCode === 200 && response.content) {
                if (
                    response.headers["Content-Type"].includes("application/pdf")
                ) {
                    const fileName = "qwipo.pdf";
                    const folderPath = path.join(
                        android.os.Environment.getExternalStoragePublicDirectory(
                            android.os.Environment.DIRECTORY_DOWNLOADS
                        ).toString(),
                        "Qwipo"
                    );
                    const filePath = path.join(folderPath, fileName);
                    console.log("File path for saving:", filePath);

                    // const file = File.fromPath(filePath);
                    // file.writeSync(response.content);
                    response.content.toFile(filePath);
                    console.log("File saved at:", filePath);
                    return filePath;
                } else {
                    console.log("Error: Unexpected content type");
                    return null;
                }
            } else {
                console.log(
                    "Error downloading file. Status code:",
                    response.statusCode
                );
                return null;
            }
        } catch (error) {
            console.error("Error during file write:", error);
            throw error;
        }
    }
}
