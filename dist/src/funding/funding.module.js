"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundingModule = void 0;
const common_1 = require("@nestjs/common");
const funding_controller_1 = require("./funding.controller");
const funding_service_1 = require("./funding.service");
const stripe_service_1 = require("./stripe.service");
const interswitch_service_1 = require("./interswitch.service");
const virtual_accounts_service_1 = require("./virtual-accounts.service");
const ledger_service_1 = require("./ledger.service");
const payouts_service_1 = require("./payouts.service");
let FundingModule = class FundingModule {
};
exports.FundingModule = FundingModule;
exports.FundingModule = FundingModule = __decorate([
    (0, common_1.Module)({
        controllers: [funding_controller_1.FundingController],
        providers: [
            funding_service_1.FundingService,
            stripe_service_1.StripeService,
            interswitch_service_1.InterswitchService,
            virtual_accounts_service_1.VirtualAccountsService,
            ledger_service_1.LedgerService,
            payouts_service_1.PayoutsService,
        ],
        exports: [
            funding_service_1.FundingService,
            stripe_service_1.StripeService,
            interswitch_service_1.InterswitchService,
            virtual_accounts_service_1.VirtualAccountsService,
            ledger_service_1.LedgerService,
            payouts_service_1.PayoutsService,
        ],
    })
], FundingModule);
//# sourceMappingURL=funding.module.js.map