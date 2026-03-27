import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
export declare class CommentsController {
    private commentsService;
    constructor(commentsService: CommentsService);
    findByProject(projectId: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    create(userId: string, projectId: string, dto: CreateCommentDto): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    update(userId: string, id: string, content: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    remove(userId: string, role: string, id: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
}
