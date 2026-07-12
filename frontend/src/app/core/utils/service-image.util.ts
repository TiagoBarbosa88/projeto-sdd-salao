export type ServiceGender = 'masculino' | 'feminino';

const MASCULINE_KEYWORDS = [
  'barba',
  'degrade',
  'degradê',
  'masculino',
  'navalha',
  'bigode',
  'barbearia',
  'acabamento',
  'nuca',
  'laterais',
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
  'sobrancelha',
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
];

const IMAGE_BY_KEY: Record<string, string> = {
  barba: '/images/services/barba.svg',
  degrade: '/images/services/corte-masculino.svg',
  masculino: '/images/services/corte-masculino.svg',
  navalha: '/images/services/barba.svg',
  progressiva: '/images/services/progressiva.svg',
  escova: '/images/services/escova.svg',
  hidrat: '/images/services/hidratacao.svg',
  manicure: '/images/services/manicure.svg',
  pedicure: '/images/services/manicure.svg',
  colora: '/images/services/coloracao.svg',
  balayage: '/images/services/coloracao.svg',
  sobrancelha: '/images/services/sobrancelha.svg',
  maquiagem: '/images/services/maquiagem.svg',
  feminino: '/images/services/corte-feminino.svg',
  unha: '/images/services/manicure.svg',
  acabamento: '/images/services/corte-masculino.svg',
  contorno: '/images/services/barba.svg',
  tradicional: '/images/services/corte-masculino.svg',
  corte: '/images/services/corte-feminino.svg',
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
  for (const [keyword, image] of Object.entries(IMAGE_BY_KEY)) {
    if (text.includes(keyword)) {
      return image;
    }
  }
  const gender = resolveServiceGender(name, description);
  return gender === 'masculino'
    ? '/images/services/corte-masculino.svg'
    : '/images/services/corte-feminino.svg';
}

export function serviceGenderLabel(gender: ServiceGender): string {
  return gender === 'masculino' ? 'Masculino' : 'Feminino';
}
