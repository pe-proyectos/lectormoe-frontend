import React, { useEffect, useState } from 'react';
import CommentsSection from './CommentsSection';
import HilosComments from './HilosComments';

// Interruptor del cutover de comentarios. PUBLIC_COMMENTS_ENGINE:
//   'hilos'  -> motor nuevo (hilos.rest), compartido con lacharca.com
//   'legacy' -> sistema propio de CapibaraTraductor (por defecto)
// La data antigua NUNCA se toca: si volvemos a 'legacy', todo sigue donde estaba.
const ENGINE = (import.meta.env['PUBLIC_COMMENTS_ENGINE'] || 'legacy').toLowerCase();

interface Props {
  /** identifier del sistema legacy: '<mangaSlug>_<numero>' o '<mangaSlug>'. */
  identifier: string;
  /** Referencia en hilos: 'chapter:<id>' o 'manga:<mangaCustomId>'. */
  hilosRef?: string | null;
  logged: boolean;
  user: any;
  organization?: any;
  onLogin?: () => void;
}

const CommentsGateway: React.FC<Props> = ({ identifier, hilosRef, ...rest }) => {
  // Si el motor nuevo esta activo pero no sabemos a que post apunta este
  // contenido, caemos al sistema de siempre en vez de dejar la seccion vacia.
  const [useHilos, setUseHilos] = useState(ENGINE === 'hilos' && !!hilosRef);

  useEffect(() => { setUseHilos(ENGINE === 'hilos' && !!hilosRef); }, [hilosRef]);

  if (useHilos && hilosRef) {
    return <HilosComments hilosRef={hilosRef} {...rest} />;
  }
  return <CommentsSection identifier={identifier} {...rest} />;
};

export default CommentsGateway;
