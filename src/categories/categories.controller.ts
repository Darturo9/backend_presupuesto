import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 categorías por minuto
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto, @Req() req) {
    return this.categoriesService.create(createCategoryDto, req.user.id);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('type') type?: string,
    @Query('isActive') isActive?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string
  ) {
    return this.categoriesService.findAll({ type, isActive, page, limit, name }, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.categoriesService.findOne(id, req.user.id);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 actualizaciones por minuto
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto, @Req() req) {
    return this.categoriesService.update(id, updateCategoryDto, req.user.id);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 eliminaciones por minuto
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.categoriesService.remove(id, req.user.id);
  }
}
