import { MerchantBusinessType, OrderStatus } from "../common";

export interface ItemsView {
    itemId: string;
    itemName: string;
    imageUrl: string;
    upc: number;
    quantity: number;
    unitWeight: number;
    pieces: number;
    cases: number;
    vendorBusinessName: string;
    saleValue: number;
    mrp: number;
    vendorId: string;
    invoicedQty: number;
    vendorBusinessTypeId: MerchantBusinessType;
    orders: {
        orderNumber: string;
        orderDate: Date | string;
        qty: number;
        returnQty?: number;
        orderStatusId: OrderStatus;
    }[];
    itemKey: string;
    vendorName: string;
    totalReturnQty?: number;
}

export interface OrderView {
    orderNumber: string;
    orderDate: string;
    orderStatusId: number;
    orderAmount: number;
    orderStatusLabel: string;
}

export interface OrderToModify {
    orderNumber: string;
    quantity: number;
    skuId: string;
}
export interface OrderToReturn {
    orderNumber: string;
    quantity: number;
    skuId: string;
    skuName: string;
    upc: number;
    imageUrl: string;
    sellingPrice: number;
    mrp: number;
}

export interface OrderModifyBulk {
    modifiedItems: ModifiedItem[];
    orderNumber: string;
}

export interface ModifiedItem {
    reason: string;
    quantity: number;
    sku_id: string;
}
