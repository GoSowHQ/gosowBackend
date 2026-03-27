"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
const wallets_service_1 = require("../wallets/wallets.service");
const service_response_type_1 = require("../common/types/service-response.type");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    config;
    walletsService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwt, config, walletsService) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.walletsService = walletsService;
    }
    async register(dto) {
        this.logger.log(`Registration attempt for email: ${dto.email}`);
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            this.logger.warn(`Registration failed: email ${dto.email} already exists`);
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                name: dto.name,
            },
        });
        await this.walletsService.createWallet(user.id);
        this.logger.log(`User registered successfully: ${user.email} (ID: ${user.id})`);
        const tokens = await this.generateTokens(user.id, user.email);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return (0, service_response_type_1.createServiceResponse)({ user: this.sanitizeUser(user), ...tokens }, 'User registered successfully');
    }
    async login(dto) {
        this.logger.log(`Login attempt for email: ${dto.email}`);
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user || !user.passwordHash) {
            this.logger.warn(`Login failed: invalid credentials for ${dto.email}`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            this.logger.warn(`Login failed: incorrect password for ${dto.email}`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        this.logger.log(`User logged in successfully: ${user.email}`);
        const tokens = await this.generateTokens(user.id, user.email);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return (0, service_response_type_1.createServiceResponse)({ user: this.sanitizeUser(user), ...tokens }, 'Login successful');
    }
    async refreshTokens(userId, refreshToken) {
        this.logger.log(`Token refresh attempt for user ID: ${userId}`);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.refreshToken) {
            this.logger.warn(`Token refresh failed: user not found or no refresh token for ${userId}`);
            throw new common_1.UnauthorizedException();
        }
        const valid = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!valid) {
            this.logger.warn(`Token refresh failed: invalid refresh token for ${userId}`);
            throw new common_1.UnauthorizedException();
        }
        const tokens = await this.generateTokens(user.id, user.email);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        this.logger.log(`Tokens refreshed successfully for user: ${user.email}`);
        return (0, service_response_type_1.createServiceResponse)(tokens, 'Tokens refreshed successfully');
    }
    async logout(userId) {
        this.logger.log(`Logging out user ID: ${userId}`);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        return (0, service_response_type_1.createServiceResponse)(null, 'Logged out successfully');
    }
    async validateOAuthUser(profile) {
        this.logger.log(`OAuth validation attempt: ${profile.provider} (ID: ${profile.providerId})`);
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { provider: profile.provider, providerId: profile.providerId },
                    { email: profile.email },
                ],
            },
        });
        if (!user) {
            this.logger.log(`Creating new OAuth user: ${profile.email} (${profile.provider})`);
            user = await this.prisma.user.create({
                data: {
                    email: profile.email,
                    name: profile.name,
                    avatarUrl: profile.avatarUrl,
                    provider: profile.provider,
                    providerId: profile.providerId,
                    emailVerified: true,
                },
            });
            await this.walletsService.createWallet(user.id);
        }
        else if (user.provider === 'LOCAL') {
            this.logger.log(`Linking OAuth (${profile.provider}) to existing local account: ${user.email}`);
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    avatarUrl: user.avatarUrl || profile.avatarUrl,
                    emailVerified: true,
                    provider: profile.provider,
                    providerId: profile.providerId,
                },
            });
        }
        if (!user) {
            this.logger.error(`OAuth authentication failed for ${profile.email}`);
            throw new common_1.UnauthorizedException('Authentication failed');
        }
        this.logger.log(`OAuth user validated successfully: ${user.email}`);
        const tokens = await this.generateTokens(user.id, user.email);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return { user, ...tokens };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        return (0, service_response_type_1.createServiceResponse)(this.sanitizeUser(user), 'Profile retrieved successfully');
    }
    async generateTokens(userId, email) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync({ sub: userId, email }, { secret: this.config.get('JWT_SECRET'), expiresIn: this.config.get('JWT_EXPIRATION') || '15m' }),
            this.jwt.signAsync({ sub: userId, email }, { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRATION') || '7d' }),
        ]);
        return { accessToken, refreshToken };
    }
    async updateRefreshToken(userId, refreshToken) {
        const hash = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hash },
        });
    }
    sanitizeUser(user) {
        const { passwordHash, refreshToken, ...sanitized } = user;
        return sanitized;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        wallets_service_1.WalletsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map