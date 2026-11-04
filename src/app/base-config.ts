import { Injectable } from "@angular/core";
import { getLogisticsApiUrl } from "./constants/end-points";

export interface IConfig {
    webUrl: string;
    logisticsBaseUrl: string;
}

@Injectable({
    providedIn: 'root',
  })
export class BaseConfig {
    _current: IConfig;
    /** "mock": every API call is answered by app/mock/mock-backend.interceptor.ts. */
    ENV: string;
    get current(): IConfig {
        return this._current;
    }
    constructor() {
        this.ENV = "mock";
        this._current = {
            webUrl: "~/assets/legal/",
            logisticsBaseUrl: getLogisticsApiUrl(this.ENV),
        };
    }
}
