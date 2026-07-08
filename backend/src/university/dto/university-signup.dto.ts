import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UniversitySignupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  contact_email: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  contact_person_name: string;

  @IsNotEmpty()
  @IsEmail()
  contact_person_email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
