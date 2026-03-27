"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const service_response_type_1 = require("../common/types/service-response.type");
let EventsService = class EventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(type) {
        const where = {};
        if (type)
            where.type = type;
        const events = await this.prisma.event.findMany({
            where,
            orderBy: { startDate: 'asc' },
            include: { _count: { select: { registrations: true } } },
        });
        return (0, service_response_type_1.createServiceResponse)(events, 'Events retrieved successfully');
    }
    async findBySlug(slug) {
        const event = await this.prisma.event.findUnique({
            where: { slug },
            include: { _count: { select: { registrations: true } } },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        return (0, service_response_type_1.createServiceResponse)(event, 'Event retrieved successfully');
    }
    async create(dto) {
        const slug = dto.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            + '-' + Math.random().toString(36).substring(2, 8);
        const event = await this.prisma.event.create({
            data: {
                title: dto.title,
                slug,
                description: dto.description,
                type: dto.type,
                imageUrl: dto.coverImageUrl,
                location: dto.location,
                meetingUrl: dto.meetingUrl,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                maxAttendees: dto.maxAttendees,
            },
        });
        return (0, service_response_type_1.createServiceResponse)(event, 'Event created successfully');
    }
    async update(id, dto) {
        const updated = await this.prisma.event.update({
            where: { id },
            data: {
                ...dto,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            },
        });
        return (0, service_response_type_1.createServiceResponse)(updated, 'Event updated successfully');
    }
    async remove(id) {
        await this.prisma.event.delete({ where: { id } });
        return (0, service_response_type_1.createServiceResponse)(null, 'Event removed successfully');
    }
    async register(userId, eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: { _count: { select: { registrations: true } } },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
            throw new common_1.BadRequestException('Event is full');
        }
        const reg = await this.prisma.eventRegistration.create({
            data: { userId, eventId },
        });
        return (0, service_response_type_1.createServiceResponse)(reg, 'Successfully registered for event');
    }
    async unregister(userId, eventId) {
        return this.prisma.eventRegistration.delete({
            where: { userId_eventId: { userId, eventId } },
        });
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
//# sourceMappingURL=events.service.js.map