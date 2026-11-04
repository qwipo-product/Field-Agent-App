export interface AppConfiguration {
    salesPersonConfig: SalesPersonConfig;
    appMinVersion: AppMinVersion;
    contact: ContactInfo;
    restrictions: FaAppDistanceRestrictions;
}
export interface FaAppDistanceRestrictions {
	isHopCloseDistanceRestricted: boolean;
	isReattemptRestricted: boolean;
	hopCloseDistance: number;
	reattemptDistance: number;
}

export interface SalesPersonConfig {
    distanceThreshold: number;
    interactionTime: number;
}

export interface AppMinVersion {
    android: string;
    ios: string;
}

export interface ContactInfo {
    number: string;
    email: string;
    message: string;
}
