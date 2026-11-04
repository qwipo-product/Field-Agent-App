import { Address, FieldAgent } from './index';
import { OrderType } from '~/app/common';
export class OrderMerchant {
  id: string = "";
  token: string = "";
  name: string = "";
  email: string = "";
  mobileNumber: string = "";
  percentage: number = 0;
  orderReady: boolean = false;
  orderPicked: boolean = false;
  pickUpFieldAgent: FieldAgent;
  invoice: InvoiceAsset;
  gstNumber: string = "";
  merchantTypeId: OrderType = OrderType.Medicine;
  shopDetails: Shop = new Shop();
}
export class Shop {
  shopName: string = "";
  address: Address = new Address();
}
export class InvoiceAsset {
  invoiceUrl: string;
  invoiceNumber: string;
}
