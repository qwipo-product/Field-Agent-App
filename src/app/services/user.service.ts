import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";
import { BaseConfig } from "~/app/base-config";
import { lastValueFrom } from "rxjs";
import { getString, setString } from "@nativescript/core/application-settings";
import { coreServiceUrl } from "../constants/end-points";
import * as geolocation from "@nativescript/geolocation";
import { isAndroid, isIOS } from "~/app/utils";
import { Device } from "@nativescript/core/platform";
import { CoreTypes } from "@nativescript/core";



@Injectable({
    providedIn: "root"
})
export class UserService extends BaseService {
    private BASE_URL: string;

    constructor(protected http: HttpClient, protected baseConfig: BaseConfig) {
        super(http, baseConfig);
        this.BASE_URL = coreServiceUrl(this.baseConfig.ENV);
    }

    async sendOTPCode(mobileNumber: string): Promise<any> {
        try {
            if (this.isDevOrSpecial(mobileNumber)) {
                return true;
            }

            const url: string = `${this.BASE_URL}/otp/send`;
            const payload = {
                phone_number: mobileNumber,
            };

            const response = await lastValueFrom(this.post(url, payload, {}));

            return response && response.success;
        } catch (error) {
            console.log("error::", error);
            return false;
        }
    }

    async verifyOTP(
        mobileNumber: string,
        otp: string
    ): Promise<{ isValidOtp: boolean; message: string }> {
        try {
            if (this.isDevOrSpecial(mobileNumber)) {
                return { isValidOtp: true, message: "" };
            }
            const url: string = `${this.BASE_URL}/otp/verify`;

            const response = await lastValueFrom(
                this.post(url, { otp: otp, phone_number: mobileNumber }, {})
            );
            return {
                isValidOtp: response.success,
                message: response
                    ? ""
                    : `Verification Failed; Please enter valid OTP`,
            };
        } catch (error) {
            return {
                isValidOtp: false,
                message: `Sorry, there is a problem in letting you in. Please try again later.`,
            };
        }
    }

    loggedInUser() {
        try {
            const mobileNumber = getString("loggedInUser") ?? "";
            return mobileNumber;
        } catch (error) {
            return null;
        }
    }

    logOutUser() {
        try {
            return setString("loggedInUser", "");
        } catch (error) {
            return null;
        }
    }

    setLoggedInNumber(mobileNumber: string) {
        try {
            return setString("loggedInUser", mobileNumber.toString());
        } catch (error) {
            return null;
        }
    }

    private isDevOrSpecial(mobileNumber: string): boolean {
        return ["mock", "dev", "test", "staging"].includes(this.baseConfig.ENV);
    }



    async getCurrentLocation() {
        try {
            await geolocation.enableLocationRequest();

            const location: any = await geolocation.getCurrentLocation({
                desiredAccuracy: CoreTypes.Accuracy.high,
                timeout: isAndroid() ? 5000 : 20000,
            });
            let isMockLocation: boolean = false;
            if (isAndroid()) {
                const skdVersion: number =
                    Device.sdkVersion && +Device.sdkVersion;
                if (skdVersion <= 30) {
                    isMockLocation = location.android.isFromMockProvider();
                } else {
                    isMockLocation = location.android.isMock();
                }
            } else if (isIOS()) {
                if (location.horizontalAccuracy > 1000 || location.horizontalAccuracy < 0) {
                    isMockLocation = true;
                }
            }
            return {
                lat: location?.latitude ?? 0,
                long: location?.longitude ?? 0,
                isMockLocation,
                isEnableLocation: true,
            };
        } catch (error) {
            console.log("error:::", error);
            if (
                error ===
                '{"android.permission.ACCESS_FINE_LOCATION": false, "android.permission.ACCESS_COARSE_LOCATION": false}'
            ) {
                return { lat: 0, long: 0, isEnableLocation: false, isMockLocation: false };
            }

            const errorEntity: any = {
                error: error,
                deviceInfo: {
                    version: Device.sdkVersion && +Device.sdkVersion,
                },
                createdDate: new Date().getTime(),
            };

            return { lat: 0, long: 0, isEnableLocation: true, isMockLocation: false };
        }
    }
}
