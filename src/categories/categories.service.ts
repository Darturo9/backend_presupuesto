import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) { }


  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    return await this.categoriesRepository.save(createCategoryDto);
  }

  async findAll(filters: {
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    name?: string;
  } = {}) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.name) where.name = filters.name;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const [data, total] = await this.categoriesRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {

    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['transactions'],
    });

    if (!category) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }

    return category

  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id)

    this.categoriesRepository.merge(category, updateCategoryDto)

    return await this.categoriesRepository.save(category)

  }

  async remove(id: number) {

    const category = await this.findOne(id)

    category.isActive = false
    await this.categoriesRepository.save(category)

    return {
      message: `Categoría con id ${id} desactivada correctamente`,
      id
    };
  }
}
