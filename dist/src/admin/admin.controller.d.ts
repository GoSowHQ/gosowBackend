import { AdminService } from './admin.service';
import { UserRole } from '@prisma/client';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    getPendingProjects(): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    approveProject(id: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    rejectProject(id: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    getUsers(page?: number, limit?: number): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    updateUserRole(id: string, role: UserRole): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    toggleUserStatus(id: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
}
