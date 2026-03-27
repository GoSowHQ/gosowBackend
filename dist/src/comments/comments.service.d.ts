import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class CommentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findByProject(projectId: string): Promise<ServiceResponse>;
    create(userId: string, projectId: string, dto: CreateCommentDto): Promise<ServiceResponse>;
    update(userId: string, commentId: string, content: string): Promise<ServiceResponse>;
    remove(userId: string, commentId: string, userRole: string): Promise<ServiceResponse>;
}
