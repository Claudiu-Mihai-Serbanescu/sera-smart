// Fallback/demo streams mapate pe sere
export const FALLBACK_CAMERAS = [
  {
    sera: "Sera Spanac",
    name: "Spanac - cam 1",
    type: "mp4",
    src: "https://dm0qx8t0i9gc9.cloudfront.net/watermarks/video/BgrICs-NZj4hksnn3/videoblocks-aerial-footage-in-a-greenhouse-with-moder-agriculture-technology-for-growing-green-salad_r7qr34uus__789bf4e34ba620421521574703463dc6__P360.mp4",
  },
  {
    sera: "Sera Spanac",
    name: "Spanac - cam 2",
    type: "mp4",
    src: "https://media.istockphoto.com/id/1359006633/ro/video/imagini-video-4k-cu-spanac-proasp%C4%83t-care-cre%C8%99te-%C3%AEntr-o-ferm%C4%83.mp4?s=mp4-640x640-is&k=20&c=rUp1EWQuDkr1I4ayYeAF_H__I560IXrByzel8N7Aztk=",
  },
  {
    sera: "Sera Rosii",
    name: "Rosii - cam 1",
    type: "mp4",
    src: "https://dm0qx8t0i9gc9.cloudfront.net/watermarks/video/rZJIMvhmliwmde8a6/videoblocks-tomato-plants-are-in-greenhouse-bucket-full-of-ripe-red-tomatoes-bio-nutrition-concept_rpd8iuewl__1d5a17a22ed05c6600a2d5543d4f062e__P360.mp4",
  },
  {
    sera: "Sera Rosii",
    name: "Rosii - cam 2",
    type: "mp4",
    src: "https://media.istockphoto.com/id/2160554367/ro/video/organic-tomatoes-growing-in-a-greenhouse.mp4?s=mp4-640x640-is&k=20&c=lzhUwxy9lJqKkQEQ3ODy__4Ez6snftbymh2-NIyoQ5k=",
  },
  {
    sera: "Sera Ardei",
    name: "Sera Ardei",
    type: "mp4",
    src: "https://media.istockphoto.com/id/1356891601/ro/video/mare-ser%C4%83-pepinier%C4%83-comercial%C4%83.mp4?s=mp4-640x640-is&k=20&c=Kq28wUPnAX3Y1FYqR2xI5tKBCYiQ5ue7Z-33YST22Eg=",
  },
];

// Normalizare: elimină diacritice, spații extra, face lowercase
function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritice
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Returnează lista pentru sera cerută (cu/ fără diacritice, tolerant la spații)
// Acceptă și potrivire parțială pe cuvinte (ex. "rosii", "ardei", "spanac")
export function getFallbackCamerasFor(seraName) {
  const q = norm(seraName);

  if (!q) return [];

  // întâi potrivire exactă (fără diacritice)
  let out = FALLBACK_CAMERAS.filter((c) => norm(c.sera) === q);
  if (out.length) return out;

  // apoi potrivire parțială pe tokenuri
  out = FALLBACK_CAMERAS.filter((c) => {
    const n = norm(c.sera);
    return q.includes("spanac")
      ? n.includes("spanac")
      : q.includes("rosii") || q.includes("rosi") || q.includes("ros")
      ? n.includes("rosii")
      : q.includes("ardei")
      ? n.includes("ardei")
      : false;
  });

  return out;
}
