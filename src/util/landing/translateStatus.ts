/**
 * Traduce el estado del manga del inglés al español
 */
export const translateStatus = (status: string | undefined | null): string => {
  if (!status) return 'En emisión';
  
  const statusLower = status.toLowerCase().trim();
  
  const statusMap: Record<string, string> = {
    'ongoing': 'En emisión',
    'completed': 'Completado',
    'hiatus': 'En pausa',
    'cancelled': 'Cancelado',
    'dropped': 'Abandonado',
    'on hold': 'En espera',
    'en emisión': 'En emisión', // Ya está en español
    'completado': 'Completado', // Ya está en español
    'en pausa': 'En pausa', // Ya está en español
  };
  
  return statusMap[statusLower] || status;
};

