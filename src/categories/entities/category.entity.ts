import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

// Definir el enum para los tipos de categoría
export enum CategoryType {
    EXPENSE = 'expense',
    INCOME = 'income',
}

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
}
