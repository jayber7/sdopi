import { IsEmail, IsString, IsIn, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  nombre!: string;

  @IsIn(['admin', 'operador', 'consulta'])
  role!: string;
}
