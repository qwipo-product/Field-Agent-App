import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BaseConfig } from "../base-config";
import { ApplicationStateService } from "../common";
import { getOrdersApiUrl, messageQueueService } from "../constants/end-points";
import { lastValueFrom, map } from "rxjs";
import { BaseService } from "./base.service";

@Injectable({
    providedIn: "root"
})
export class MessageQueueService extends BaseService {
    controller: string;
    baseUrl: string;

    constructor(http: HttpClient, baseConfig: BaseConfig) {
        super(http, baseConfig);
        this.baseConfig = baseConfig;
        this.baseUrl = getOrdersApiUrl(this.baseConfig.ENV);
    }

    async postMessageToMessageQueue(message: string, body: any) {
        const env = this.baseConfig.ENV;
        const url = `${messageQueueService(env)}/messagequeue/post`;
        const input = { messageType: message, input: JSON.stringify(body) };

        const response = await lastValueFrom(this.post(url, input));

        return response;
    }
}
