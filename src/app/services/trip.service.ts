import { Injectable } from "@angular/core";
import { TripListMappedResponse, TripListResponse, TripPayload, TripSummaryMappedResponse, TripSummaryResponse } from "../entities/trip";
import { Status } from "../entities/trip-summary";
import { formatWeight } from "../common";
import { HttpClient } from "@angular/common/http";
import { BaseConfig } from "../base-config";
import { lastValueFrom, map } from "rxjs";
import { BaseService } from "./base.service";
import { getLogisticsApiUrl } from "../constants/end-points";

@Injectable({
    providedIn: "root"
})
export class TripService extends BaseService {
    LOGISTICS_BASE_URL: string;

    constructor(
        protected http: HttpClient,
        protected baseConfig: BaseConfig,
    ) {
        super(http, baseConfig);
        this.LOGISTICS_BASE_URL = getLogisticsApiUrl(this.baseConfig.ENV);
    }

    async getTrips(payload: TripPayload): Promise<TripListMappedResponse[]> {
        try {
            const url = `${this.LOGISTICS_BASE_URL}/trips/filters`;
            const response = await lastValueFrom(this.post(url, payload));

            if (!response?.data?.length) {
                return [];
            }

            return this.mapToTripListResponse(response.data);
        } catch (error) {
            console.log("Error in getTrips:", error);
            return [];
        }
    }


    async getTripSummary(tripId: string): Promise<TripSummaryMappedResponse | null> {
        try {
            const url = `${this.LOGISTICS_BASE_URL}/trips/${tripId}/summary`;
            const response = await lastValueFrom(this.get(url));

            return this.mapToTripSummaryResponse(response);
        } catch (error) {
            console.log("Error in getTrips:", error);
            return null;
        }
    }


    async updateTripStatus(tripId: string, tripStatus: number) {
        try {
            const tripUrl = `${this.LOGISTICS_BASE_URL}/trips/${tripId}/status`;
            const body = { status: tripStatus };

            return await lastValueFrom(
                this.put(tripUrl, body).pipe(
                    map((response: Status) => {
                        return response;
                    })
                )
            );
        } catch (error) {
            console.log("Error in updateTripStatus ::: ", error);
            return null;
        }
    }

    async startTrip(tripId: string, agentId: string) {
        try {
            const tripUrl = `${this.LOGISTICS_BASE_URL}/trips/start`;
            const body = {
                agentId: agentId,
                tripId: tripId,
            };

            return await lastValueFrom(
                this.put(tripUrl, body).pipe(
                    map((response: Status) => {
                        return response;
                    })
                )
            );
        } catch (error) {
            console.log("Error in updateTripStatus ::: ", error);
            return null;
        }
    }

    async completeTrip(tripId: string, agentId: string) {
        try {
            const tripUrl = `${this.config.logisticsBaseUrl}/trips/complete`;
            const body = {
                agentId: agentId,
                tripId: tripId,
            };

            return await lastValueFrom(
                this.put(tripUrl, body).pipe(
                    map((response: Status) => {
                        return response;
                    })
                )
            );
        } catch (error) {
            console.log("Error in updateTripStatus ::: ", error);
            return null;
        }
    }






    private mapToTripListResponse(trips: TripListResponse[]): TripListMappedResponse[] {
        const statusOrder = { 2: 0, 1: 1, 3: 2, 4: 3 };

        return trips
            .sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
            .map((res) => ({
                createdAt: res.created_at,
                targetDate: res.target_date,
                id: res.id,
                name: res.name,
                cluster: res.cluster,
                sequence: res.sequence,
                source: res.source,
                tripNumber: res.trip_number,
                hops: res.hops,
                pickupHops: res.pickup_hops,
                deliveryHops: res.delivery_hops,
                returnHops: res.return_hops,
                weight: formatWeight(res.weight_kgs),
                deliveryAgentName: res.de_name || 'N/A',
                deliveryAgentMobileNumber: res.de_number || 'N/A',
                kms: res.kms,
                status: res.status,
                startTime: res.start_time,
                endTime: res.end_time,
                driverName: res.dr_name || 'N/A',
                driverNumber: res.dr_number || 'N/A',
                vehicleModel: res.vehicle_model || 0,
            }))
            .sort((a, b) => a.cluster.localeCompare(b.cluster) || a.sequence - b.sequence);
    }



    private mapToTripSummaryResponse(response: TripSummaryResponse): TripSummaryMappedResponse {

        return {
            tripId: response.trip_id,
            targetDate: response.target_date,
            cluster: response.cluster,
            sequence: response.sequence,
            source: response.source,
            tripNumber: response.trip_number,
            deName: response.de_name,
            deNumber: response.de_number,
            distance: response.distance,
            tripStatus: response.trip_status,
            startTime: response.start_time,
            endTime: response.end_time,
            hops: response.hops,
            pickupHops: response.pickup_hops,
            deliveryHops: response.delivery_hops,
            returnHops: response.return_hops,
            weight: response.weight,
            ordersCount: response.orders_count,
            skusCount: response.skus_count,
            dispatchValue: response.dispatch_value,
            customerReturns: response.customer_returns,
            vendorPickups: response.vendor_pickups,
            vendorReturns: response.vendor_returns,
            onlinePayments: response.online_payments,
            cashCollections: response.cash_collections,
            clusterSequence: `${response.cluster}_${response.sequence}`,
        }

    }


}
