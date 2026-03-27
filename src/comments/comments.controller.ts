import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get('projects/:projectId/comments')
  findByProject(@Param('projectId') projectId: string) {
    return this.commentsService.findByProject(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('projects/:projectId/comments')
  create(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(userId, projectId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('comments/:id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.commentsService.update(userId, id, content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  remove(@CurrentUser('id') userId: string, @CurrentUser('role') role: string, @Param('id') id: string) {
    return this.commentsService.remove(userId, id, role);
  }
}
