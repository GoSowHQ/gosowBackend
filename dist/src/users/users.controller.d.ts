import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    updateMe(userId: string, body: {
        name?: string;
        bio?: string;
    }): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    getUserProjects(id: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
}
