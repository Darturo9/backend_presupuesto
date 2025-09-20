import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail({}, { message: 'El correo no es válido' })
    email: string;

    @IsOptional()
    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password?: string; // Opcional para Google

    @IsOptional()
    @IsString()
    googleId?: string; // Opcional para Google

    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    firstName: string;

    @IsNotEmpty({ message: 'El apellido es requerido' })
    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    avatar?: string;
}
