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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
const service_response_type_1 = require("../common/types/service-response.type");
let StripeService = class StripeService {
    config;
    stripe = null;
    constructor(config) {
        this.config = config;
        const key = this.config.get('STRIPE_SECRET_KEY');
        if (key) {
            this.stripe = new stripe_1.default(key, {
                apiVersion: '2024-12-18.acacia',
            });
        }
    }
    async createCheckoutSession(params) {
        if (!this.stripe)
            throw new Error('Stripe is not configured');
        const frontendUrl = this.config.get('FRONTEND_URL');
        const session = await this.stripe.checkout.sessions.create({
            customer_email: params.customerEmail,
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Back: ${params.projectTitle}`,
                            description: params.rewardTitle || 'General backing',
                        },
                        unit_amount: Math.round(params.amount * 100),
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                fundingId: params.fundingId,
                projectId: params.projectId,
                userId: params.userId,
            },
            success_url: `${frontendUrl}/projects/${params.projectSlug}?funded=true`,
            cancel_url: `${frontendUrl}/projects/${params.projectSlug}?funded=cancelled`,
        });
        return (0, service_response_type_1.createServiceResponse)(session, 'Stripe checkout session created');
    }
    constructWebhookEvent(payload, signature) {
        if (!this.stripe)
            throw new Error('Stripe is not configured');
        const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map