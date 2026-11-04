import { Address } from "./address";
import { UserType } from "~/app/common";

export class Customer {
    id: string = "";
    isActive: boolean = true;
    name: string = "";
    nameLowerCase: string = "";
    eWallet: eWallet = new eWallet();
    userTypeId = UserType.Customer;
    email: string = "";
    emailLowerCase: string = "";
    mobileNumber: string = "";
    address: Address = new Address();
    token: string = "";
    referredBy: string = "";
    profilePicUrl: string = "";
    profilePicStorageName: string = "";
    referrelCode: string = "";
    createdDate: number;
    refExpDate: number;
    dueAmount: number;
    referenceId: string = "";
    coupons: {};
}
export class eWallet {
    amount: number;
    lastUpdatedDate: number;
}

export interface Supplier {
    id: string;
    name: string;
    mobileNumber: string;
    address: string;
    areaname: string;
    landMark: string;
    pincode: number;
    country: string;
    latitude: string;
    longitude: string;
    panNumber: string;
    panCopy: string;
    aadharNumber: string;
    aadharCopy: string;
    gstNumber: string;
    gstCopy: string;
    designation: number;
    supplierName: string;
    supplierType: string;
    tcsPercentage: string;
    contractMode: number;
    status: number;
    location: string;
}
