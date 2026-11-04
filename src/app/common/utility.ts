declare var UIApplication;
import { isIOS, isAndroid } from "@nativescript/core/platform";
import { ToastDuration, Toasty } from "@triniwiz/nativescript-toasty";
import { FulFillmentType, GateWayType, HopStatus, PaymentType, PointMode, PointType, TripStatus } from "./enums";
import { TNSFancyAlert } from "@nstudio/nativescript-fancyalert";
import { FieldAgent, WarehouseDetails } from "../entities/fieldAgent";
import { Address } from "../entities/address";


export function dismissSoftKeybaord() {
    if (isIOS) {
        UIApplication.sharedApplication.keyWindow.endEditing(true);
    }
    if (isAndroid) {
        // if (dialogFragment) {
        //     utils.ad.dismissSoftInput(
        //         dialogFragment.getDialog().getCurrentFocus()
        //     );
        // } else {
        //     utils.ad.dismissSoftInput();
        // }
    }
}
export function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return (
        s4() +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        s4() +
        s4()
    );
}

export function getReturnFilters() {
    return [
        {
            id: 1101,
            name: "returns",
            displayName: "Returns",
            isSelected: true,
        },
    ];
}

export function getAdminTripListFilters() {
    return [
        {
            id: 1104,
            name: "date",
            displayName: "Date",
            isSelected: false,
            statusId: 1,
        },
        {
            id: 1101,
            name: "download",
            displayName: "Download",
            isSelected: false,
            statusId: 2,
        },
    ];
}

export function getAdminHopListFilters() {
    return [
        {
            id: 1101,
            name: "generate",
            displayName: "Generate",
            isSelected: true,
        },
        {
            id: 1102,
            name: "download",
            displayName: "Download",
            isSelected: false,
        },
    ];
}

export function getPaymentCollectionFilters() {
    return [
        {
            id: 1102,
            name: "collections",
            displayName: "Collections",
            isSelected: false,
        },
    ];
}

export function getReturnsSubFilters() {
    return [{ id: 1101, name: "Whole Orders", isSelected: true }];
}

export function getAdminSubFilters() {
    return [
        {
            id: 1101,
            name: "Warehouse Pickup Indent",
            isSelected: false,
            statusId: 2,
        },
        {
            id: 1102,
            name: "Vendor pick up Indent",
            isSelected: false,
            statusId: 1,
        },
    ];
}

export function getHopAdminGenerateOptions() {
    return [
        { id: 1101, name: "Invoices", isSelected: false, statusId: 1 },
        // { id: 1101, name: "E-Way Bill", isSelected: false },
    ];
}
export function getHopAdminDownloadOptions() {
    return [
        { id: 1101, name: "Invoices", isSelected: false, statusId: 1 },
        { id: 1101, name: "Pick-up Indent", isSelected: false, statusId: 2 },
        // { id: 1101, name: "E-Way Bill", isSelected: false, statusId: 3 },
    ];
}

// export function getCollectionSubFilters() {
//     return [
//         { id: 1101, name: "Generate Qr Code", isSelected: false },
//         { id: 1102, name: "Cash Entry", isSelected: false },
//         { id: 1103, name: "Request For Payment", isSelected: false },
//     ];
// }

export function getCollectionSubFilters(vendor: any) {
    const filters = [
        { id: 1101, name: "Generate QR Code", isSelected: false },
        { id: 1102, name: "Cash Entry", isSelected: false },
        { id: 1103, name: "Request For Payment", isSelected: false },
    ];

    if (vendor?.admin_config?.fulfillment?.fulfillmentBy == FulFillmentType.QWIPO) {

        return filters;
    }

    const isQrEnabled = Array.isArray(vendor?.admin_config?.providers)
    ? vendor.admin_config.providers.some(
        item => item.gatewayType === GateWayType.PaySharp &&
               item.paymentType === PaymentType.QrCode
      )
    : false;

    console.log("isQrEnabled", isQrEnabled);

    return isQrEnabled
        ? filters
        : filters.filter(filter => filter.id !== 1101);
}



export function convertToYYYYMMDD(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based
    const day = date.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function getReturnRequestReasons() {
    return [
        {
            id: 1,
            name: "Brought From Market",
            isSelected: false,
        },
        {
            id: 2,
            name: "Coupon not appiled by Customer",
            isSelected: false,
        },
        {
            id: 3,
            name: "Customer Request",
            isSelected: false,
        },
        {
            id: 5,
            name: "Damaged Item Delivered",
            isSelected: false,
        },
        {
            id: 6,
            name: "DE not reachable / DE issue",
            isSelected: false,
        },
        {
            id: 7,
            name: "Double Order",
            isSelected: false,
        },
        {
            id: 8,
            name: "High Price",
            isSelected: false,
        },
        {
            id: 9,
            name: "Late Delivery",
            isSelected: false,
        },
        {
            id: 10,
            name: "MGN Date Issue",
            isSelected: false,
        },
        {
            id: 11,
            name: "Mistakenly Placed",
            isSelected: false,
        },
        {
            id: 12,
            name: "No Cash",
            isSelected: false,
        },
        {
            id: 13,
            name: "Quality Issue",
            isSelected: false,
        },
        {
            id: 14,
            name: "Road Block",
            isSelected: false,
        },
        {
            id: 15,
            name: "Shop Closed",
            isSelected: false,
        },
        {
            id: 16,
            name: "Wrong Item Ordered/Placed",
            isSelected: false,
        },
        {
            id: 17,
            name: "Wrong Location",
            isSelected: false,
        },

        {
            id: 18,
            name: "Wrong Quantity Placed",
            isSelected: false,
        },

        {
            id: 19,
            name: "Missing Item",
            isSelected: false,
        },
        {
            id: 20,
            name: "OOS (Out of Stock) Item Not Modified",
            isSelected: false,
        },
        {
            id: 21,
            name: "Vehicle Breakdown",
            isSelected: false,
        },
        {
            id: 22,
            name: "Weight Issue",
            isSelected: false,
        },
        {
            id: 23,
            name: "Not Satisfied with Quality",
            isSelected: false,
        },
        {
            id: 24,
            name: "Wrong Item Loaded",
            isSelected: false,
        },
        {
            id: 25,
            name: "Packing Issue",
            isSelected: false,
        },
        {
            id: 26,
            name: "Order Not Placed",
            isSelected: false,
        },
        {
            id: 27,
            name: "Freebies Not Given",
            isSelected: false,
        },
        {
            id: 28,
            name: "Internal Employee",
            isSelected: false,
        }, {
            id: 29,
            name: "Others",
            isSelected: false,
        },
    ];
}

export function YYYYMMDD(d = new Date()) {
    return `${d.getFullYear().toString().padStart(4, "0")}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

export const showToast = (message: string): Toasty => {
    const toast = new Toasty({
        text: message,
        duration: ToastDuration.SHORT,
    });

    toast.show();

    return toast;
};

export function getItemQtyInCasesPieces(upc: number, qty: number) {
    if (upc == 0) {
        return { pieces: qty, cases: 0 };
    }

    const roundedUpc = Math.round(upc);

    let pieces = Math.abs(qty) % roundedUpc;
    let cases = Math.floor(Math.abs(qty) / roundedUpc);

    if (qty < 0) {
        pieces = -pieces;
        cases = -cases;
    }

    return { pieces, cases };
}

export function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

export function showError(
    message: string,
    detail: string,
    buttonText: string = "OK"
): void {
    TNSFancyAlert.showError(message, detail, buttonText);
}

export function showSuccess(
    message: string,
    detail: string,
    buttonText: string = "OK"
): void {
    TNSFancyAlert.showSuccess(message, detail, buttonText);
}

export function showWarning(
    message: string,
    detail: string,
    buttonText: string = "OK"
): void {
    TNSFancyAlert.showWarning(message, detail, buttonText);
}


export function getPointModeLabel(mode: PointMode): string {
    const hopModeLabel = {
        [PointMode.PICKUP]: "Pickup",
        [PointMode.DELIVERY]: "Delivery",
        [PointMode.RETURN]: "Return",
        [PointMode.NONE]: "None",
    };
    return hopModeLabel[mode];
}

export function getConcatenateLabel(mode: PointMode): string {
    const hopModeLabel = {
        [PointMode.PICKUP]: "From",
        [PointMode.DELIVERY]: "To",
        [PointMode.RETURN]: "To",
        [PointMode.NONE]: "None",
    };
    return hopModeLabel[mode];
}

export function getPointTypeLabel(mode: PointType): string {
    const hopModeLabel = {
        [PointType.VENDOR]: "Seller",
        [PointType.CUSTOMER]: "Retailer",
        [PointType.WAREHOUSE]: "WareHouse",
        [PointType.NONE]: "None",
    };
    return hopModeLabel[mode];
}

export function getHopStatusLabel(mode: HopStatus): string {
    const hopModeLabel = {
        [HopStatus.NotStarted]: "Not Started",
        [HopStatus.Completed]: "Completed",
        [HopStatus.None]: "None",
    };
    return hopModeLabel[mode];
}

export function getTripStatusLabel(status: TripStatus): string {
    const tripStatusLabel = {
        [TripStatus.NotStarted]: "Not Started",
        [TripStatus.InProgress]: "In Progress",
        [TripStatus.Completed]: "Completed",
        [TripStatus.Cancelled]: "Cancelled",
        [TripStatus.None]: "None",
    };
    return tripStatusLabel[status];
}

export function formatWeight(weight: number): number {
    return weight ? Math.round(weight * 100) / 100 : 0;
}


export function bankersRounding(num: number, precision: number): number {
    const multiplier = Math.pow(10, precision);
    const scaledNum = num * multiplier;

    const intermediate = Math.round(num * multiplier);

    let rounded: number;
    if (Math.abs(intermediate - scaledNum) === 0.5) {
        rounded = intermediate % 2 === 0 ? intermediate : intermediate - 1;
    } else {
        rounded = intermediate;
    }

    const roundedAmount = rounded / multiplier
    return roundedAmount;
}


export function formatAddress(locationInfo: WarehouseDetails) {
    return [
        locationInfo.area,
        locationInfo.city,
        locationInfo.state,
        locationInfo.country,
        locationInfo.pincode,
    ]
        .filter(Boolean)
        .join(", ");
}

export function getFormattedAddress(fieldAgent: FieldAgent) {
    return [
        fieldAgent.address,
        fieldAgent.areaName,
        fieldAgent.landMark,
        fieldAgent.city,
        fieldAgent.state,
        fieldAgent.pinCode,
    ]
        .filter(Boolean)
        .join(", ");
}