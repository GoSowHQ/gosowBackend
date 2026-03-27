import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private config: ConfigService) {
    super({
      clientID: config.get('GITHUB_CLIENT_ID') || 'not-configured',
      clientSecret: config.get('GITHUB_CLIENT_SECRET') || 'not-configured',
      callbackURL: config.get('GITHUB_CALLBACK_URL') || 'http://localhost:3001/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { emails, displayName, photos, id, username } = profile;
    return {
      email: emails?.[0]?.value,
      name: displayName || username,
      avatarUrl: photos?.[0]?.value,
      providerId: String(id),
      provider: 'GITHUB' as const,
    };
  }
}
