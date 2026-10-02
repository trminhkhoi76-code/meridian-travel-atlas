'use client';

import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { SessionUser } from '@/lib/auth';
import { ACCOUNT_PATHS } from '@/lib/auth';

interface SessionState {
  /** `undefined` = đang tải lần đầu (đừng vội hiện nút "Đăng nhập"). */
  user: SessionUser | null | undefined;
  reload: () => void;
}

const SessionContext = createContext<SessionState>({ user: undefined, reload: () => {} });

const isAccountPath = (p: string | null) => p !== null && ACCOUNT_PATHS.includes(p);

/**
 * Trạng thái đăng nhập phía client, lấy qua /api/session sau khi mount — layout không
 * đọc cookie, để các trang atlas vẫn prerender tĩnh.
 *
 * Server action đăng nhập/đăng xuất kết thúc bằng redirect, nên không có callback phía
 * client để báo. Thay vào đó tải lại mỗi khi rời hoặc vào một trang tài khoản.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const prevPath = useRef<string | null>(null);

  const reload = useCallback(() => {
    fetch('/api/session', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((body: { user: SessionUser | null }) => setUser(body.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const prev = prevPath.current;
    prevPath.current = pathname;
    if (prev === null || isAccountPath(prev) || isAccountPath(pathname)) reload();
  }, [pathname, reload]);

  return <SessionContext.Provider value={{ user, reload }}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
