"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterswitchService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const service_response_type_1 = require("../common/types/service-response.type");
let InterswitchService = class InterswitchService {
    config;
    constructor(config) {
        this.config = config;
    }
    async createVirtualAccount(params) {
        if (this.isMockMode()) {
            return (0, service_response_type_1.createServiceResponse)(this.mockVirtualAccount(params.projectId, params.projectTitle), 'Mock virtual account created');
        }
        const response = await this.request(this.config.get('INTERSWITCH_COLLECTIONS_URL') ||
            'https://sandbox.interswitchng.com/paymentgateway/api/v1/payable/virtualaccount', {
            method: 'POST',
            body: {
                requestReference: `proj_${params.projectId}`,
                payableCode: this.required('INTERSWITCH_PAYABLE_CODE'),
                accountName: `${params.projectTitle} - ${params.creatorName}`.slice(0, 30),
            },
        });
        return (0, service_response_type_1.createServiceResponse)({
            accountNumber: String(response.accountNumber),
            accountName: String(response.accountName || `${params.projectTitle} Funding`),
            bankCode: response.bankCode ? String(response.bankCode) : null,
            bankName: response.bankName ? String(response.bankName) : 'Interswitch',
            payableCode: response.payableCode
                ? String(response.payableCode)
                : this.required('INTERSWITCH_PAYABLE_CODE'),
            externalReference: response.requestReference
                ? String(response.requestReference)
                : `proj_${params.projectId}`,
            metadata: response,
        }, 'Virtual account created successfully');
    }
    async createWebpayCheckout(params) {
        if (this.isMockMode()) {
            return (0, service_response_type_1.createServiceResponse)({
                url: `${this.config.get('FRONTEND_URL')}/projects/${params.projectSlug}?funded=true`,
                transactionReference: `mock_tx_${(0, crypto_1.randomUUID)()}`,
            }, 'Mock checkout initiated');
        }
        const response = await this.request(this.config.get('INTERSWITCH_WEBPAY_URL') ||
            'https://sandbox.interswitchng.com/paymentgateway/api/v1/checkout', {
            method: 'POST',
            body: {
                amount: params.amountMinor,
                customerId: params.email,
                merchantCode: this.required('INTERSWITCH_MERCHANT_CODE'),
                payableCode: this.required('INTERSWITCH_PAYABLE_CODE'),
                transactionReference: `fund_${params.fundingId}`,
                redirectUrl: `${this.config.get('FRONTEND_URL')}/projects/${params.projectSlug}?funded=true`,
            }
        });
        return (0, service_response_type_1.createServiceResponse)({
            url: response.paymentUrl,
            transactionReference: response.transactionReference
        }, 'Webpay checkout initiated successfully');
    }
    async createPayout(params) {
        if (this.isMockMode()) {
            return (0, service_response_type_1.createServiceResponse)({
                providerReference: params.reference,
                providerPayoutId: `payout_${(0, crypto_1.randomUUID)()}`,
                status: 'PROCESSING',
                metadata: {
                    responseCode: '00',
                    transactionReference: params.reference,
                },
            }, 'Mock payout initiated');
        }
        const response = await this.request(this.config.get('INTERSWITCH_PAYOUT_URL') ||
            'https://sandbox.interswitchng.com/api/v1/payouts', {
            method: 'POST',
            body: {
                transactionReference: params.reference,
                amount: (params.amountMinor / 100).toFixed(2),
                currency: 'NGN',
                beneficiary: {
                    accountNumber: params.accountNumber,
                    accountName: params.accountName,
                    bankCode: params.bankCode,
                },
                narration: params.narration,
                singleCall: true,
            },
        });
        return (0, service_response_type_1.createServiceResponse)({
            providerReference: response.transactionReference || params.reference,
            providerPayoutId: response.transactionId || response.transactionReference || params.reference,
            status: response.status || 'PROCESSING',
            metadata: response,
        }, 'Payout initiated successfully');
    }
    async request(url, init) {
        const headers = new Headers({
            'Content-Type': 'application/json',
        });
        Object.entries(this.authHeaders()).forEach(([key, value]) => {
            headers.set(key, value);
        });
        const response = await fetch(url, {
            method: init.method,
            headers,
            body: init.body ? JSON.stringify(init.body) : undefined,
        });
        const text = await response.text();
        let payload = null;
        if (text) {
            try {
                payload = JSON.parse(text);
            }
            catch {
                payload = { raw: text };
            }
        }
        if (!response.ok) {
            throw new common_1.BadGatewayException({
                message: 'Interswitch request failed',
                statusCode: response.status,
                payload,
            });
        }
        return payload;
    }
    authHeaders() {
        const bearerToken = this.config.get('INTERSWITCH_BEARER_TOKEN');
        if (bearerToken) {
            return { Authorization: `Bearer ${bearerToken}` };
        }
        const clientId = this.config.get('INTERSWITCH_CLIENT_ID');
        const clientSecret = this.config.get('INTERSWITCH_CLIENT_SECRET');
        if (clientId && clientSecret) {
            return {
                'X-Client-Id': clientId,
                'X-Client-Secret': clientSecret,
            };
        }
        throw new common_1.InternalServerErrorException('Interswitch credentials are not configured');
    }
    isMockMode() {
        return this.config.get('INTERSWITCH_MOCK_MODE') === 'true';
    }
    required(key) {
        const value = this.config.get(key);
        if (!value) {
            throw new common_1.InternalServerErrorException(`${key} is not configured`);
        }
        return value;
    }
    mockVirtualAccount(projectId, projectTitle) {
        const digits = projectId.replace(/[^0-9]/g, '').slice(0, 10).padEnd(10, '7');
        return {
            accountNumber: digits,
            accountName: `${projectTitle} Funding`.slice(0, 30),
            bankCode: '999',
            bankName: 'Interswitch Mock Bank',
            payableCode: this.config.get('INTERSWITCH_PAYABLE_CODE') || 'MOCKPAY',
            externalReference: `proj_${projectId}`,
            metadata: { mock: true },
        };
    }
};
exports.InterswitchService = InterswitchService;
exports.InterswitchService = InterswitchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], InterswitchService);
//# sourceMappingURL=interswitch.service.js.map