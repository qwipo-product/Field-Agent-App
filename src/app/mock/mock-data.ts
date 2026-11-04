// Synthetic dataset served by MockBackendInterceptor. Every person, shop, order and amount here is made up.
// The interceptor keeps this state in memory, so starting trips, completing stops, collecting cash, etc.
// change what later screens show. Restarting the app resets it.

export const MOCK_IMAGE = (key: string) => `~/images/mock/${key}.png`;

// ---------- helpers ----------

const pad = (n: number) => n.toString().padStart(2, "0");

export function ymd(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function at(dayOffset: number, hours: number, minutes = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
}

// ---------- people / places ----------

export interface MockLocation {
    id: string; name: string; warehouse_id: string; warehouse_name: string; area: string; city: string;
    state: string; country: string; pincode: string; latitude: string; longitude: string; type: string;
    createdAt: string; updatedAt: string;
}

export const WAREHOUSE: MockLocation = {
    id: "loc-alwal-hub",
    name: "Alwal Logistics Hub",
    warehouse_id: "wh-alwal-01",
    warehouse_name: "Qwipo Alwal Warehouse",
    area: "Old Alwal",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    pincode: "500010",
    latitude: "17.5020",
    longitude: "78.5113",
    type: "2", // LocationType.Logistic
    createdAt: at(-400, 10),
    updatedAt: at(-30, 10),
};

export interface MockAgent {
    id: string; name: string; mobileNumber: string; email: string; designation: number; status: number;
    address: string; areaName: string; landMark: string; pinCode: string;
    // Persona-only switches (not part of the API shape)
    forceOldAppVersion?: boolean;
}

// Log in with any of these numbers; any 6-digit OTP is accepted (ENV=test skips OTP).
export const AGENTS: MockAgent[] = [
    { id: "fa-ravi", name: "Ravi Kumar", mobileNumber: "9876543210", email: "ravi.kumar@example.com", designation: 3, status: 1, address: "H.No 2-14, Lothukunta", areaName: "Alwal", landMark: "Near Bus Depot", pinCode: "500015" },
    { id: "fa-suresh", name: "Suresh Reddy", mobileNumber: "9876543211", email: "suresh.reddy@example.com", designation: 4, status: 1, address: "Plot 77, Yapral", areaName: "Yapral", landMark: "Opp. Water Tank", pinCode: "500087" },
    { id: "fa-priya", name: "Priya Sharma", mobileNumber: "9876543212", email: "priya.sharma@example.com", designation: 12, status: 1, address: "Flat 302, Sai Residency", areaName: "Kowkoor", landMark: "Near Church", pinCode: "500010" },
    { id: "fa-anil", name: "Anil Verma", mobileNumber: "9876543213", email: "anil.verma@example.com", designation: 6, status: 1, address: "Villa 9, Green Meadows", areaName: "Kompally", landMark: "Near Petrol Bunk", pinCode: "500014" },
    { id: "fa-kiran", name: "Kiran Rao", mobileNumber: "9876543214", email: "kiran.rao@example.com", designation: 3, status: 0, address: "H.No 5-1, Bolarum", areaName: "Bolarum", landMark: "Station Road", pinCode: "500010" },
    { id: "fa-naveen", name: "Naveen Goud", mobileNumber: "9876543215", email: "naveen.goud@example.com", designation: 3, status: 1, address: "H.No 8-3, Macha Bolarum", areaName: "Alwal", landMark: "Temple Street", pinCode: "500010", forceOldAppVersion: true },
    // Other delivery staff who appear on trips but are not login personas
    { id: "fa-mahesh", name: "Mahesh Babu", mobileNumber: "9876500002", email: "", designation: 3, status: 1, address: "", areaName: "Kompally", landMark: "", pinCode: "500014" },
    { id: "fa-imran", name: "Imran Khan", mobileNumber: "9876500003", email: "", designation: 4, status: 1, address: "", areaName: "Bolarum", landMark: "", pinCode: "500010" },
    { id: "fa-rajesh", name: "Rajesh Naik", mobileNumber: "9876500004", email: "", designation: 3, status: 1, address: "", areaName: "Kompally", landMark: "", pinCode: "500014" },
    { id: "fa-salim", name: "Salim Shaikh", mobileNumber: "9876500005", email: "", designation: 4, status: 1, address: "", areaName: "Alwal", landMark: "", pinCode: "500010" },
];

export interface MockPoint {
    id: string; name: string; businessName: string; mobile: string; address: string; lat: number; lng: number;
}

const point = (id: string, name: string, businessName: string, mobile: string, address: string, lat: number, lng: number): MockPoint =>
    ({ id, name, businessName, mobile, address, lat, lng });

export const POINTS: Record<string, MockPoint> = Object.fromEntries([
    point(WAREHOUSE.warehouse_id, WAREHOUSE.warehouse_name, "Qwipo", "9000012340", "Plot 21, Lothkunta Road, Old Alwal, Hyderabad, Telangana, 500010", 17.502, 78.5113),
    // vendors
    point("v-lakshmi", "Lakshmi Narayana", "Sri Lakshmi Traders", "9700011122", "Shop 18, Begum Bazar, Hyderabad, Telangana, 500012", 17.3753, 78.4744),
    point("v-annapurna", "Annapurna Foods", "Annapurna Foods Pvt Ltd", "9700022233", "Plot 4, IDA Jeedimetla, Hyderabad, Telangana, 500055", 17.5113, 78.4542),
    point("v-deccan", "Deccan FMCG", "Deccan FMCG Distributors", "9700033344", "1-8-77, Bowenpally, Secunderabad, Telangana, 500011", 17.4721, 78.4847),
    point("v-qff", "Qwipo Fresh", "Qwipo Fresh Fulfilment", "9700044455", "Unit 2, Medchal Road, Kompally, Telangana, 500014", 17.5402, 78.4867),
    // customers (retail shops)
    point("c-balaji", "Ramesh Gupta", "Balaji Kirana Store", "9848012345", "Plot 12, Lothukunta, Alwal, Telangana, 500015", 17.5052, 78.5031),
    point("c-sairam", "Srinivas Yadav", "Sai Ram General Stores", "9848023456", "H.No 3-45, Macha Bolarum, Hyderabad, Telangana, 500010", 17.5236, 78.5189),
    point("c-venkat", "Venkat Rao", "Venkateshwara Supermarket", "9848034567", "Shop 4, Temple Alwal Road, Hyderabad, Telangana, 500010", 17.5091, 78.5142),
    point("c-hanuman", "Mahesh Chary", "Hanuman Provision Stores", "9848045678", "1-2-56, Yapral Main Road, Hyderabad, Telangana, 500087", 17.4996, 78.5371),
    point("c-annapurna", "Lakshmi Devi", "Annapurna Mart", "9848056789", "Kowkoor Junction, Bolarum, Hyderabad, Telangana, 500010", 17.5198, 78.5302),
    point("c-durga", "Prakash Reddy", "Sri Durga Kirana", "9848067890", "Main Road, Suchitra Circle, Hyderabad, Telangana, 500067", 17.4995, 78.4673),
    point("c-pragathi", "Anjali Rao", "Pragathi Super Bazaar", "9848078901", "Plot 21, Kompally X Roads, Hyderabad, Telangana, 500014", 17.5361, 78.4865),
    point("c-royal", "Farhan Ali", "Royal Mart", "9848089012", "Shop 7, Bowenpally Market, Secunderabad, Telangana, 500011", 17.4719, 78.4881),
    point("c-ganesh", "Ganesh Patel", "Ganesh Traders", "9848090123", "Petbasheerabad Main Road, Hyderabad, Telangana, 500067", 17.5262, 78.4812),
    point("c-krishna", "Gopal Krishna", "Krishna Kirana & General", "9848001234", "H.No 9-2, Jeedimetla Village, Hyderabad, Telangana, 500055", 17.5161, 78.4521),
    point("c-sbk", "Rahul Jain", "Sri Sai Balaji Kirana", "9848011223", "Bollaram Bazaar, Secunderabad, Telangana, 500010", 17.5312, 78.5154),
    point("c-vijaya", "Vijaya Lakshmi", "Vijaya Daily Needs", "9848022334", "Doolapally Road, Hyderabad, Telangana, 500055", 17.5465, 78.4612),
    point("c-sunrise", "Kishore Kumar", "Sunrise Mini Mart", "9848033445", "AS Rao Nagar, Hyderabad, Telangana, 500062", 17.4795, 78.5562),
].map((p) => [p.id, p]));

export const VENDOR_BUSINESS_TYPE: Record<string, number> = {
    "v-lakshmi": 1, // Distributor
    "v-annapurna": 2, // Manufacturer
    "v-deccan": 3, // Wholesaler
    "v-qff": 5, // Inventory
};

// ---------- catalogue ----------

export interface MockProduct { id: string; name: string; mrp: number; sp: number; upc: number; unitWeight: number; image: string; }

const product = (id: string, name: string, mrp: number, sp: number, upc: number, unitWeight: number, image: string): MockProduct =>
    ({ id, name, mrp, sp, upc, unitWeight, image: MOCK_IMAGE(image) });

export const PRODUCTS: Record<string, MockProduct> = Object.fromEntries([
    product("sku-atta-10", "Chakki Fresh Whole Wheat Atta 10 kg", 520, 468, 4, 10, "atta"),
    product("sku-rice-25", "Sona Masoori Raw Rice 25 kg", 1650, 1525, 1, 25, "rice"),
    product("sku-oil-1l", "Sunflower Refined Oil 1 L Pouch", 165, 142, 10, 0.91, "oil"),
    product("sku-toor-1", "Toor Dal Premium 1 kg", 180, 158, 20, 1, "toor"),
    product("sku-sugar-5", "Sugar M-30 5 kg", 260, 232, 6, 5, "sugar"),
    product("sku-tea-500", "Assam Dust Tea 500 g", 290, 248, 24, 0.5, "tea"),
    product("sku-salt-1", "Iodised Crystal Salt 1 kg", 28, 22, 25, 1, "salt"),
    product("sku-soap-4", "Neem Bathing Soap 100 g (Pack of 4)", 140, 118, 36, 0.4, "soap"),
    product("sku-det-1", "Detergent Powder 1 kg", 125, 104, 20, 1, "detergent"),
    product("sku-bisc-800", "Glucose Biscuits 800 g", 100, 86, 12, 0.8, "biscuit"),
    product("sku-chilli-500", "Red Chilli Powder 500 g", 210, 176, 20, 0.5, "chilli"),
    product("sku-turm-200", "Turmeric Powder 200 g", 75, 62, 40, 0.2, "turmeric"),
    product("sku-ghee-1l", "Cow Ghee 1 L Jar", 680, 612, 12, 0.92, "ghee"),
    product("sku-nood-12", "Masala Instant Noodles 70 g (Pack of 12)", 168, 144, 8, 0.84, "noodles"),
    product("sku-moong-1", "Moong Dal 1 kg", 150, 132, 20, 1, "moong"),
].map((p) => [p.id, p]));

// ---------- orders ----------

export interface MockOrderLine { sku: string; qty: number; }

export interface MockOrder {
    orderNumber: string; customerId: string; vendorId: string; orderDate: string;
    lines: MockOrderLine[]; shipping: number; coupon: number;
    cancelled?: boolean;
}

const order = (orderNumber: string, customerId: string, vendorId: string, daysAgo: number, lines: [string, number][], shipping = 0, coupon = 0): MockOrder => ({
    orderNumber, customerId, vendorId, orderDate: at(-daysAgo, 18, 30),
    lines: lines.map(([sku, qty]) => ({ sku, qty })), shipping, coupon,
});

export const ORDERS: Record<string, MockOrder> = Object.fromEntries([
    // Trip ALWAL-1 (in progress)
    order("QW2611040101", "c-balaji", "v-lakshmi", 1, [["sku-atta-10", 8], ["sku-oil-1l", 20], ["sku-sugar-5", 6], ["sku-bisc-800", 24]], 40),
    order("QW2611040102", "c-balaji", "v-annapurna", 1, [["sku-toor-1", 20], ["sku-chilli-500", 10]]),
    order("QW2611040103", "c-sairam", "v-lakshmi", 1, [["sku-rice-25", 4], ["sku-oil-1l", 30], ["sku-salt-1", 25], ["sku-tea-500", 6]], 60, 150),
    order("QW2611040104", "c-sairam", "v-deccan", 1, [["sku-soap-4", 12], ["sku-det-1", 20], ["sku-nood-12", 8]]),
    order("QW2611040105", "c-venkat", "v-annapurna", 1, [["sku-atta-10", 12], ["sku-ghee-1l", 6], ["sku-moong-1", 15], ["sku-turm-200", 20]], 80),
    order("QW2611040106", "c-hanuman", "v-lakshmi", 1, [["sku-sugar-5", 10], ["sku-tea-500", 12], ["sku-bisc-800", 36]], 40),
    order("QW2611040107", "c-hanuman", "v-deccan", 1, [["sku-det-1", 10], ["sku-soap-4", 18]]),
    order("QW2611040108", "c-annapurna", "v-annapurna", 1, [["sku-rice-25", 2], ["sku-toor-1", 10], ["sku-chilli-500", 6], ["sku-oil-1l", 10]], 50, 100),
    // Trip ALWAL-2 (not started)
    order("QW2611040201", "c-durga", "v-lakshmi", 1, [["sku-atta-10", 6], ["sku-oil-1l", 15], ["sku-salt-1", 25]]),
    order("QW2611040202", "c-pragathi", "v-annapurna", 1, [["sku-ghee-1l", 12], ["sku-moong-1", 20], ["sku-toor-1", 20]], 60),
    order("QW2611040203", "c-royal", "v-deccan", 1, [["sku-nood-12", 16], ["sku-soap-4", 24], ["sku-det-1", 12]]),
    // Trip KOMPALLY-1 (completed today)
    order("QW2611040301", "c-ganesh", "v-annapurna", 1, [["sku-rice-25", 3], ["sku-sugar-5", 8]], 40),
    order("QW2611040302", "c-krishna", "v-lakshmi", 1, [["sku-oil-1l", 40], ["sku-tea-500", 10], ["sku-bisc-800", 24]]),
    // Trip BOLARUM-QL-1 (Qwipo Lite, in progress)
    order("QW2611040401", "c-sbk", "v-qff", 1, [["sku-atta-10", 5], ["sku-oil-1l", 20], ["sku-sugar-5", 4]]),
    order("QW2611040402", "c-vijaya", "v-qff", 1, [["sku-toor-1", 15], ["sku-moong-1", 10], ["sku-turm-200", 20]], 40),
    // Trip YAPRAL-V-1 (vendor trip, cancelled)
    order("QW2611040501", "c-sunrise", "v-deccan", 1, [["sku-det-1", 8], ["sku-soap-4", 12]]),
    // Yesterday's completed trips
    order("QW2611030101", "c-balaji", "v-annapurna", 2, [["sku-atta-10", 6], ["sku-ghee-1l", 4]]),
    order("QW2611030102", "c-venkat", "v-lakshmi", 2, [["sku-oil-1l", 25], ["sku-sugar-5", 10]], 40),
    order("QW2611030201", "c-durga", "v-deccan", 2, [["sku-nood-12", 10], ["sku-det-1", 15]]),
].map((o) => [o.orderNumber, o]));

export function orderAmount(o: MockOrder): number {
    return o.lines.reduce((sum, l) => sum + l.qty * PRODUCTS[l.sku].sp, 0) + o.shipping - o.coupon;
}

// ---------- trips & hops ----------

export interface MockReturnLine { orderNumber: string; sku: string; qty: number; reason: string; createdAt: string; }

export interface MockHopItem {
    sku: string; orderNumber: string; qty: number;
}

export interface MockHop {
    id: string; tripId: string; stop: number; mode: number; type: number; pointId: string;
    status: number; otp: string; createdAt: string; updatedAt: string;
    orderNumbers: string[]; // delivery / pickup hops
    items: MockHopItem[]; // explicit items (return hops)
    cash: number; online: number;
    returns: MockReturnLine[];
}

export interface MockTrip {
    id: string; name: string; tripNumber: number; cluster: string; sequence: number; source: number;
    date: string; status: number; deId: string; driverId: string; vehicleModel: number; kms: number;
    startTime: string | null; endTime: string | null; createdAt: string;
}

export const TRIPS: MockTrip[] = [
    { id: "trip-alw-01", name: "ALWAL-1", tripNumber: 2611040101, cluster: "ALWAL", sequence: 1, source: 1, date: ymd(new Date()), status: 2, deId: "fa-ravi", driverId: "fa-suresh", vehicleModel: 3, kms: 42.6, startTime: at(0, 8, 15), endTime: null, createdAt: at(-1, 21) },
    { id: "trip-alw-02", name: "ALWAL-2", tripNumber: 2611040102, cluster: "ALWAL", sequence: 2, source: 1, date: ymd(new Date()), status: 1, deId: "fa-mahesh", driverId: "fa-imran", vehicleModel: 4, kms: 31.2, startTime: null, endTime: null, createdAt: at(-1, 21, 10) },
    { id: "trip-kmp-01", name: "KOMPALLY-1", tripNumber: 2611040201, cluster: "KOMPALLY", sequence: 1, source: 1, date: ymd(new Date()), status: 3, deId: "fa-rajesh", driverId: "fa-salim", vehicleModel: 3, kms: 27.9, startTime: at(0, 6, 40), endTime: at(0, 10, 5), createdAt: at(-1, 20, 45) },
    { id: "trip-bol-ql-01", name: "BOLARUM-QL-1", tripNumber: 2611040301, cluster: "BOLARUM", sequence: 1, source: 4, date: ymd(new Date()), status: 2, deId: "fa-mahesh", driverId: "fa-imran", vehicleModel: 2, kms: 18.4, startTime: at(0, 9, 0), endTime: null, createdAt: at(-1, 22) },
    { id: "trip-ypr-v-01", name: "YAPRAL-V-1", tripNumber: 2611040401, cluster: "YAPRAL", sequence: 1, source: 3, date: ymd(new Date()), status: 4, deId: "fa-rajesh", driverId: "fa-salim", vehicleModel: 2, kms: 9.8, startTime: null, endTime: null, createdAt: at(-1, 22, 30) },
    // yesterday
    { id: "trip-alw-y1", name: "ALWAL-1", tripNumber: 2611030101, cluster: "ALWAL", sequence: 1, source: 1, date: ymd(new Date(Date.now() - 86400000)), status: 3, deId: "fa-ravi", driverId: "fa-suresh", vehicleModel: 3, kms: 38.1, startTime: at(-1, 8), endTime: at(-1, 14, 20), createdAt: at(-2, 21) },
    { id: "trip-alw-y2", name: "ALWAL-2", tripNumber: 2611030102, cluster: "ALWAL", sequence: 2, source: 1, date: ymd(new Date(Date.now() - 86400000)), status: 3, deId: "fa-mahesh", driverId: "fa-imran", vehicleModel: 4, kms: 26.5, startTime: at(-1, 9), endTime: at(-1, 13, 45), createdAt: at(-2, 21, 15) },
];

let otpSeed = 4821;
const nextOtp = () => String((otpSeed = (otpSeed * 7 + 13) % 9000) + 1000);

function hop(id: string, tripId: string, stop: number, mode: number, type: number, pointId: string, status: number,
    orderNumbers: string[], extra: Partial<MockHop> = {}): MockHop {
    const trip = TRIPS.find((t) => t.id === tripId)!;
    return {
        id, tripId, stop, mode, type, pointId, status, otp: nextOtp(),
        createdAt: trip.createdAt, updatedAt: status === 2 ? at(0, 8 + stop) : trip.createdAt,
        orderNumbers, items: [], cash: 0, online: 0, returns: [], ...extra,
    };
}

const WH = WAREHOUSE.warehouse_id;
// PointMode: 1 pickup, 2 delivery, 3 return | PointType: 1 vendor, 2 customer, 3 warehouse | HopStatus: 1 not started, 2 completed
export const HOPS: MockHop[] = [
    // ALWAL-1, in progress: 3 stops done, 4 deliveries pending, return to warehouse pending
    hop("hop-a1-01", "trip-alw-01", 1, 1, 3, WH, 2, ["QW2611040102", "QW2611040104", "QW2611040105", "QW2611040107", "QW2611040108"]),
    hop("hop-a1-02", "trip-alw-01", 2, 1, 1, "v-lakshmi", 2, ["QW2611040101", "QW2611040103", "QW2611040106"]),
    hop("hop-a1-03", "trip-alw-01", 3, 2, 2, "c-balaji", 2, ["QW2611040101", "QW2611040102"], {
        online: 2000, cash: 12656,
        returns: [{ orderNumber: "QW2611040101", sku: "sku-bisc-800", qty: 4, reason: "Damaged Product", createdAt: at(0, 9, 40) }],
    }),
    hop("hop-a1-04", "trip-alw-01", 4, 2, 2, "c-sairam", 1, ["QW2611040103", "QW2611040104"]),
    hop("hop-a1-05", "trip-alw-01", 5, 2, 2, "c-venkat", 1, ["QW2611040105"], { online: 3000 }),
    hop("hop-a1-06", "trip-alw-01", 6, 2, 2, "c-hanuman", 1, ["QW2611040106", "QW2611040107"]),
    hop("hop-a1-07", "trip-alw-01", 7, 2, 2, "c-annapurna", 1, ["QW2611040108"]),
    hop("hop-a1-08", "trip-alw-01", 8, 3, 3, WH, 1, [], {
        items: [{ sku: "sku-bisc-800", orderNumber: "QW2611040101", qty: 4 }],
    }),
    // ALWAL-2, not started
    hop("hop-a2-01", "trip-alw-02", 1, 1, 3, WH, 1, ["QW2611040202", "QW2611040203"]),
    hop("hop-a2-02", "trip-alw-02", 2, 1, 1, "v-lakshmi", 1, ["QW2611040201"]),
    hop("hop-a2-03", "trip-alw-02", 3, 2, 2, "c-durga", 1, ["QW2611040201"]),
    hop("hop-a2-04", "trip-alw-02", 4, 2, 2, "c-pragathi", 1, ["QW2611040202"]),
    hop("hop-a2-05", "trip-alw-02", 5, 2, 2, "c-royal", 1, ["QW2611040203"]),
    // KOMPALLY-1, completed
    hop("hop-k1-01", "trip-kmp-01", 1, 1, 3, WH, 2, ["QW2611040301"]),
    hop("hop-k1-02", "trip-kmp-01", 2, 1, 1, "v-lakshmi", 2, ["QW2611040302"]),
    hop("hop-k1-03", "trip-kmp-01", 3, 2, 2, "c-ganesh", 2, ["QW2611040301"], { online: 6471 }),
    hop("hop-k1-04", "trip-kmp-01", 4, 2, 2, "c-krishna", 2, ["QW2611040302"], { cash: 7200, online: 3024 }),
    // BOLARUM-QL-1, Qwipo Lite: vendor pickup done, one delivery done, one pending, return to vendor pending
    hop("hop-q1-01", "trip-bol-ql-01", 1, 1, 1, "v-qff", 2, ["QW2611040401", "QW2611040402"]),
    hop("hop-q1-02", "trip-bol-ql-01", 2, 2, 2, "c-sbk", 2, ["QW2611040401"], {
        cash: 4000, online: 1876,
        returns: [{ orderNumber: "QW2611040401", sku: "sku-sugar-5", qty: 1, reason: "Packet Torn", createdAt: at(0, 10, 15) }],
    }),
    hop("hop-q1-03", "trip-bol-ql-01", 3, 2, 2, "c-vijaya", 1, ["QW2611040402"]),
    hop("hop-q1-04", "trip-bol-ql-01", 4, 3, 1, "v-qff", 1, [], {
        items: [{ sku: "sku-sugar-5", orderNumber: "QW2611040401", qty: 1 }],
    }),
    // YAPRAL-V-1, cancelled
    hop("hop-y1-01", "trip-ypr-v-01", 1, 1, 1, "v-deccan", 1, ["QW2611040501"]),
    hop("hop-y1-02", "trip-ypr-v-01", 2, 2, 2, "c-sunrise", 1, ["QW2611040501"]),
    // yesterday
    hop("hop-ay1-01", "trip-alw-y1", 1, 1, 3, WH, 2, ["QW2611030101"]),
    hop("hop-ay1-02", "trip-alw-y1", 2, 1, 1, "v-lakshmi", 2, ["QW2611030102"]),
    hop("hop-ay1-03", "trip-alw-y1", 3, 2, 2, "c-balaji", 2, ["QW2611030101"], { online: 5256 }),
    hop("hop-ay1-04", "trip-alw-y1", 4, 2, 2, "c-venkat", 2, ["QW2611030102"], { cash: 5910 }),
    hop("hop-ay2-01", "trip-alw-y2", 1, 1, 3, WH, 2, ["QW2611030201"]),
    hop("hop-ay2-02", "trip-alw-y2", 2, 2, 2, "c-durga", 2, ["QW2611030201"], { cash: 3000 }),
];

// ---------- static lookups ----------

export const RETURN_REASONS = [
    "Damaged Product",
    "Expired Product",
    "Wrong Item Delivered",
    "Packet Torn",
    "Quality Issue",
    "Customer Refused",
    "Price Mismatch",
    "Not Ordered",
    "Shop Closed",
].map((name, i) => ({ id: i + 1, name, isSelected: false }));

export const APP_SETTINGS = {
    salesPersonConfig: { distanceThreshold: 200, interactionTime: 5 },
    appMinVersion: { android: "1.0.0", ios: "1.0.0" },
    contact: {
        number: "9000012345",
        email: "support@example.com",
        message: "Your account is under review. Please contact the Qwipo operations team to activate it.",
    },
    // Location checks are off so stops can be completed from the emulator
    restrictions: {
        isHopCloseDistanceRestricted: false,
        isReattemptRestricted: false,
        hopCloseDistance: 200,
        reattemptDistance: 200,
    },
};
