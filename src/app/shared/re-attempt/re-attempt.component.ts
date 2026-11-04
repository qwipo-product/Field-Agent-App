import { Component, Inject, NO_ERRORS_SCHEMA, OnInit } from "@angular/core";
import { UIService } from "../../../app/services/ui-service";
import { GenericParams } from "../../../app/tokens/tokens";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { Action, ApplicationStateService, dismissSoftKeybaord, mapUploadImageType, showWarning } from "~/app/common";
import { ReturnsService } from "~/app/services/returns.service";
import * as camera from "@nativescript/camera";
import { ImageSource } from "@nativescript/core";
import { HopService } from "~/app/services/hop.service";


interface IDocument {
    path: string;
    name: string;
    base64Value: string;
}

@Component({
    standalone: true,
    moduleId: module.id,
    selector: "re-attempt",
    templateUrl: "re-attempt.component.html",
    imports: [NativeScriptCommonModule],
    schemas: [NO_ERRORS_SCHEMA],

})

export class ReAttemptComponent implements OnInit {

    POPUP_HEIGHT_LARGE = 800;
    POPUP_HEIGHT_SMALL = 450;
    popupHeight = 450;
    showReturnRequestList: boolean = false;
    returns: { id: number; name: string; isSelected: boolean }[] = [];
    isSelectedReason: boolean = false;
    wholeOrdersReturn: { id: number, imageUrl: string, reason: string, status: boolean } = { id: 0, imageUrl: "", reason: "", status: false };
    selectedReason: any;
    selectedUploadFileType: string;
    extension: string;
    imageBase64string: string;
    imagesToUpload: {
        'shop_image': IDocument
    } = {
            shop_image: {
                path: '',
                name: '',
                base64Value: ''
            }
        }

    actionType: Action;
    showLoading: boolean = false;



    constructor(
        @Inject(GenericParams) private inputData: any,
        private uiService: UIService,
        private returnsService: ReturnsService,
        private appState: ApplicationStateService,
        private hopService: HopService

    ) {
        this.inputData = this.inputData;
        console.log("inputData : ", this.inputData);
        if (this.inputData.items.type == Action.ReAttempt) {
            this.actionType = Action.ReAttempt;
        } else {
            this.actionType = Action.Return;
        }

    }


    ngOnInit(): void {




    }


    goBack() {
        this.uiService.closeBottomSheet('');
    }


    async openReturnRequestList() {
        dismissSoftKeybaord();
        this.popupHeight = this.POPUP_HEIGHT_LARGE;
        this.showReturnRequestList = true;

        if (this.returns.length === 0) {
            this.returns = await this.returnsService.getReturnReasons();
        }
    }

    selectSubFilter(returnItem: any) {
        this.selectedReason = this.returns.find(
            (subFilter) => subFilter.id === returnItem.id
        );

        // this.popupHeight = this.POPUP_HEIGHT_SMALL;
        this.isSelectedReason = true;

        this.returns = this.returns.map((subFilter) => ({
            ...subFilter,
            isSelected: subFilter.id === returnItem.id,
        }));

        this.showReturnRequestList = false;

    }


    selectImage(uploadFileType: number, path: string = '') {
        this.selectedUploadFileType = mapUploadImageType(uploadFileType);
        this.selectImageFromGallery();
    }

    private async selectImageFromGallery() {
        try {
            const options = {
                width: 300,
                height: 600,
                keepAspectRatio: false,
                saveToGallery: true,
            };

            const isAvailable = camera.isAvailable();
            if (isAvailable) {
                const granted = await camera.requestPermissions();
                if (granted) {
                    const imageAsset = await camera.takePicture(options);

                    const imageSource = await ImageSource.fromAsset(imageAsset);

                    const base64String = imageSource.toBase64String('jpeg', 100); // 'jpeg' and 100 are optional parameters

                    this.imagesToUpload[this.selectedUploadFileType].name = "selected 1 image";
                    this.imageBase64string = base64String;
                    this.extension = "png";
                } else {
                    return null;
                }
            }
        } catch (error) {
            showWarning("Warning", error);

            return null;
        }
    }


    isSubmitBtnEnable() {
        if (this.actionType == Action.Return) {
            if (this.selectedReason?.id != 15 && this.selectedReason?.name) {
                return true;
            } else if (this.selectedReason?.id == 15 && this.imagesToUpload.shop_image.name) {
                return true;
            } else {
                return false;
            }

        } else if (this.actionType == Action.ReAttempt) {

            if (this.selectedReason?.id && this.imagesToUpload.shop_image.name) {
                return true;
            } else {
                return false;
            }
        }
        return false;
    }


    async submit() {
        if (!this.isSelectedReason) {
            showWarning("Warning", "Please Select the Reason");
            return;
        }

        this.showLoading = true;

        try {
            const isReturnWithShopClosed =
                this.actionType === Action.Return && this.selectedReason?.id === 15;
            const isReAttempt = this.actionType === Action.ReAttempt;

            let response: string | null = null;

            if (isReturnWithShopClosed || isReAttempt) {
                response = await this.hopService.uploadReAttemptActionImage(
                    this.appState.hop.hopId,
                    this.imageBase64string,
                    this.extension
                );

                if (!response) {
                    showWarning("Something Went Wrong !", "Please try after sometime.", "OK");
                    return;
                }
            }

            this.wholeOrdersReturn = {
                ...this.wholeOrdersReturn,
                id: this.selectedReason!.id,
                reason: this.selectedReason!.name,
                imageUrl: response,
                status: true,
            };

            this.uiService.closeBottomSheet(this.wholeOrdersReturn);
        } catch (error) {
            showWarning("Something Went Wrong !", "Please try again later.", "OK");
        } finally {
            this.showLoading = false;
        }
    }




}
