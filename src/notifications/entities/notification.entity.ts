import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
    BUDGET_ALERT = 'budget_alert',
    TRANSACTION_REMINDER = 'transaction_reminder',
    WEEKLY_REPORT = 'weekly_report',
    SYSTEM = 'system'
}

export enum NotificationPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column('text')
    message: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.SYSTEM
    })
    type: NotificationType;

    @Column({
        type: 'enum',
        enum: NotificationPriority,
        default: NotificationPriority.MEDIUM
    })
    priority: NotificationPriority;

    @Column({ default: false })
    read: boolean;

    @Column({ type: 'json', nullable: true })
    metadata?: any; // Datos adicionales como amount, categoryId, etc.

    @Column({ nullable: true })
    actionUrl?: string; // URL para navegar cuando se hace click

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @Column()
    userId: number;
}