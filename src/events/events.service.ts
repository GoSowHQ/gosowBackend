import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: string): Promise<ServiceResponse> {
    const where: any = {};
    if (type) where.type = type;

    const events = await this.prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { registrations: true } } },
    });
    return createServiceResponse(events, 'Events retrieved successfully');
  }

  async findBySlug(slug: string): Promise<ServiceResponse> {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: { _count: { select: { registrations: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');
    return createServiceResponse(event, 'Event retrieved successfully');
  }

  async create(dto: CreateEventDto): Promise<ServiceResponse> {
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
    return createServiceResponse(event, 'Event created successfully');
  }

  async update(id: string, dto: UpdateEventDto): Promise<ServiceResponse> {
    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    return createServiceResponse(updated, 'Event updated successfully');
  }

  async remove(id: string): Promise<ServiceResponse> {
    await this.prisma.event.delete({ where: { id } });
    return createServiceResponse(null, 'Event removed successfully');
  }

  async register(userId: string, eventId: string): Promise<ServiceResponse> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
      throw new BadRequestException('Event is full');
    }

    const reg = await this.prisma.eventRegistration.create({
      data: { userId, eventId },
    });
    return createServiceResponse(reg, 'Successfully registered for event');
  }

  async unregister(userId: string, eventId: string) {
    return this.prisma.eventRegistration.delete({
      where: { userId_eventId: { userId, eventId } },
    });
  }
}
