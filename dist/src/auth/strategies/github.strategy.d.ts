import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
declare const GithubStrategy_base: new (...args: [options: import("passport-github2").StrategyOptionsWithRequest] | [options: import("passport-github2").StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class GithubStrategy extends GithubStrategy_base {
    private config;
    constructor(config: ConfigService);
    validate(accessToken: string, refreshToken: string, profile: any): Promise<{
        email: any;
        name: any;
        avatarUrl: any;
        providerId: string;
        provider: "GITHUB";
    }>;
}
export {};
