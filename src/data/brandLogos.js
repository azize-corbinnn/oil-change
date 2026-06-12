/**
 * Mapping ID merek -> slug Simple Icons (https://simpleicons.org)
 * Logo diambil dari CDN: https://cdn.simpleicons.org/{slug}/{warna}
 *
 * Jika slug bernilai null, berarti logo resmi tidak tersedia di Simple Icons,
 * BrandLogo akan otomatis fallback ke ikon emoji (🏍️ / 🚗).
 */
export const brandLogoSlugs = {
  // Motor
  honda: "honda",
  yamaha: "yamahacorporation",
  suzuki: "suzuki",
  kawasaki: "kawasaki",
  vespa: "vespa",

  // Mobil
  toyota: "toyota",
  daihatsu: null,
  mitsubishi: "mitsubishi",
  nissan: "nissan",
  wuling: null,
  bmw: "bmw",
  mercedes: "mercedes",
  hyundai: "hyundai",

  lainnya: null,
};

/**
 * Mendapatkan URL logo brand dari Simple Icons CDN.
 * @param {string} brandId - id merek (lowercase) sesuai data/vehicles.js
 * @param {string} color - warna hex tanpa '#' (default putih)
 */
export const getBrandLogoUrl = (brandId, color = "ffffff") => {
  const slug = brandLogoSlugs[brandId];
  if (!slug) return null;
  return `https://cdn.simpleicons.org/${slug}/${color}`;
};

export default { brandLogoSlugs, getBrandLogoUrl };
