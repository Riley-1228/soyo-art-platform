export type ArtworkStatus =
  | "available"
  | "reserved"
  | "sold";

export type BackendArtwork = {
  id: string;
  title: string;
  artist: string;
  price: string;
  status: ArtworkStatus;
};

export const artworks: BackendArtwork[] = [
  {
    id: "quiet-mountains",
    title: "Quiet Mountains",
    artist: "Preview Artist 01",
    price: "₩1,200,000",
    status: "available",
  },
  {
    id: "soft-figure",
    title: "Soft Figure",
    artist: "Preview Artist 02",
    price: "₩980,000",
    status: "available",
  },
  {
    id: "material-fragment",
    title: "Material Fragment",
    artist: "Preview Artist 03",
    price: "₩760,000",
    status: "reserved",
  },
  {
    id: "mended-vessel",
    title: "Mended Vessel",
    artist: "Preview Artist 04",
    price: "₩640,000",
    status: "sold",
  },
];