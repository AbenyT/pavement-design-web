import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trimLower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

/** POST /auth/register body. */
export class RegisterDto {
  @Transform(trimLower)
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72) // bcrypt only uses the first 72 bytes
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

/** POST /auth/login body. */
export class LoginDto {
  @Transform(trimLower)
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Enter your password' })
  password: string;
}
