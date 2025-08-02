export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Hace un momento';
  } else if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffInDays < 7) {
    return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  } else {
    // Para fechas más antiguas, mostrar fecha completa
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

export const formatDateWithTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Hace un momento';
  } else if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffInDays < 7) {
    return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  } else {
    // Para fechas más antiguas, mostrar fecha y hora
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}; 