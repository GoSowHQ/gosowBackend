import { EventType } from '@prisma/client';
export declare class CreateEventDto {
    title: string;
    description: string;
    type: EventType;
    coverImageUrl?: string;
    location?: string;
    meetingUrl?: string;
    startDate: string;
    endDate: string;
    maxAttendees?: number;
    tags?: string[];
}
