export class OrderModifyToBottomSheet {
    itemName: string;
    itemId: string;
    requestedQuantity: number;
    availableQuantity: string;
    damageQuantity: string;
    isVendorDrop: boolean;
    invoicedQty: number;
    upc: number;
    requestCss: number;
    requestPcs: number;
    availableCss: string;
    availablePcs: string;
    availableDamageCss: string;
    availableDamagePcs: string;
}
export class ModifyOrderInput {
    itemId: string;
    availableQuantity: number;
    damageQuantity: number;
    requestedQuantity: number;
    isVendorDrop: boolean;
}
export class OrderModifyInput {
    availableQty: number;
    damageQty: number;
}
export interface OrderModifyEntity {
    reason: string;
    quantity: number;
    sku_id: string;
}
