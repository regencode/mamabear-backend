const PLACEHOLDER_HASH =
  "$2b$10$placeholderhashplaceholderhashplaceholderha";

export const users = [
  {
    email: "admin@mamabear.id",
    hashedPassword: PLACEHOLDER_HASH,
    name: "Admin MamaBear",
    phone: "081200001111",
    role: "ADMIN" as const,
    isVerified: true,
  },
  {
    email: "siti.rahayu@email.com",
    hashedPassword: PLACEHOLDER_HASH,
    name: "Siti Rahayu",
    phone: "081234567890",
    role: "USER" as const,
    isVerified: true,
  },
  {
    email: "dewi.lestari@email.com",
    hashedPassword: PLACEHOLDER_HASH,
    name: "Dewi Lestari",
    phone: "081298765432",
    role: "USER" as const,
    isVerified: true,
  },
  {
    email: "rina.wati@email.com",
    hashedPassword: PLACEHOLDER_HASH,
    name: "Rina Wati",
    phone: "082112345678",
    role: "USER" as const,
    isVerified: false,
  },
  {
    email: "budi.santoso@email.com",
    hashedPassword: PLACEHOLDER_HASH,
    name: "Budi Santoso",
    phone: "085678901234",
    role: "USER" as const,
    isVerified: true,
  },
];

export const products = [
  {
    name: "S-26 Procal Gold 3",
    slug: "",
    description:
      "Growing-up formula for children aged 1-3 years, enriched with nucleotides and carotenoids.",
    price_idr: 185000,
    weight_g: 900,
    sku: "S26-PROCAL-3-900",
    stock: 50,
    isActive: true,
  },
  {
    name: "Nutrilon Royal 2",
    slug: "",
    description:
      "Follow-on formula for infants aged 6-12 months with Pronutra+ advancing immunity.",
    price_idr: 210000,
    weight_g: 800,
    sku: "NUTRI-R2-800",
    stock: 35,
    isActive: true,
  },
  {
    name: "Bebelac Gold 3",
    slug: "",
    description:
      "Growing-up milk for toddlers 1-3 years with Combiotic+ for easy digestion.",
    price_idr: 175000,
    weight_g: 900,
    sku: "BEBE-G3-900",
    stock: 40,
    isActive: true,
  },
  {
    name: "SGM Eksplor 3+",
    slug: "",
    description:
      "Growing-up milk for children aged 3-5 years, fortified with iron and vitamin C.",
    price_idr: 95000,
    weight_g: 800,
    sku: "SGM-E3-800",
    stock: 60,
    isActive: true,
  },
  {
    name: "Frisian Flag Jelajah 1+",
    slug: "",
    description:
      "Milk for toddlers aged 1-3 years with essential nutrients for growth and development.",
    price_idr: 82000,
    weight_g: 800,
    sku: "FF-J1-800",
    stock: 55,
    isActive: true,
  },
  {
    name: "Morinaga Chil Kid Platinum 3",
    slug: "",
    description:
      "Growing-up formula for children 1-3 years with triple care: brain, immunity, and growth.",
    price_idr: 195000,
    weight_g: 800,
    sku: "MORI-CKP3-800",
    stock: 30,
    isActive: true,
  },
  {
    name: "Lactamil Pregnasis",
    slug: "",
    description:
      "Nutritional milk for pregnant mothers with DHA, folate, and high calcium.",
    price_idr: 72000,
    weight_g: 400,
    sku: "LAC-PREG-400",
    stock: 45,
    isActive: true,
  },
  {
    name: "Lactamil Lactamom",
    slug: "",
    description:
      "Nutritional milk for breastfeeding mothers to support milk production and quality.",
    price_idr: 78000,
    weight_g: 400,
    sku: "LAC-MOM-400",
    stock: 45,
    isActive: true,
  },
  {
    name: "Promina Bubur Bayi Sereal Beras Merah",
    slug: "",
    description:
      "Baby cereal with red rice for infants 6+ months, iron-fortified and easy to digest.",
    price_idr: 35000,
    weight_g: 120,
    sku: "PROM-BR-120",
    stock: 80,
    isActive: true,
  },
  {
    name: "S-26 Promise Gold 4",
    slug: "",
    description:
      "School-age formula for children 3-9 years with enhanced memory and learning support.",
    price_idr: 168000,
    weight_g: 900,
    sku: "S26-P4-900",
    stock: 25,
    isActive: true,
  },
];
