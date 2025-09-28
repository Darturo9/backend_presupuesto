import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) { }


  async create(createCategoryDto: CreateCategoryDto, userId: number): Promise<Category> {
    const category = this.categoriesRepository.create({
      name: createCategoryDto.name,
      description: createCategoryDto.description || '',
      type: createCategoryDto.type || CategoryType.EXPENSE,
      user: { id: userId } as User
    });

    const result = await this.categoriesRepository.save(category);
    return result;
  }

  async findAll(filters: {
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    name?: string;
  } = {}, userId: number) {
    const where: any = { user: { id: userId } };
    if (filters.type) where.type = filters.type;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.name) where.name = Like(`%${filters.name}%`);

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

  async findOne(id: number, userId: number) {
    const category = await this.categoriesRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['transactions'],
    });

    if (!category) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }

    return category;
  }

  // Método temporal para otros servicios que no tienen userId disponible
  async findOneById(id: number) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['transactions'],
    });

    if (!category) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto, userId: number) {
    if (!updateCategoryDto || Object.keys(updateCategoryDto).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    const category = await this.findOne(id, userId);
    this.categoriesRepository.merge(category, updateCategoryDto);
    const result = await this.categoriesRepository.save(category);
    return result;
  }

  async remove(id: number, userId: number) {
    const category = await this.findOne(id, userId);

    category.isActive = false;
    await this.categoriesRepository.save(category);

    return {
      message: `Categoría con id ${id} desactivada correctamente`,
      id
    };
  }
}
