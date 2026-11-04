import { SubFooterComponent } from './../../../shared/sub-footer/sub-footer-bar';
import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import { Page, TextField } from "@nativescript/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { NavigationExtras, Router } from "@angular/router";
import { ApplicationStateService } from "../../../../app/common/application-state-service";
import { showToast, showWarning } from "../../../../app/common/utility";
import { NativeScriptCommonModule, NativeScriptFormsModule } from "@nativescript/angular";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { isValidOTPNumber } from "~/app/utils/validations";
import { webViewSrcAssets } from "~/app/common/app-common";
import { loaderOptions } from "~/app/utils";
import { FieldAgent } from "../../../entities";
import { FieldAgentService } from "~/app/services/fieldagent.service";
import { UserService } from "~/app/services/user.service";

let LoadingIndicator = require("@nstudio/nativescript-loading-indicator").LoadingIndicator;
let loader = new LoadingIndicator();

@Component({
    standalone: true,
    moduleId: module.id,
    selector: "mobile-otp-component",
    templateUrl: "mobile-otp-component.html",
    imports: [NativeScriptCommonModule, ReactiveFormsModule, NativeScriptFormsModule],
    schemas: [NO_ERRORS_SCHEMA]
})
export class MobileOTPComponent implements AfterViewInit {
    otpForm: FormGroup;
    otpDigits: string[] = new Array(6).fill("");
    enableOtpButton: boolean = false;
    setOtpTimer: number = 30;
    isTimerCompleted: boolean = false;
    loginMobileNumber: string;
    otpCode: string;

    @ViewChild("firstDigit", { static: false }) firstDigit: ElementRef<TextField>;
    @ViewChild("secondDigit", { static: false }) secondDigit: ElementRef<TextField>;
    @ViewChild("thirdDigit", { static: false }) thirdDigit: ElementRef<TextField>;
    @ViewChild("fourthDigit", { static: false }) fourthDigit: ElementRef<TextField>;
    @ViewChild("fifthDigit", { static: false }) fifthDigit: ElementRef<TextField>;
    @ViewChild("sixthDigit", { static: false }) sixthDigit: ElementRef<TextField>;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private page: Page,
        private appState: ApplicationStateService,
        private fieldAgentService: FieldAgentService,
		private userService : UserService,
    ) {
        this.page.actionBarHidden = true;
        this.otpForm = this.fb.group({ password: ["", [Validators.required, Validators.minLength(6)]] });
    }

    ngOnInit(): void {
        this.loginMobileNumber = this.appState.loginMobileNumber;
        this.startOtpTimer();
    }

    ngAfterViewInit(): void {
        setTimeout(() => { // Introduce a delay
            this.focusFirstDigit();
        }, 50);
    }

    private focusFirstDigit(): void {
        if (this.firstDigit?.nativeElement) {
            this.firstDigit.nativeElement.focus();
        }
    }

    private startOtpTimer(): void {
        const timerInterval = setInterval(() => {
            this.setOtpTimer--;
            if (this.setOtpTimer <= 0) {
                this.isTimerCompleted = true;
                clearInterval(timerInterval);
            }
        }, 1000);
    }

    zeroPad(num: number | string, places: number) {
        const zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    }

    private joinOtpDigits(): void {
        const otpDigits = [];
        otpDigits.push(this.firstDigit.nativeElement.text);
        otpDigits.push(this.secondDigit.nativeElement.text);
        otpDigits.push(this.thirdDigit.nativeElement.text);
        otpDigits.push(this.fourthDigit.nativeElement.text);
        otpDigits.push(this.fifthDigit.nativeElement.text);
        otpDigits.push(this.sixthDigit.nativeElement.text);
        const otpCode = otpDigits.join("");
        this.getOTPNumber(otpCode)
    }


    getOTPNumber(value: string): void {
        this.otpCode = value;
        this.enableOtpButton = isValidOTPNumber(this.otpCode);
    }

    onTextChange(event: any, index: number): void {
        const inputValue = event.value;
        if (inputValue.length === 1) {
            if(isNaN(Number(inputValue))) {
                showWarning(`Warning !`, "Please enter a valid number.", "OK")
                return;
            }

            while (this.otpDigits.length <= index) {
                this.otpDigits.push('');
            }

            this.otpDigits[index] = inputValue;

            if (index < 5) {
                const nextField = this.getFieldByIndex(index + 1);

                setTimeout(() => {
                    nextField?.focus();
                }, 20);
            } else {
                this.joinOtpDigits();
            }
        } else if (inputValue.length === 0) {
            const currentField = this.getFieldByIndex(index);
            if (currentField.text.length > 0) {
                currentField.text = '';
            }
            const previousField = this.getFieldByIndex(index - 1);
            setTimeout(() => {
                previousField?.focus();
            }, 20);

            this.joinOtpDigits()
        }
    }

    onFocus(event: any, index: number): void {
        if (index > 0) {
            const previousField = this.getFieldByIndex(index - 1);
            previousField?.focus();
        }
    }

    private getFieldByIndex(index: number): TextField {
        switch (index) {
            case 0:
                return this.firstDigit.nativeElement;
            case 1:
                return this.secondDigit.nativeElement;
            case 2:
                return this.thirdDigit.nativeElement;
            case 3:
                return this.fourthDigit.nativeElement;
            case 4:
                return this.fifthDigit.nativeElement;
            case 5:
                return this.sixthDigit.nativeElement;

            default:
                return null;
        }
    }

    onReturnOtpCode(event: any, index: number): void {
        if (index < 5) {
            const nextField = this.getOtpFieldByIndex(index + 1);
            nextField?.focus();
        } else {
            event.object.dismissSoftInput();
        }
    }

    private getOtpFieldByIndex(index: number): TextField | null {
        switch (index) {
            case 0:
                return this.firstDigit?.nativeElement;
            case 1:
                return this.secondDigit?.nativeElement;
            case 2:
                return this.thirdDigit?.nativeElement;
            case 3:
                return this.fourthDigit?.nativeElement;
            case 4:
                return this.fifthDigit?.nativeElement;
            case 5:
                return this.sixthDigit?.nativeElement;
            default:
                return null;
        }
    }

    async resendOTP(): Promise<void> {
        if (this.isTimerCompleted) {
            this.setOtpTimer = 30;
            this.isTimerCompleted = false;
            this.startOtpTimer();
            loaderOptions.message = "Sending OTP.....";
            loader.show(loaderOptions);
            try {
                const response = await this.userService.sendOTPCode(this.appState.loginMobileNumber);
                if (response) {
                    const otpMessage = "OTP Sent Successfully to your Mobile Number (" + this.appState.loginMobileNumber + ").";
                    showToast(otpMessage);
                    loader.hide();
                } else {
                    showToast("Something went wrong to send verification code.");
                    loader.hide();
                }
            } catch (error) {
                showToast("Something went wrong to send verification code.");
                loader.hide();
            }
        }
    }

    async verifyOTP(): Promise<void> {
        try {
            loaderOptions.message = "Verifying OTP.....";
            loader.show(loaderOptions);
            const otpCode = this.otpDigits.join("");
            if (otpCode.length !== 6) {
                loader.hide();
                showToast("Please enter OTP");
                return;
            }
            const response = await this.userService.verifyOTP(
                this.appState.loginMobileNumber,
                otpCode
            );

            if (!response.isValidOtp) {
                loader.hide();
                showToast("Invalid OTP. Please try again.");
                return;
            }
            const fieldAgent : FieldAgent = await this.fieldAgentService.userByMobileNumber(this.appState.loginMobileNumber);

            if (!fieldAgent) {
                loader.hide();
                showToast("Field Agent not found. Please register.");
				this.router.navigate(['/mobile-number-component']);
                return;
            }
            loader.hide();
            this.userService.setLoggedInNumber(fieldAgent.mobileNumber);
            this.router.navigate(['/login']);
        } catch (error) {
            loader.hide();
            showToast("Something went wrong. Please try again.");
        }
    }

    navigation() {
        const navigationExtras: NavigationExtras = {
            queryParams: webViewSrcAssets[1],
        };
        this.router.navigate(['/web-view'], navigationExtras);
    }

    showMobileNumberScreen(): void {
        this.router.navigate(["/mobile-number-component"]);
    }


}
