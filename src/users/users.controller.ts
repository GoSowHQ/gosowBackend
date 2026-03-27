import { Controller, Patch, UseGuards, Body, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('users/me')
  updateMe(@CurrentUser('id') userId: string, @Body() body: { name?: string; bio?: string }) {
    return this.usersService.updateMe(userId, body);
  }

  @Get('users/:id/projects')
  getUserProjects(@Param('id') id: string) {
    return this.usersService.getUserProjects(id);
  }
}
