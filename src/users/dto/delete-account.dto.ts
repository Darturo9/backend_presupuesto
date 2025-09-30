import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class DeleteAccountDto {
    @IsOptional()
    @IsString()
    password?: string; // Solo requerida para usuarios con contraseña local

    @IsNotEmpty({ message: 'La confirmación es requerida' })
    @IsString()
    confirmation: string; // Usuario debe escribir "ELIMINAR" para confirmar
}