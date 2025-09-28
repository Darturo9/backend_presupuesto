import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 transacciones por minuto
  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    const userId = req.user.userId;
    return this.transactionsService.create(createTransactionDto, userId);
  }

  @Get()
  findAll(@Request() req, @Query() queryParams: any) {
    const userId = req.user.userId || req.user.id;

    const filters = {
      type: queryParams.type,
      categoryId: queryParams.categoryId ? parseInt(queryParams.categoryId) : undefined,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      page: queryParams.page ? parseInt(queryParams.page) : undefined,
      limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
    };

    return this.transactionsService.findAll(filters, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 actualizaciones por minuto
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(+id, updateTransactionDto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 eliminaciones por minuto
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(+id);
  }

  // Endpoints para el dashboard
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard (balance, ingresos, gastos)' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del dashboard obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalIncome: { type: 'number', example: 5000 },
        totalExpenses: { type: 'number', example: 3000 },
        balance: { type: 'number', example: 2000 },
      },
    },
  })
  getDashboardStats(@Request() req) {
    const userId = req.user.userId;
    return this.transactionsService.getDashboardStats(userId);
  }

  @Get('dashboard/recent')
  @ApiOperation({ summary: 'Obtener transacciones recientes del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Transacciones recientes obtenidas exitosamente',
  })
  getRecentTransactions(@Request() req) {
    const userId = req.user.userId;
    return this.transactionsService.getRecentTransactions(userId);
  }

  @Get('dashboard/expenses-by-category')
  @ApiOperation({ summary: 'Obtener gastos agrupados por categoría' })
  @ApiResponse({
    status: 200,
    description: 'Gastos por categoría obtenidos exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string', example: 'Alimentación' },
          amount: { type: 'number', example: 150.50 },
        },
      },
    },
  })
  getExpensesByCategory(@Request() req) {
    const userId = req.user.userId;
    return this.transactionsService.getExpensesByCategory(userId);
  }
}
