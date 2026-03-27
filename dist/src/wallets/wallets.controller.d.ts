import { WalletsService } from './wallets.service';
export declare class WalletsController {
    private walletsService;
    constructor(walletsService: WalletsService);
    getMyWallet(req: any): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
}
