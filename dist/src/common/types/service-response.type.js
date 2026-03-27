"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceResponse = createServiceResponse;
exports.createErrorResponse = createErrorResponse;
function createServiceResponse(data, message = 'Request successful', meta) {
    return {
        success: true,
        data,
        message,
        meta,
    };
}
function createErrorResponse(message, success = false) {
    return {
        success,
        data: null,
        message,
    };
}
//# sourceMappingURL=service-response.type.js.map