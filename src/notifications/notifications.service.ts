import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { UserSettings } from '../users/entities/user-settings.entity';

interface CreateNotificationDto {
    userId: number;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    metadata?: any;
    actionUrl?: string;
}

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationsRepository: Repository<Notification>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(UserSettings)
        private userSettingsRepository: Repository<UserSettings>,
    ) {}

    async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const notification = this.notificationsRepository.create(createNotificationDto);
        return this.notificationsRepository.save(notification);
    }

    async getUserNotifications(userId: number, limit: number = 50): Promise<Notification[]> {
        return this.notificationsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit
        });
    }

    async getUnreadCount(userId: number): Promise<number> {
        return this.notificationsRepository.count({
            where: { userId, read: false }
        });
    }

    async markAsRead(notificationId: number, userId: number): Promise<void> {
        await this.notificationsRepository.update(
            { id: notificationId, userId },
            { read: true }
        );
    }

    async markAllAsRead(userId: number): Promise<void> {
        await this.notificationsRepository.update(
            { userId, read: false },
            { read: true }
        );
    }

    async deleteNotification(notificationId: number, userId: number): Promise<void> {
        await this.notificationsRepository.delete({ id: notificationId, userId });
    }

    // Métodos específicos para tipos de notificaciones
    async createBudgetAlert(userId: number, amount: number, limit: number, categoryName?: string): Promise<void> {
        // Verificar si el usuario tiene alertas de presupuesto habilitadas
        const settings = await this.userSettingsRepository.findOne({ where: { userId } });
        if (!settings?.budgetAlerts) return;

        const percentage = Math.round((amount / limit) * 100);
        const title = percentage >= 100 ? '🚨 Presupuesto superado' : '⚠️ Alerta de presupuesto';

        let message = '';
        if (categoryName) {
            message = percentage >= 100
                ? `Has superado tu presupuesto en "${categoryName}" por Q${(amount - limit).toFixed(2)}`
                : `Has usado ${percentage}% de tu presupuesto en "${categoryName}" (Q${amount.toFixed(2)} de Q${limit.toFixed(2)})`;
        } else {
            message = percentage >= 100
                ? `Has superado tu presupuesto mensual por Q${(amount - limit).toFixed(2)}`
                : `Has usado ${percentage}% de tu presupuesto mensual (Q${amount.toFixed(2)} de Q${limit.toFixed(2)})`;
        }

        await this.createNotification({
            userId,
            title,
            message,
            type: NotificationType.BUDGET_ALERT,
            priority: percentage >= 100 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
            metadata: { amount, limit, percentage, categoryName },
            actionUrl: '/dashboard/transactions'
        });
    }

    async createTransactionReminder(userId: number): Promise<void> {
        const settings = await this.userSettingsRepository.findOne({ where: { userId } });
        if (!settings?.transactionReminders) return;

        await this.createNotification({
            userId,
            title: '📝 Recordatorio de transacciones',
            message: '¿Has registrado tus gastos de hoy? Mantén tu presupuesto actualizado.',
            type: NotificationType.TRANSACTION_REMINDER,
            priority: NotificationPriority.LOW,
            actionUrl: '/dashboard/transactions'
        });
    }

    async createWeeklyReport(userId: number, totalExpenses: number, totalIncome: number): Promise<void> {
        const settings = await this.userSettingsRepository.findOne({ where: { userId } });
        if (!settings?.weeklyReports) return;

        const balance = totalIncome - totalExpenses;
        const balanceText = balance >= 0 ? `+Q${balance.toFixed(2)}` : `-Q${Math.abs(balance).toFixed(2)}`;

        await this.createNotification({
            userId,
            title: '📊 Reporte semanal',
            message: `Esta semana: Ingresos Q${totalIncome.toFixed(2)}, Gastos Q${totalExpenses.toFixed(2)}, Balance ${balanceText}`,
            type: NotificationType.WEEKLY_REPORT,
            priority: NotificationPriority.MEDIUM,
            metadata: { totalExpenses, totalIncome, balance },
            actionUrl: '/dashboard'
        });
    }

    // Limpiar notificaciones antiguas (ejecutar periódicamente)
    async cleanupOldNotifications(daysOld: number = 30): Promise<void> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        await this.notificationsRepository.delete({
            createdAt: MoreThan(cutoffDate),
            read: true
        });
    }
}