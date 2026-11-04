import { OrderStatus } from "../common";
import { HopReturnItems } from "./returns";

export class HopItems {
    id: string;
    itemId: string;
    itemName: string;
    imageUrl: string;
    upc: number;
    mrp: number;
    sellingPrice: number;
    orderNumber: string;
    customerId: string;
    quantity: number;
    unitWeight: number;
    weight: number;
    createdDate?: string;
    updatedDate?: string;
    createdTimeStamp: number;
    pieces: number;
    cases: number;
    returnQty?: number | 0;
    qtyAfterEdit?: number;
    modifiedQty?: number;
    orderStatusId: number;
    transitMode: number;
    fulfillmentType: number;
    vendorName: string;
    vendorBusinessName: string;
    vendorId: string;
    orderDate: string;
    itemKey: string;
    orderStatusLabel?: string;
    vendorBusinessTypeId: number;
    orderAmount: number;
    orderOutstandingAmount: number;
    logisticsStatusId?: number;
    shippingChargesCustomerRounded: number;
    shippingChargesCustomerTotal: number;
    couponDiscountAmount: number;
}

export interface Order {
    vendorId: any;
    customerId: string;
    orderNumber: string;
    orderStatusId: string;
    createdDate: string | undefined;
    createdTimeStamp: number;
    items: Item[];
    orderAmount: number;
    orderStatusLabel: string;
}

interface Item {
    itemId: string;
    id: string;
    itemName: string;
    quantity: number;
    sellingPrice: number;
    weight: number;
    upc: number;
    imageUrl: string;
    mrp: number;
    modifiedQty: number;
    itemKey?: string;
    returnQty?: number;
    qtyAfterEdit?: number;
    createdTimeStamp: number;
}

export class HopOrder {
    orderNumber: string;
    orderStatus: string;
    createdDate: string;
    itemId: string;
    quantity: string;
    id: string;
}

export class HopProducts {
    id: string;
    itemId: string;
    itemName: string;
    imageUrl: string;
    upc: number;
    mrp: number;
    sellingPrice: number;
    orderNumber: string;
    customerId: string;
    quantity: number;
    weight: number;
    createdDate?: string;
    updatedDate?: string;
    createdTimeStamp: number;
    pieces: number;
    cases: number;
    orderAmount: number;
    returnQty?: number;
    qtyAfterEdit?: number;
    modifiedQty?: number;
    orderStatusId: number;
    transitMode: number;
    fulfillmentType: number;
    vendorName: string;
    vendorBusinessName: string;
    vendorId: string;
    orderDate: string;
    itemKey: string;
    vendorBusinessTypeId: number;
    reason?: string;
}

export class HopItemsResponse {
    id: string;
    item_id: string;
    item_name: string;
    item_image: string;
    maximum_retail_price: number;
    selling_price: string;
    upc: number;
    order_number: string;
    order_status_id: string;
    order_date: string;
    vendor_id: string;
    vendor_name: string;
    vendor_business_name: string;
    customer_id: string;
    transit_mode: number;
    fulfilment_type: number;
    order_amount: string;
    quantity: number;
    weight: number;
    created_at: string;
    updated_at: string;
    vendor_business_type_id: string;
    outstanding_amount: string;
    logistics_status_id: string;
    shipping_charges_customer_rounded: number;
    shipping_charges_customer_total: string;
    coupon_discount_amount: string;
}

export interface IHopOrders {
    orderNumber: string;
    orderAmount: number;
    orderOutStandingAmount: number;
    orderStatus: OrderStatus;
    orderDate: string | Date;
    orderStatusId: number;
    logisticsStatusId?: number;
    vendorId: string;
}

export interface DEOrderView {
    orderNumber: string;
    orderDate: string;
    orderStatusId: number;
    logisticsStatusId?: number;
    orderProducts: DEOrderProduct[];
}
export interface DEOrderProduct {
    orderNumber: string;
    orderStatusId: number;
    itemId: string;
    itemName: string;
    imageUrl: string;
    upc: number;
    quantity: number;
    totalReturnQty: number;
    unitWeight: number;
    saleValue: number;
    selling_price: number;
    mrp: number;
    pieces: number;
    cases: number;
    vendorBusinessName: string;
    vendorId: string;
    vendorBusinessTypeId: number;
    vendorName: string;
    invoicedQty: number;
    itemKey: string;
    logisticsStatusId?: number;
    shippingChargesCustomerRounded: number;
    couponDiscountAmount: number;

}

interface ReturnOrderProductInput {
    orderNumber: string;
    itemId: string;
    itemName: string;
    imageUrl: string;
    upc: number;
    quantity: number;
    totalReturnQty: number;
    unitWeight: number;
    saleValue: number;
    mrp: number;
    pieces: number;
    cases: number;
    vendorBusinessName: string;
    vendorId: string;
    vendorBusinessTypeId: number;
    vendorName: string;
    invoicedQty: number;
    itemKey: string;
    orderStatusId: number;
    selling_price: number;
}

export interface ReturnOrderInput {
    orderNumber: string;
    products: ReturnOrderProductInput[];
}

export interface StoreReturnOrderInput {
    vendorId: string;
    orderNumber: string;
    products: HopReturnItems[];
}

export interface ValidateStockUpdate {
    vendor_id: string;
    sku_id: string;
    date: Date;
}

export interface QFFReturnSummeryResponse {
    success: boolean;
    message: string;
    data: QFFReturnHopSummery;
}
export interface QFFReturnHopSummery {
    dispatch_value: number;
    return_value: number
    online_payment: number
    cash: number;
}

export interface QFFReturnSummery {
    dispatchValue: number;
    returnValue: number
    onlinePayment: number
    cash: number;
    balance: number;
}



// new

export interface HopFilters {
    pageSize: number;
    pageNum: number;
    agentId: string;
    pointId: string;
    tripId: string;
}


export interface TripHopResponse {
    trip_id: string;
    target_date: string;
    hop_id: string;
    trip_number: number;
    cluster: string;
    sequence: number;
    source: number;
    delivery_agent_id: string;
    trip_status: number;
    point_id: string;
    point_name: string;
    point_business_name: string;
    point_mobile_number: string;
    point_address: string;
    point_lat: number;
    point_lng: number;
    otp: string;
    hop_status: number;
    stop_number: number;
    point_mode: number;
    point_type: number;
    hop_created_at: string;
    hop_updated_at: string;
    orders_count: number;
    skus_count: number;
    weight: number;
}


export interface TripHopMappedResponse {
    tripId: string;
    targetDate: string;
    hopId: string;
    tripNumber: number;
    cluster: string;
    sequence: number;
    source: number;
    deliveryAgentId: string;
    tripStatus: number;
    pointId: string;
    pointName: string;
    pointBusinessName: string;
    pointMobileNumber: string;
    pointAddress: string;
    pointLat: number;
    pointLng: number;
    otp: string;
    hopStatus: number;
    stopNumber: number;
    pointMode: number;
    pointType: number;
    hopCreatedAt: string;
    hopUpdatedAt: string;
    ordersCount: number;
    skusCount: number;
    weight: number;
}


export interface TripHopSummaryResponse {
    trip_id: string;
    target_date: string;
    hop_id: string;
    trip_number: number;
    cluster: string;
    sequence: number;
    source: number;
    trip_status: number;
    point_id: string;
    point_name: string;
    point_business_name: string;
    point_mobile_number: string;
    point_address: string;
    point_lat: number;
    point_lng: number;
    otp: string;
    hop_status: number;
    stop_number: number;
    point_mode: number;
    point_type: number;
    hop_created_at: string;
    hop_updated_at: string;
    orders_count: number;
    skus_count: number;
    weight: number;
    dispatch_value: number;
    customer_returns: number;
    vendor_pickups: number;
    vendor_returns: number;
    online_payments: number;
    cash_collections: number;
  }

  export interface TripHopSummaryMappedResponse {
    tripId: string;
    targetDate: string;
    hopId: string;
    tripNumber: number;
    cluster: string;
    sequence: number;
    source: number;
    tripStatus: number;
    pointId: string;
    pointName: string;
    pointBusinessName: string;
    pointMobileNumber: string;
    pointAddress: string;
    pointLat: number;
    pointLng: number;
    otp: string;
    hopStatus: number;
    stopNumber: number;
    pointMode: number;
    pointType: number;
    hopCreatedAt: string;
    hopUpdatedAt: string;
    ordersCount: number;
    skusCount: number;
    weight: number;
    dispatchValue: number;
    customerReturns: number;
    vendorPickups: number;
    vendorReturns: number;
    onlinePayments: number;
      cashCollections: number;
      deliveryAgentId: string;
  }
