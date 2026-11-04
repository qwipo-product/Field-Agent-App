
export interface TripDetails {
    driverName: string;
    driverNumber: string;
    deliveryAgentName: string;
    deliveryAgentNumber: string;
    vehicleCapacity: string;
    vehicleType: string;
}

export interface CollectionDetails {
    dispatchValue: number;
    cash: number;
    online: number;
    returns: number;
    settlement: number;
}

export interface ProductDetails {
    product: string;
    cases: number;
    pcs: number;
    qty: number;
}

export interface TripSummary {
    tripDetails: TripDetails;
    pickups: number;
    returns: number;
    deliveries: number;
    collections: CollectionDetails;
    pickUpFromVendor: ProductDetails[];
    pickUpFromWareHouse: ProductDetails[];
    deliverToCustomer: ProductDetails[];
    returnToVendor: ProductDetails[];
    returnToWareHouse: ProductDetails[];
}

export class Status {
    success: boolean;
    message: string;
    data: string
}



