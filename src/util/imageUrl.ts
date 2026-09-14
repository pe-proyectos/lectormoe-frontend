// Extensiones de imagen que mostramos inline. AVIF incluido: R2 lo sirve tal
// cual y todos los navegadores que soportamos lo pintan de forma nativa.
const IMG_EXT = /\.(png|jpe?g|jfif|gif|webp|avif|bmp|apng|svg)(\?.*)?$/i

export const isImageUrl = (u: string): boolean => IMG_EXT.test(u) || u.includes('r2.hilos.rest')
