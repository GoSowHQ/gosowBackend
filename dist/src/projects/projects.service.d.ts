import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsDto } from './dto/list-projects.dto';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(params: ListProjectsDto): Promise<ServiceResponse>;
    findBySlug(slug: string): Promise<ServiceResponse>;
    create(userId: string, dto: CreateProjectDto): Promise<ServiceResponse>;
}
