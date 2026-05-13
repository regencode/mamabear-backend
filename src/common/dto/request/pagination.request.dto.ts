import { IsOptional, IsInt, Min, Max } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class CursorPaginationRequestDto {
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) =>
    value !== undefined ? Number(value) : undefined,
  )
  @IsInt()
  @Min(1)
  cursor?: number

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => {
    const num = value !== undefined ? Number(value) : 10
    return Math.min(num, 10)
  })
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number
}