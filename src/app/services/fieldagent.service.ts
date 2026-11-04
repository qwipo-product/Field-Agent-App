import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BaseService } from "./base.service";
import { BaseConfig, IConfig } from "~/app/base-config";
import { getCacheApiUrl } from "~/app/constants";
import { lastValueFrom, map } from "rxjs";
import { FieldAgent, FieldAgentResponse } from "../entities/fieldAgent";
import { getLogisticsApiUrl } from "../constants/end-points";

export interface AppVersion {
    android: string;
    ios: string;
}

declare var com: any;

@Injectable({
    providedIn: "root"
})
export class FieldAgentService extends BaseService {
    private baseUrl: string;
    private logisticsUrl: string

    config: IConfig;
    date: Date = new Date();
    constructor(protected baseConfig: BaseConfig, protected http: HttpClient) {
        super(http, baseConfig);
        this.baseUrl = getCacheApiUrl(this.baseConfig.ENV);
        this.logisticsUrl = getLogisticsApiUrl(this.baseConfig.ENV);

    }

    async userByMobileNumber(mobileNumber: string): Promise<FieldAgent> {
        try {
            const url = `${this.logisticsUrl}/resource/get_by_mobile_number/${mobileNumber}`;
            const response = await lastValueFrom(this.get(url, {}));

            return (
                (response && response.data && this.mapFa(response.data)) || null
            );
        } catch (error) {
            return null;
        }
    }

    private mapFa(data: FieldAgentResponse): FieldAgent {
        return {
            id: data.id,
            name: data.name,
            mobileNumber: data.mobileNumber,
            address: data.address,
            areaName: data.areaName,
            landMark: data.landMark,
            latitude: data.latitude,
            longitude: data.longitude,
            designation: +data.designation,
            supplierName: data.supplierName,
            supplierType: +data.supplierType,
            contractMode: data.contractMode,
            status: data.status,
            location: data.location,
            locationInfo: data.locationInfo,
            city : data.city,
            state : data.state,
            pinCode : data.pinCode,
            country : data.country,
            email : data.email
        };
    }

    async getAgentTaggedWareHouse(id: string) {
        {
            try {
                const url = `${this.logisticsUrl}/resource/agent/${id}/warehouse`;

                const response = await lastValueFrom(this.get(url, {}));

                return (response && response.data) || null;
            } catch (error) {
                console.log("createPayment error", error);
            }
        }
    }
}
