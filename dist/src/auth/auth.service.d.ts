import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WalletsService } from '../wallets/wallets.service';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    private walletsService;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, walletsService: WalletsService);
    register(dto: RegisterDto): Promise<ServiceResponse>;
    login(dto: LoginDto): Promise<ServiceResponse>;
    refreshTokens(userId: string, refreshToken: string): Promise<ServiceResponse>;
    logout(userId: string): Promise<ServiceResponse>;
    validateOAuthUser(profile: {
        email: string;
        name: string;
        avatarUrl?: string;
        providerId: string;
        provider: 'GOOGLE' | 'GITHUB';
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            passwordHash: string | null;
            name: string;
            avatarUrl: string | null;
            bio: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            provider: import(".prisma/client").$Enums.AuthProvider;
            providerId: string | null;
            emailVerified: boolean;
            isActive: boolean;
            refreshToken: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getProfile(userId: string): Promise<ServiceResponse>;
    private generateTokens;
    private updateRefreshToken;
    private sanitizeUser;
}
