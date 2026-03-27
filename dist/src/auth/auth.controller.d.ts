import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
export declare class AuthController {
    private authService;
    private config;
    constructor(authService: AuthService, config: ConfigService);
    register(dto: RegisterDto): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    login(dto: LoginDto): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    refresh(req: any): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    logout(userId: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    getProfile(userId: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    googleAuth(): void;
    googleCallback(req: any, res: any): Promise<void>;
    githubAuth(): void;
    githubCallback(req: any, res: any): Promise<void>;
}
