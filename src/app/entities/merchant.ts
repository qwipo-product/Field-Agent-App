import { Address } from './address';
import { MerchantType } from '~/app/common';
export class Merchant {
    id: string = "";
    token: string = "";
    name: string = "";
    nameLowerCase: string = "";
    email: string = "";
    emailLowerCase: string = "";
    mobileNumber: string = "";
    dealerId: string = "";
    partialDealers: Array<any> = [];
    merchantTypeId: MerchantType = MerchantType.Medicine;
    isActive: boolean = false;
    shopDetails: Shop = new Shop();
    bankDetails: BankDetails = new BankDetails();
}
export class Shop {
    shopName: string = "";
    gstNumber: string = "";
    address: Address = new Address();
}
export class BankDetails {
    accountName: string = "";
    accountNumber: string = "";
    ifscCode: string = "";
    branchName: string = "";
    branchCity: string = "";
    state: string = "";
}
