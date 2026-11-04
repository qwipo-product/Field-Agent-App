// Every service lives on a ".invalid" host (RFC 2606: never resolves), so no call can leave the device.
// app/mock/mock-backend.interceptor.ts answers each request by its path. `env` is kept so callers stay unchanged.
const mockHost = (service: string, suffix = "/api") => `https://${service}.fieldagent.invalid${suffix}`;

export function getApiBaseUrl(env: string) {
    return mockHost("api");
}

export function getCacheApiUrl(env: string) {
    return mockHost("cache");
}

export function getOrdersApiUrl(env: string) {
    return mockHost("orders");
}

export function authTokenServiceBaseUrl(env: string) {
    return mockHost("auth");
}

export function getLogisticsApiUrl(env: string) {
    return mockHost("logistics");
}

export function getPaymentsApiUrl(env: string) {
    return mockHost("payments");
}

export function messageQueueService(env: string) {
    return mockHost("messaging");
}

export function getInventoryUrl(env: string) {
    return mockHost("inventory", "");
}

export function coreServiceUrl(env: string) {
    return mockHost("core");
}

export function fileService(env: string) {
    return mockHost("files");
}
