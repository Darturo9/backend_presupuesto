import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { User } from 'src/users/entities/user.entity';

export enum TransactionType {
    EXPENSE = 'expense',
    INCOME = 'income'
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('decimal')
    amount: number;

    @Column({ length: 100, nullable: false })
    description: string;

    @Column({
        type: 'enum',
        enum: TransactionType
    })
    type: TransactionType;

    @ManyToOne(() => Category, category => category.transactions)
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, user => user.transactions)
    user: User;
}
