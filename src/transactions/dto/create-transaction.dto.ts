import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, Length, IsInt } from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
    @IsNotEmpty({ message: 'El monto es requerido' })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número con máximo 2 decimales' })
    @IsPositive({ message: 'El monto debe ser mayor a 0' })
    amount: number;

    @IsNotEmpty({ message: 'La descripción es requerida' })
    @IsString({ message: 'La descripción debe ser un texto' })
    @Length(2, 100, { message: 'La descripción debe tener entre 2 y 100 caracteres' })
    description: string;

    @IsNotEmpty({ message: 'El tipo es requerido' })
    @IsEnum(TransactionType, { message: 'El tipo debe ser "expense" o "income"' })
    type: TransactionType;

    @IsNotEmpty({ message: 'La categoría es requerida' })
    @IsInt({ message: 'El ID de categoría debe ser un número entero' })
    categoryId: number;
}
