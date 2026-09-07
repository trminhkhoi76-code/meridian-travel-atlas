'use client';

import { createContext, useContext, useMemo, useState } from 'react';

interface PinFocusValue {
  /** key của trải nghiệm đang được rê chuột/focus tới ở bảng bên phải. */
  hovered: string | null;
  setHovered: (key: string | null) => void;
}

const Ctx = createContext<PinFocusValue | null>(null);

export function usePinFocus(): PinFocusValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('usePinFocus phải nằm trong <PinFocusProvider>');
  return value;
}

/**
 * Cầu nối giữa danh sách trải nghiệm ở bảng bán (phải highlight/hiện nhãn
 * ghim nào trên quả cầu) và AtlasShell (nơi vẽ ghim) — hai bên không lồng
 * nhau trong cây component nên cần context riêng, tách khỏi CatalogProvider.
 */
export function PinFocusProvider({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const value = useMemo(() => ({ hovered, setHovered }), [hovered]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
