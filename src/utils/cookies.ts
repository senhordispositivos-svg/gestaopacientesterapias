// Utility to securely manage browser cookies for credential persistence
export const cookieStorage = {
  get(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const nameEQ = `${encodeURIComponent(name)}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        try {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        } catch {
          return c.substring(nameEQ.length, c.length);
        }
      }
    }
    return null;
  },

  set(name: string, value: string, days: number = 30): void {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    const isSecure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Strict${isSecure}`;
  },

  remove(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/; SameSite=Strict`;
  },
};
