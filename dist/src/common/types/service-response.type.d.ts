export interface ServiceResponse<T = any> {
    success: boolean;
    data: T | null;
    message?: string;
    meta?: any;
}
export declare function createServiceResponse<T>(data: T, message?: string, meta?: any): ServiceResponse<T>;
export declare function createErrorResponse(message: string, success?: boolean): ServiceResponse<null>;
