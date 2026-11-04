import { ChangeDetectorRef, Component, Inject, NO_ERRORS_SCHEMA } from "@angular/core";
import { Router } from "@angular/router";
import { ApplicationStateService, YYYYMMDD, getAdminHopListFilters, getAdminSubFilters, getAdminTripListFilters, getHopAdminDownloadOptions, getHopAdminGenerateOptions, getReturnFilters, getReturnsSubFilters } from "~/app/common";
import { GenericParams } from "~/app/tokens";
import { UIService } from "../../services/ui-service";
import { TNSFancyAlert } from "@nstudio/nativescript-fancyalert";
import { WholeOrderReturn } from "~/app/entities/returns";
import { AdminHopFilter, TripFilters } from "~/app/entities/trip";
import { FieldAgent } from "~/app/entities";
import { ReturnRepository } from "~/app/store/return.repository";
import { UserService } from "~/app/services/user.service";
import { ReturnsService } from "~/app/services/returns.service";
import { NativeScriptCommonModule, NativeScriptFormsModule } from "@nativescript/angular";
import { ReactiveFormsModule } from "@angular/forms";

@Component({
    moduleId: module.id,
    selector: "ns-bottomsheet",
    templateUrl: "./bottomsheet.component.html",
    standalone: true,
    imports: [NativeScriptCommonModule,ReactiveFormsModule,NativeScriptFormsModule],
    schemas: [NO_ERRORS_SCHEMA]
})
export class BottomsheetComponent {
    items: any;
    type: number;
    popupHeight = 450;
    duePayment: number;
    selectedReason: { id: number; name: string };
    isSelectedReason: boolean = false;
    POPUP_HEIGHT_LARGE = 800;
    POPUP_HEIGHT_SMALL = 450;
    filters: Array<any> = [];
    actionItems: Array<any> = [];
    mainFilters: Array<any> = [];
    tripListFilterItems: Array<any> = [];
    subFilters: {
        id: number;
        name: string;
        isSelected: boolean;
        statusId?: number;
    }[];
    selectedFilter: number;
    showReturnRequestList: boolean = false;
    wholeOrderReturns: { id: number; name: string; isSelected: boolean }[] = [];
    tripOptions: { id: number; name: string; isSelected: boolean }[] = [];
    wholeOrdersReturn: WholeOrderReturn;
    otpNumber: any;
    isGenerate: boolean = false;
    isIndentDownload: boolean = false;
    showStartDate: boolean = false;
    showEndDate: boolean = false;
    startDate: Date = new Date();
    endDate: Date = new Date();
    selectedTripStartDate: string = "";
    selectedTripEndDate: string = "";
    showMultipleDate: boolean = false;
    selectedTripDownLoadOptions: number[] = [];
    selectedHopDownLoadOptions: number[] = [];
    tripSelectionInput: TripFilters;
    tripSelectedManiOption: string;
    tripSelectedOption: {
        id: number;
        name: string;
        isSelected: boolean;
        statusId?: number;
    };
    selectedIndentId: string;
    hopSelectionInput: AdminHopFilter;
    hopDetailsLogOutText:string;
    isCacheReturn:boolean=false;

    constructor(
        private uiService: UIService,
        private userService: UserService,
        private appState: ApplicationStateService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        public returnsService: ReturnsService,
        private returnRepository: ReturnRepository,
        @Inject(GenericParams) private inputData: any
    ) {
        this.type = inputData.type;
        this.items = inputData.items;
    }

    async ngOnInit() {
        if (this.type == 10001) {
        } else if (this.type == 10002) {
            this.wholeOrdersReturn = this.items;
            this.wholeOrderReturns =
            await this.returnsService.getReturnReasons();
            this.mainFilters = getReturnFilters();
            this.onFilterChange(this.mainFilters[0].name);
        } else if (this.type == 10003) {
            this.otpNumber = this.items.otp;
            this.otpNumber = this.items.otp;
        } else if (this.type == 10004) {
            this.mainFilters = getAdminTripListFilters();
            this.onTripListFilterChange(this.mainFilters[0].name);
        } else if (this.type == 10005) {
            this.mainFilters = getAdminHopListFilters();
            this.onHopListFilterChange(this.mainFilters[0].name);
        } else if (this.type == 10006) {
            const storeCache = await this.returnRepository.getReturnById(this.appState.hop.hopId);
            this.hopDetailsLogOutText = storeCache != undefined ? "You have pending returns, Do you want to log out and delete returns?" : "Do you want to Logout ?";
            this.isCacheReturn= storeCache != undefined ? true : false;
        }
        else if (this.type == 10007) {

        }
    }

    getSubFilters(displayName: string) {
        switch (displayName) {
            case "download":
                return getAdminSubFilters();
            case "returns":
                return getReturnsSubFilters();
            default:
                return [];
        }
    }

    onFilterChange(displayName: string) {
        this.subFilters = this.getSubFilters(displayName);
    }

    getHopAdminSubFilters(displayName: string) {
        switch (displayName) {
            case "generate":
                return getHopAdminGenerateOptions();
            case "download":
                return getHopAdminDownloadOptions();
            default:
                return [];
        }
    }

    close(data): void {
        this.uiService.closeBottomSheet(data);
    }

    async logOut() {
        // TODO
        this.uiService.closeBottomSheet("");
        this.userService.logOutUser();
        this.appState.loginMobileNumber = "";
        this.appState.fieldAgent = new FieldAgent();
        this.router.navigate(['/login']);
        if(this.isCacheReturn){
            this.returnRepository.deleteCacheReturnByHopId(this.appState.hop.hopId);
        }
    }




    removeReturnCache(isDelete: boolean=false) {
        this.close(isDelete);
    }

    async openReturnRequestList() {
        // this.showReturnRequestList = !this.showReturnRequestList;
        // this.wholeOrderReturns = getReturnRequestReasons();
        this.popupHeight = this.POPUP_HEIGHT_LARGE;
        this.showReturnRequestList = true;
    }

    updateHopStatus(otp: string) {
        if (otp === this.otpNumber) {
            this.close(otp);
        } else {
            this.showMessage("Invalid OTP Entered.");
            return;
        }
    }

    showMessage(message: string) {
        TNSFancyAlert.showWarning("", message, "Okay");
    }

    selectSubFilter(returnItem: any) {
        this.selectedReason = this.wholeOrderReturns.find(
            (subFilter) => subFilter.id === returnItem.id
        );

        this.showReturnRequestList = false;
        this.popupHeight = this.POPUP_HEIGHT_SMALL;
        this.isSelectedReason = true;

        this.wholeOrderReturns = this.wholeOrderReturns.map((subFilter) => ({
            ...subFilter,
            isSelected: subFilter.id === returnItem.id,
        }));
    }
    wholeOrderReturn() {
        if (!this.selectedReason) {
            this.showMessage("Please Select the Reason");
            return;
        }
        this.wholeOrdersReturn.reason = this.selectedReason.name;
        this.wholeOrdersReturn.status = true;
        this.close(this.wholeOrdersReturn);
    }

    onOkClick() {
        if (this.startDate && this.endDate) {
            this.selectedTripStartDate = YYYYMMDD(this.startDate);
            this.selectedTripEndDate = YYYYMMDD(this.endDate);
            this.showStartDate = false;
            this.showEndDate = false;
        } else if (this.startDate && !this.endDate) {
            this.selectedTripStartDate = YYYYMMDD(this.startDate);
            this.showStartDate = false;
            this.showEndDate = true;
            this.cdr.detectChanges();
        } else if (!this.startDate && this.endDate) {
            this.selectedTripEndDate = YYYYMMDD(this.endDate);
            this.showStartDate = true;
            this.showEndDate = false;
            this.cdr.detectChanges();
        }
    }

    selectStartDate() {
        this.showStartDate = true;
        this.showEndDate = false;
        this.cdr.detectChanges();
    }

    selectEndDate() {
        this.showStartDate = false;
        this.showEndDate = true;
        this.cdr.detectChanges();
    }

    tripIndentDownloadFilter() {
        if (this.selectedTripDownLoadOptions.length == 0) {
            const msg = "Please Select any Option";
            this.showMessage(msg);
            return;
        }
        // return;
        this.close(this.selectedTripDownLoadOptions);
    }

    onTripListFilterChange(displayName: string) {
        this.tripSelectedManiOption = displayName;
        this.isIndentDownload = displayName == "date" ? true : false;
        if (displayName == "date") {
            this.selectedFilter = 1104;
            this.showMultipleDate = true;
        } else if (displayName == "download") {
            this.selectedFilter = 1101;
            this.showMultipleDate = false;
            this.subFilters = this.getSubFilters(displayName);
        }
    }

    onHopListFilterChange(displayName: string) {
        this.tripSelectedManiOption = displayName;
        this.isGenerate = displayName == "generate" ? true : false;
        this.selectedFilter = displayName == "generate" ? 1101 : 1102;
        this.subFilters = this.getHopAdminSubFilters(displayName);
    }

    selectFilterInvoice(filter) {
        const { id, isSelected, statusId } = filter;

        if (id !== 1101) return;

        const selectedStatusIndex =
            this.selectedHopDownLoadOptions.indexOf(statusId);
        const isSelectedStatus = selectedStatusIndex !== -1;

        if (isSelected && isSelectedStatus) {
            this.selectedHopDownLoadOptions.splice(selectedStatusIndex, 1);
        } else if (!isSelected && !isSelectedStatus) {
            this.selectedHopDownLoadOptions.push(statusId);
        }

        filter.isSelected = !isSelected;
    }

    selectTripIndentFilter(selectedId: any) {
        this.subFilters = this.subFilters.map((subFilter) => ({
            ...subFilter,
            isSelected: subFilter.id === selectedId.id,
        }));
    }

    private validateDates(): boolean {
        if (
            this.selectedTripStartDate == "" ||
            this.selectedTripEndDate == ""
        ) {
            const msg = "Please Select Trip Start Date and End Date";
            this.showMessage(msg);
            return false;
        }

        const startDate = new Date(this.selectedTripStartDate);
        const endDate = new Date(this.selectedTripEndDate);

        if (endDate < startDate) {
            const msg = "Please Select Valid Date";
            this.showMessage(msg);
            return false;
        }

        return true;
    }

    private validateDatesTripIndent(): boolean {
        this.tripSelectedOption = this.subFilters.find(
            (item) => item.isSelected === true
        );
        this.selectedIndentId = this.tripSelectedOption.statusId.toString();

        if (this.tripSelectedOption == undefined) {
            const msg = "Please Select any Option";
            this.showMessage(msg);
            return false;
        }
        return true;
    }
    tripIndentDateFilter() {
        const validateFunc =
            this.tripSelectedManiOption === "date"
                ? this.validateDates
                : this.validateDatesTripIndent;
        if (!validateFunc.call(this)) {
            return;
        }

        this.tripSelectionInput = {
            selectedMainOption:
                this.tripSelectedManiOption === "date" ? "1" : "2",
            selectedSubOption: this.selectedIndentId || "",
            startDate: this.selectedTripStartDate,
            endDate: this.selectedTripEndDate,
        };
        this.close(this.tripSelectionInput);
    }

    validationHorHop() {
        if (this.selectedHopDownLoadOptions.length == 0) {
            const msg = "Please Select any Option";
            this.showMessage(msg);
            return false;
        }
        return true;
    }

    generateInvoices() {
        // NEED TO IMPLEMENT GENERATE INVOICE NEED TO CALL MESSAGE QUEUE
        if (!this.validationHorHop()) {
            return;
        }
        this.hopSelectionInput = {
            selectedMainOption:
                this.tripSelectedManiOption === "generate" ? "1" : "2",
            selectedOptions: this.selectedHopDownLoadOptions,
        };

        console.log("this.hopSelectionInput :", this.hopSelectionInput);
        this.close(this.hopSelectionInput);
    }
}
