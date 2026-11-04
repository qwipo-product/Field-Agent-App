import { Injectable } from "@angular/core";
import { BaseConfig } from "../base-config";
import { lastValueFrom } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { setString } from "@nativescript/core/application-settings";
import { BaseService } from "./base.service";
import { authTokenServiceBaseUrl } from "../constants/end-points";

@Injectable({
    providedIn: "root"
})
export class AuthService extends BaseService {
    private BASE_URL: string;
    private AUTH_TOKEN_URL: string;


    constructor(protected http: HttpClient, protected baseConfig: BaseConfig) {
        super(http, baseConfig);
        this.AUTH_TOKEN_URL = `${authTokenServiceBaseUrl(this.baseConfig.ENV)}/auth`;
    }

    async generateApiToken(userId: string): Promise<any> {
        try {
            const url = `${this.AUTH_TOKEN_URL}/generate_token`;
            const response = await lastValueFrom(this.post(url, { "userId": userId, "userType": 3 }));// TODO
            const resultToken = response?.data?.token;
            setString("auth-token", resultToken);
            setString("refresh-token", resultToken);
            return response;
        } catch (error) {
            console.log("error in generateApiToken ::: ", error);
            throw error;
        }
    }




}
