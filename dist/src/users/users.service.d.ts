import { PrismaService } from '../prisma/prisma.service';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    updateMe(userId: string, data: {
        name?: string;
        bio?: string;
    }): Promise<ServiceResponse>;
    getUserProjects(userId: string): Promise<ServiceResponse>;
}
