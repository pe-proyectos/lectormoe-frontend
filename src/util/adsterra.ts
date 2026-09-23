// Registro unico de las unidades de Adsterra.
//
// Todas las claves viven aqui para que cambiar una unidad (o el dominio de
// servicio, que Adsterra rota cada cierto tiempo) sea tocar un solo archivo.
// El dominio anterior era profitablecpmratenetwork.com; los snippets actuales
// del panel usan mergerindirect.com.
//
// AVISO: estas unidades tienen "Adults Ads" activado en el panel de Adsterra,
// asi que tambien sirven publicidad adulta en el lado azul. Si eso se quiere
// separar, hay que crear unidades distintas para el azul y usarlas aqui.

export const ADSTERRA_HOST = 'https://mergerindirect.com';

/** Scripts que se cargan una vez por pagina, sin hueco visible. */
export const ADSTERRA_GLOBAL = {
  socialBar: `${ADSTERRA_HOST}/fa/50/12/fa50128d8d2e47e35db6626316aea5aa.js`,
  popunder: `${ADSTERRA_HOST}/1a/2a/f9/1a2af9b9b73dc2aadf88a69ee2a974eb.js`,
} as const;

/** Banner nativo (se integra en una rejilla o listado). */
export const ADSTERRA_NATIVE_KEY = '7dcd97a713890d3292004700f33bae35';

/** Enlace monetizado. No es una unidad visual: se usa como destino de un clic. */
export const ADSTERRA_SMARTLINK =
  `${ADSTERRA_HOST}/ccc1ptkn2?key=3e0256e54d1289686b70f0e6c9cb2297`;

export type AdsterraSize = '300x250' | '468x60' | '160x300' | '728x90' | '320x50' | '160x600';

interface UnidadBanner {
  key: string;
  width: number;
  height: number;
}

export const ADSTERRA_BANNERS: Record<AdsterraSize, UnidadBanner> = {
  '300x250': { key: '21c4f24a8cf143d91aa6be7c9f45ff68', width: 300, height: 250 },
  '468x60': { key: '2e456db6a5e583c757401757f21d5740', width: 468, height: 60 },
  '160x300': { key: '3242b9ad86eacba0030822c08d9d5221', width: 160, height: 300 },
  '728x90': { key: 'd699a30ad9ed4c390045b35f4c6f741b', width: 728, height: 90 },
  '320x50': { key: 'fa1ddb6b6ca9fdd26811b660ba34cffb', width: 320, height: 50 },
  '160x600': { key: 'ec798f4fd9e053718a0d7fafb6711ad3', width: 160, height: 600 },
};

export const urlInvoke = (key: string) => `${ADSTERRA_HOST}/${key}/invoke.js`;
