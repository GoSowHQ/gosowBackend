import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class EventsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(type?: string): Promise<ServiceResponse>;
    findBySlug(slug: string): Promise<ServiceResponse>;
    create(dto: CreateEventDto): Promise<ServiceResponse>;
    update(id: string, dto: UpdateEventDto): Promise<ServiceResponse>;
    remove(id: string): Promise<ServiceResponse>;
    register(userId: string, eventId: string): Promise<ServiceResponse>;
    unregister(userId: string, eventId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        eventId: string;
    }>;
}
