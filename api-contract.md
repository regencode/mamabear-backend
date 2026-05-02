# MamaBear API Contract

Base URL: `http://localhost:3000`

## Shared Types

### Role (enum)

| Value |
|-------|
| USER  |
| ADMIN |

### Error Response

```json
{
  "statusCode": "number",
  "message": "string | string[]",
  "error": "string"
}
```

---

## Auth

### POST /auth/login

**Request**

```json
{
  "email": "string (valid email)",
  "password": "string"
}
```

**Response** `200`

```json
{
  "access_token": "string (JWT)",
  "refresh_token": "string (JWT)"
}
```

---

### POST /auth/register

**Request**

```json
{
  "email": "string (valid email)",
  "password": "string (8-24 chars)",
  "name": "string",
  "phone": "string (numeric string)"
}
```

**Response** `201`

```json
{
  "id": "string (UUID)",
  "email": "string",
  "name": "string",
  "phone": "string",
  "role": "USER",
  "isVerified": false,
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime) | null"
}
```

---

### POST /auth/logout

Coming soon!

### POST /auth/refresh

Coming soon!

### POST /auth/forgot-password

Coming soon!

### POST /auth/reset-password/:access_token

Coming soon!

### GET /auth/verify-email/:token

Coming soon!

## Users

### POST /users

**Request**

```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "phone": "string",
  "role": "USER | ADMIN (optional, default: USER)",
  "isVerified": "boolean (optional, default: false)"
}
```

**Response** `201`

```json
{
  "id": "string (UUID)",
  "email": "string",
  "name": "string",
  "phone": "string",
  "role": "USER | ADMIN",
  "isVerified": "boolean",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime) | null"
}
```

---

### GET /users

**Request** — no body

**Response** `200`

```json
[
  {
    "id": "string (UUID)",
    "email": "string",
    "name": "string",
    "phone": "string",
    "role": "USER | ADMIN",
    "isVerified": "boolean",
    "createdAt": "string (ISO 8601 datetime)",
    "updatedAt": "string (ISO 8601 datetime) | null"
  }
]
```

---

### GET /users/:id

**Request** — no body

| Param | Type        |
|-------|-------------|
| id    | string (UUID) |

**Response** `200`

```json
{
  "id": "string (UUID)",
  "email": "string",
  "name": "string",
  "phone": "string",
  "role": "USER | ADMIN",
  "isVerified": "boolean",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime) | null"
}
```

**Error** `404`

```json
{
  "statusCode": 404,
  "message": "User with id <id> not found",
  "error": "Not Found"
}
```

---

### PATCH /users/:id

**Request**

| Param | Type        |
|-------|-------------|
| id    | string (UUID) |

```json
{
  "email": "string (optional)",
  "password": "string (optional)",
  "name": "string (optional)",
  "phone": "string (optional)",
  "role": "USER | ADMIN (optional)",
  "isVerified": "boolean (optional)"
}
```

**Response** `200`

```json
{
  "id": "string (UUID)",
  "email": "string",
  "name": "string",
  "phone": "string",
  "role": "USER | ADMIN",
  "isVerified": "boolean",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime) | null"
}
```

---

### DELETE /users/:id

**Request** — no body

| Param | Type        |
|-------|-------------|
| id    | string (UUID) |

**Response** `200`

```json
{
  "id": "string (UUID)",
  "email": "string",
  "name": "string",
  "phone": "string",
  "role": "USER | ADMIN",
  "isVerified": "boolean",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime) | null"
}
```

---

## Products

### Category (nested object)

```json
{
  "id": "number",
  "name": "string"
}
```

### ProductImage (nested object)

```json
{
  "id": "number",
  "productId": "number",
  "imageUrl": "string",
  "sortOrder": "number",
  "altText": "string | null"
}
```

### ProductVariant (nested object)

```json
{
  "id": "number",
  "productId": "number",
  "name": "string",
  "price_idr": "string (decimal)",
  "stock": "number"
}
```

---

### GET /products

**Request** — no body

**Response** `200`

```json
[
  {
    "id": "number",
    "name": "string",
    "slug": "string",
    "description": "string",
    "price_idr": "string (decimal, e.g. \"185000.00\")",
    "weight_g": "number",
    "sku": "string | null",
    "stock": "number",
    "isActive": "boolean",
    "createdAt": "string (ISO 8601 datetime)",
    "updatedAt": "string (ISO 8601 datetime) | null",
    "categoryId": "number | null",
    "category": "Category | null",
    "images": "ProductImage[]",
    "variants": "ProductVariant[]"
  }
]
```

---

### GET /products/:id

**Request** — no body

| Param | Type   |
|-------|--------|
| id    | number |

**Response** `200`

```json
{
  "id": "number",
  "name": "string",
  "slug": "string",
  "description": "string",
  "price_idr": "string (decimal, e.g. \"185000.00\")",
  "weight_g": "number",
  "sku": "string | null",
  "stock": "number",
  "isActive": "boolean",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime) | null",
  "categoryId": "number | null",
  "category": "Category | null",
  "images": "ProductImage[]",
  "variants": "ProductVariant[]"
}
```

**Error** `404`

```json
{
  "statusCode": 404,
  "message": "Product with id <id> not found",
  "error": "Not Found"
}
```

---

### POST /products

_Admin only_

**Request**

```json
{
  "name": "string",
  "description": "string",
  "weight_g": "number",
  "price_idr": "number",
  "stock": "number (optional, default: 0)",
  "isActive": "boolean (optional, default: true)",
  "sku": "string (optional)"
}
```

**Response** `201`

```json
{
  "id": "number",
  "name": "string",
  "slug": "string",
  "description": "string",
  "price_idr": "string (decimal)",
  "weight_g": "number",
  "sku": "string | null",
  "stock": "number",
  "isActive": "boolean",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime) | null",
  "categoryId": "number | null",
  "category": "Category | null",
  "images": "ProductImage[]",
  "variants": "ProductVariant[]"
}
```

---

### PUT /products/:id

_Admin only_

**Request**

| Param | Type   |
|-------|--------|
| id    | number |

```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "weight_g": "number (optional)",
  "price_idr": "number (optional)",
  "stock": "number (optional)",
  "isActive": "boolean (optional)",
  "sku": "string (optional)"
}
```

**Response** `200`

```json
{
  "id": "number",
  "name": "string",
  "slug": "string",
  "description": "string",
  "price_idr": "string (decimal)",
  "weight_g": "number",
  "sku": "string | null",
  "stock": "number",
  "isActive": "boolean",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime) | null",
  "categoryId": "number | null",
  "category": "Category | null",
  "images": "ProductImage[]",
  "variants": "ProductVariant[]"
}
```

---

### DELETE /products/:id

_Admin only_

**Request** — no body

| Param | Type   |
|-------|--------|
| id    | number |

**Response** `200`

```json
{
  "id": "number",
  "name": "string",
  "slug": "string",
  "description": "string",
  "price_idr": "string (decimal)",
  "weight_g": "number",
  "sku": "string | null",
  "stock": "number",
  "isActive": "boolean",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime) | null",
  "categoryId": "number | null",
  "category": "Category | null",
  "images": "ProductImage[]",
  "variants": "ProductVariant[]"
}
```
