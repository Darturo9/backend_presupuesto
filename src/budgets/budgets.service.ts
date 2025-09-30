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


  async create(createBudgetDto: CreateBudgetDto, userId: number) {
    // Verifica si ya existe un presupuesto para la misma categoría y periodo del usuario
    const exists = await this.budgetsRepository.findOne({
      where: {
        category: { id: createBudgetDto.categoryId },
        period: createBudgetDto.period,
        user: { id: userId }
      },
      relations: ['category', 'user'],
    });

    if (exists) {
      throw new Error('Ya existe un presupuesto para esta categoría y periodo.');
    }

    const category = await this.categoriesService.findOneById(createBudgetDto.categoryId);

    const budget = this.budgetsRepository.create({
      ...createBudgetDto,
      category,
      user: { id: userId }
    });

    return await this.budgetsRepository.save(budget);
  }

  async getBudgetStatus(id: number, userId: number) {
    const budget = await this.budgetsRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['category', 'user'],
    });

    if (!budget) {
      throw new NotFoundException(`Presupuesto con id ${id} no encontrado`);
    }

    // Sumar los gastos de la categoría y periodo del presupuesto para este usuario
    const totalSpent = await this.transactionsService.sumExpensesByCategoryAndPeriod(
      budget.category.id,
      budget.period,
      userId
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

  async findAll(filters: { period?: string; categoryId?: number }, userId: number) {
    const where: any = { user: { id: userId } };
    if (filters.period) where.period = filters.period;
    if (filters.categoryId) where.category = { id: filters.categoryId };

    return await this.budgetsRepository.find({
      where,
      relations: ['category', 'user'],
      order: { period: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: number, userId: number) {
    const budget = await this.budgetsRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['category', 'user'],
    });

    if (!budget) {
      throw new NotFoundException(`Presupuesto con id ${id} no encontrado`);
    }

    return budget;
  }

  async update(id: number, updateBudgetDto: UpdateBudgetDto, userId: number) {
    const budget = await this.findOne(id, userId);

    // Si se envía un nuevo categoryId, valida y actualiza la categoría
    if (updateBudgetDto.categoryId) {
      budget.category = await this.categoriesService.findOneById(updateBudgetDto.categoryId);
    }

    // Actualiza los demás campos
    if (updateBudgetDto.name !== undefined) budget.name = updateBudgetDto.name;
    if (updateBudgetDto.amount !== undefined) budget.amount = updateBudgetDto.amount;
    if (updateBudgetDto.period !== undefined) budget.period = updateBudgetDto.period;

    return await this.budgetsRepository.save(budget);
  }

  async remove(id: number, userId: number) {
    const budget = await this.findOne(id, userId); // Valida que exista, lanza excepción si no
    await this.budgetsRepository.remove(budget);
    return { message: `Presupuesto con id ${id} eliminado correctamente` };
  }
}
