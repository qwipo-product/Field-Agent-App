import { Action } from "../common/enums";

export interface partialReturn {
    itemName: string;
    reason: string;
    quantity: number;
}
export interface ReturnEntity {
    reason: string | undefined;
    quantity: number;
    sku_id: string;
}
export interface WholeOrderReturn {
    id : number;
    reason: string;
    imageUrl : string;
    status: boolean;
}

export interface OrderReturnApiInput {
    orderNumber: string;
    items: ReturnEntity[];
}
export interface Resource {
    resource_id: string;
    name: string;
    mobile_number: string;
    designation: number;
    warehouse_id: string;
    warehouse_name: string;
}

export interface HopReturnItemsResponse {
    order_number: string;
    sku_id: string;
    image_url: string;
    mrp: number;
    selling_price: number;
    upc: string;
    weight_per_unit: number;
    stock_uom: string;
    package_type: string;
    hsn_code: string;
    total_net_amount: number;
    total_weight: number;
    quantity: number;
    sku_name: string;
    created_at: string;
    vendor_name: string;
    vendor_id: string;
}
export interface HopReturnItems {
    id?: string;
    orderNumber: string;
    itemId: string;
    imageUrl: string;
    mrp: number;
    sellingPrice: number;
    upc: string;
    weightPerUnit: number;
    stockUOM: string;
    packageType: string;
    hsnCode: string;
    totalNetAmount: number;
    totalWeight: number;
    quantity: number;
    itemName: string;
    pieces: number;
    cases: number;
    createdTimeStamp: number;
    vendorName: string;
    vendorId: string;
    itemKey: string;
    reason?: string | undefined;
    originalQuantity: number;
    shippingChargesCustomerRounded:number;
    oldCouponDiscountAmount:number,
    newCouponDiscountAmount:number,
}

export interface MapHopReturnItem {
    itemId: string;
    itemName: string;
    imageUrl: string;
    mrp: number;
    sellingPrice: number;
    returnQty: number;
    pieces: number;
    cases: number;
}

export interface getReturnReason {
    id: number;
    name: string;
    isSelected: boolean;
}


export interface QFFReturnHopResponse {
    success: boolean;
    message: string;
    data: QFFReturnHop | null;
  }

  // Interface for the return hop data
  export interface QFFReturnHop {
    id: string;
    trip_id: string;
    point_id: string;
    point_name: string;
    point_business_name: string;
    point_mobile_number: string;
    point_address: string;
    point_lat: string;
    point_lng: string;
    stop_number: number;
    point_mode: number;
    point_type: number;
    otp: string;
    status: number;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
  }

  export interface OrderReturn {
    reason: string;
    status: boolean;
    type: Action;
}
