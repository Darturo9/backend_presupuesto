import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 10, default: 'GTQ' })
    currency: string;

    @Column({ type: 'varchar', length: 20, default: 'DD/MM/YYYY' })
    dateFormat: string;

    @Column({ type: 'varchar', length: 10, default: 'es' })
    language: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    monthlyBudgetLimit?: number;

    @Column({ type: 'boolean', default: true })
    budgetAlerts: boolean;

    @Column({ type: 'boolean', default: false })
    transactionReminders: boolean;

    @Column({ type: 'boolean', default: true })
    weeklyReports: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => User)
    @JoinColumn()
    user: User;

    @Column()
    userId: number;
}