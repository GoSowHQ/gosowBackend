import { PrismaService } from '../prisma/prisma.service';
import { InterswitchService } from './interswitch.service';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class VirtualAccountsService {
    private prisma;
    private interswitchService;
    constructor(prisma: PrismaService, interswitchService: InterswitchService);
    ensureProjectVirtualAccount(projectId: string): Promise<ServiceResponse>;
    getPublicProjectVirtualAccount(projectId: string): Promise<ServiceResponse>;
    findByAccountNumber(accountNumber: string): Promise<({
        project: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            title: string;
            description: string;
            shortDescription: string | null;
            imageUrl: string | null;
            category: import(".prisma/client").$Enums.ProjectCategory;
            status: import(".prisma/client").$Enums.ProjectStatus;
            goalAmount: number;
            currentAmount: number;
            backerCount: number;
            startDate: Date | null;
            endDate: Date | null;
            featured: boolean;
            creatorId: string;
        };
    } & {
        id: string;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.VirtualAccountStatus;
        projectId: string;
        accountNumber: string | null;
        accountName: string | null;
        bankCode: string | null;
        bankName: string | null;
        payableCode: string | null;
        externalReference: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }) | null>;
    getInterswitchService(): InterswitchService;
}
