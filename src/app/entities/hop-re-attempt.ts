import { Action } from "../common";

export interface HopAttemptHistoryRequest {
	hop_id: string;
	point_id: string;
	action: Action;
	image_url?: string;
	attempt_count?: number;
	description?: string;
}
