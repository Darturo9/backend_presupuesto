import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { Budget } from './entities/budget.entity';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetsRepository: Repository<Budget>,
    private categoriesService: CategoriesService,
    private transactionsService: TransactionsService,
  ) { }


  async create(createBudgetDto: CreateBudgetDto) {
    // Verifica si ya existe un presupuesto para la misma categoría y periodo
    const exists = await this.budgetsRepository.findOne({
      where: {
        category: { id: createBudgetDto.categoryId },
        period: createBudgetDto.period,
      },
      relations: ['category'],
    });

    if (exists) {
      throw new Error('Ya existe un presupuesto para esta categoría y periodo.');
    }

    const category = await this.categoriesService.findOne(createBudgetDto.categoryId);

    const budget = this.budgetsRepository.create({
      ...createBudgetDto,
      category,
    });

    return await this.budgetsRepository.save(budget);
  }

  async getBudgetStatus(id: number) {
    const budget = await this.budgetsRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!budget) {
      throw new NotFoundException(`Presupuesto con id ${id} no encontrado`);
    }

    // Sumar los gastos de la categoría y periodo del presupuesto
    const totalSpent = await this.transactionsService.sumExpensesByCategoryAndPeriod(
      budget.category.id,
      budget.period,
    );

    return {
      budgetId: budget.id,
      name: budget.name,
      category: budget.category.name,
      period: budget.period,
      amount: budget.amount,
      spent: totalSpent,
      available: budget.amount - totalSpent,
    };
  }

  async findAll(filters: { period?: string; categoryId?: number }) {
    const where: any = {};
    if (filters.period) where.period = filters.period;
    if (filters.categoryId) where.category = { id: filters.categoryId };

    return await this.budgetsRepository.find({
      where,
      relations: ['category'],
      order: { period: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const budget = await this.budgetsRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!budget) {
      throw new NotFoundException(`Presupuesto con id ${id} no encontrado`);
    }

    return budget;
  }

  async update(id: number, updateBudgetDto: UpdateBudgetDto) {
    const budget = await this.findOne(id);

    // Si se envía un nuevo categoryId, valida y actualiza la categoría
    if (updateBudgetDto.categoryId) {
      budget.category = await this.categoriesService.findOne(updateBudgetDto.categoryId);
    }

    // Actualiza los demás campos
    if (updateBudgetDto.name !== undefined) budget.name = updateBudgetDto.name;
    if (updateBudgetDto.amount !== undefined) budget.amount = updateBudgetDto.amount;
    if (updateBudgetDto.period !== undefined) budget.period = updateBudgetDto.period;

    return await this.budgetsRepository.save(budget);
  }

  async remove(id: number) {
    const budget = await this.findOne(id); // Valida que exista, lanza excepción si no
    await this.budgetsRepository.remove(budget);
    return { message: `Presupuesto con id ${id} eliminado correctamente` };
  }
}
