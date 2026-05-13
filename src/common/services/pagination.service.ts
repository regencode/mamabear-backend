import { Injectable } from '@nestjs/common'
import { CursorPaginationRequestDto } from '../dto/request/pagination.request.dto'
import {
  CursorPaginationResponseDto,
  CursorPaginationMetaDto,
} from '../dto/response/pagination.response.dto'

interface ICursorPaginationOptions {
  cursorField?: string
  orderDirection?: 'asc' | 'desc'
}

@Injectable()
export class CursorPaginationService {
  async paginate<T extends Record<string, any>>(
    model: { findMany: Function },
    paginationDto: CursorPaginationRequestDto,
    args: any = {},
    options?: ICursorPaginationOptions,
  ): Promise<CursorPaginationResponseDto<T>> {
    const { cursor, limit } = paginationDto
    const safeLimit = limit ?? 10
    const cursorField = options?.cursorField ?? 'id'
    const orderDirection = options?.orderDirection ?? 'asc'

    const orderBy = {
      [cursorField]: orderDirection,
    }

    const prismaCursor =
      cursor !== undefined ? { [cursorField]: cursor } : undefined

    // ✅ FIXED: Hanya pass argument yang valid untuk Prisma
    // Hapus cursorField dan orderDirection - bukan argument Prisma!
    const items: T[] = await model.findMany({
      ...args,
      take: safeLimit + 1,
      cursor: prismaCursor,
      skip: cursor !== undefined ? 1 : 0,
      orderBy,
    })

    let nextCursor: number | null = null
    if (items.length > safeLimit) {
      const nextItem = items.pop()
      nextCursor = nextItem?.[cursorField] ?? null
    }

    return new CursorPaginationResponseDto(
      items,
      new CursorPaginationMetaDto(safeLimit, nextCursor),
    )
  }
}