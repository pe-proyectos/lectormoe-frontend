// Ficha de joint: lógica compartida por la variante azul (/joint/...) y la +18
// (/red/joint/...). Antes solo existía la azul, así que un joint adulto se
// servía junto a AdSense; y los joints no se podían clasificar, por lo que
// obras normales acababan listadas en /red.
//
// Regla única, la misma que ya usa la ficha de manga: todo lo +18 vive en /red
// y todo lo que no, en el azul. Quien entre por la URL equivocada se redirige,
// nunca se le muestra un 404.

export interface JointRedirect {
  redirect: string
  status?: 301 | 302
}

/** Devuelve la URL a la que hay que mandar al visitante, o null si está bien. */
export function jointRedirectTarget(
  joint: { isNSFW?: boolean | null; slug: string },
  nsfwMode: boolean,
  search = ''
): JointRedirect | null {
  const esAdulto = !!joint?.isNSFW
  if (esAdulto && !nsfwMode) {
    return { redirect: `/red/joint/manga/${joint.slug}${search}`, status: 302 }
  }
  if (!esAdulto && nsfwMode) {
    return { redirect: `/joint/manga/${joint.slug}${search}`, status: 302 }
  }
  return null
}

/** Prefijo de enlaces internos según el lado en el que estemos. */
export const jointPrefix = (nsfwMode: boolean) => (nsfwMode ? '/red/joint' : '/joint')

/**
 * Convierte un joint en la forma que esperan MangaDetailPageContainer y
 * ReaderPageContainer. `isNSFW` se propaga de verdad: es lo que decide si la
 * portada se difumina en el azul y qué red de anuncios se carga.
 */
export function mangaFromJoint(joint: any) {
  return {
    id: joint.id,
    slug: joint.slug,
    title: joint.title || joint.manga?.title || 'Joint',
    description: joint.description || joint.manga?.description || null,
    shortDescription: joint.shortDescription || joint.manga?.shortDescription || null,
    imageUrl: joint.imageUrl || joint.manga?.imageUrl || null,
    bannerUrl:
      joint.bannerUrl || joint.imageUrl || joint.manga?.bannerUrl || joint.manga?.imageUrl || null,
    status: joint.status || 'ongoing',
    // Vistas totales del joint: sin esto la ficha mostraba 0 (el objeto
    // sintético no traía el contador).
    views: joint.views || 0,
    demography: joint.manga?.demography || null,
    // Géneros propios del joint; si no tuviera, cae a los del manga base.
    genres: (joint.genres && joint.genres.length ? joint.genres : joint.manga?.genres) || [],
    authors: joint.manga?.authors || [],
    chapters: (joint.chapters || []).map((ch: any) => ({
      id: ch.id,
      number: ch.number,
      title: ch.title || null,
      releasedAt: ch.releasedAt,
      imageUrl: ch.imageUrl || null,
      isUnreleased: ch.isUnreleased || false,
      hasAccess: true,
    })),
    requireLogin: false,
    isSimulRelease: false,
    isNSFW: !!joint.isNSFW,
    isPublic: true,
    subscriptionPlansCanReadReleased: [],
    subscriptionPlansCanReadUnreleased: [],
    jointMembers: joint.members || [],
  }
}

/**
 * Organización sintética para que la navbar pinte el modo contextual del joint.
 * `jointMembers` es la señal que usa Navbar para mostrar los logos de los
 * participantes en vez de un único scan.
 */
export function orgFromJoint(joint: any, nsfwMode = false) {
  return {
    id: 0,
    name: 'Joint',
    slug: 'joint',
    logoUrl: null,
    isPublic: true,
    isNSFW: !!joint.isNSFW,
    jointMembers: joint.members || [],
    jointSlug: joint.slug,
    jointPrefix: jointPrefix(nsfwMode),
  }
}
