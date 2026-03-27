import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthProvider } from '@prisma/client';
import { WalletsService } from '../wallets/wallets.service';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private walletsService: WalletsService,
  ) {}

  async register(dto: RegisterDto): Promise<ServiceResponse> {
    this.logger.log(`Registration attempt for email: ${dto.email}`);
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      this.logger.warn(`Registration failed: email ${dto.email} already exists`);
      throw new ConflictException('Email already registered');
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
    return createServiceResponse(
      { user: this.sanitizeUser(user), ...tokens },
      'User registered successfully'
    );
  }

  async login(dto: LoginDto): Promise<ServiceResponse> {
    this.logger.log(`Login attempt for email: ${dto.email}`);
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      this.logger.warn(`Login failed: invalid credentials for ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`Login failed: incorrect password for ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in successfully: ${user.email}`);
    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return createServiceResponse(
      { user: this.sanitizeUser(user), ...tokens },
      'Login successful'
    );
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<ServiceResponse> {
    this.logger.log(`Token refresh attempt for user ID: ${userId}`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) {
      this.logger.warn(`Token refresh failed: user not found or no refresh token for ${userId}`);
      throw new UnauthorizedException();
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!valid) {
      this.logger.warn(`Token refresh failed: invalid refresh token for ${userId}`);
      throw new UnauthorizedException();
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    this.logger.log(`Tokens refreshed successfully for user: ${user.email}`);
    return createServiceResponse(tokens, 'Tokens refreshed successfully');
  }

  async logout(userId: string): Promise<ServiceResponse> {
    this.logger.log(`Logging out user ID: ${userId}`);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return createServiceResponse(null, 'Logged out successfully');
  }

  async validateOAuthUser(profile: {
    email: string;
    name: string;
    avatarUrl?: string;
    providerId: string;
    provider: 'GOOGLE' | 'GITHUB';
  }) {
    this.logger.log(`OAuth validation attempt: ${profile.provider} (ID: ${profile.providerId})`);
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { provider: profile.provider as AuthProvider, providerId: profile.providerId },
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
          provider: profile.provider as AuthProvider,
          providerId: profile.providerId,
          emailVerified: true,
        },
      });
      await this.walletsService.createWallet(user.id);
    } else if (user.provider === ('LOCAL' as AuthProvider)) {
      this.logger.log(`Linking OAuth (${profile.provider}) to existing local account: ${user.email}`);
      // Link OAuth to existing local account or update profile
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          avatarUrl: user.avatarUrl || profile.avatarUrl,
          emailVerified: true,
          provider: profile.provider as AuthProvider,
          providerId: profile.providerId,
        },
      });
    }

    if (!user) {
      this.logger.error(`OAuth authentication failed for ${profile.email}`);
      throw new UnauthorizedException('Authentication failed');
    }

    this.logger.log(`OAuth user validated successfully: ${user.email}`);
    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }

  async getProfile(userId: string): Promise<ServiceResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return createServiceResponse(this.sanitizeUser(user), 'Profile retrieved successfully');
  }

  private async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email },
        { secret: this.config.get('JWT_SECRET'), expiresIn: this.config.get('JWT_EXPIRATION') || '15m' },
      ),
      this.jwt.signAsync(
        { sub: userId, email },
        { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRATION') || '7d' },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshToken, ...sanitized } = user;
    return sanitized;
  }
}
