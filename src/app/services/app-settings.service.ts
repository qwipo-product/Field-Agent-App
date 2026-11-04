import { Injectable } from "@angular/core";
import { BaseConfig } from "../base-config";
import { lastValueFrom, map } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { ApplicationStateService } from "../common";
import { AppConfiguration } from "../entities/app-setting-response.model";
import { getCacheApiUrl } from "../constants";
import { BaseService } from "./base.service";

@Injectable({
    providedIn: "root"
})
export class AppSettingService extends BaseService {
    private BASE_URL: string;

    constructor(
        protected http: HttpClient,
        protected baseConfig: BaseConfig,
        private appState: ApplicationStateService
    ) {
        super(http, baseConfig);
        this.BASE_URL = getCacheApiUrl(this.baseConfig.ENV);
    }

    async getAppSettings(): Promise<AppConfiguration> {
        try {
            // const key = `appSettings`;
            // const localCacheSettings = await this.localCache.get(key);
            // if (localCacheSettings) {
            //     this.appState.appSettings = localCacheSettings;
            //     return localCacheSettings as AppConfiguration;
            // }

            const fullUrl: string = `${this.BASE_URL}/app_info/get/fa_app`;

            const response = await lastValueFrom(this.get(fullUrl, {}));

            if (response && response.data) {
                // await this.localCache.set(key, response.data);
                this.appState.appSettings = response.data;
                return response.data as AppConfiguration;
            }

            return null;
        } catch (error) {
            console.error("Error while fetching App settings data:", error);
            return null;
        }
    }
}
