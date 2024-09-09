export const formatDate = (date: any, language: string) => {
  if (!date) return "";
  const dt = new Date(date);
  const now = new Date();
  const diff = now.getTime() - dt.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (language === "en") {
    if (diff < 0) {
      const absDiff = Math.abs(diff);
      const futureSeconds = Math.floor(absDiff / 1000);
      const futureMinutes = Math.floor(futureSeconds / 60);
      const futureHours = Math.floor(futureMinutes / 60);
      const futureDays = Math.floor(futureHours / 24);
      if (futureDays > 0)
        return `in ${futureDays} day${futureDays > 1 ? "s" : ""}`;
      if (futureHours > 0)
        return `in ${futureHours} hour${futureHours > 1 ? "s" : ""}`;
      if (futureMinutes > 0)
        return `in ${futureMinutes} minute${futureMinutes > 1 ? "s" : ""}`;
      if (futureSeconds > 0)
        return `in ${futureSeconds} second${futureSeconds > 1 ? "s" : ""}`;
    } else {
      if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
      if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
      if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
      if (seconds > 0) return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
    }
    return "today";
  } else if (language === "pt") {
    if (diff < 0) {
      const absDiff = Math.abs(diff);
      const futureSeconds = Math.floor(absDiff / 1000);
      const futureMinutes = Math.floor(futureSeconds / 60);
      const futureHours = Math.floor(futureMinutes / 60);
      const futureDays = Math.floor(futureHours / 24);
      if (futureDays > 0)
        return `em ${futureDays} dia${futureDays > 1 ? "s" : ""}`;
      if (futureHours > 0)
        return `em ${futureHours} hora${futureHours > 1 ? "s" : ""}`;
      if (futureMinutes > 0)
        return `em ${futureMinutes} minuto${futureMinutes > 1 ? "s" : ""}`;
      if (futureSeconds > 0)
        return `em ${futureSeconds} segundo${futureSeconds > 1 ? "s" : ""}`;
    } else {
      if (months > 0) return `há ${months} mes${months > 1 ? "es" : ""}`;
      if (weeks > 0) return `há ${weeks} semana${weeks > 1 ? "s" : ""}`;
      if (days > 0) return `há ${days} dia${days > 1 ? "s" : ""}`;
      if (hours > 0) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
      if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? "s" : ""}`;
      if (seconds > 0) return `há ${seconds} segundo${seconds > 1 ? "s" : ""}`;
    }
    return "hoje";
  }
  if (diff < 0) {
    const absDiff = Math.abs(diff);
    const futureSeconds = Math.floor(absDiff / 1000);
    const futureMinutes = Math.floor(futureSeconds / 60);
    const futureHours = Math.floor(futureMinutes / 60);
    const futureDays = Math.floor(futureHours / 24);
    if (futureDays > 0)
      return `en ${futureDays} día${futureDays > 1 ? "s" : ""}`;
    if (futureHours > 0)
      return `en ${futureHours} hora${futureHours > 1 ? "s" : ""}`;
    if (futureMinutes > 0)
      return `en ${futureMinutes} minuto${futureMinutes > 1 ? "s" : ""}`;
    if (futureSeconds > 0)
      return `en ${futureSeconds} segundo${futureSeconds > 1 ? "s" : ""}`;
  } else {
    if (months > 0) return `hace ${months} mes${months > 1 ? "es" : ""}`;
    if (weeks > 0) return `hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
    if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
    if (seconds > 0) return `hace ${seconds} segundo${seconds > 1 ? "s" : ""}`;
  }
  return "hoy";
};
