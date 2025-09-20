import { Module } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './entities/budget.entity';
import { CategoriesModule } from 'src/categories/categories.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Budget]),
    CategoriesModule,
    TransactionsModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule { }
