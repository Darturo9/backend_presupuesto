import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { CategoryType } from '../entities/category.entity';

export class CreateCategoryDto {
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString({ message: 'El nombre debe ser un texto' })
    @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
    name: string;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser un texto' })
    description?: string;

    @IsOptional()
    @IsBoolean({ message: 'isActive debe ser un valor booleano' })
    isActive?: boolean = true;

    @IsOptional()
    @IsEnum(CategoryType, { message: 'El tipo debe ser "expense" o "income"' })
    type?: CategoryType;
}
