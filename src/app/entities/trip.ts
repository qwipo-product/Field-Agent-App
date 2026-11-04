export class TripFilters {
    selectedMainOption: string;
    selectedSubOption: string;
    startDate: string;
    endDate: string;
}

export class AdminHopFilter {
    selectedMainOption: string;
    selectedOptions: number[];
}

export interface TripPayload {
    agent_mobile: string;
    trip_status: any;
    trip_name: string;
    start_date: string;
    end_date: string;
    page_number: number;
    page_size: number;
    trip_number: string;
    location_id: string;
    delivery_agent_id: string;
}

export interface TripListResponse {
    created_at: string;
    target_date: string;
    id: string;
    name: number;
    cluster: string;
    sequence: number;
    source: number;
    trip_number: number;
    hops: number;
    pickup_hops: number;
    delivery_hops: number;
    return_hops: number;
    weight_kgs: number;
    de_name: string;
    de_number: string;
    kms: number;
    status: number;
    start_time: string;
    end_time: string | null;
    dr_name: string;
    dr_number: string;
    vehicle_model: number;
}

export interface TripListMappedResponse {
    createdAt: string;
    targetDate: string;
    id: string;
    name: number;
    cluster: string;
    sequence: number;
    source: number;
    tripNumber: number;
    hops: number;
    pickupHops: number;
    deliveryHops: number;
    returnHops: number;
    weight: number;
    deliveryAgentName: string;
    deliveryAgentMobileNumber: string;
    kms: number;
    status: number;
    startTime: string;
    endTime: string | null;
    driverName: string;
    driverNumber: string;
    vehicleModel: number;
}


export interface TripSummaryResponse {
    trip_id: string;
    target_date: string;
    cluster: string;
    sequence: number;
    source: number;
    trip_number: number;
    de_name: string;
    de_number: string;
    distance: number;
    trip_status: number;
    start_time: string | null;
    end_time: string | null;
    hops: number;
    pickup_hops: number;
    delivery_hops: number;
    return_hops: number;
    weight: number;
    orders_count: number;
    skus_count: number;
    dispatch_value: number;
    customer_returns: number;
    vendor_pickups: number;
    vendor_returns: number;
    online_payments: number;
    cash_collections: number;
  }


  export interface TripSummaryMappedResponse {
    tripId: string;
    targetDate: string;
    cluster: string;
    sequence: number;
    source: number;
    tripNumber: number;
    deName: string;
    deNumber: string;
    distance: number;
    tripStatus: number;
    startTime: string | null;
    endTime: string | null;
    hops: number;
    pickupHops: number;
    deliveryHops: number;
    returnHops: number;
    weight: number;
    ordersCount: number;
    skusCount: number;
    dispatchValue: number;
    customerReturns: number;
    vendorPickups: number;
    vendorReturns: number;
    onlinePayments: number;
    cashCollections: number;
    clusterSequence : string;
  }