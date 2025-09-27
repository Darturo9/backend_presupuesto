import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriesService } from 'src/categories/categories.service';

@Injectable()
export class TransactionsService {

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private categoriesService: CategoriesService
  ) { }


  async create(createTransactionDto: CreateTransactionDto) {

    const category = await this.categoriesService.findOneById(createTransactionDto.categoryId)

    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      category,
    })
    return await this.transactionRepository.save(transaction);

  }

  async findAll() {
    return await this.transactionRepository.findAndCount()
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

  async sumExpensesByCategoryAndPeriod(categoryId: number, period: string): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'sum')
      .where('transaction.categoryId = :categoryId', { categoryId })
      .andWhere('transaction.type = :type', { type: 'expense' })
      .andWhere('to_char(transaction.createdAt, \'YYYY-MM\') = :period', { period })
      .getRawOne();

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
}
