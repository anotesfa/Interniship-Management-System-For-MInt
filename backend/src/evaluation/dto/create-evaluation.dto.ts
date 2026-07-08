import {
  IsInt,
  Min,
  Max,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
  IsArray,
} from 'class-validator';

const LETTER_GRADES = ['A+', 'A', 'B', 'C', 'D', 'F'] as const;

export class CreateEvaluationDto {
  @IsInt()
  student_id!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  attendance_rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  technical_rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  teamwork_rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  communication_rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  initiative_rating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  punctuality_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  reliability_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  independence_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communication_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  professionalism_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  speed_of_work_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  accuracy_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  engagement_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  need_for_work_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  cooperation_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  technical_skills_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  organizational_skills_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  project_support_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  responsibility_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  team_quality_score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  attendance_percentage?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  total_absent_days?: number;

  @IsOptional()
  @IsArray()
  weeks?: any[];

  @IsString()
  @IsIn(LETTER_GRADES as unknown as string[])
  grade?: string;

  @IsString()
  @MinLength(100)
  @MaxLength(1000)
  remarks!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;
}


