import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto, @Req() req) {
    console.log('🔍 Controller - create category:', createCategoryDto);
    console.log('🔍 Controller - user id:', req.user.id);
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

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto, @Req() req) {
    console.log('🔍 Controller - update category id:', id);
    console.log('🔍 Controller - update data:', updateCategoryDto);
    console.log('🔍 Controller - user id:', req.user.id);
    return this.categoriesService.update(id, updateCategoryDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.categoriesService.remove(id, req.user.id);
  }
}
