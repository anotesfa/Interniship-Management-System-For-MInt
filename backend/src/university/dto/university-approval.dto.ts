import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ApproveUniversityDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  university_id: number;
}

export class RejectUniversityDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  university_id: number;

  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  rejected_reason: string;
}
