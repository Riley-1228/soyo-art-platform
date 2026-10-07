export type Artwork = {
  id: string;
  title: string;
  artist: string;
  location: string;
  price: string;
  image: string;
  category: string;
  edition: string;
};

export type ExhibitionRoom = {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  note: string;
};

export const artworks: Artwork[] = [
  {
    id: "quiet-mountains",
    title: "Quiet Mountains",
    artist: "Preview Artist 01",
    location: "Hangzhou, China",
    price: "₩1,200,000",
    image: "/images/works/work-01.jpg",
    category: "Painting",
    edition: "Unique",
  },
  {
    id: "soft-figure",
    title: "Soft Figure",
    artist: "Preview Artist 02",
    location: "Shanghai, China",
    price: "₩980,000",
    image: "/images/works/work-02.jpg",
    category: "Painting",
    edition: "Unique",
  },
  {
    id: "material-fragment",
    title: "Material Fragment",
    artist: "Preview Artist 03",
    location: "Beijing, China",
    price: "₩760,000",
    image: "/images/works/work-03.jpg",
    category: "Mixed Media",
    edition: "Edition 1/8",
  },
  {
    id: "mended-vessel",
    title: "Mended Vessel",
    artist: "Preview Artist 04",
    location: "Jingdezhen, China",
    price: "₩640,000",
    image: "/images/works/work-04.jpg",
    category: "Ceramic Object",
    edition: "Unique",
  },
];

export const rooms: ExhibitionRoom[] = [
  {
    id: "new-voices",
    number: "01",
    title: "New Voices",
    description: "새로운 세대의 창작자를 발견하는 전시",
    image: "/images/rooms/room-01-new-voices.jpg",
    note: "Painting · New generation",
  },
  {
    id: "material-dialogues",
    number: "02",
    title: "Material Dialogues",
    description: "재료와 손의 흔적을 중심으로 보는 전시",
    image: "/images/rooms/room-02-material-dialogues.jpg",
    note: "Material · Process · Craft",
  },
  {
    id: "everyday-poetics",
    number: "03",
    title: "Everyday Poetics",
    description: "일상의 형태를 다시 바라보는 전시",
    image: "/images/rooms/room-03-everyday-poetics.jpg",
    note: "Object · Everyday form",
  },
  {
    id: "between-worlds",
    number: "04",
    title: "Between Worlds",
    description: "서로 다른 문화와 감각이 만나는 전시",
    image: "/images/rooms/room-04-between-worlds.jpg",
    note: "Cross-cultural · Contemporary",
  },
];

export const artists = [
  {
    id: "preview-artist-01",
    name: "Preview Artist 01",
    location: "Hangzhou, China",
    discipline: "Painting",
    image: "/images/artists/featured-artist.jpg",
    statement: "Material, light and the marks left by the hand.",
  },
  {
    id: "preview-artist-02",
    name: "Preview Artist 02",
    location: "Shanghai, China",
    discipline: "Painting & Mixed Media",
    image: "/images/works/work-02.jpg",
    statement: "Quiet figurative work shaped by texture and atmosphere.",
  },
  {
    id: "preview-artist-03",
    name: "Preview Artist 03",
    location: "Beijing, China",
    discipline: "Material Practice",
    image: "/images/process/process-02-material.jpg",
    statement: "Surfaces become records of making, repair and time.",
  },
  {
    id: "preview-artist-04",
    name: "Preview Artist 04",
    location: "Jingdezhen, China",
    discipline: "Ceramic Object",
    image: "/images/process/process-03-final-work.jpg",
    statement: "Hand-built objects where imperfection becomes identity.",
  },
];
