import { CouponDiscountType, OrderType, CouponProvider, ApprovalStatus } from '~/app/common';
export class Coupon {
    id: string;
    couponCode: string;
    couponTypeId: CouponDiscountType; // Price Or Percentage
    orderTypeId: OrderType;   // For Medicine Or Butchery
    price: number;
    percentage: number;
    description: string;
    noOfTimes: number;
    minOrderValue: number;
    maxDiscount: number;
    couponProvider: CouponProvider = CouponProvider.Qwipo;
    approvalStatusId: ApprovalStatus = ApprovalStatus.Success;
    startDate: number;
    endDate: number;
    termsandconditions: Array<string> = [];
}