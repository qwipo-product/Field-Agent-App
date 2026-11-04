export class FieldAgent {
    id: string;
    name: string;
    mobileNumber: string;
    address: string;
    areaName: string;
    landMark: string;
    latitude: string;
    longitude: string;
    designation: number;
    supplierName: string;
    supplierType: number;
    contractMode: number;
    status: number;
    location: string;
    locationInfo : WarehouseDetails;
    email: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
}

export class FieldAgentResponse {
    id: string;
    name: string;
    mobileNumber: string;
    email: string;
    password: string;
    address: string;
    areaName: string;
    landMark: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
    latitude: string;
    longitude: string;
    aadharNumber: string;
    aadharCopy: string;
    panNumber: string;
    panCopy: string;
    gstNumber: string;
    gstCopy: string;
    supplierName: string;
    supplierType: number;
    tcsPercentage: string;
    contractMode: number;
    status: number;
    designation: number;
    location: string;
    type : number;
    locationInfo : WarehouseDetails;

}


export interface WarehouseDetails {
    id: string;
    name: string;
    warehouse_id: string;
    warehouse_name: string;
    area: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    latitude: string;
    longitude: string;
    type: string;
    createdAt: string;
    updatedAt: string;
  }
