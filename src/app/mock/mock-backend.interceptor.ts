import { Injectable } from "@angular/core";
import { HttpErrorResponse, type HttpEvent, HttpHandler, type HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Observable, of, throwError, timer } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { getString } from "@nativescript/core/application-settings";
import {
    AGENTS, APP_SETTINGS, HOPS, MOCK_IMAGE, MockHop, MockOrder, MockTrip, ORDERS, POINTS, PRODUCTS,
    RETURN_REASONS, TRIPS, VENDOR_BUSINESS_TYPE, WAREHOUSE, orderAmount, ymd,
} from "./mock-data";

// Answers every HttpClient call with synthetic data from mock-data.ts so the app can run with no backend.
// Registered in main.ts. State lives in memory and resets when the app restarts.

type Handler = (match: RegExpMatchArray, body: any, req: HttpRequest<any>) => any;

class NotFound {
    constructor(public message: string) { }
}

const clone = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)));
const ok = (data: any = null, message = "Success") => ({ success: true, message, data });
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

const tripOf = (h: MockHop) => TRIPS.find((t) => t.id === h.tripId)!;
const agentById = (id: string) => AGENTS.find((a) => a.id === id);
const isFieldStaff = (designation: number) => designation === 3 || designation === 4;
const today = () => ymd(new Date());

// ---------- read models (shaped like the real API) ----------

interface ItemLine { orderNumber: string; sku: string; qty: number; }

function hopLines(h: MockHop): ItemLine[] {
    const fromOrders = h.orderNumbers.flatMap((n) =>
        ORDERS[n].lines.filter((l) => l.qty > 0).map((l) => ({ orderNumber: n, sku: l.sku, qty: l.qty }))
    );
    return [...fromOrders, ...h.items.map((i) => ({ orderNumber: i.orderNumber, sku: i.sku, qty: i.qty }))];
}

const linesValue = (lines: { sku: string; qty: number }[]) => sum(lines.map((l) => l.qty * PRODUCTS[l.sku].sp));
const returnsValue = (h: MockHop) => linesValue(h.returns);
const hopWeight = (h: MockHop) => round2(sum(hopLines(h).map((l) => l.qty * PRODUCTS[l.sku].unitWeight)));
const hopDispatchValue = (h: MockHop) =>
    h.orderNumbers.length ? sum(h.orderNumbers.map((n) => orderAmount(ORDERS[n]))) : linesValue(h.items);

// Spreads what the customer has paid / returned at this hop across its orders, oldest first.
function orderOutstanding(h: MockHop): Record<string, number> {
    let credit = h.cash + h.online + returnsValue(h);
    const outstanding: Record<string, number> = {};
    for (const n of h.orderNumbers) {
        const amount = orderAmount(ORDERS[n]);
        const applied = Math.min(amount, credit);
        credit -= applied;
        outstanding[n] = round2(amount - applied);
    }
    return outstanding;
}

function orderStatus(h: MockHop, o: MockOrder | undefined): number {
    const trip = tripOf(h);
    if (o?.cancelled) return 10; // Cancelled
    if (trip.status === 1 || trip.status === 4) return 6; // Ready for shipment
    if (h.mode === 2) return h.status === 2 ? 8 : 7; // Delivered / Out for delivery
    if (h.mode === 1) return h.status === 2 ? 7 : 6;
    return 8;
}

function hopRow(h: MockHop) {
    const trip = tripOf(h);
    const p = POINTS[h.pointId];
    const lines = hopLines(h);
    return {
        trip_id: trip.id,
        target_date: trip.date,
        hop_id: h.id,
        trip_number: trip.tripNumber,
        cluster: trip.cluster,
        sequence: trip.sequence,
        source: trip.source,
        delivery_agent_id: trip.deId,
        trip_status: trip.status,
        point_id: h.pointId,
        point_name: p.name,
        point_business_name: p.businessName,
        point_mobile_number: p.mobile,
        point_address: p.address,
        point_lat: p.lat,
        point_lng: p.lng,
        otp: h.otp,
        hop_status: h.status,
        stop_number: h.stop,
        point_mode: h.mode,
        point_type: h.type,
        hop_created_at: h.createdAt,
        hop_updated_at: h.updatedAt,
        orders_count: new Set(lines.map((l) => l.orderNumber)).size,
        skus_count: new Set(lines.map((l) => l.sku)).size,
        weight: hopWeight(h),
    };
}

function hopSummary(h: MockHop) {
    const { delivery_agent_id, ...row } = hopRow(h);
    const value = hopDispatchValue(h);
    return {
        ...row,
        dispatch_value: value,
        customer_returns: returnsValue(h),
        vendor_pickups: h.mode === 1 && h.type === 1 ? value : 0,
        vendor_returns: h.mode === 3 && h.type === 1 ? value : 0,
        online_payments: h.online,
        cash_collections: h.cash,
    };
}

function hopItemRows(h: MockHop) {
    const outstanding = orderOutstanding(h);
    return hopLines(h).map((l, i) => {
        const o = ORDERS[l.orderNumber];
        const p = PRODUCTS[l.sku];
        const vendor = POINTS[o?.vendorId] ?? POINTS[h.pointId];
        return {
            id: `${h.id}-item-${i + 1}`,
            item_id: p.id,
            item_name: p.name,
            item_image: p.image,
            maximum_retail_price: p.mrp,
            selling_price: String(p.sp),
            upc: p.upc,
            order_number: l.orderNumber,
            order_status_id: String(orderStatus(h, o)),
            order_date: o?.orderDate ?? h.createdAt,
            vendor_id: vendor.id,
            vendor_name: vendor.name,
            vendor_business_name: vendor.businessName,
            customer_id: o?.customerId ?? "",
            transit_mode: 1,
            fulfilment_type: 1,
            order_amount: String(o ? orderAmount(o) : 0),
            quantity: l.qty,
            weight: round2(l.qty * p.unitWeight),
            created_at: o?.orderDate ?? h.createdAt,
            updated_at: h.updatedAt,
            vendor_business_type_id: String(VENDOR_BUSINESS_TYPE[vendor.id] ?? 1),
            outstanding_amount: String(outstanding[l.orderNumber] ?? 0),
            logistics_status_id: "1",
            shipping_charges_customer_rounded: o?.shipping ?? 0,
            shipping_charges_customer_total: String(o?.shipping ?? 0),
            coupon_discount_amount: String(o?.coupon ?? 0),
        };
    });
}

function returnRow(line: { orderNumber: string; sku: string; qty: number; createdAt?: string }, h: MockHop) {
    const p = PRODUCTS[line.sku];
    const vendor = POINTS[ORDERS[line.orderNumber]?.vendorId] ?? POINTS[h.pointId];
    return {
        order_number: line.orderNumber,
        sku_id: p.id,
        image_url: p.image,
        mrp: p.mrp,
        selling_price: p.sp,
        upc: String(p.upc),
        weight_per_unit: p.unitWeight,
        stock_uom: "PCS",
        package_type: "Box",
        hsn_code: "1101",
        total_net_amount: line.qty * p.sp,
        total_weight: round2(line.qty * p.unitWeight),
        quantity: line.qty,
        sku_name: p.name,
        created_at: line.createdAt ?? h.updatedAt,
        vendor_name: vendor.businessName,
        vendor_id: vendor.id,
    };
}

function tripHops(t: MockTrip) {
    return HOPS.filter((h) => h.tripId === t.id);
}

function tripRow(t: MockTrip) {
    const hops = tripHops(t);
    const de = agentById(t.deId);
    const driver = agentById(t.driverId);
    return {
        created_at: t.createdAt,
        target_date: t.date,
        id: t.id,
        name: t.name,
        cluster: t.cluster,
        sequence: t.sequence,
        source: t.source,
        trip_number: t.tripNumber,
        hops: hops.length,
        pickup_hops: hops.filter((h) => h.mode === 1).length,
        delivery_hops: hops.filter((h) => h.mode === 2).length,
        return_hops: hops.filter((h) => h.mode === 3).length,
        weight_kgs: round2(sum(hops.filter((h) => h.mode === 2).map(hopWeight))),
        de_name: de?.name ?? "",
        de_number: de?.mobileNumber ?? "",
        kms: t.kms,
        status: t.status,
        start_time: t.startTime,
        end_time: t.endTime,
        dr_name: driver?.name ?? "",
        dr_number: driver?.mobileNumber ?? "",
        vehicle_model: t.vehicleModel,
    };
}

function tripSummary(t: MockTrip) {
    const hops = tripHops(t);
    const deliveries = hops.filter((h) => h.mode === 2);
    const deliveryLines = deliveries.flatMap(hopLines);
    const de = agentById(t.deId);
    const row = tripRow(t);
    return {
        trip_id: t.id,
        target_date: t.date,
        cluster: t.cluster,
        sequence: t.sequence,
        source: t.source,
        trip_number: t.tripNumber,
        de_name: de?.name ?? "",
        de_number: de?.mobileNumber ?? "",
        distance: t.kms,
        trip_status: t.status,
        start_time: t.startTime,
        end_time: t.endTime,
        hops: row.hops,
        pickup_hops: row.pickup_hops,
        delivery_hops: row.delivery_hops,
        return_hops: row.return_hops,
        weight: row.weight_kgs,
        orders_count: new Set(deliveryLines.map((l) => l.orderNumber)).size,
        skus_count: new Set(deliveryLines.map((l) => l.sku)).size,
        dispatch_value: sum(deliveries.map(hopDispatchValue)),
        customer_returns: sum(deliveries.map(returnsValue)),
        vendor_pickups: sum(hops.filter((h) => h.mode === 1 && h.type === 1).map(hopDispatchValue)),
        vendor_returns: sum(hops.filter((h) => h.mode === 3 && h.type === 1).map(hopDispatchValue)),
        online_payments: sum(deliveries.map((h) => h.online)),
        cash_collections: sum(deliveries.map((h) => h.cash)),
    };
}

function agentResponse(mobile: string) {
    const a = AGENTS.find((x) => x.mobileNumber === mobile);
    if (!a) throw new NotFound(`No field agent with mobile ${mobile}`);
    return ok({
        id: a.id,
        name: a.name,
        mobileNumber: a.mobileNumber,
        email: a.email,
        password: "",
        address: a.address,
        areaName: a.areaName,
        landMark: a.landMark,
        city: WAREHOUSE.city,
        state: WAREHOUSE.state,
        pinCode: a.pinCode,
        country: WAREHOUSE.country,
        latitude: WAREHOUSE.latitude,
        longitude: WAREHOUSE.longitude,
        aadharNumber: "XXXX-XXXX-4321",
        aadharCopy: "",
        panNumber: "ABCDE1234F",
        panCopy: "",
        gstNumber: "",
        gstCopy: "",
        supplierName: "Qwipo Logistics",
        supplierType: 1,
        tcsPercentage: "0",
        contractMode: 1,
        status: a.status,
        designation: a.designation,
        location: WAREHOUSE.id,
        type: 4,
        locationInfo: WAREHOUSE,
    });
}

// ---------- write helpers ----------

const hopById = (id: string) => {
    const h = HOPS.find((x) => x.id === id);
    if (!h) throw new NotFound(`No hop ${id}`);
    return h;
};

const tripById = (id: string) => {
    const t = TRIPS.find((x) => x.id === id);
    if (!t) throw new NotFound(`No trip ${id}`);
    return t;
};

// The delivery hop an order is (or was) being delivered on, preferring live trips.
function deliveryHopForOrder(orderNumber: string): MockHop | undefined {
    const candidates = HOPS.filter((h) => h.mode === 2 && h.orderNumbers.includes(orderNumber));
    return candidates.find((h) => tripOf(h).status === 2) ?? candidates[0];
}

function recordReturn(orderNumber: string, item: { sku_id?: string; quantity?: number; reason?: string }) {
    const h = deliveryHopForOrder(orderNumber);
    if (!h || !item?.sku_id || !PRODUCTS[item.sku_id]) return;
    h.returns.push({
        orderNumber,
        sku: item.sku_id,
        qty: +item.quantity || 0,
        reason: item.reason || "Other",
        createdAt: new Date().toISOString(),
    });
}

function addItemsToHop(h: MockHop, items: any[]) {
    for (const i of items) {
        const sku = i.item_id ?? i.itemId ?? i.sku_id;
        if (!PRODUCTS[sku]) continue;
        h.items.push({ sku, orderNumber: i.order_number ?? i.orderNumber ?? "", qty: +i.quantity || 0 });
    }
    h.updatedAt = new Date().toISOString();
}

interface MockPayment { requestId: string; paymentId: string; amount: number; hopId?: string; createdAt: number; credited: boolean; }
const PAYMENTS: Record<string, MockPayment> = {};
let idSeq = 1000;
const newId = (prefix: string) => `${prefix}-${++idSeq}`;

function paymentStatus(p: MockPayment) {
    // Stay PENDING for a few seconds so the "waiting for payment" state is visible, then succeed.
    if (Date.now() - p.createdAt < 8000) {
        return { status: "PENDING", amount: p.amount, request_id: p.requestId, payment_id: p.paymentId };
    }
    if (!p.credited && p.hopId) {
        hopById(p.hopId).online += p.amount;
        p.credited = true;
    }
    return { status: "SUCCESS", amount: p.amount, request_id: p.requestId, payment_id: p.paymentId };
}

// Re-orders a delivery agent's pending stops nearest-first from where they are standing.
function optimizeRoute(lat: number, lng: number, agentId: string) {
    const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => Math.hypot(a.lat - b.lat, a.lng - b.lng);
    for (const t of TRIPS.filter((x) => x.status === 2 && (x.deId === agentId || x.driverId === agentId))) {
        const hops = tripHops(t);
        const pending = hops.filter((h) => h.status === 1 && h.mode === 2);
        const done = hops.filter((h) => h.status === 2);
        let stop = Math.max(0, ...done.map((h) => h.stop));
        let here = { lat, lng };
        while (pending.length) {
            pending.sort((a, b) => dist(here, POINTS[a.pointId]) - dist(here, POINTS[b.pointId]));
            const next = pending.shift()!;
            next.stop = ++stop;
            here = POINTS[next.pointId];
        }
        for (const h of hops.filter((x) => x.status === 1 && x.mode !== 2)) h.stop = ++stop;
    }
    return true;
}

const currentAgent = () => AGENTS.find((a) => a.mobileNumber === getString("loggedInUser", ""));

// ---------- routes ----------

const ROUTES: [string, RegExp, Handler][] = [
    // auth / user
    ["POST", /\/auth\/(generate_token|refresh_token)$/, () => ok({ token: `mock-token-${Date.now()}` })],
    ["POST", /\/otp\/(send|verify)$/, () => ({ success: true, message: "OTP verified" })],
    ["GET", /\/resource\/get_by_mobile_number\/(\d*)$/, (m) => agentResponse(m[1])],
    ["GET", /\/resource\/agent\/([^/]+)\/warehouse$/, (m) => {
        const a = agentById(m[1]);
        return ok({
            resource_id: m[1], name: a?.name ?? "", mobile_number: a?.mobileNumber ?? "", designation: a?.designation ?? 3,
            warehouse_id: WAREHOUSE.warehouse_id, warehouse_name: WAREHOUSE.warehouse_name,
        });
    }],
    ["GET", /\/app_info\/get\/fa_app$/, () => {
        const settings = clone(APP_SETTINGS);
        if (currentAgent()?.forceOldAppVersion) {
            settings.appMinVersion = { android: "99.0.0", ios: "99.0.0" };
        }
        return ok(settings);
    }],

    // trips
    ["POST", /\/trips\/filters$/, (_m, body) => {
        const agent = agentById(body?.delivery_agent_id);
        const start = body?.start_date || today();
        const end = body?.end_date || start;
        const trips = TRIPS
            .filter((t) => t.date >= start && t.date <= end)
            .filter((t) => !agent || !isFieldStaff(agent.designation) || t.deId === agent.id || t.driverId === agent.id);
        return ok(trips.map(tripRow));
    }],
    ["GET", /\/trips\/([^/]+)\/summary$/, (m) => tripSummary(tripById(m[1]))],
    ["PUT", /\/trips\/start$/, (_m, body) => {
        const t = tripById(body.tripId);
        t.status = 2;
        t.startTime = new Date().toISOString();
        return ok(t.id, "Trip started");
    }],
    ["PUT", /\/trips\/complete$/, (_m, body) => {
        const t = tripById(body.tripId);
        t.status = 3;
        t.endTime = new Date().toISOString();
        return ok(t.id, "Trip completed");
    }],
    ["PUT", /\/trips\/([^/]+)\/status$/, (m, body) => {
        tripById(m[1]).status = +body.status;
        return ok(m[1], "Trip status updated");
    }],
    ["GET", /\/trips\/vendor_reco_summary\/tripId\/([^/]+)\/vendor\/([^/]+)$/, (m) => {
        const hops = HOPS.filter((h) => h.tripId === m[1]);
        const deliveries = hops.filter((h) => h.mode === 2);
        return ok({
            dispatch_value: sum(hops.filter((h) => h.mode === 1 && h.pointId === m[2]).map(hopDispatchValue)),
            return_value: sum(deliveries.map(returnsValue)),
            online_payment: sum(deliveries.map((h) => h.online)),
            cash: sum(deliveries.map((h) => h.cash)),
        });
    }],

    // hops
    ["POST", /\/hops\/filters$/, (_m, body) => {
        let hops: MockHop[];
        if (body?.tripId) {
            hops = HOPS.filter((h) => h.tripId === body.tripId);
        } else {
            const agent = agentById(body?.agentId);
            const live = TRIPS.filter((t) => t.date === today() && (t.status === 1 || t.status === 2));
            const mine = agent && isFieldStaff(agent.designation)
                ? live.filter((t) => t.deId === agent.id || t.driverId === agent.id)
                : live;
            hops = HOPS.filter((h) => mine.some((t) => t.id === h.tripId));
        }
        return hops.map(hopRow);
    }],
    ["GET", /\/hops\/([^/]+)\/summary$/, (m) => hopSummary(hopById(m[1]))],
    ["GET", /\/hops\/([^/]+)\/hop_items$/, (m) => hopItemRows(hopById(m[1]))],
    ["GET", /\/hops\/([^/]+)\/hop_returns$/, (m) => {
        const h = hopById(m[1]);
        const lines = h.mode === 3 ? h.items : h.returns;
        return lines.map((l) => returnRow(l, h));
    }],
    ["PUT", /\/hops\/([^/]+)\/status$/, (m, body) => {
        const h = hopById(m[1]);
        h.status = +body.status;
        h.updatedAt = new Date().toISOString();
        return ok(h.id, "Hop status updated");
    }],
    ["PUT", /\/hops\/([^/]+)\/hop_items$/, (m, body) => {
        // Order modification: new quantities per (order, sku)
        for (const i of body ?? []) {
            const line = ORDERS[i.order_number]?.lines.find((l) => l.sku === i.item_id);
            if (line) line.qty = +i.quantity;
        }
        hopById(m[1]).updatedAt = new Date().toISOString();
        return ok(null, "Hop items updated");
    }],
    ["POST", /\/hops\/add_hop_items\/([^/]+)$/, (m, body) => {
        addItemsToHop(hopById(m[1]), Array.isArray(body) ? body : [body]);
        return ok(null, "Hop items added");
    }],
    ["GET", /\/hops\/check_return_hop\/tripId\/([^/]+)\/vendor\/([^/]+)$/, (m) => {
        const h = HOPS.find((x) => x.tripId === m[1] && x.mode === 3 && x.pointId === m[2] && x.status === 1);
        if (!h) return ok(null, "No return hop");
        const row = hopRow(h);
        return ok({
            id: h.id, trip_id: h.tripId, point_id: h.pointId, point_name: row.point_name,
            point_business_name: row.point_business_name, point_mobile_number: row.point_mobile_number,
            point_address: row.point_address, point_lat: String(row.point_lat), point_lng: String(row.point_lng),
            stop_number: h.stop, point_mode: h.mode, point_type: h.type, otp: h.otp, status: h.status,
            created_at: h.createdAt, updated_at: h.updatedAt, created_by: "mock", updated_by: "mock",
        });
    }],
    ["POST", /\/hops\/trips_hop_optimize$/, (_m, body) => optimizeRoute(+body.point_lat, +body.point_lng, body.deliveryAgentId)],
    ["POST", /\/hops\/hop_attempt_history$/, () => {
        const id = newId("attempt");
        return { ...ok({ id }), id };
    }],
    ["POST", /\/hops\/post_message_to_re_attempt_queue$/, () => ok(null, "Queued")],
    ["POST", /\/hops$/, (_m, body) => {
        // New return hop created by the app (returns to warehouse / vendor)
        if (!POINTS[body.point_id]) {
            POINTS[body.point_id] = {
                id: body.point_id, name: body.point_name, businessName: body.point_business_name,
                mobile: body.point_mobile_number, address: body.point_address, lat: +body.point_lat, lng: +body.point_lng,
            };
        }
        const h: MockHop = {
            id: newId("hop-new"), tripId: body.trip_id, stop: +body.stop_number, mode: +body.point_mode,
            type: +body.point_type, pointId: body.point_id, status: +body.status || 1, otp: String(body.otp ?? "0000"),
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            orderNumbers: [], items: [], cash: 0, online: 0, returns: [],
        };
        addItemsToHop(h, Array.isArray(body.hopItems) ? body.hopItems : [body.hopItems]);
        HOPS.push(h);
        return ok({ id: h.id }, "Hop created");
    }],

    // orders / returns
    ["GET", /\/core\/return-reasons$/, () => ok(clone(RETURN_REASONS))],
    ["POST", /\/orders\/returns\/bulk_orders$/, (_m, body) => {
        for (const o of body ?? []) for (const i of o.items ?? []) recordReturn(o.orderNumber, i);
        return ok(null, "Returns recorded");
    }],
    ["POST", /\/orders\/([^/]+)\/returns$/, (m, body) => {
        recordReturn(m[1], body);
        return ok(null, "Return recorded");
    }],
    ["POST", /\/orders\/([^/]+)\/items_modify$/, () => ok(null, "Order modified")],
    ["POST", /\/orders\/bulk_orders_modify$/, () => ok(null, "Orders modified")],

    // payments
    ["GET", /\/vendor\/([^/]+)$/, (m) => ok({
        id: m[1],
        name: POINTS[m[1]]?.businessName ?? "Vendor",
        admin_config: {
            fulfillment: { fulfillmentBy: 1 },
            providers: [{ gatewayType: 4, paymentType: 2 }], // PaySharp QR
        },
    })],
    ["POST", /\/cod_collections$/, (_m, body) => {
        const h = hopById(body.hop_id);
        h.cash += round2(sum((body.orders ?? []).map((o: any) => +o.amount || 0)));
        h.updatedAt = new Date().toISOString();
        return ok(null, "Cash collection recorded");
    }],
    ["POST", /\/payment_request\/create$/, () => ok({ id: newId("payreq") }, "Payment request sent to customer")],
    ["POST", /\/payments\/initiate$/, (_m, body) => {
        const hop = HOPS.find((h) => h.pointId === body?.customer?.id && h.mode === 2 && h.status === 1 && tripOf(h).status === 2);
        const p: MockPayment = {
            requestId: newId("req"), paymentId: newId("pay"), amount: +body.amount || 0,
            hopId: hop?.id, createdAt: Date.now(), credited: false,
        };
        PAYMENTS[p.paymentId] = p;
        return ok({
            request_id: p.requestId,
            payment_id: p.paymentId,
            amount: p.amount,
            urls: { qr_code: MOCK_IMAGE("upi-qr") },
        });
    }],
    ["POST", /\/payments\/gateway_payment_status$/, (_m, body) => {
        const p = PAYMENTS[body.paymentId];
        if (!p) throw new NotFound(`No payment ${body.paymentId}`);
        return ok(paymentStatus(p));
    }],
    ["GET", /\/payments$/, (_m, _b, req) => {
        const p = PAYMENTS[req.params.get("paymentId") ?? req.urlWithParams.match(/[?&]paymentId=([^&]+)/)?.[1]];
        if (!p) throw new NotFound("No payment");
        return ok(paymentStatus(p));
    }],

    // inventory, files, messaging
    ["POST", /\/stock\/validate_update$/, () => ({ ...ok(), inventoryQty: 120, tripsQty: 0, updateRequired: false })],
    ["POST", /\/inventory\/(decrement\/stock|insert)$/, () => ok(null, "Inventory updated")],
    ["PUT", /\/images\/upload_action_image$/, () => ok({ url: MOCK_IMAGE("reattempt-proof") })],
    ["POST", /\/messagequeue\/post$/, () => ok(null, "Message queued")],
];

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const path = req.url.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
        const route = ROUTES.find(([method, pattern]) => method === req.method && pattern.test(path));
        const latency = 250 + Math.random() * 350;

        if (!route) {
            console.log(`[MOCK] unhandled ${req.method} ${req.url} -> empty success`);
            return timer(latency).pipe(mergeMap(() => of(new HttpResponse({ status: 200, url: req.url, body: ok() }))));
        }

        return timer(latency).pipe(
            mergeMap(() => {
                try {
                    const body = clone(route[2](path.match(route[1])!, req.body, req));
                    console.log(`[MOCK] ${req.method} ${path} -> 200`);
                    return of(new HttpResponse({ status: 200, url: req.url, body }));
                } catch (e: any) {
                    const status = e instanceof NotFound ? 404 : 500;
                    console.log(`[MOCK] ${req.method} ${path} -> ${status} ${e?.message ?? e}`);
                    return throwError(() => new HttpErrorResponse({ status, url: req.url, error: { success: false, message: e?.message } }));
                }
            })
        );
    }
}
