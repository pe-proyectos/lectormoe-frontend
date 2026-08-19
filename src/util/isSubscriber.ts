// ¿El usuario es suscriptor "de verdad"? Suscripción activa, no vencida y con
// plan activo. Espeja el chequeo canónico del backend (util/access-control.ts).
export function isSubscriber(user: any): boolean {
  if (!user || !Array.isArray(user.subscriptions)) return false;
  const now = Date.now();
  return user.subscriptions.some((s: any) => {
    if (s?.active === false) return false;
    if (s?.endDate && new Date(s.endDate).getTime() < now) return false;
    if (s?.subscriptionPlan && s.subscriptionPlan.active === false) return false;
    return true;
  });
}
