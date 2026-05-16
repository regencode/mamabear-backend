export class AddToCartDto {
  productId: number;
  variantId?: number;
  quantity?: number = 1;
}
