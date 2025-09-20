import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { User } from 'src/users/entities/user.entity';

@Unique(['category', 'period'])
@Entity('budgets')
export class Budget {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column('decimal')
    amount: number;

    @Column()
    period: string; // Ej: '2025-09'

    @ManyToOne(() => Category)
    category: Category;

    @ManyToOne(() => User, user => user.budgets)
    user: User;
}
