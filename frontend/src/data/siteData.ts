export type ArtworkStatus =
  | "available"
  | "reserved"
  | "sold";

export type Artwork = {
  id: string;

  title: string;

  /* 작가 연결 */
  artist: string;
  artistId: string;

  location: string;

  /* 작품 기본 정보 */
  year: string;
  material: string;
  dimensions: string;
  category: string;
  edition: string;

  /* 판매 */
  price: string;
  status: ArtworkStatus;

  /* 이미지 / 설명 */
  image: string;
  description: string;

  /* 전시 연결 */
  exhibitionId: string;
};

export type ExhibitionRoom = {
  id: string;
  number: string;

  title: string;
  description: string;

  image: string;
  note: string;

  /* 상세 페이지용 */
  period: string;
  curatorialNote: string;

  /* 참여 작가 / 작품 */
  artistIds: string[];
  artworkIds: string[];
};

export type Artist = {
  id: string;

  name: string;
  location: string;
  discipline: string;

  image: string;

  statement: string;
  bio: string;
};


/* =========================================================
   ARTWORKS
   ========================================================= */

export const artworks: Artwork[] = [
  {
    id: "quiet-mountains",

    title: "Quiet Mountains",

    artist: "Preview Artist 01",
    artistId: "preview-artist-01",

    location: "Hangzhou, China",

    year: "2026",
    material: "Oil and mixed media on canvas",
    dimensions: "80 × 100 cm",
    category: "Painting",
    edition: "Unique",

    price: "₩1,200,000",
    status: "available",

    image: "/images/works/work-01.jpg",

    description:
      "A quiet landscape built through layers of light, texture and muted colour. The work explores the distance between memory and place.",

    exhibitionId: "new-voices",
  },

  {
    id: "soft-figure",

    title: "Soft Figure",

    artist: "Preview Artist 02",
    artistId: "preview-artist-02",

    location: "Shanghai, China",

    year: "2026",
    material: "Oil on canvas",
    dimensions: "72 × 92 cm",
    category: "Painting",
    edition: "Unique",

    price: "₩980,000",
    status: "available",

    image: "/images/works/work-02.jpg",

    description:
      "A figurative work shaped by soft light and restrained colour, focusing on gesture, atmosphere and the presence of the body.",

    exhibitionId: "new-voices",
  },

  {
    id: "material-fragment",

    title: "Material Fragment",

    artist: "Preview Artist 03",
    artistId: "preview-artist-03",

    location: "Beijing, China",

    year: "2026",
    material: "Mixed media",
    dimensions: "65 × 82 cm",
    category: "Mixed Media",
    edition: "Edition 1/8",

    price: "₩760,000",
    status: "reserved",

    image: "/images/works/work-03.jpg",

    description:
      "Layered surfaces and fragmented materials record the process of making, erosion and reconstruction.",

    exhibitionId: "material-dialogues",
  },

  {
    id: "mended-vessel",

    title: "Mended Vessel",

    artist: "Preview Artist 04",
    artistId: "preview-artist-04",

    location: "Jingdezhen, China",

    year: "2026",
    material: "Hand-built ceramic",
    dimensions: "28 × 28 × 34 cm",
    category: "Ceramic Object",
    edition: "Unique",

    price: "₩640,000",
    status: "sold",

    image: "/images/works/work-04.jpg",

    description:
      "A hand-built ceramic object that treats irregularity, repair and visible traces of the making process as part of the final form.",

    exhibitionId: "material-dialogues",
  },
];


/* =========================================================
   CURATED ROOMS
   ========================================================= */

export const rooms: ExhibitionRoom[] = [
  {
    id: "new-voices",
    number: "01",

    title: "New Voices",

    description:
      "새로운 세대의 창작자를 발견하는 전시",

    image:
      "/images/rooms/room-01-new-voices.jpg",

    note:
      "Painting · New generation",

    period:
      "October — November 2026",

    curatorialNote:
      "New Voices introduces emerging creators whose work reflects a new generation of perspectives, materials and visual languages.",

    artistIds: [
      "preview-artist-01",
      "preview-artist-02",
    ],

    artworkIds: [
      "quiet-mountains",
      "soft-figure",
    ],
  },

  {
    id: "material-dialogues",
    number: "02",

    title: "Material Dialogues",

    description:
      "재료와 손의 흔적을 중심으로 보는 전시",

    image:
      "/images/rooms/room-02-material-dialogues.jpg",

    note:
      "Material · Process · Craft",

    period:
      "November — December 2026",

    curatorialNote:
      "Material Dialogues considers how surfaces, objects and traces of the hand become part of an artwork's meaning.",

    artistIds: [
      "preview-artist-03",
      "preview-artist-04",
    ],

    artworkIds: [
      "material-fragment",
      "mended-vessel",
    ],
  },

  {
    id: "everyday-poetics",
    number: "03",

    title: "Everyday Poetics",

    description:
      "일상의 형태를 다시 바라보는 전시",

    image:
      "/images/rooms/room-03-everyday-poetics.jpg",

    note:
      "Object · Everyday form",

    period:
      "Coming Soon",

    curatorialNote:
      "An exploration of ordinary objects and familiar forms through the perspectives of contemporary creators.",

    artistIds: [],

    artworkIds: [],
  },

  {
    id: "between-worlds",
    number: "04",

    title: "Between Worlds",

    description:
      "서로 다른 문화와 감각이 만나는 전시",

    image:
      "/images/rooms/room-04-between-worlds.jpg",

    note:
      "Cross-cultural · Contemporary",

    period:
      "Coming Soon",

    curatorialNote:
      "Between Worlds explores works shaped by movement between cultures, places and visual traditions.",

    artistIds: [],

    artworkIds: [],
  },
];


/* =========================================================
   ARTISTS
   ========================================================= */

export const artists: Artist[] = [
  {
    id: "preview-artist-01",

    name: "Preview Artist 01",

    location: "Hangzhou, China",

    discipline: "Painting",

    image:
      "/images/artists/featured-artist.jpg",

    statement:
      "Material, light and the marks left by the hand.",

    bio:
      "Preview biography for the SOYO test exhibition. This section will later contain the artist's background, practice and selected exhibition history.",
  },

  {
    id: "preview-artist-02",

    name: "Preview Artist 02",

    location: "Shanghai, China",

    discipline:
      "Painting & Mixed Media",

    image:
      "/images/works/work-02.jpg",

    statement:
      "Quiet figurative work shaped by texture and atmosphere.",

    bio:
      "Preview biography for the SOYO test exhibition. The final version will introduce the artist's practice and creative background.",
  },

  {
    id: "preview-artist-03",

    name: "Preview Artist 03",

    location: "Beijing, China",

    discipline:
      "Material Practice",

    image:
      "/images/process/process-02-material.jpg",

    statement:
      "Surfaces become records of making, repair and time.",

    bio:
      "Preview biography for the SOYO test exhibition. This artist focuses on material, process and changes in the surface of the work.",
  },

  {
    id: "preview-artist-04",

    name: "Preview Artist 04",

    location: "Jingdezhen, China",

    discipline:
      "Ceramic Object",

    image:
      "/images/process/process-03-final-work.jpg",

    statement:
      "Hand-built objects where imperfection becomes identity.",

    bio:
      "Preview biography for the SOYO test exhibition. This section will later be replaced with the participating artist's actual profile.",
  },
];