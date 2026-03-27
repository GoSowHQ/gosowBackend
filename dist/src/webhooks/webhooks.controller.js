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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const stripe_service_1 = require("../funding/stripe.service");
const funding_service_1 = require("../funding/funding.service");
let WebhooksController = class WebhooksController {
    stripeService;
    fundingService;
    constructor(stripeService, fundingService) {
        this.stripeService = stripeService;
        this.fundingService = fundingService;
    }
    async handleStripeWebhook(req, signature) {
        let event;
        try {
            event = this.stripeService.constructWebhookEvent(req.rawBody, signature);
        }
        catch {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                await this.fundingService.handleCheckoutCompleted(session.id, session.payment_intent);
                break;
            }
            case 'checkout.session.expired': {
                const session = event.data.object;
                await this.fundingService.handleCheckoutExpired(session.id);
                break;
            }
        }
        return { received: true };
    }
    async handleInterswitchWebhook(body) {
        return this.fundingService.handleInterswitchWebhook(body);
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('stripe'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleStripeWebhook", null);
__decorate([
    (0, common_1.Post)('interswitch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleInterswitchWebhook", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [stripe_service_1.StripeService,
        funding_service_1.FundingService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map