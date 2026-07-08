import { IsEmail, IsNumber, IsOptional, IsString, Max, Min, MinLength, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubmitApplicationDto {
  @IsString()
  @MinLength(1)
  student_name: string;

  @IsString()
  @MinLength(1)
  department: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : parseFloat(value)))
  @IsNumber()
  @Min(0)
  @Max(4)
  gpa?: number;

  @IsEmail()
  institutional_email: string;

  @IsOptional()
  @IsDateString()
  internship_start_date?: string;

  @IsOptional()
  @IsDateString()
  internship_end_date?: string;
}
