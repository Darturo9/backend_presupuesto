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

  async findAll() {
    //retorna todas las categorais
    return await this.categoriesRepository.findAndCount()
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

    console.table("solo quiero ver")

    const category = await this.findOne(id)

    // Eliminar la categoría
    await this.categoriesRepository.remove(category);

    return {
      message: `Categoría con id ${id} eliminada correctamente`,
      id
    };
  }
}
