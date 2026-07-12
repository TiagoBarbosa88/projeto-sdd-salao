export type MapCoordinates = { lat: number; lng: number };

export function extractMapCoordinates(
  googleMapsUrl?: string | null,
  address?: string | null
): MapCoordinates | null {
  const mapsUrl = googleMapsUrl?.trim();
  if (mapsUrl) {
    const preciseMatch = mapsUrl.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (preciseMatch) {
      return { lat: parseFloat(preciseMatch[1]), lng: parseFloat(preciseMatch[2]) };
    }

    const atMatch = mapsUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    const llMatch = mapsUrl.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (llMatch) {
      return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
    }
  }

  const query = address?.trim();
  if (!query) {
    return null;
  }

  return null;
}

export function buildOsmStaticMapUrl(lat: number, lng: number, width = 800, height = 400): string {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=${width}x${height}&markers=${lat},${lng},red-pushpin`;
}

function buildQueryEmbed(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=pt&z=16&output=embed`;
}

function extractMapsQuery(googleMapsUrl: string): string | null {
  const qMatch = googleMapsUrl.match(/[?&]q=([^&]+)/);
  if (qMatch) {
    return decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
  }

  const placeMatch = googleMapsUrl.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
  }

  return null;
}

function isShortMapsUrl(googleMapsUrl: string): boolean {
  return googleMapsUrl.includes('goo.gl') || googleMapsUrl.includes('maps.app');
}

export function buildGoogleMapsEmbedUrl(
  googleMapsUrl?: string | null,
  address?: string | null
): string | null {
  const mapsUrl = googleMapsUrl?.trim();
  if (mapsUrl) {
    if (mapsUrl.includes('/embed') || mapsUrl.includes('output=embed')) {
      return mapsUrl;
    }

    if (isShortMapsUrl(mapsUrl)) {
      const query = address?.trim();
      return query ? buildQueryEmbed(query) : null;
    }

    const coords = extractMapCoordinates(mapsUrl, address);
    if (coords) {
      return buildQueryEmbed(`${coords.lat},${coords.lng}`);
    }

    const extractedQuery = extractMapsQuery(mapsUrl);
    if (extractedQuery) {
      return buildQueryEmbed(extractedQuery);
    }
  }

  const query = address?.trim();
  if (query) {
    return buildQueryEmbed(query);
  }

  return mapsUrl ? buildQueryEmbed(mapsUrl) : null;
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
