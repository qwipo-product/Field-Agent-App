import { HttpClient } from "@angular/common/http";
import { BaseConfig } from "~/app/base-config";
import { Injectable } from "@angular/core";
import { lastValueFrom, map } from "rxjs";
import { BaseService } from "./base.service";
import { coreServiceUrl, getLogisticsApiUrl, getPaymentsApiUrl } from "../constants/end-points";
import { GateWayType, MerchantBusinessType, PaymentType } from "../common";
@Injectable({
    providedIn: "root"
})
export class PaymentService extends BaseService {
    PAYMENT_BASE_URL: string;
    LOGISTICS_BASE_URL: string;
    CORE_BASE_URL: string;
    constructor(http: HttpClient, baseConfig: BaseConfig) {
        super(http, baseConfig);
        this.PAYMENT_BASE_URL = getPaymentsApiUrl(this.baseConfig.ENV);
        this.LOGISTICS_BASE_URL = getLogisticsApiUrl(this.baseConfig.ENV);
        this.CORE_BASE_URL = coreServiceUrl(this.baseConfig.ENV);
    }

    async updatePaymentCodStatus(inputObj: any) {
        try {
            const url = `${this.LOGISTICS_BASE_URL}/cod_collections`;

            const response = await lastValueFrom(this.post(url, inputObj, {}));

            return response;
        } catch (error) {
            throw error;
        }
    }

    async generateQrPaySharp(inputObj: any) {
        try {
            const url = `${this.PAYMENT_BASE_URL}/payments/initiate`;
            const response = await lastValueFrom(this.post(url, inputObj, {}));

            return (response && response.data) || {};
        } catch (error) {
            throw error;
        }
    }

    async insertRequestForPayment(inputObj: any) {
        try {
            const url = `${this.LOGISTICS_BASE_URL}/payment_request/create`;
            const response = await lastValueFrom(this.post(url, inputObj, {}));

            return response;
        } catch (error) {
            throw error;
        }
    }

    async getPaymentStatus(reqId: string, paymentId: string) {
        try {
            const url = `${this.PAYMENT_BASE_URL}/payments?requestId=${reqId}&paymentId=${paymentId}`;

            const response = await lastValueFrom(this.get(url, {}));

            return response && response.data;
        } catch (error) {
            throw error;
        }
    }

    async getPaymentGatewayStatus(reqId: string, paymentId: string) {
        try {
            const payload = {
                paymentId: paymentId,
                requestId: reqId,
                gatewayType: GateWayType.PaySharp,
            };
            const url = `${this.PAYMENT_BASE_URL}/payments/gateway_payment_status`;

            const response = await lastValueFrom(this.post(url, payload, {}));

            return response && response.data || {};
        } catch (error) {
            throw error;
        }
    }

    async getVendorPaymentOptions(vendorId: string) {
        try {
            const url = `${this.CORE_BASE_URL}/vendor/${vendorId}`;
            const response = await lastValueFrom(this.get(url, {}));

            return response?.data || [];


        } catch (error) {
            throw error;
        }
    }
}
