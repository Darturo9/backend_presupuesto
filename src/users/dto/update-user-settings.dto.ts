import { IsOptional, IsString, IsBoolean, IsNumber, IsIn, Min } from 'class-validator';

export class UpdateUserSettingsDto {
    @IsOptional()
    @IsString()
    @IsIn(['GTQ', 'USD', 'EUR', 'MXN'])
    currency?: string;

    @IsOptional()
    @IsString()
    @IsIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
    dateFormat?: string;

    @IsOptional()
    @IsString()
    @IsIn(['es', 'en'])
    language?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    monthlyBudgetLimit?: number;

    @IsOptional()
    @IsBoolean()
    budgetAlerts?: boolean;

    @IsOptional()
    @IsBoolean()
    transactionReminders?: boolean;

    @IsOptional()
    @IsBoolean()
    weeklyReports?: boolean;
}