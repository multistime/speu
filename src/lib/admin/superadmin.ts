/** Нармалізаваны email галоўнага адміна — ролю «адмін» нельга зняць праз UI/API. */
export const SUPERADMIN_EMAIL_NORMALIZED = "multistime@gmail.com";

export function isSuperadminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPERADMIN_EMAIL_NORMALIZED;
}
