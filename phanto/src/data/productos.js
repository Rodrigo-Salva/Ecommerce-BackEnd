export const productos = [
  // SILLAS
  {
    id: 1,
    nombre: "Silla Sakarias",
    categoria: "sillas",
    precio: 392,
    rating: 5.0,
    imagen: "/assets/images/silla-sakarias.jpg",
    descripcion: "Silla moderna con diseño ergonómico que combina comodidad y estilo. Perfecta para comedores y espacios de trabajo contemporáneos.",
    caracteristicas: [
      "Diseño ergonómico para máxima comodidad",
      "Estructura resistente de madera maciza",
      "Tapizado de alta calidad",
      "Fácil de limpiar y mantener"
    ],
    materiales: "Madera de roble, tela",
    dimensiones: "45 x 50 x 85 cm",
    stock: 15
  },
  {
    id: 2,
    nombre: "Silla Nordic",
    categoria: "sillas",
    precio: 285,
    rating: 4.8,
    imagen: "/assets/images/silla-nordic.jpg",
    descripcion: "Silla de diseño escandinavo con líneas minimalistas y elegantes. Ideal para cualquier ambiente moderno.",
    caracteristicas: [
      "Diseño escandinavo minimalista",
      "Madera de haya natural",
      "Asiento acolchado confortable",
      "Patas reforzadas para mayor durabilidad"
    ],
    materiales: "Madera de haya, cuero sintético",
    dimensiones: "42 x 48 x 82 cm",
    stock: 20
  },
  {
    id: 3,
    nombre: "Silla Executive",
    categoria: "sillas",
    precio: 520,
    rating: 4.9,
    imagen: "/assets/images/silla-executive.jpg",
    descripcion: "Silla ejecutiva premium con máximo confort y soporte lumbar. Perfecta para oficinas y espacios de trabajo profesionales.",
    caracteristicas: [
      "Soporte lumbar ajustable",
      "Brazos acolchados ergonómicos",
      "Altura regulable con sistema de gas",
      "Base giratoria de 360 grados"
    ],
    materiales: "Cuero genuino, aluminio",
    dimensiones: "50 x 55 x 95 cm",
    stock: 8
  },

  // CAMAS
  {
    id: 4,
    nombre: "Cama Oslo",
    categoria: "camas",
    precio: 1890,
    rating: 4.9,
    imagen: "/assets/images/cama-oslo.jpg",
    descripcion: "Cama de diseño contemporáneo con cabecero acolchado. Elegancia y confort para tu dormitorio.",
    caracteristicas: [
      "Cabecero tapizado de lujo",
      "Base reforzada con listones de madera",
      "Diseño moderno y elegante",
      "Fácil montaje"
    ],
    materiales: "Madera maciza, tela premium",
    dimensiones: "160 x 200 x 110 cm",
    stock: 5
  },
  {
    id: 5,
    nombre: "Cama Imperial",
    categoria: "camas",
    precio: 2450,
    rating: 5.0,
    imagen: "/assets/images/cama-imperial.jpg",
    descripcion: "Cama king size con diseño majestuoso. Lujo y comodidad para un descanso incomparable.",
    caracteristicas: [
      "Tamaño king size",
      "Cabecero alto y elegante",
      "Estructura ultra resistente",
      "Acabados de primera calidad"
    ],
    materiales: "Madera noble, terciopelo",
    dimensiones: "180 x 200 x 130 cm",
    stock: 3
  },
  {
    id: 6,
    nombre: "Cama Minimal",
    categoria: "camas",
    precio: 1250,
    rating: 4.7,
    imagen: "/assets/images/cama-minimal.jpg",
    descripcion: "Cama de líneas puras y diseño minimalista. Perfecta para espacios modernos y funcionales.",
    caracteristicas: [
      "Diseño minimalista japonés",
      "Base flotante con LED opcional",
      "Estructura de bajo perfil",
      "Almacenamiento integrado"
    ],
    materiales: "Madera de nogal, metal",
    dimensiones: "140 x 190 x 35 cm",
    stock: 12
  },

  // SOFÁS
  {
    id: 7,
    nombre: "Sofá Valencia",
    categoria: "sofas",
    precio: 2890,
    rating: 4.8,
    imagen: "/assets/images/sofa-valencia.jpg",
    descripcion: "Sofá de 3 plazas con diseño contemporáneo. Comodidad excepcional para tu sala de estar.",
    caracteristicas: [
      "Asientos de espuma de alta densidad",
      "Tapizado en tela premium resistente",
      "Estructura de madera maciza",
      "Cojines desmontables y lavables"
    ],
    materiales: "Madera maciza, tela jacquard",
    dimensiones: "220 x 90 x 85 cm",
    stock: 6
  },
  {
    id: 8,
    nombre: "Sofá Modular Urban",
    categoria: "sofas",
    precio: 3450,
    rating: 4.9,
    imagen: "/assets/images/sofa-urban.jpg",
    descripcion: "Sofá modular configurable según tus necesidades. Versatilidad y estilo urbano contemporáneo.",
    caracteristicas: [
      "Configuración modular flexible",
      "Sistema de conexión fácil",
      "Respaldo ajustable",
      "Resistente a manchas"
    ],
    materiales: "Espuma viscoelástica, tela tecnológica",
    dimensiones: "280 x 95 x 80 cm",
    stock: 4
  },
  {
    id: 9,
    nombre: "Sofá Chesterfield",
    categoria: "sofas",
    precio: 4200,
    rating: 5.0,
    imagen: "/assets/images/sofa-chesterfield.jpg",
    descripcion: "Sofá clásico Chesterfield con botones capitoné. Elegancia atemporal y lujo tradicional.",
    caracteristicas: [
      "Diseño clásico británico",
      "Tapizado capitoné a mano",
      "Estructura de madera de roble",
      "Cuero genuino envejecido"
    ],
    materiales: "Cuero genuino, madera de roble",
    dimensiones: "200 x 85 x 78 cm",
    stock: 2
  },

  // LÁMPARAS
  {
    id: 10,
    nombre: "Lámpara Arc",
    categoria: "lamparas",
    precio: 420,
    rating: 4.7,
    imagen: "/assets/images/lampara-arc.jpg",
    descripcion: "Lámpara de pie con arco moderno. Iluminación ajustable para crear ambientes únicos.",
    caracteristicas: [
      "Brazo ajustable en altura",
      "Base de mármol estable",
      "Bombilla LED incluida",
      "Regulador de intensidad"
    ],
    materiales: "Acero inoxidable, mármol",
    dimensiones: "180 x 40 cm (altura ajustable)",
    stock: 15
  },
  {
    id: 11,
    nombre: "Lámpara Pendant",
    categoria: "lamparas",
    precio: 285,
    rating: 4.8,
    imagen: "/assets/images/lampara-pendant.jpg",
    descripcion: "Lámpara colgante de diseño escandinavo. Iluminación focal perfecta para mesas y barras.",
    caracteristicas: [
      "Pantalla de cristal soplado",
      "Cable textil ajustable",
      "Instalación sencilla",
      "Luz cálida difusa"
    ],
    materiales: "Cristal, latón pulido",
    dimensiones: "25 x 30 cm",
    stock: 25
  },
  {
    id: 12,
    nombre: "Lámpara Industrial",
    categoria: "lamparas",
    precio: 350,
    rating: 4.6,
    imagen: "/assets/images/lampara-industrial.jpg",
    descripcion: "Lámpara de estilo industrial vintage. Carácter único para espacios urbanos y lofts.",
    caracteristicas: [
      "Acabado metalizado envejecido",
      "Brazo articulado multidireccional",
      "Estilo loft industrial",
      "Compatible con bombillas Edison"
    ],
    materiales: "Hierro fundido, bronce",
    dimensiones: "45 x 35 cm",
    stock: 18
  },

  // MESAS
  {
    id: 13,
    nombre: "Mesa Dining Oak",
    categoria: "mesas",
    precio: 1650,
    rating: 4.9,
    imagen: "/assets/images/mesa-dining.jpg",
    descripcion: "Mesa de comedor en roble macizo. Elegancia natural para reuniones memorables.",
    caracteristicas: [
      "Madera de roble certificada",
      "Capacidad para 6-8 personas",
      "Acabado natural protegido",
      "Patas cónicas modernas"
    ],
    materiales: "Roble macizo",
    dimensiones: "180 x 90 x 75 cm",
    stock: 7
  },
  {
    id: 14,
    nombre: "Mesa Centro Glass",
    categoria: "mesas",
    precio: 580,
    rating: 4.7,
    imagen: "/assets/images/mesa-centro.jpg",
    descripcion: "Mesa de centro con tapa de cristal templado. Diseño minimalista y sofisticado.",
    caracteristicas: [
      "Cristal templado de seguridad",
      "Base de acero inoxidable",
      "Diseño ligero y transparente",
      "Fácil limpieza"
    ],
    materiales: "Cristal templado, acero",
    dimensiones: "120 x 60 x 40 cm",
    stock: 14
  },
  {
    id: 15,
    nombre: "Mesa Work Station",
    categoria: "mesas",
    precio: 890,
    rating: 4.8,
    imagen: "/assets/images/mesa-work.jpg",
    descripcion: "Mesa de trabajo profesional con espacio optimizado. Productividad y estilo para tu oficina.",
    caracteristicas: [
      "Superficie amplia de trabajo",
      "Sistema de organización de cables",
      "Estructura metálica reforzada",
      "Altura ergonómica"
    ],
    materiales: "MDF laminado, acero",
    dimensiones: "140 x 70 x 75 cm",
    stock: 10
  }
];

export const categorias = [
  {
    id: "sillas",
    nombre: "Sillas",
    descripcion: "Diseños ergonómicos y elegantes",
    imagen: "/assets/images/categoria-sillas.jpg"
  },
  {
    id: "camas",
    nombre: "Camas",
    descripcion: "Confort para tu descanso",
    imagen: "/assets/images/categoria-camas.jpg"
  },
  {
    id: "sofas",
    nombre: "Sofás",
    descripcion: "Elegancia y comodidad",
    imagen: "/assets/images/categoria-sofas.jpg"
  },
  {
    id: "lamparas",
    nombre: "Lámparas",
    descripcion: "Iluminación con estilo",
    imagen: "/assets/images/categoria-lamparas.jpg"
  },
  {
    id: "mesas",
    nombre: "Mesas",
    descripcion: "Funcionalidad y diseño",
    imagen: "/assets/images/categoria-mesas.jpg"
  }
];