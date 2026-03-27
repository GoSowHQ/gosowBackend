import { Controller, Post, Body, UseGuards, Get, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: any) {
    return this.authService.refreshTokens(req.user.sub, req.user.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: any, @Res() res: any) {
    const result = await this.authService.validateOAuthUser(req.user);
    const frontendUrl = this.config.get('FRONTEND_URL');
    res.redirect(
      `${frontendUrl}/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
    );
  }

  @UseGuards(GithubAuthGuard)
  @Get('github')
  githubAuth() {}

  @UseGuards(GithubAuthGuard)
  @Get('github/callback')
  async githubCallback(@Req() req: any, @Res() res: any) {
    const result = await this.authService.validateOAuthUser(req.user);
    const frontendUrl = this.config.get('FRONTEND_URL');
    res.redirect(
      `${frontendUrl}/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
    );
  }
}
