import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventsController {
    private eventsService;
    constructor(eventsService: EventsService);
    findAll(type?: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    findBySlug(slug: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    create(dto: CreateEventDto): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    update(id: string, dto: UpdateEventDto): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    remove(id: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    register(userId: string, id: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    unregister(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        eventId: string;
    }>;
}
