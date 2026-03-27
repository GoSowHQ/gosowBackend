import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('projects/pending')
  getPendingProjects() {
    return this.adminService.getPendingProjects();
  }

  @Patch('projects/:id/approve')
  approveProject(@Param('id') id: string) {
    return this.adminService.approveProject(id);
  }

  @Patch('projects/:id/reject')
  rejectProject(@Param('id') id: string) {
    return this.adminService.rejectProject(id);
  }

  @Get('users')
  getUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getUsers(page || 1, limit || 20);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.adminService.updateUserRole(id, role);
  }

  @Patch('users/:id/status')
  toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }
}
