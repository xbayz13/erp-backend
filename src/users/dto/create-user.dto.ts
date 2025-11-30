import { IsArray, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../../common/enums/role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsArray()
  roles!: UserRole[];
}


