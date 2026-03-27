import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private config: ConfigService) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret: config.get('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL: config.get('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { emails, displayName, photos, id } = profile;
    const user = {
      email: emails[0].value,
      name: displayName,
      avatarUrl: photos?.[0]?.value,
      providerId: id,
      provider: 'GOOGLE' as const,
    };
    done(null, user);
  }
}
