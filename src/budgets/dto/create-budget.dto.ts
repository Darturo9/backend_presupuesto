import { IsNotEmpty, IsNumber, IsString, IsInt } from 'class-validator';

export class CreateBudgetDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @IsString()
    period: string;

    @IsNotEmpty()
    @IsInt()
    categoryId: number;
}
