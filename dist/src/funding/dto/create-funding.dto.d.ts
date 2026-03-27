export declare class CreateFundingDto {
    amount: number;
    projectId: string;
    rewardId?: string;
    isAnonymous?: boolean;
    message?: string;
    provider?: 'STRIPE' | 'INTERSWITCH';
}
