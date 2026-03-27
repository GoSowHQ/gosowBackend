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
exports.FundingController = void 0;
const common_1 = require("@nestjs/common");
const funding_service_1 = require("./funding.service");
const create_funding_dto_1 = require("./dto/create-funding.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const virtual_accounts_service_1 = require("./virtual-accounts.service");
const payouts_service_1 = require("./payouts.service");
const create_bank_account_dto_1 = require("./dto/create-bank-account.dto");
const request_payout_dto_1 = require("./dto/request-payout.dto");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let FundingController = class FundingController {
    fundingService;
    virtualAccountsService;
    payoutsService;
    constructor(fundingService, virtualAccountsService, payoutsService) {
        this.fundingService = fundingService;
        this.virtualAccountsService = virtualAccountsService;
        this.payoutsService = payoutsService;
    }
    createCheckout(userId, email, dto) {
        return this.fundingService.createCheckout(userId, email, dto);
    }
    findByProject(projectId) {
        return this.fundingService.findByProject(projectId);
    }
    getProjectVirtualAccount(projectId) {
        return this.virtualAccountsService.getPublicProjectVirtualAccount(projectId);
    }
    provisionProjectVirtualAccount(projectId) {
        return this.virtualAccountsService.ensureProjectVirtualAccount(projectId);
    }
    getProjectBalance(userId, projectId) {
        return this.payoutsService.getProjectBalance(userId, projectId);
    }
    createBankAccount(userId, dto) {
        return this.payoutsService.createBankAccount(userId, dto);
    }
    listBankAccounts(userId) {
        return this.payoutsService.listBankAccounts(userId);
    }
    requestPayout(userId, dto) {
        return this.payoutsService.requestPayout(userId, dto);
    }
    listPayouts(userId) {
        return this.payoutsService.listPayouts(userId);
    }
};
exports.FundingController = FundingController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('checkout'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('email')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_funding_dto_1.CreateFundingDto]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "createCheckout", null);
__decorate([
    (0, common_1.Get)('project/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "findByProject", null);
__decorate([
    (0, common_1.Get)('projects/:projectId/virtual-account'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "getProjectVirtualAccount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, common_1.Post)('projects/:projectId/virtual-account/provision'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "provisionProjectVirtualAccount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('projects/:projectId/balance/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "getProjectBalance", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('bank-accounts/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_bank_account_dto_1.CreateBankAccountDto]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "createBankAccount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('bank-accounts/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "listBankAccounts", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('payouts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_payout_dto_1.RequestPayoutDto]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "requestPayout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('payouts/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "listPayouts", null);
exports.FundingController = FundingController = __decorate([
    (0, common_1.Controller)('funding'),
    __metadata("design:paramtypes", [funding_service_1.FundingService,
        virtual_accounts_service_1.VirtualAccountsService,
        payouts_service_1.PayoutsService])
], FundingController);
//# sourceMappingURL=funding.controller.js.map