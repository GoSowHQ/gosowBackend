import { ProjectsService } from './projects.service';
import { ListProjectsDto } from './dto/list-projects.dto';
import { CreateProjectDto } from './dto/create-project.dto';
export declare class ProjectsController {
    private projectsService;
    constructor(projectsService: ProjectsService);
    findAll(query: ListProjectsDto): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    findBySlug(slug: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    create(userId: string, dto: CreateProjectDto): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
}
