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
];

const IMAGE_BY_KEY: Record<string, string> = {
  acabamento: '/images/services/acabamento.jpg',
  'corte + escova': '/images/services/corte-escova.jpg',
  'corte escova': '/images/services/corte-escova.jpg',
  'corte feminino': '/images/services/corte-feminino.jpg',
  feminino: '/images/services/corte-feminino.jpg',
  escova: '/images/services/escova.jpg',
  hidrat: '/images/services/hidratacao.jpg',
  progressiva: '/images/services/progressiva-masculina.jpg',
  sobrancelha: '/images/services/sobrancelha.jpg',
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

export function resolveServiceImage(name: string, description?: string): string {
  const text = `${name} ${description ?? ''}`.toLowerCase();
  const sortedKeys = Object.keys(IMAGE_BY_KEY).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeys) {
    if (text.includes(keyword)) {
      return IMAGE_BY_KEY[keyword];
    }
  }
  const gender = resolveServiceGender(name, description);
  return gender === 'masculino'
    ? '/images/services/corte-tradicional.jpg'
    : '/images/services/corte-feminino.jpg';
}

export function serviceGenderLabel(gender: ServiceGender): string {
  return gender === 'masculino' ? 'Masculino' : 'Feminino';
}
