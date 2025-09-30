import { Controller, Get, Post, Delete, Param, Query, Request, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    async getUserNotifications(
        @Request() req,
        @Query('limit', ParseIntPipe) limit: number = 50
    ) {
        return this.notificationsService.getUserNotifications(req.user.id, limit);
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req) {
        const count = await this.notificationsService.getUnreadCount(req.user.id);
        return { count };
    }

    @Post(':id/mark-read')
    async markAsRead(
        @Param('id', ParseIntPipe) id: number,
        @Request() req
    ) {
        await this.notificationsService.markAsRead(id, req.user.id);
        return { message: 'Notificación marcada como leída' };
    }

    @Post('mark-all-read')
    async markAllAsRead(@Request() req) {
        await this.notificationsService.markAllAsRead(req.user.id);
        return { message: 'Todas las notificaciones marcadas como leídas' };
    }

    @Delete(':id')
    async deleteNotification(
        @Param('id', ParseIntPipe) id: number,
        @Request() req
    ) {
        await this.notificationsService.deleteNotification(id, req.user.id);
        return { message: 'Notificación eliminada' };
    }
}