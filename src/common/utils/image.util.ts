import { Prisma } from '@/generated/prisma';

type ImageFkField = 'productId' | 'variantId' | 'categoryId';

interface ImageInput {
  imageUrl: string;
  publicId: string;
  sortOrder?: number;
  width?: number;
  height?: number;
  fileSize?: number;
  format?: string;
  altText?: string;
}

export async function syncImages(
  tx: Prisma.TransactionClient,
  fkField: ImageFkField,
  fkId: number,
  incoming: ImageInput[],
) {
  const current = await tx.image.findMany({
    where: { [fkField]: fkId },
  });

  const incomingPublicIds = new Set(incoming.map((img) => img.publicId));
  const idsToDelete = current
    .filter((img) => !incomingPublicIds.has(img.publicId))
    .map((img) => img.id);

  if (idsToDelete.length > 0) {
    await tx.image.deleteMany({ where: { id: { in: idsToDelete } } });
  }

  await Promise.all(
    incoming.map((img, index) =>
      tx.image.upsert({
        where: { publicId: img.publicId },
        update: {
          imageUrl: img.imageUrl,
          sortOrder: img.sortOrder ?? index,
          altText: img.altText ?? null,
          width: img.width ?? null,
          height: img.height ?? null,
          fileSize: img.fileSize ?? null,
          format: img.format ?? null,
          [fkField]: fkId,
        },
        create: {
          imageUrl: img.imageUrl,
          publicId: img.publicId,
          sortOrder: img.sortOrder ?? index,
          altText: img.altText ?? null,
          width: img.width ?? null,
          height: img.height ?? null,
          fileSize: img.fileSize ?? null,
          format: img.format ?? null,
          [fkField]: fkId,
        },
      }),
    ),
  );

  return tx.image.findMany({
    where: { [fkField]: fkId },
    orderBy: { sortOrder: 'asc' },
  });
}
