import { syncImages } from './image.util';

function createMockTx(existingImages: any[] = []) {
  const images = [...existingImages];
  const operations: string[] = [];

  const tx = {
    image: {
      findMany: jest.fn(async ({ where, orderBy }) => {
        const fkField = Object.keys(where)[0];
        const fkId = where[fkField];
        return images
          .filter((img) => img[fkField] === fkId)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      }),
      deleteMany: jest.fn(async ({ where }) => {
        const idsToDelete = where.id.in;
        const deleted = images.filter((img) => idsToDelete.includes(img.id));
        idsToDelete.forEach((id: number) => {
          const idx = images.findIndex((img) => img.id === id);
          if (idx !== -1) images.splice(idx, 1);
        });
        operations.push(
          `deleteMany:[${deleted.map((d) => d.publicId).join(',')}]`,
        );
        return { count: deleted.length };
      }),
      upsert: jest.fn(async ({ where, update, create }) => {
        const existing = images.find((img) => img.publicId === where.publicId);
        if (existing) {
          Object.assign(existing, update);
          operations.push(`update:${where.publicId}`);
          return existing;
        }
        const newImg = { id: images.length + 100, ...create };
        images.push(newImg);
        operations.push(`create:${where.publicId}`);
        return newImg;
      }),
    },
    _images: images,
    _operations: operations,
  };

  return tx;
}

describe('syncImages', () => {
  it('should create new images when none exist', async () => {
    const tx = createMockTx();
    const incoming = [
      {
        imageUrl: 'https://example.com/a.jpg',
        publicId: 'img-a',
        sortOrder: 0,
        altText: 'Image A',
      },
      {
        imageUrl: 'https://example.com/b.jpg',
        publicId: 'img-b',
        sortOrder: 1,
        altText: 'Image B',
      },
    ];

    const result = await syncImages(tx as any, 'productId', 1, incoming);

    expect(tx.image.upsert).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0].publicId).toBe('img-a');
    expect(result[1].publicId).toBe('img-b');
  });

  it('should delete images not present in incoming array', async () => {
    const tx = createMockTx([
      {
        id: 1,
        publicId: 'img-a',
        productId: 1,
        imageUrl: 'https://example.com/a.jpg',
        sortOrder: 0,
        altText: null,
        width: null,
        height: null,
        fileSize: null,
        format: null,
      },
      {
        id: 2,
        publicId: 'img-b',
        productId: 1,
        imageUrl: 'https://example.com/b.jpg',
        sortOrder: 1,
        altText: null,
        width: null,
        height: null,
        fileSize: null,
        format: null,
      },
    ]);

    const incoming = [
      {
        imageUrl: 'https://example.com/a-updated.jpg',
        publicId: 'img-a',
        sortOrder: 0,
      },
    ];

    const result = await syncImages(tx as any, 'productId', 1, incoming);

    expect(tx.image.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [2] } },
    });
    expect(result).toHaveLength(1);
    expect(result[0].publicId).toBe('img-a');
  });

  it('should delete all images when incoming is empty', async () => {
    const tx = createMockTx([
      {
        id: 1,
        publicId: 'img-a',
        productId: 1,
        imageUrl: 'https://example.com/a.jpg',
        sortOrder: 0,
        altText: null,
        width: null,
        height: null,
        fileSize: null,
        format: null,
      },
      {
        id: 2,
        publicId: 'img-b',
        productId: 1,
        imageUrl: 'https://example.com/b.jpg',
        sortOrder: 1,
        altText: null,
        width: null,
        height: null,
        fileSize: null,
        format: null,
      },
    ]);

    const result = await syncImages(tx as any, 'productId', 1, []);

    expect(tx.image.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] } },
    });
    expect(tx.image.upsert).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });

  it('should update all fields on existing images', async () => {
    const tx = createMockTx([
      {
        id: 1,
        publicId: 'img-a',
        productId: 1,
        imageUrl: 'https://example.com/old.jpg',
        sortOrder: 0,
        altText: 'Old alt',
        width: 100,
        height: 100,
        fileSize: 5000,
        format: 'jpg',
      },
    ]);

    const incoming = [
      {
        imageUrl: 'https://example.com/new.jpg',
        publicId: 'img-a',
        sortOrder: 2,
        altText: 'New alt',
        width: 200,
        height: 200,
        fileSize: 10000,
        format: 'webp',
      },
    ];

    await syncImages(tx as any, 'productId', 1, incoming);

    expect(tx.image.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicId: 'img-a' },
        update: expect.objectContaining({
          imageUrl: 'https://example.com/new.jpg',
          sortOrder: 2,
          altText: 'New alt',
          width: 200,
          height: 200,
          fileSize: 10000,
          format: 'webp',
          productId: 1,
        }),
      }),
    );
  });

  it('should set sortOrder to array index when sortOrder is not provided', async () => {
    const tx = createMockTx();

    const incoming = [
      { imageUrl: 'https://example.com/a.jpg', publicId: 'img-a' },
      { imageUrl: 'https://example.com/b.jpg', publicId: 'img-b' },
      { imageUrl: 'https://example.com/c.jpg', publicId: 'img-c' },
    ];

    await syncImages(tx as any, 'productId', 1, incoming);

    expect(tx.image.upsert).toHaveBeenCalledTimes(3);
    const calls = tx.image.upsert.mock.calls;
    expect(calls[0][0].create.sortOrder).toBe(0);
    expect(calls[1][0].create.sortOrder).toBe(1);
    expect(calls[2][0].create.sortOrder).toBe(2);
  });

  it('should respect explicit sortOrder when provided', async () => {
    const tx = createMockTx();

    const incoming = [
      {
        imageUrl: 'https://example.com/a.jpg',
        publicId: 'img-a',
        sortOrder: 5,
      },
      {
        imageUrl: 'https://example.com/b.jpg',
        publicId: 'img-b',
        sortOrder: 10,
      },
    ];

    await syncImages(tx as any, 'productId', 1, incoming);

    const calls = tx.image.upsert.mock.calls;
    expect(calls[0][0].create.sortOrder).toBe(5);
    expect(calls[1][0].create.sortOrder).toBe(10);
  });

  it('should work with variantId FK field', async () => {
    const tx = createMockTx([
      {
        id: 1,
        publicId: 'img-a',
        variantId: 5,
        imageUrl: 'https://example.com/a.jpg',
        sortOrder: 0,
        altText: null,
        width: null,
        height: null,
        fileSize: null,
        format: null,
      },
    ]);

    const incoming = [
      {
        imageUrl: 'https://example.com/b.jpg',
        publicId: 'img-b',
        sortOrder: 0,
      },
    ];

    await syncImages(tx as any, 'variantId', 5, incoming);

    expect(tx.image.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [1] } },
    });
    expect(tx.image.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ variantId: 5 }),
        update: expect.objectContaining({ variantId: 5 }),
      }),
    );
  });

  it('should work with categoryId FK field', async () => {
    const tx = createMockTx();

    const incoming = [
      {
        imageUrl: 'https://example.com/cat.jpg',
        publicId: 'img-cat',
        sortOrder: 0,
      },
    ];

    await syncImages(tx as any, 'categoryId', 3, incoming);

    expect(tx.image.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ categoryId: 3 }),
        update: expect.objectContaining({ categoryId: 3 }),
      }),
    );
  });

  it('should handle mix of new, updated, and deleted images', async () => {
    const tx = createMockTx([
      {
        id: 1,
        publicId: 'img-a',
        productId: 1,
        imageUrl: 'https://example.com/a.jpg',
        sortOrder: 0,
        altText: 'Keep',
        width: null,
        height: null,
        fileSize: null,
        format: null,
      },
      {
        id: 2,
        publicId: 'img-b',
        productId: 1,
        imageUrl: 'https://example.com/b.jpg',
        sortOrder: 1,
        altText: 'Remove',
        width: null,
        height: null,
        fileSize: null,
        format: null,
      },
    ]);

    const incoming = [
      {
        imageUrl: 'https://example.com/a-updated.jpg',
        publicId: 'img-a',
        sortOrder: 1,
        altText: 'Updated A',
      },
      {
        imageUrl: 'https://example.com/c.jpg',
        publicId: 'img-c',
        sortOrder: 0,
        altText: 'New C',
      },
    ];

    const result = await syncImages(tx as any, 'productId', 1, incoming);

    expect(tx.image.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [2] } },
    });
    expect(tx.image.upsert).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result.map((r: any) => r.publicId)).toEqual(['img-c', 'img-a']);
  });

  it('should return images ordered by sortOrder ascending', async () => {
    const tx = createMockTx();

    const incoming = [
      {
        imageUrl: 'https://example.com/c.jpg',
        publicId: 'img-c',
        sortOrder: 2,
      },
      {
        imageUrl: 'https://example.com/a.jpg',
        publicId: 'img-a',
        sortOrder: 0,
      },
      {
        imageUrl: 'https://example.com/b.jpg',
        publicId: 'img-b',
        sortOrder: 1,
      },
    ];

    const result = await syncImages(tx as any, 'productId', 1, incoming);

    expect(result[0].sortOrder).toBe(0);
    expect(result[1].sortOrder).toBe(1);
    expect(result[2].sortOrder).toBe(2);
  });
});
