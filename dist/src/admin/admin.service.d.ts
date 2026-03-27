import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { VirtualAccountsService } from '../funding/virtual-accounts.service';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class AdminService {
    private prisma;
    private virtualAccountsService;
    constructor(prisma: PrismaService, virtualAccountsService: VirtualAccountsService);
    getDashboard(): Promise<ServiceResponse>;
    getPendingProjects(): Promise<ServiceResponse>;
    approveProject(projectId: string): Promise<ServiceResponse>;
    rejectProject(projectId: string): Promise<ServiceResponse>;
    getUsers(page?: number, limit?: number): Promise<ServiceResponse>;
    updateUserRole(userId: string, role: UserRole): Promise<ServiceResponse>;
    toggleUserStatus(userId: string): Promise<ServiceResponse>;
}
