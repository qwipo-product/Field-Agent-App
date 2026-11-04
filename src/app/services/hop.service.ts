import { Injectable } from "@angular/core";
import { ApplicationStateService, formatAddress, PointMode, PointType } from "../common";
import { HttpClient } from "@angular/common/http";
import { BaseConfig } from "../base-config";
import { DEOrderProduct, HopFilters, Order, QFFReturnSummery, QFFReturnSummeryResponse, ReturnOrderInput, StoreReturnOrderInput, TripHopMappedResponse, TripHopResponse, TripHopSummaryMappedResponse, TripHopSummaryResponse } from "../entities/hop";
import { lastValueFrom } from "rxjs";
import { QFFReturnHop, QFFReturnHopResponse, Resource } from "../entities/returns";
import { getLogisticsApiUrl } from "../constants/end-points";
import { ItemsView, OrderToModify } from "../entities";
import { BaseService } from "./base.service";
import { HopAttemptHistoryRequest } from "../entities/hop-re-attempt";
import { fileService } from "../constants/end-points";

@Injectable({
    providedIn: "root"
})
export class HopService extends BaseService {
    BASE_LOGISTICS_URL: string;
    FILE_BASE_URL : string;

    constructor(
        protected http: HttpClient,
        protected baseConfig: BaseConfig,
        private appState: ApplicationStateService
    ) {
        super(http, baseConfig);
        this.BASE_LOGISTICS_URL = getLogisticsApiUrl(this.baseConfig.ENV);
        this.FILE_BASE_URL = fileService(this.baseConfig.ENV);
    }


    async getHopsByFilters(filters: HopFilters): Promise<TripHopMappedResponse[] | []> {
        try {
            const url = `${this.BASE_LOGISTICS_URL}/hops/filters`;
            const response = await lastValueFrom(this.post(url, filters));

            if (!response) {
                return [];
            }

            return this.mapToHopResponse(response)

        } catch (error) {
            console.log("Error in getHopsByFilters ::::: ", error);
            return [];
        }
    }

    async getHopSummary(hopId: string): Promise<TripHopSummaryMappedResponse | null>  {
        try {
            const url = `${this.BASE_LOGISTICS_URL}/hops/${hopId}/summary`;
            const response = await lastValueFrom(this.get(url));

            if (!response) {
                return null;
            }

            return this.mapToSummaryResponse(response)

        } catch (error) {
            console.log("Error in getHopSummary ::::: ", error);
            return null;
        }

    }

    private mapToSummaryResponse(res: TripHopSummaryResponse): TripHopSummaryMappedResponse {

        return {
            tripId: res.trip_id,
            targetDate: res.target_date,
            hopId: res.hop_id,
            tripNumber: res.trip_number,
            cluster: res.cluster,
            sequence: res.sequence,
            source: res.source,
            tripStatus: res.trip_status,
            pointId: res.point_id,
            pointName: res.point_name,
            pointBusinessName: res.point_business_name,
            pointMobileNumber: res.point_mobile_number,
            pointAddress: res.point_address,
            pointLat: res.point_lat,
            pointLng: res.point_lng,
            otp: res.otp,
            hopStatus: res.hop_status,
            stopNumber: res.stop_number,
            pointMode: res.point_mode,
            pointType: res.point_type,
            hopCreatedAt: res.hop_created_at,
            hopUpdatedAt: res.hop_updated_at,
            ordersCount: res.orders_count,
            skusCount: res.skus_count,
            weight: res.weight,
            dispatchValue: res.dispatch_value || 0,
            customerReturns: res.customer_returns || 0,
            vendorPickups: res.vendor_pickups || 0,
            vendorReturns: res.vendor_returns || 0,
            onlinePayments: res.online_payments || 0,
            cashCollections: res.cash_collections || 0,
            deliveryAgentId: ''// TODO
        }
    }


    private mapToHopResponse(hops: TripHopResponse[]): TripHopMappedResponse[] {
        const transformedHops = hops.map((res) => ({

            tripId: res.trip_id,
            targetDate: res.target_date,
            hopId: res.hop_id,
            tripNumber: res.trip_number,
            cluster: res.cluster,
            sequence: res.sequence,
            source: res.source,
            deliveryAgentId: res.delivery_agent_id,
            tripStatus: res.trip_status,
            pointId: res.point_id,
            pointName: res.point_name,
            pointBusinessName: res.point_business_name,
            pointMobileNumber: res.point_mobile_number,
            pointAddress: res.point_address,
            pointLat: res.point_lat,
            pointLng: res.point_lng,
            otp: res.otp,
            hopStatus: res.hop_status,
            stopNumber: res.stop_number,
            pointMode: res.point_mode,
            pointType: res.point_type,
            hopCreatedAt: res.hop_created_at,
            hopUpdatedAt: res.hop_updated_at,
            ordersCount: res.orders_count,
            skusCount: res.skus_count,
            weight: res.weight
        }));
        transformedHops.sort((a, b) => {
            if (a.hopStatus !== b.hopStatus) {
                return a.hopStatus - b.hopStatus;
            } else {
                return a.stopNumber - b.stopNumber;
            }
        });

        return transformedHops;
    }

    async updateHopStatus(hopId: string, hopStatus: number): Promise<boolean> {
        const hopUrl: string = `${this.BASE_LOGISTICS_URL}/hops/${hopId}/status`;
        const body = { status: +hopStatus };
        try {
            const response = await lastValueFrom(this.put(hopUrl, body, {}));

            return response.success || false;
        } catch (error) {
            return false;
        }
    }

    async updateHopItems(hopId: string, order: Order[], isReturn: boolean): Promise<any> {
        try {
            const url: string = `${this.BASE_LOGISTICS_URL}/hops/${hopId}/hop_items`;
            const updateReturnHopInput = this.mapUpdateHopItems(order, isReturn);
            const response = await lastValueFrom(this.put(url, updateReturnHopInput, {}));

            return response;
        } catch (error) {
            console.log("updateHopItems error", error);
            return [];
        }
    }

    async createReturnHop(
        tripId: string,
        order: OrderToModify[],
        resource: Resource,
        highestStopNumber: number,
        item: ItemsView
    ): Promise<any> {
        try {
            const url: string = `${this.BASE_LOGISTICS_URL}/hops`;
            const returnHopInput = await this.mapReturnHopItems(
                tripId,
                order,
                resource,
                highestStopNumber,
                item
            );
            const response = await lastValueFrom(
                this.post(url, returnHopInput)
            );
            return response;
        } catch (error) {
            console.log("createPayment error", error);
            throw error;
        }
    }

    private mapUpdateHopItems(orders: Order[], isReturn: boolean) {
        return orders.flatMap((order) =>
            order.items.map((item) => ({
                item_id: item.itemId,
                order_number: order.orderNumber,
                quantity: isReturn ? item.quantity : item.modifiedQty,
                weight: item.weight,
            }))
        );
    }

    async mapReturnHopItems(
        tripId: string,
        orders: OrderToModify[],
        resource: Resource,
        highestStopNumber: number,
        item: ItemsView
    ) {
        const mappedOrders = {
            trip_id: tripId,
            point_id: resource.warehouse_id,
            point_name: resource.warehouse_name, //"WareHouse",
            point_business_name: "Qwipo",
            point_mobile_number: "9000012340",
            point_address:
                "Plot 21, Lothkunta Road, Old Alwal, Hyderabad, ",
            point_lat: 17.45,
            point_lng: 78.434,
            status: 1,
            otp: this.generateUnique4DigitNumber().toString(),
            stop_number: highestStopNumber + 1,
            point_mode: PointMode.RETURN,
            point_type: PointType.WAREHOUSE,
            hopItems: orders.flatMap((order) => ({
                item_id: item.itemId,
                item_name: item.itemName,
                item_image: item.imageUrl,
                upc: item.upc,
                maximum_retail_price: item.mrp,
                selling_price: item.saleValue,
                order_number: order.orderNumber,
                quantity: order.quantity,
                weight: item.unitWeight * order.quantity,
            })),
        };

        return mappedOrders;
    }
    private generateUnique4DigitNumber = () => {
        const generatedNumbers = new Set();

        while (true) {
            const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generate random 4-digit number
            if (!generatedNumbers.has(randomNumber)) {
                generatedNumbers.add(randomNumber);
                return randomNumber;
            }
        }
    };


    async updateHopItemsReturn(hopId: string, payload: any[]): Promise<any> {
        try {
            const url: string = `${this.BASE_LOGISTICS_URL}/hops/add_hop_items/${hopId}`;
            const response = await lastValueFrom(this.post(url, payload));

            return response;
        } catch (error) {
            console.log("updateHopItems error", error);
            throw error;
        }
    }

    async createReturnHopWholeOrder(
        tripId: string,
        order: ItemsView[],
        resource: Resource,
        highestStopNumber: number
    ): Promise<any> {
        try {
            const url: string = `${this.BASE_LOGISTICS_URL}/hops`;
            const returnHopInput = await this.mapReturnHopItemsWholeOrder(tripId, order, resource, highestStopNumber);
            const response = await lastValueFrom(this.post(url, returnHopInput));

            return response;
        } catch (error) {
            console.log("createPayment error", error);
            throw error;
        }
    }

    async mapReturnHopItemsWholeOrder( tripId: string, orderNeedToReturn: ItemsView[], resource: Resource, highestStopNumber: number ) {
        const data = orderNeedToReturn.flatMap((item) =>
            item.orders.map((order) => ({
                item_id: item.itemId,
                item_name: item.itemName,
                item_image: item.imageUrl,
                upc: item.upc,
                maximum_retail_price: item.mrp,
                selling_price: item.saleValue,
                order_number: order.orderNumber,
                quantity: order.qty,
                weight: item.unitWeight * order.qty,
            }))
        );

        const mappedOrders = {
            trip_id: tripId,
            point_id: resource.warehouse_id,
            point_name: resource.warehouse_name, //"WareHouse",
            point_business_name: "Qwipo",
            point_mobile_number: "9000012340",
            point_address:
                "Plot 21, Lothkunta Road, Old Alwal, Hyderabad, ",
            point_lat: 17.45,
            point_lng: 78.434,
            status: 1,
            otp: this.generateUnique4DigitNumber().toString(),
            stop_number: highestStopNumber + 1,
            point_mode: PointMode.RETURN,
            point_type: PointType.WAREHOUSE,
            hopItems: data,
        };

        return mappedOrders;
    }


    private async mapProductReturnHopItems(
        tripId: string,
        returnQty: number,
        resource: Resource,
        highestStopNumber: number,
        item: DEOrderProduct
    ) {
        const mappedOrders = {
            trip_id: tripId,
            point_id: resource.warehouse_id,
            point_name: resource.warehouse_name, //"WareHouse",
            point_business_name: "Qwipo",
            point_mobile_number: "9000012340",
            point_address:
                "Plot 21, Lothkunta Road, Old Alwal, Hyderabad, ",
            point_lat: 17.45,
            point_lng: 78.434,
            status: 1,
            otp: this.generateUnique4DigitNumber().toString(),
            stop_number: highestStopNumber + 1,
            point_mode: PointMode.RETURN,
            point_type: PointType.WAREHOUSE,
            hopItems: {
                item_id: item.itemId,
                item_name: item.itemName,
                item_image: item.imageUrl,
                upc: item.upc,
                maximum_retail_price: item.mrp,
                selling_price: item.selling_price,
                order_number: item.orderNumber,
                quantity: returnQty,
                weight: item.unitWeight * returnQty,
            },
        };

        return mappedOrders;
    }

    async createProductReturnHop(
        tripId: string,
        returnQty: number,
        resource: Resource,
        highestStopNumber: number,
        item: DEOrderProduct
    ): Promise<any> {
        try {
            const url: string = `${this.BASE_LOGISTICS_URL}/hops`;
            const returnHopInput = await this.mapProductReturnHopItems(
                tripId,
                returnQty,
                resource,
                highestStopNumber,
                item
            );

            const response = await lastValueFrom(this.post(url, returnHopInput));
            return response;
        } catch (error) {
            console.log("createPayment error", error);
            throw error;
        }
    }

    private async mapOrdersReturnHopItemsWholeOrder(
        tripId: string,
        orderNeedToReturn: ReturnOrderInput[],
        resource: Resource,
        highestStopNumber: number
    ) {
        const data = orderNeedToReturn.flatMap((item) =>
            item.products.map((order) => ({
                item_id: order.itemId,
                item_name: order.itemName,
                item_image: order.imageUrl,
                upc: order.upc,
                maximum_retail_price: order.mrp,
                selling_price: order.selling_price,
                order_number: order.orderNumber,
                quantity: order.quantity,
                weight: order.unitWeight * order.quantity,
            }))
        );
        const wareHouseAddress = formatAddress(this.appState.fieldAgent.locationInfo);
        const mappedOrders = {
            trip_id: tripId,
            point_id: resource.warehouse_id,
            point_name: resource.warehouse_name, //"WareHouse",
            point_business_name: "Qwipo",
            point_mobile_number: "9000012340",
            point_address: wareHouseAddress,
            point_lat: this.appState.fieldAgent.locationInfo.latitude,
            point_lng: this.appState.fieldAgent.locationInfo.longitude,
            status: 1,
            otp: this.generateUnique4DigitNumber().toString(),
            stop_number: highestStopNumber + 1,
            point_mode: PointMode.RETURN,
            point_type: PointType.WAREHOUSE,
            hopItems: data,
        };

        return mappedOrders;
    }

    async createOrdersReturnHopWholeOrder(
        tripId: string,
        order: ReturnOrderInput[],
        resource: Resource,
        highestStopNumber: number
    ): Promise<any> {
        try {
            const url: string = `${this.BASE_LOGISTICS_URL}/hops`;
            const returnHopInput = await this.mapOrdersReturnHopItemsWholeOrder(
                tripId,
                order,
                resource,
                highestStopNumber
            );
            const response = await lastValueFrom(
                this.post(url, returnHopInput)
            );
            return response;
        } catch (error) {
            console.log("createPayment error", error);
            throw error;
        }
    }


    async createReturnToWareHouse(
        tripId: string,
        order: StoreReturnOrderInput[],
        resource: Resource,
        highestStopNumber: number
    ): Promise<any> {
        try {
            const url: string = `${this.BASE_LOGISTICS_URL}/hops`;
            const returnHopInput = await this.mapToWareHouseDetails(
                tripId,
                order,
                resource,
                highestStopNumber
            );

            const response = await lastValueFrom(
                this.post(url, returnHopInput)
            );
            return response;
        } catch (error) {
            console.log("createPayment error", error);
            throw error;
        }
    }

    async mapToWareHouseDetails(
        tripId: string,
        orderNeedToReturn: StoreReturnOrderInput[],
        resource: Resource,
        highestStopNumber: number
    ) {
        const data = orderNeedToReturn.flatMap((item) =>
            item.products.map((order) => ({
                item_id: order.itemId,
                item_name: order.itemName,
                item_image: order.imageUrl,
                upc: order.upc,
                maximum_retail_price: order.mrp,
                selling_price: order.sellingPrice,
                order_number: order.orderNumber,
                quantity: order.quantity,
                weight: order.weightPerUnit * order.quantity,
            }))
        );


        const wareHouseAddress = formatAddress(this.appState.fieldAgent.locationInfo);
        const mappedOrders = {
            trip_id: tripId,
            point_id: resource.warehouse_id,
            point_name: resource.warehouse_name,
            point_business_name: resource.warehouse_name,
            point_mobile_number: "N/A",
            point_address: wareHouseAddress,
            point_lat: this.appState.fieldAgent.locationInfo.latitude,
            point_lng: this.appState.fieldAgent.locationInfo.longitude,
            status: 1,
            otp: this.generateUnique4DigitNumber().toString(),
            stop_number: +highestStopNumber + 1,
            point_mode: PointMode.RETURN,
            point_type: PointType.WAREHOUSE,
            hopItems: data,
        };

        return mappedOrders;
    }

    async getVendorReturnHop(tripId: string, vendorId: string): Promise<QFFReturnHop | null> {
        try {
            const url = `${this.BASE_LOGISTICS_URL}/hops/check_return_hop/tripId/${tripId}/vendor/${vendorId}`;
            console.log("url", url);

            const response = await lastValueFrom(this.get(url, {})) as QFFReturnHopResponse;

            return response?.data || null;
        } catch (error) {
            throw error;
        }
    }

    async getHopsQFFByTripId(tripId: string, vendorId: string): Promise<QFFReturnSummery> {
        try {
            const url = `${this.BASE_LOGISTICS_URL}/trips/vendor_reco_summary/tripId/${tripId}/vendor/${vendorId}`;
            const response = await lastValueFrom(this.get(url)) as QFFReturnSummeryResponse;

            // Validate response data
            if (!response || !response.data) {
                throw new Error('Invalid response: Missing data from logistics service');
            }
            const dispatchValue = response.data.dispatch_value ?? 0;
            const sum = (response.data.online_payment ?? 0) + (response.data.cash ?? 0) + (response.data.return_value ?? 0);
            const balance = dispatchValue - sum;
            const result: QFFReturnSummery = {
                dispatchValue: dispatchValue,
                onlinePayment: response.data.online_payment ?? 0,
                returnValue: response.data.return_value ?? 0,
                cash: response.data.cash ?? 0,
                balance: Math.round(balance)
            };

            return result;
        } catch (error) {
            throw new Error(`QFF service error: ${error}`);
        }
    }

    async createQFFReturnToWareHouse( tripId: string, order: StoreReturnOrderInput[], vendorHop: TripHopMappedResponse, highestStopNumber: number): Promise<any> {
        try {
            const url: string = `${this.BASE_LOGISTICS_URL}/hops`;
            const returnHopInput = await this.mapQFFToWareHouseDetails( tripId, order, vendorHop, highestStopNumber);
            const response = await lastValueFrom(this.post(url, returnHopInput));

            return response;
        } catch (error) {
            console.log("createPayment error", error);
            throw error;
        }
    }

    async mapQFFToWareHouseDetails(
        tripId: string,
        orderNeedToReturn: StoreReturnOrderInput[],
        vendorHop: TripHopMappedResponse,
        highestStopNumber: number
    ) {
        const data = orderNeedToReturn.flatMap((item) =>
            item.products.map((order) => ({
                item_id: order.itemId,
                item_name: order.itemName,
                item_image: order.imageUrl,
                upc: order.upc,
                maximum_retail_price: order.mrp,
                selling_price: order.sellingPrice,
                order_number: order.orderNumber,
                quantity: order.quantity,
                weight: order.weightPerUnit * order.quantity,
            }))
        );


        const mappedOrders = {
            trip_id: tripId,
            point_id: vendorHop.pointId,
            point_name: vendorHop.pointName,
            point_business_name: vendorHop.pointBusinessName,
            point_mobile_number: "N/A",
            point_address: vendorHop.pointAddress,
            point_lat: this.appState.fieldAgent.locationInfo.latitude,
            point_lng: this.appState.fieldAgent.locationInfo.longitude,
            status: 1,
            otp: this.generateUnique4DigitNumber().toString(),
            stop_number: +highestStopNumber + 1,
            point_mode: PointMode.RETURN,
            point_type: PointType.VENDOR,
            hopItems: data,
        };

        return mappedOrders;
    }


    async optimizeRoute(payLoad: {point_lat: number,point_lng: number,deliveryAgentId : string}): Promise<boolean> {
        try {
            const url: string = `${this.BASE_LOGISTICS_URL}/hops/trips_hop_optimize`;
            const response = await lastValueFrom(this.post(url, payLoad));
            return response;
        } catch (error) {
            console.log("Error in optimizeRoute ::::: ", error);
            return false
        }
    }


    async createHopAttemptHistory(payLoad : HopAttemptHistoryRequest) {
        try {
            const url: string = `${this.BASE_LOGISTICS_URL}/hops/hop_attempt_history`;
            const response = await lastValueFrom(this.post(url, payLoad));
            return response;
        } catch (error) {
            console.log("Error in createHopAttemptHistory ::::: ", error);
            return false
        }
    }


    async uploadReAttemptActionImage(hopId: string, file: any, imageType: string) {
        try {
            const fullUrl = `${this.FILE_BASE_URL}/images/upload_action_image`;
            const payLoad: any = {
                "fileName": `${hopId}-${Date.now()}`,
                "fileExtension": imageType,
                "fileData": file
            }
            const response = await lastValueFrom(this.put(fullUrl, payLoad, {}));

            return response?.data?.url || '';
        } catch (error) {
            console.log("Error in uploadReAttemptActionImage ::::: ", error);
            return '';
        }
    }

    async createHopAttemptHistoryWithTransaction(id: string) {

        try {
            const fullUrl = `${this.BASE_LOGISTICS_URL}/hops/post_message_to_re_attempt_queue`;
            const payLoad: any = {
                "id": id,
            }
            const response = await lastValueFrom(this.post(fullUrl, payLoad));
            return response;

        } catch (error) {
            console.log("Error in createHopAttemptHistoryWithTransaction ::::: ", error);
            return ''
        }



    }





}
