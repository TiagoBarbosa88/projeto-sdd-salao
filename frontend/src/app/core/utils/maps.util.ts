export function buildGoogleMapsEmbedUrl(
  googleMapsUrl?: string | null,
  address?: string | null
): string | null {
  const mapsUrl = googleMapsUrl?.trim();
  if (mapsUrl) {
    if (mapsUrl.includes('output=embed') || mapsUrl.includes('/embed')) {
      return mapsUrl;
    }
    if (mapsUrl.includes('google.com/maps')) {
      const separator = mapsUrl.includes('?') ? '&' : '?';
      return `${mapsUrl}${separator}output=embed`;
    }
  }

  const query = address?.trim() || mapsUrl;
  if (!query) {
    return null;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=pt&z=16&output=embed`;
}

export function buildGoogleMapsOpenUrl(
  googleMapsUrl?: string | null,
  address?: string | null
): string | null {
  const mapsUrl = googleMapsUrl?.trim();
  if (mapsUrl) {
    return mapsUrl;
  }
  const query = address?.trim();
  if (!query) {
    return null;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
