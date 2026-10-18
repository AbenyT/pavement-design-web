import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** POST /projects body. */
export class CreateProjectDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Give the project a name' })
  @MaxLength(150)
  name: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

/** PATCH /projects/:id body — every field optional. */
export class UpdateProjectDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'The project name cannot be empty' })
  @MaxLength(150)
  name?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
