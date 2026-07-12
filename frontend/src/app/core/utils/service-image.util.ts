export type ServiceGender = 'masculino' | 'feminino';

const MASCULINE_KEYWORDS = [
  'barba',
  'degrade',
  'degradê',
  'masculin',
  'navalha',
  'bigode',
  'barbearia',
  'pigmenta',
  'infantil',
  'fade',
];

const FEMININE_KEYWORDS = [
  'progressiva',
  'escova',
  'hidrat',
  'manicure',
  'pedicure',
  'colora',
  'balayage',
  'botox',
  'design',
  'maquiagem',
  'feminino',
  'unha',
  'penteado',
  'luzes',
  'mechas',
  'alisamento',
  'cauteriz',
  'cronograma',
  'acabamento',
  'nuca',
  'laterais',
  'sobrancelha',
];

const IMAGE_BY_KEY: Record<string, string> = {
  acabamento: '/images/services/acabamento.jpg',
  'corte + escova': '/images/services/corte-escova.jpg',
  'corte escova': '/images/services/corte-escova.jpg',
  'corte feminino': '/images/services/corte-feminino.jpg',
  escova: '/images/services/escova.jpg',
  hidrat: '/images/services/hidratacao.jpg',
  progressiva: '/images/services/progressiva-masculina.jpg',
  'sobrancelha masculina': '/images/services/sobrancelha-masculina.jpg',
  'sobrancelha feminina': '/images/services/sobrancelha-feminina.jpg',
  sobrancelha: '/images/services/sobrancelha-feminina.jpg',
  barba: '/images/services/barba.jpg',
  'corte + barba': '/images/services/corte-barba.jpg',
  'corte barba': '/images/services/corte-barba.jpg',
  degrade: '/images/services/corte-degrade.jpg',
  degradê: '/images/services/corte-degrade.jpg',
  fade: '/images/services/corte-degrade.jpg',
  infantil: '/images/services/corte-infantil.jpg',
  tradicional: '/images/services/corte-tradicional.jpg',
  pigmenta: '/images/services/pigmentacao-barba.jpg',
  manicure: '/images/services/manicure.svg',
  pedicure: '/images/services/manicure.svg',
  colora: '/images/services/coloracao.svg',
  maquiagem: '/images/services/maquiagem.svg',
  masculino: '/images/services/corte-tradicional.jpg',
  navalha: '/images/services/barba.jpg',
  feminino: '/images/services/corte-feminino.jpg',
  corte: '/images/services/corte-feminino.jpg',
};

export function resolveServiceImageUrl(
  name: string,
  description?: string,
  imageUrl?: string | null
): string {
  if (imageUrl?.trim()) {
    return imageUrl;
  }
  return resolveServiceImage(name, description);
}

export function resolveServiceGender(name: string, description?: string): ServiceGender {
  const text = `${name} ${description ?? ''}`.toLowerCase();
  if (text.includes('masculin')) {
    return 'masculino';
  }
  if (MASCULINE_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return 'masculino';
  }
  if (FEMININE_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return 'feminino';
  }
  return 'feminino';
}

function matchImageKey(text: string): string | null {
  const normalized = text.toLowerCase();
  const sortedKeys = Object.keys(IMAGE_BY_KEY).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeys) {
    if (normalized.includes(keyword)) {
      return IMAGE_BY_KEY[keyword];
    }
  }
  return null;
}

export function resolveServiceImage(name: string, description?: string): string {
  const nameMatch = matchImageKey(name);
  if (nameMatch) {
    if (name.toLowerCase().includes('sobrancelha')) {
      return resolveSobrancelhaImage(name, description);
    }
    return nameMatch;
  }

  const fullTextMatch = matchImageKey(`${name} ${description ?? ''}`);
  if (fullTextMatch) {
    if (`${name} ${description ?? ''}`.toLowerCase().includes('sobrancelha')) {
      return resolveSobrancelhaImage(name, description);
    }
    return fullTextMatch;
  }

  const gender = resolveServiceGender(name, description);
  return gender === 'masculino'
    ? '/images/services/corte-tradicional.jpg'
    : '/images/services/corte-feminino.jpg';
}

function resolveSobrancelhaImage(name: string, description?: string): string {
  const text = `${name} ${description ?? ''}`.toLowerCase();
  if (text.includes('masculin')) {
    return '/images/services/sobrancelha-masculina.jpg';
  }
  return '/images/services/sobrancelha-feminina.jpg';
}

export function serviceGenderLabel(gender: ServiceGender): string {
  return gender === 'masculino' ? 'Masculino' : 'Feminino';
}
