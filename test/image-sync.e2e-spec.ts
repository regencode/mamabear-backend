import request from 'supertest';

const BASE = 'http://localhost:3000/api';
const runId = Date.now();

const state = {
  token: '',
  productId: 0,
  variantId: 0,
  categoryId: 0,
};

const authHeader = () => ({ Authorization: `Bearer ${state.token}` });

const IMG_A = {
  imageUrl: `https://example.com/e2e-a-${runId}.jpg`,
  publicId: `e2e-img-a-${runId}`,
  sortOrder: 0,
  altText: 'Image A',
  width: 800,
  height: 600,
  fileSize: 30000,
  format: 'jpg',
};

const IMG_B = {
  imageUrl: `https://example.com/e2e-b-${runId}.jpg`,
  publicId: `e2e-img-b-${runId}`,
  sortOrder: 1,
  altText: 'Image B',
  width: 800,
  height: 600,
  fileSize: 35000,
  format: 'jpg',
};

const IMG_C = {
  imageUrl: `https://example.com/e2e-c-${runId}.jpg`,
  publicId: `e2e-img-c-${runId}`,
  sortOrder: 0,
  altText: 'Image C',
  width: 600,
  height: 400,
  fileSize: 20000,
  format: 'jpg',
};

describe('Image Sync E2E', () => {
  describe('Auth', () => {
    it('POST /auth/login — admin login', async () => {
      const res = await request(BASE)
        .post('/auth/login')
        .send({ email: 'admin@mamabear.id', password: 'admin' })
        .expect(201);

      expect(res.body.success).toBe(true);
      state.token = res.body.data.accessToken;
    });
  });

  describe('Setup — create entities without images', () => {
    it('POST /admin/products — create product', async () => {
      const res = await request(BASE)
        .post('/admin/products')
        .set(authHeader())
        .send({
          name: `ImageSync Product ${runId}`,
          description: 'E2E image sync test',
          weightG: 100,
          priceIdr: 50000,
          stock: 10,
          sku: `E2E-IMG-${runId}`,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      state.productId = res.body.data.id;
    });

    it('POST /admin/products/:id/variants — create variant', async () => {
      const res = await request(BASE)
        .post(`/admin/products/${state.productId}/variants`)
        .set(authHeader())
        .send({
          name: `ImageSync Variant ${runId}`,
          priceIdr: 50000,
          weightG: 100,
          sku: `E2E-IMG-VAR-${runId}`,
          stock: 10,
          sortOrder: 1,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      state.variantId = res.body.data.id;
    });

    it('POST /admin/categories — create category', async () => {
      const res = await request(BASE)
        .post('/admin/categories')
        .set(authHeader())
        .send({
          name: `ImageSync Category ${runId}`,
          description: 'E2E image sync test',
          sortOrder: 199,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      state.categoryId = res.body.data.id;
    });
  });

  describe('Product — image sync', () => {
    it('PUT /admin/products/:id — add 2 images', async () => {
      const res = await request(BASE)
        .put(`/admin/products/${state.productId}`)
        .set(authHeader())
        .send({ images: [IMG_A, IMG_B] })
        .expect(200);

      expect(res.body.success).toBe(true);
      const imgs = res.body.data.images;
      expect(imgs).toHaveLength(2);
      expect(imgs[0].publicId).toBe(IMG_A.publicId);
      expect(imgs[1].publicId).toBe(IMG_B.publicId);
      expect(imgs[0].sortOrder).toBe(0);
      expect(imgs[1].sortOrder).toBe(1);
    });

    it('PUT /admin/products/:id — reorder images (swap)', async () => {
      const res = await request(BASE)
        .put(`/admin/products/${state.productId}`)
        .set(authHeader())
        .send({
          images: [
            { ...IMG_B, sortOrder: 0 },
            { ...IMG_A, sortOrder: 1 },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      const imgs = res.body.data.images;
      expect(imgs).toHaveLength(2);
      expect(imgs[0].publicId).toBe(IMG_B.publicId);
      expect(imgs[0].sortOrder).toBe(0);
      expect(imgs[1].publicId).toBe(IMG_A.publicId);
      expect(imgs[1].sortOrder).toBe(1);
    });

    it('PUT /admin/products/:id — remove one image', async () => {
      const res = await request(BASE)
        .put(`/admin/products/${state.productId}`)
        .set(authHeader())
        .send({ images: [IMG_B] })
        .expect(200);

      expect(res.body.success).toBe(true);
      const imgs = res.body.data.images;
      expect(imgs).toHaveLength(1);
      expect(imgs[0].publicId).toBe(IMG_B.publicId);
    });

    it('PUT /admin/products/:id — update image fields', async () => {
      const res = await request(BASE)
        .put(`/admin/products/${state.productId}`)
        .set(authHeader())
        .send({
          images: [
            {
              ...IMG_B,
              imageUrl: 'https://example.com/updated-b.jpg',
              altText: 'Updated B',
            },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      const img = res.body.data.images[0];
      expect(img.imageUrl).toBe('https://example.com/updated-b.jpg');
      expect(img.altText).toBe('Updated B');
    });

    it('PUT /admin/products/:id — delete all images with empty array', async () => {
      const res = await request(BASE)
        .put(`/admin/products/${state.productId}`)
        .set(authHeader())
        .send({ images: [] })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.images).toHaveLength(0);
    });

    it('PUT /admin/products/:id — omitting images does not resurrect deleted images', async () => {
      const res = await request(BASE)
        .put(`/admin/products/${state.productId}`)
        .set(authHeader())
        .send({ name: `Still No Images ${runId}` })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.images).toHaveLength(0);
    });
  });

  describe('Variant — image sync', () => {
    it('PUT /admin/products/variants/:id — add 1 image', async () => {
      const res = await request(BASE)
        .put(`/admin/products/variants/${state.variantId}`)
        .set(authHeader())
        .send({ images: [IMG_C] })
        .expect(200);

      expect(res.body.success).toBe(true);
      const imgs = res.body.data.images;
      expect(imgs).toHaveLength(1);
      expect(imgs[0].publicId).toBe(IMG_C.publicId);
    });

    it('PUT /admin/products/variants/:id — add a second image and reorder', async () => {
      const variantImgD = {
        imageUrl: `https://example.com/e2e-d-${runId}.jpg`,
        publicId: `e2e-img-d-${runId}`,
        sortOrder: 0,
        altText: 'Image D',
      };

      const res = await request(BASE)
        .put(`/admin/products/variants/${state.variantId}`)
        .set(authHeader())
        .send({
          images: [
            variantImgD,
            { ...IMG_C, sortOrder: 1 },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      const imgs = res.body.data.images;
      expect(imgs).toHaveLength(2);
      expect(imgs[0].publicId).toBe(variantImgD.publicId);
      expect(imgs[0].sortOrder).toBe(0);
      expect(imgs[1].publicId).toBe(IMG_C.publicId);
      expect(imgs[1].sortOrder).toBe(1);
    });

    it('PUT /admin/products/variants/:id — delete all images with empty array', async () => {
      const res = await request(BASE)
        .put(`/admin/products/variants/${state.variantId}`)
        .set(authHeader())
        .send({ images: [] })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.images).toHaveLength(0);
    });

    it('PUT /admin/products/variants/:id — update name without images key (no-op)', async () => {
      const res = await request(BASE)
        .put(`/admin/products/variants/${state.variantId}`)
        .set(authHeader())
        .send({ name: `Still No Images Variant ${runId}` })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.images).toHaveLength(0);
    });
  });

  describe('Category — image sync', () => {
    it('PUT /admin/categories/:id — add 2 images', async () => {
      const catImgA = {
        imageUrl: `https://example.com/cat-a-${runId}.jpg`,
        publicId: `e2e-cat-a-${runId}`,
        sortOrder: 0,
        altText: 'Cat Image A',
      };
      const catImgB = {
        imageUrl: `https://example.com/cat-b-${runId}.jpg`,
        publicId: `e2e-cat-b-${runId}`,
        sortOrder: 1,
        altText: 'Cat Image B',
      };

      const res = await request(BASE)
        .put(`/admin/categories/${state.categoryId}`)
        .set(authHeader())
        .send({ images: [catImgA, catImgB] })
        .expect(200);

      expect(res.body.success).toBe(true);
      const imgs = res.body.data.images;
      expect(imgs).toHaveLength(2);
      expect(imgs[0].publicId).toBe(catImgA.publicId);
      expect(imgs[1].publicId).toBe(catImgB.publicId);

      state['catImgA'] = catImgA;
      state['catImgB'] = catImgB;
    });

    it('PUT /admin/categories/:id — reorder and update fields', async () => {
      const res = await request(BASE)
        .put(`/admin/categories/${state.categoryId}`)
        .set(authHeader())
        .send({
          images: [
            {
              ...state['catImgB'] as any,
              sortOrder: 0,
              altText: 'Reordered Cat B',
            },
            {
              ...state['catImgA'] as any,
              sortOrder: 1,
              altText: 'Reordered Cat A',
            },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      const imgs = res.body.data.images;
      expect(imgs).toHaveLength(2);
      expect(imgs[0].publicId).toBe((state['catImgB'] as any).publicId);
      expect(imgs[0].sortOrder).toBe(0);
      expect(imgs[0].altText).toBe('Reordered Cat B');
      expect(imgs[1].publicId).toBe((state['catImgA'] as any).publicId);
      expect(imgs[1].sortOrder).toBe(1);
    });

    it('PUT /admin/categories/:id — remove one image', async () => {
      const res = await request(BASE)
        .put(`/admin/categories/${state.categoryId}`)
        .set(authHeader())
        .send({ images: [state['catImgB'] as any] })
        .expect(200);

      expect(res.body.success).toBe(true);
      const imgs = res.body.data.images;
      expect(imgs).toHaveLength(1);
      expect(imgs[0].publicId).toBe((state['catImgB'] as any).publicId);
    });

    it('PUT /admin/categories/:id — delete all images with empty array', async () => {
      const res = await request(BASE)
        .put(`/admin/categories/${state.categoryId}`)
        .set(authHeader())
        .send({ images: [] })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.images).toHaveLength(0);
    });

    it('PUT /admin/categories/:id — update name without images key (no-op)', async () => {
      const res = await request(BASE)
        .put(`/admin/categories/${state.categoryId}`)
        .set(authHeader())
        .send({ name: `Still No Images Category ${runId}` })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.images).toHaveLength(0);
    });
  });

  describe('Cleanup', () => {
    it('DELETE /admin/products/variants/:id', async () => {
      const res = await request(BASE)
        .delete(`/admin/products/variants/${state.variantId}`)
        .set(authHeader())
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('DELETE /admin/products/:id', async () => {
      const res = await request(BASE)
        .delete(`/admin/products/${state.productId}`)
        .set(authHeader());

      expect([200, 409]).toContain(res.status);
    });

    it('DELETE /admin/categories/:id', async () => {
      const res = await request(BASE)
        .delete(`/admin/categories/${state.categoryId}`)
        .set(authHeader())
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
