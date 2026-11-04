import { Component, OnInit, ViewChild, ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';
import { webViewSrcAssets } from '../../../../app/common/app-common';
import { NativeScriptCommonModule, NativeScriptFormsModule } from '@nativescript/angular';
import { isIOS,loaderOptions } from "../../../../app/utils";
import { Page } from '@nativescript/core';
import { ApplicationStateService } from '../../../../app/common/application-state-service';
import * as indicator from "@nstudio/nativescript-loading-indicator";
import { showToast } from '../../../../app/common/utility';
import { UserService } from '~/app/services/user.service';
const loader = new indicator.LoadingIndicator();

@Component({
    standalone: true,
    moduleId: module.id,
    selector: "mobile-number-component",
    templateUrl: "mobile-number.component.html",
    imports: [NativeScriptCommonModule, ReactiveFormsModule, NativeScriptFormsModule],
    schemas: [NO_ERRORS_SCHEMA]
})
export class MobileNumberComponent implements OnInit {
    registration: FormGroup;
    showIOS: boolean;
    enableLoginButton: boolean = false;

    @ViewChild('mobileNumberInput', { static: false }) mobileNumberInput!: ElementRef;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private page: Page,
        private appState: ApplicationStateService,
        private userService : UserService
    ) {
        this.page.actionBarHidden = true;
        this.registration = this.fb.group({
            mobileNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
        });
        this.showIOS = isIOS() ? true : false;

    }

    ngOnInit(): void { }

    onMobileNumberChange(value: string): void {
        const sanitizedValue = value.replace(/\D/g, '');

        if (sanitizedValue.length > 10) {
            this.registration.controls['mobileNumber'].setValue(sanitizedValue.slice(0, 10));
        } else {
            this.registration.controls['mobileNumber'].setValue(sanitizedValue);
        }
        this.enableLoginButton = this.isValidMobileNumber(sanitizedValue);

    }

    isValidMobileNumber(value: string): boolean {
        const phoneRegex = /^[6-9]\d{9}$/; // Validates a 10-digit Indian mobile number
        return phoneRegex.test(value);
    }


    async sendOtp(): Promise<void> {
        if (this.enableLoginButton) {
            console.log('OTP sent to:', this.registration.value.mobileNumber);
            this.appState.loginMobileNumber = this.registration.value.mobileNumber;
            loaderOptions.message = "Sending OTP.....";
            loader.show(loaderOptions);
            try {
                const response = await this.userService.sendOTPCode(
                    this.registration.value.mobileNumber
                );
                if (!response) {
                    loader.hide();
                    showToast("Something went wrong to send verification code.");
                    return;
                }
                this.appState.loginMobileNumber = this.registration.value.mobileNumber
                showToast(`OTP Sent Successfully to your Mobile Number (${this.appState.loginMobileNumber}).`);
                loader.hide();
                this.router.navigate(['/mobile-otp-component'])

            } catch (error) {
                loader.hide();
                showToast("Something went wrong to send verification code.");
            }

        }
    }

    navigation() {
        const navigationExtras: NavigationExtras = {
            queryParams: webViewSrcAssets[1],
        };
        this.router.navigate(['/web-view'], navigationExtras);
    }

}
