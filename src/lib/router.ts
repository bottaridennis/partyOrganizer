import { useEffect, useState, useCallback } from 'react';

export type Route =
  | 'home'
  | 'dispensa'
  | 'spesa'
  | 'amici'
  | 'richieste'
  | 'movimenti'
  | 'contributi'
  | 'registro'
  | 'impostazioni';

const ROUTES: Route[] = ['home', 'dispensa', 'spesa', 'amici', 'richieste', 'movimenti', 'contributi', 'registro', 'impostazioni'];

export interface Location {
  route: Route;
  /** Extra path segment, e.g. a participant filter. */
  param?: string;
}

function parse(hash: string): Location {
  const [route, param] = hash.replace(/^#\/?/, '').split('/');
  return { route: (ROUTES as string[]).includes(route) ? (route as Route) : 'home', param: param ? decodeURIComponent(param) : undefined };
}

/** Small hash router: views survive a refresh and can be shared as links. */
export function useHashRoute() {
  const [loc, setLoc] = useState<Location>(() => parse(window.location.hash));

  useEffect(() => {
    const onHash = () => setLoc(parse(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((route: Route, param?: string) => {
    const hash = `#/${route}${param ? `/${encodeURIComponent(param)}` : ''}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    else setLoc(parse(hash));
    document.getElementById('main-scroll')?.scrollTo({ top: 0 });
  }, []);

  return { ...loc, navigate };
}

/** Invite links look like `…/#/invito/ABC123`. Read once, then cleared. */
export function takeInviteCodeFromUrl(): string | null {
  const m = window.location.hash.match(/^#\/?invito\/([A-Za-z0-9-]+)/);
  if (!m) return null;
  try {
    sessionStorage.setItem('pp-invite', m[1].toUpperCase());
  } catch {}
  history.replaceState(null, '', window.location.pathname + window.location.search);
  return m[1].toUpperCase();
}

export function pendingInviteCode(): string | null {
  try {
    return sessionStorage.getItem('pp-invite');
  } catch {
    return null;
  }
}

export function clearPendingInvite() {
  try {
    sessionStorage.removeItem('pp-invite');
  } catch {}
}

export const inviteLink = (code: string) => `${window.location.origin}${window.location.pathname}#/invito/${code}`;
