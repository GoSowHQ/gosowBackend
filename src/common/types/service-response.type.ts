export interface ServiceResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  meta?: any;
}

export function createServiceResponse<T>(
  data: T,
  message = 'Request successful',
  meta?: any,
): ServiceResponse<T> {
  return {
    success: true,
    data,
    message,
    meta,
  };
}

export function createErrorResponse(
  message: string,
  success = false,
): ServiceResponse<null> {
  return {
    success,
    data: null,
    message,
  };
}
