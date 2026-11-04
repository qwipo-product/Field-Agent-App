export enum UserStatus {
    InActive = 0,
    Active = 1,
}
export enum DesignationType {
    DeliveryBoy = 3,
    Driver = 4,
    SalesRepresentative = 5,
    Manager = 6,
    OperationExecutive = 12,
    OperationAdmin = 13,
}
export enum VehicleModel {
    TwoWheeler = 2,
    ThreeWheeler = 3,
    FourWheeler = 4,
}

export enum OrderStatus {
    OrderPlaced = 1,
    OrderPreparation = 2,
    OrderConfirmed = 3,
    ReadyForPickup = 4,
    OrderInvoiced = 5,
    ReadyForShipment = 6,
    OutForDelivery = 7,
    Delivered = 8,
    Cancelled = 10,
    None = 99,
}
export const JobStatus = {
    Created: "Created",
    InProgress: "InProgress",
    Error: "Error",
    Completed: "Completed",
    InvalidInput: "InvalidInput",
};
export interface IErrorObj {
    orderNumber: string;
    error: string;
    id: string;
    date: string;
}
export enum CustomerOrderStatus {
    Ordered = 1,
    Verified = 2,
    Dispatched = 3,
    Cancelled = 4,
    Delivered = 5,
}
export enum UserType {
    Customer = 1,
    Dealer = 2,
    Merchant = 3,
    FieldAgent = 4,
    SupportMember = 5,
    MarketingAgent = 6,
    Guest = 99,
}
export enum PaymentStatus {
    Paid = 1,
    UnPaid = 2,
    InProgress = 3,
    None = 99,
}
export enum PrescriptionType {
    Image = 1,
    Text = 2,
    None = 99,
}
export enum ActivityType {
    NewRegistration = 1,
    NewOrder = 2,
    PriceUpdate = 3,
    BankDetailsUpdate = 4,
    OnlineStatus = 5,
    OfflineStatus = 6,
    OrderReady = 7,
    OrderPicked = 8,
    OrderDelivered = 9,
    OrderDeliveryDelayed = 10,
    OrderCancelled = 11,
    OrderCancellationRequest = 12,
    OnlinePayment = 13,
    PersonalDetailsUpdate = 14,
    PaymentUpdate = 15,
}

export enum DeliveryStatus {
    Delivered = 1,
    NotDelivered = 2,
    Cancelled = 3,
    None = 99,
}

export enum OrderPaymentStatus {
    Initiated = 1,
    Success = 2,
    Failure = 3,
    None = 99,
}
export enum OrderType {
    Medicine = 1,
    Butchery = 2,
    Sweets = 3,
    Food = 4,
    Nursery = 5,
    VegetablesFruits = 6,
    CakesBakery = 7,
    Milk = 8,
    Fuel = 9,
    Groceries = 10,
    PoojaNeeds = 11,
    OrganicGroceries = 12,
    HealthDiet = 13,
    CarServices = 14,
    Laundry = 15,
    None = 99,
}
export enum CouponStatus {
    Applied = 1,
    Failed = 2,
    Expired = 3,
    None = 99,
}
export enum CouponType {
    Price = 1,
    Percentage = 2,
    None = 99,
}
export enum MerchantType {
    Medicine = 1,
    Butchery = 2,
    None = 99,
}
export enum CouponDiscountType {
    Price = 1,
    Percentage = 2,
    None = 99,
}
export enum CouponProvider {
    Qwipo = 1,
    Dealer = 2,
    None = 3,
}
export enum PrescriptionType {
    prescriptionImageUrl = 1,
    text = 2,
}
export interface ValuePair {
    id: number;
    name: string;
}
export enum ApprovalStatus {
    Success = 1,
    Pending = 2,
    Rejected = 3,
    None = 99,
}
export enum PriceSelection {
    ProductPrice = 1,
    LookUpPrice = 2,
    None = 99,
}
export enum PriceUnit {
    KG = 1,
    Litre = 2,
    Grams = 3,
    MilliLitres = 4,
    SingleItem = 5,
    Pack = 6,
    Piece = 7,
    None = 99,
}
export enum ProviderType {
    Master = 1,
    Dealer = 2,
    Other = 3,
}
export var states = [
    { id: 1, name: "Andhra Pradesh" },
    { id: 2, name: "Arunachal Pradesh" },
    { id: 3, name: "Assam" },
    { id: 4, name: "Bihar" },
    { id: 5, name: "Chhattisgarh" },
    { id: 6, name: "Delhi / New Delhi" },
    { id: 7, name: "Goa" },
    { id: 8, name: "Gujarat" },
    { id: 9, name: "Haryana" },
    { id: 10, name: "Himachal Pradesh" },
    { id: 11, name: "Jammu & Kashmir" },
    { id: 12, name: "Jharkhand" },
    { id: 13, name: "Karnataka" },
    { id: 14, name: "Kerala" },
    { id: 15, name: "Madhya Pradesh" },
    { id: 16, name: "Maharashtra" },
    { id: 17, name: "Manipur" },
    { id: 18, name: "Meghalaya" },
    { id: 19, name: "Mizoram" },
    { id: 20, name: "Nagaland" },
    { id: 21, name: "Odisha (Orissa)" },
    { id: 22, name: "Punjab" },
    { id: 23, name: "Rajasthan" },
    { id: 24, name: "Sikkim" },
    { id: 25, name: "Tamil Nadu" },
    { id: 26, name: "Telangana" },
    { id: 27, name: "Tripura" },
    { id: 28, name: "Uttar Pradesh" },
    { id: 29, name: "Uttarakhand" },
    { id: 30, name: "West Bengal" },
];

export class EnumEx {
    static getNames(e: any) {
        return Object.keys(e).filter((v) => isNaN(parseInt(v, 10)));
    }

    static getValues(e: any) {
        return Object.keys(e)
            .map((v) => parseInt(v, 10))
            .filter((v) => !isNaN(v));
    }

    static getNamesAndValues(e: any): Array<ValuePair> {
        return EnumEx.getValues(e).map((v) => {
            return { id: v, name: e[v] as string };
        });
    }
}
export enum CratesOperationMode {
    Operation = 1,
    BulkRecovery = 2,
    SingleRecovery = 3,
}
export enum DBOperation {
    unknown = 0,
    contains = 1,
    doesNotContain = 2,
    startsWith = 3,
    endsWith = 4,
    equalTo = 5,
    notEqualTo = 6,
    greaterThan = 7,
    greaterThanOrEqualTo = 8,
    lessThan = 9,
    lessThanOrEqualTo = 10,
    in = 11,
    notIn = 12,
    isNULL = 13,
    isNotNull = 14,
    dateEqual = 15,
    dateNotEqual = 16,
    dateGreaterThan = 17,
    dateGreaterThanOrEqual = 18,
    dateLessThan = 19,
    dateLessThanOrEqual = 20,
    orderBy = 21,
    doesNotStartsWith = 22,
    doesNotEndsWith = 23,
}
export enum SortOperation {
    none = 0,
    ascending = 1,
    descending = 2,
}

export enum LogicalOperation {
    none = 0,
    and = 1,
    or = 2,
}
export enum PairOperation {
    none = 0,
    open = 1,
    close = 2,
}
export enum PaymentsMode {
    Cash = 1,
    Cheque = 2,
    Online = 3,
    OperationsCash = 4,
}

export enum QrPaymentStatus {
    Initiated = 1,
    Success = 2,
    Failure = 3,
    Pending = 4,
    Cancelled = 5,
    Refunded = 6,
    Expired = 7,
    Declined = 8,
}

export enum HopStatus {
    NotStarted = 1,
    Completed = 2,
    None = 99,
}

export enum TripStatus {
    NotStarted = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
    None = 99,
}

export enum PointMode {
    PICKUP = 1,
    DELIVERY = 2,
    RETURN = 3,
    NONE = 99,
}

export enum PointType {
    VENDOR = 1,
    CUSTOMER = 2,
    WAREHOUSE = 3,
    NONE = 99,
}

export enum TransitMode {
    QWIPO_DELIVERY = 1,
    VENDOR_DROP = 2,
    QWIPO_PICKUP = 3,
    VENDOR_DELIVERY = 4,
}

export enum FulFillmentType {
    QWIPO = 1,
    VENDOR = 2,
}
export enum TripSource {
    Qwipo = 1,
    ThreePL = 2,
    Vendor = 3,
    Qwipo_Lite = 4,
    None = 99,
}

export enum DownLoadInvoice {
    Invoice = 1,
    PickUp_Indent = 2,
}
export enum DownLoadTripIndent {
    wareHouseIndent = 2,
    VendorIndent = 1,
}
export enum TripIndentMainFilter {
    date = 1,
    download = 2,
}

export enum HopMainFilter {
    Generate = 1,
    Download = 2,
}
export enum HopDownloadOptions {
    Invoices = 1,
    Pick_upIndent = 2,
}
export enum GenerateOptions {
    Invoices = 1,
    E_WayBill = 2,
}

export enum GateWayType {
    Paytm = 1,
    Instamojo = 2,
    Mobikwik = 3,
    PaySharp = 4,
    Rupifi = 5,
    None = 99,
}
export enum PaymentType {
    Upi = 1,
    QrCode = 2,
    Credit = 3,
    None = 4,
}
export enum MerchantBusinessType {
    Distributor = 1,
    Manufacturer = 2,
    Wholesaler = 3,
    JitVendor = 4,
    Inventory = 5,
    None = 99,
}

export enum PaymentOptions {
    CashEntry = 1,
    QRCode = 2,
    PaymentRequest = 3,
}

export enum PaysharpPaymentStatus {
    SUCCESS = 1,
    FAILED = 2,
    TIMEOUT = 3,
    PENDING = 4,
    EXPIRED = 5,
    None = 99,
}

export enum LogisticsEvents {
    VendorPickup = 1,
    WarehouseDelivery = 2,
    CustomerDelivery = 3,
    WarehouseReturn = 4,
    VendorReturn = 5,
    WarehousePickup = 6,
}


export enum LocationType {
    Vendor = 1,
    Logistic = 2,
    None = 99,
}

export enum NavigatedFrom {
    Trip = 1,
    Non_Trip = 2,
    None = 99,
}

export enum Action {
    ReAttempt = 1,
    Return = 2,
}

export const mapUploadImageType = (id: number | string) => {
    if (typeof id === "string") {
        return {
            shop_image: "shopUrl",
        }[id];
    }
    return {
        1: "shop_image",
    }[id];
};
