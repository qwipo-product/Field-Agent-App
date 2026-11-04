import { UserType, OrderType } from '~/app/common';
import { Address } from './address';
import { BankDetails } from './merchant';

export class Dealer {
    id: string;
    userTypeId: UserType = UserType.Dealer;
    name: string;
    nameLowerCase: string;
    mobileNumber: string;
    isActive: boolean = false;
    email: string;
    services: Array<Service> = [];
    address: Address = new Address();
    bankDetails: BankDetails = new BankDetails();
}
export class Service {
    id: string;
    name: string;
    orderType: OrderType.None;
    isAvailable: boolean = false;
    markUpPercentage: 0;
    deliverySlots: Array<any>;
    inventorySlots: Array<any>;
    timings: {};
    displayOrder: number
}