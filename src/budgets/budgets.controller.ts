import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) { }

  @Post()
  create(@Body() createBudgetDto: CreateBudgetDto, @Request() req) {
    return this.budgetsService.create(createBudgetDto, req.user.id);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('period') period?: string,
    @Query('categoryId') categoryId?: number
  ) {
    return this.budgetsService.findAll({ period, categoryId }, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.budgetsService.findOne(+id, req.user.id);
  }

  @Get(':id/status')
  getBudgetStatus(@Param('id') id: string, @Request() req) {
    return this.budgetsService.getBudgetStatus(+id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBudgetDto: UpdateBudgetDto, @Request() req) {
    return this.budgetsService.update(+id, updateBudgetDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.budgetsService.remove(+id, req.user.id);
  }
}
