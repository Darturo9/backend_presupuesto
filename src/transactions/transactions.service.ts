import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserSettings } from '../users/entities/user-settings.entity';
import { NotificationType, NotificationPriority } from '../notifications/entities/notification.entity';

@Injectable()
export class TransactionsService {

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private categoriesService: CategoriesService,
    private notificationsService: NotificationsService,
    @InjectRepository(UserSettings)
    private userSettingsRepository: Repository<UserSettings>
  ) { }


  async create(createTransactionDto: CreateTransactionDto, userId: number) {
    const category = await this.categoriesService.findOneById(createTransactionDto.categoryId);

    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      category,
      userId: userId
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Solo verificar presupuesto si es un gasto
    if (createTransactionDto.type === 'expense') {
      await this.checkBudgetAlert(userId, category.id, createTransactionDto.amount);
    }

    return savedTransaction;
  }

  async findAll(filters: {
    type?: string;
    categoryId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}, userId: number) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.userId = :userId', { userId });

    // Aplicar filtros
    if (filters.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: filters.type });
    }

    if (filters.categoryId) {
      queryBuilder.andWhere('transaction.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate: filters.endDate + ' 23:59:59' });
    }

    // Ordenar por fecha más reciente primero
    queryBuilder.orderBy('transaction.createdAt', 'DESC');

    // Paginación
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const transaction = await this.transactionRepository.findOneBy({ id })

    if (!transaction) {
      throw new NotFoundException(`Transaction con id ${id} no encontrada`);
    }

    return transaction

  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.findOne(id);

    // Si se envía un nuevo categoryId, valida y actualiza la categoría
    if (updateTransactionDto.categoryId) {
      transaction.category = await this.categoriesService.findOneById(updateTransactionDto.categoryId);
    }

    this.transactionRepository.merge(transaction, updateTransactionDto);

    return await this.transactionRepository.save(transaction);
  }

  async remove(id: number) {
    const transaction = await this.findOne(id)

    await this.transactionRepository.remove(transaction)

    return {
      message: `Transaction con id ${id} eliminada correctamente`,
      id
    };
  }

  async sumExpensesByCategoryAndPeriod(categoryId: number, period: string, userId?: number): Promise<number> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'sum')
      .where('transaction.categoryId = :categoryId', { categoryId })
      .andWhere('transaction.type = :type', { type: 'expense' })
      .andWhere('to_char(transaction.createdAt, \'YYYY-MM\') = :period', { period });

    if (userId) {
      queryBuilder.andWhere('transaction.userId = :userId', { userId });
    }

    const result = await queryBuilder.getRawOne();
    return Number(result.sum) || 0;
  }

  // Métodos para el dashboard
  async getDashboardStats(userId: number) {
    const totalIncome = await this.getTotalIncome(userId);
    const totalExpenses = await this.getTotalExpenses(userId);
    const balance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      balance,
    };
  }

  async getTotalIncome(userId: number): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'sum')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.type = :type', { type: 'income' })
      .getRawOne();

    return Number(result.sum) || 0;
  }

  async getTotalExpenses(userId: number): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'sum')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.type = :type', { type: 'expense' })
      .getRawOne();

    return Number(result.sum) || 0;
  }

  async getRecentTransactions(userId: number, limit: number = 5) {
    return await this.transactionRepository.find({
      where: { user: { id: userId } },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getExpensesByCategory(userId: number) {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('category.name', 'categoryName')
      .addSelect('SUM(transaction.amount)', 'total')
      .leftJoin('transaction.category', 'category')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.type = :type', { type: 'expense' })
      .groupBy('category.id, category.name')
      .getRawMany();

    return result.map(item => ({
      category: item.categoryName,
      amount: Number(item.total) || 0,
    }));
  }

  private async checkBudgetAlert(userId: number, categoryId: number, transactionAmount: number) {
    try {
      // Verificar configuración de notificaciones del usuario
      const userSettings = await this.userSettingsRepository.findOne({
        where: { user: { id: userId } }
      });

      if (!userSettings?.budgetAlerts) {
        return;
      }

      // Obtener el período actual (YYYY-MM)
      const currentPeriod = new Date().toISOString().slice(0, 7);

      // Buscar presupuestos activos para esta categoría y período
      const budgets = await this.transactionRepository.manager.query(`
        SELECT b.id, b.name, b.amount, b.period
        FROM budgets b
        WHERE b.categoryId = ? AND b.period = ?
      `, [categoryId, currentPeriod]);

      for (const budget of budgets) {
        // Calcular gastos actuales en esta categoría y período
        const currentSpent = await this.sumExpensesByCategoryAndPeriod(categoryId, currentPeriod, userId);

        const spentPercentage = (currentSpent / budget.amount) * 100;
        const remaining = budget.amount - currentSpent;

        // Alertas por porcentaje de presupuesto usado
        if (spentPercentage >= 90 && spentPercentage < 100) {
          await this.notificationsService.createNotification({
            userId,
            title: '🚨 Presupuesto casi agotado',
            message: `Has gastado el ${spentPercentage.toFixed(1)}% de tu presupuesto "${budget.name}". Te quedan $${remaining.toFixed(2)}.`,
            type: NotificationType.BUDGET_ALERT,
            priority: NotificationPriority.HIGH,
            metadata: {
              budgetId: budget.id,
              categoryId,
              spentPercentage: spentPercentage.toFixed(1),
              remaining: remaining.toFixed(2)
            }
          });
        } else if (spentPercentage >= 75 && spentPercentage < 90) {
          await this.notificationsService.createNotification({
            userId,
            title: '⚠️ Alerta de presupuesto',
            message: `Has gastado el ${spentPercentage.toFixed(1)}% de tu presupuesto "${budget.name}". Te quedan $${remaining.toFixed(2)}.`,
            type: NotificationType.BUDGET_ALERT,
            priority: NotificationPriority.MEDIUM,
            metadata: {
              budgetId: budget.id,
              categoryId,
              spentPercentage: spentPercentage.toFixed(1),
              remaining: remaining.toFixed(2)
            }
          });
        }

        // Alerta si se excede el presupuesto
        if (currentSpent > budget.amount) {
          const excess = currentSpent - budget.amount;
          await this.notificationsService.createNotification({
            userId,
            title: '🔴 Presupuesto excedido',
            message: `Has excedido tu presupuesto "${budget.name}" por $${excess.toFixed(2)}.`,
            type: NotificationType.BUDGET_ALERT,
            priority: NotificationPriority.HIGH,
            metadata: {
              budgetId: budget.id,
              categoryId,
              excess: excess.toFixed(2),
              overspent: true
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
      // No propagar el error para no afectar la creación de la transacción
    }
  }
}
