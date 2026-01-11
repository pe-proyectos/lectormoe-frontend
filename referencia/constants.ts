
import { Manga, Scan, SubscriptionPlan } from './types';

export const POPULAR_MANGAS: Manga[] = [
  {
    id: '1',
    title: 'Capibara Knight',
    cover: 'https://picsum.photos/seed/capy1/800/1200',
    scan: 'Galaxy Scans',
    status: 'Ongoing',
    lastUpdate: 'Hace 2 horas',
    chapter: 'Cap. 142',
    chapterTitle: 'El amanecer del roedor',
    prevChapter: 'Cap. 141',
    prevChapterTitle: 'Preparativos para la guerra',
    prevChapterUpdate: 'Hace 1 semana',
    author: 'K. Capy',
    genres: ['Acción', 'Fantasía'],
    isRead: false,
    prevIsRead: true,
    isSubscriberOnly: true
  },
  {
    id: '2',
    title: 'Digital Horizon',
    cover: 'https://picsum.photos/seed/capy2/800/1200',
    scan: 'Lumina Scanlation',
    status: 'Ongoing',
    lastUpdate: 'Hace 5 horas',
    chapter: 'Cap. 54',
    chapterTitle: 'Protocolo Zero',
    prevChapter: 'Cap. 53',
    prevChapterTitle: 'Sombra en la red',
    prevChapterUpdate: 'Hace 4 días',
    author: 'Neo Byte',
    genres: ['Sci-Fi', 'Misterio'],
    isRead: true,
    prevIsRead: true
  },
  {
    id: '3',
    title: 'Neon Ronin',
    cover: 'https://picsum.photos/seed/capy3/800/1200',
    scan: 'Titan Translations',
    status: 'Completed',
    lastUpdate: 'Hace 1 día',
    chapter: 'Cap. Final',
    chapterTitle: 'El último corte',
    prevChapter: 'Cap. 199',
    prevChapterTitle: 'Camino sin retorno',
    prevChapterUpdate: 'Hace 2 semanas',
    author: 'S. Katana',
    genres: ['Cyberpunk', 'Acción']
  },
  {
    id: '4',
    title: 'Void Walker',
    cover: 'https://picsum.photos/seed/capy4/800/1200',
    scan: 'Galaxy Scans',
    status: 'Ongoing',
    lastUpdate: 'Hace 3 horas',
    chapter: 'Cap. 12',
    chapterTitle: 'Ecos del vacío',
    prevChapter: 'Cap. 11',
    prevChapterTitle: 'Primer contacto',
    prevChapterUpdate: 'Hace 1 mes',
    author: 'V. Void',
    genres: ['Horror', 'Sobrenatural'],
    isSubscriberOnly: true
  },
  {
    id: '5',
    title: 'Starry Nights',
    cover: 'https://picsum.photos/seed/galaxy5/800/1200',
    scan: 'Galaxy Scans',
    status: 'Ongoing',
    lastUpdate: 'Hace 10 min',
    chapter: 'Cap. 89',
    chapterTitle: 'Bajo el manto estelar',
    author: 'A. Nova',
    genres: ['Romance', 'Fantasía'],
    description: 'Una historia de amor que trasciende las constelaciones en un universo donde las estrellas dictan el destino de los mortales.'
  },
  {
    id: '6',
    title: 'The Last Bunker',
    cover: 'https://picsum.photos/seed/galaxy6/800/1200',
    scan: 'Galaxy Scans',
    status: 'Completed',
    lastUpdate: 'Hace 2 semanas',
    chapter: 'Cap. 50 (Final)',
    chapterTitle: 'Luz al final del túnel',
    author: 'M. Steel',
    genres: ['Thriller', 'Post-Apocalíptico'],
    description: 'En un mundo devastado, un grupo de supervivientes descubre que el búnker en el que viven oculta secretos más peligrosos que el exterior.'
  },
  {
    id: '7',
    title: 'Nebula Hunter',
    cover: 'https://picsum.photos/seed/galaxy7/800/1200',
    scan: 'Galaxy Scans',
    status: 'Ongoing',
    lastUpdate: 'Hace 1 día',
    chapter: 'Cap. 215',
    chapterTitle: 'Presa identificada',
    author: 'Hunter X',
    genres: ['Acción', 'Aventura'],
    isSubscriberOnly: false,
    description: 'Acompaña al cazador de recompensas más famoso de la galaxia en su misión por capturar a los criminales más buscados del sector 7.'
  },
  {
    id: '8',
    title: 'Quantum Shift',
    cover: 'https://picsum.photos/seed/galaxy8/800/1200',
    scan: 'Galaxy Scans',
    status: 'Hiatus',
    lastUpdate: 'Hace 3 meses',
    chapter: 'Cap. 44',
    chapterTitle: 'Paradoja Temporal',
    author: 'Dr. Time',
    genres: ['Sci-Fi', 'Drama'],
    description: '¿Qué harías si pudieras cambiar un solo momento de tu pasado? El costo de la realidad es más alto de lo que nadie imaginó.'
  },
  {
    id: '9',
    title: 'Cyber Capy 2077',
    cover: 'https://picsum.photos/seed/galaxy9/800/1200',
    scan: 'Galaxy Scans',
    status: 'Ongoing',
    lastUpdate: 'Recién publicado',
    chapter: 'Cap. 01',
    chapterTitle: 'Cero y Uno',
    author: 'C. Pibara',
    genres: ['Comedia', 'Cyberpunk'],
    isSubscriberOnly: true,
    description: 'Un roedor con aumentos cibernéticos intenta sobrevivir en la jungla de asfalto de Neo-Montevideo. Humor ácido y alta tecnología.'
  }
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'ex',
    rank: 'Rango Ex',
    price: '1',
    color: 'border-zinc-500 text-zinc-400',
    description: 'Apoyo básico al equipo.',
    benefits: ['Acceso a contenido exclusivo', 'Sin anuncios']
  },
  {
    id: 'a',
    rank: 'Rango A',
    price: '3',
    color: 'border-cyan-500 text-cyan-400',
    description: 'Beneficios del Rango B más extras.',
    benefits: [
      'Links de descarga y lectura directa',
      'Acceso a capítulos adelantados (horas/días antes)',
      'Aparecerás en créditos de nuestros patrones',
      'Rango especial en nuestro Discord'
    ]
  },
  {
    id: 's',
    rank: 'Rango S',
    price: '5',
    color: 'border-purple-500 text-purple-400',
    description: 'Beneficios de los rangos B y A.',
    benefits: [
      'Avances de traducciones que desees ver',
      'Voto en encuestas de prioridad de actualización'
    ]
  },
  {
    id: 'ss',
    rank: 'Rango SS+',
    price: '10',
    color: 'border-yellow-500 text-yellow-400',
    description: 'Máximo apoyo, máximos beneficios.',
    benefits: [
      'Proponer de 2 a 3 nuevos mangas (sujeto a disponibilidad)',
      'Auspicio y publicidad en 5 mangas por capítulo'
    ]
  }
];

export const WEEKLY_POPULAR: Manga[] = POPULAR_MANGAS.slice(0, 5);
export const UPDATES_MANGAS: Manga[] = POPULAR_MANGAS;
export const ALL_MANGAS = [...POPULAR_MANGAS];
export const SCANS: Scan[] = [
  { id: 's1', name: 'Galaxy Scans', logo: 'https://picsum.photos/seed/s1/100/100', memberCount: 1200 },
  { id: 's2', name: 'Lumina Scanlation', logo: 'https://picsum.photos/seed/s2/100/100', memberCount: 850, isNSFW: true },
  { id: 's3', name: 'Titan Translations', logo: 'https://picsum.photos/seed/s3/100/100', memberCount: 2100 },
  { id: 's4', name: 'Aura Scans', logo: 'https://picsum.photos/seed/s4/100/100', memberCount: 1500 },
];
export const GENRES = ['Acción', 'Aventura', 'Comedia', 'Fantasía', 'Sci-Fi', 'Romance', 'Horror', 'Cyberpunk', 'Post-Apocalíptico'];
export const TOP_RANKING_DATA = ["Capibara Knight", "Nebula Hunter", "Digital Horizon", "Starry Nights", "Neon Ronin"];
export const RECOMMENDED_MANGA = POPULAR_MANGAS[0];
export const TRENDING_LISTS = [];
export const USER_PENDING = POPULAR_MANGAS.slice(0, 2);
export const USER_FOLLOWING = [];
export const USER_FAVORITES = [];
