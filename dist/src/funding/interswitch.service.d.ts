import { ConfigService } from '@nestjs/config';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class InterswitchService {
    private config;
    constructor(config: ConfigService);
    createVirtualAccount(params: {
        projectId: string;
        projectTitle: string;
        creatorName: string;
    }): Promise<ServiceResponse>;
    createWebpayCheckout(params: {
        amountMinor: number;
        email: string;
        fundingId: string;
        projectSlug: string;
        projectId: string;
    }): Promise<ServiceResponse>;
    createPayout(params: {
        amountMinor: number;
        accountNumber: string;
        accountName: string;
        bankCode: string;
        narration: string;
        reference: string;
    }): Promise<ServiceResponse>;
    private request;
    private authHeaders;
    private isMockMode;
    private required;
    private mockVirtualAccount;
}
