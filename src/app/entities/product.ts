import { PriceUnit, PriceSelection } from "~/app/common";

export class LookUpItem {
    display: string;
    price: number;
}
export class QuantityUnit {
    showKgs: Boolean;
    showGrms: Boolean;
    showLtrs: Boolean;
    showMlltrs: Boolean;
    showPacks: Boolean;
    showSingleItem: Boolean;
    showPiece: Boolean;

}

export class Product {
    id: string;
    itemId: string;
    itemName: string;
    itemImage: string;
    upc: string;
    maximumRetailPrice: string;
    sellingPrice: string;
    orderNumber: string;
    orderStatusId: number;
    orderDate: string;
    orderAmount: string;
    quantity: number;
    weight: number;
    createdAt: string;
    updatedAt: string;
}


