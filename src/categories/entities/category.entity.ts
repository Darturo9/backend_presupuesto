import { Transaction } from 'src/transactions/entities/transaction.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, Unique } from 'typeorm';

// Definir el enum para los tipos de categoría
export enum CategoryType {
    EXPENSE = 'expense',
    INCOME = 'income',
}

@Unique(['user', 'name']) // <-- Aquí
@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({
        type: 'enum',
        enum: CategoryType,
        default: CategoryType.EXPENSE
    })
    type: CategoryType;

    @OneToMany(() => Transaction, transaction => transaction.category)
    transactions: Transaction[];

    @ManyToOne(() => User, user => user.categories)
    user: User;
}
