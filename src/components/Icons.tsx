import type { Cat } from '@/lib/catalog';

/**
 * Bộ icon nét (stroke 1.8, đầu tròn) lấy đúng từ bản thiết kế. Luôn `aria-hidden`:
 * nút chỉ có icon phải tự mang `aria-label`.
 */

type P = { size?: number; className?: string };

function S({ size = 20, className, children }: P & { children: React.ReactNode }) {
  return (
    <svg className={'ic' + (className ? ' ' + className : '')} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconSearch = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20 L16.2 16.2" />
  </S>
);
export const IconHeart = (p: P) => (
  <S {...p}>
    <path d="M12 20 C5 15.5 3 12.5 3 9.2 C3 6.6 5 4.6 7.5 4.6 C9.4 4.6 10.9 5.7 12 7.3 C13.1 5.7 14.6 4.6 16.5 4.6 C19 4.6 21 6.6 21 9.2 C21 12.5 19 15.5 12 20 Z" />
  </S>
);
export const IconBag = (p: P) => (
  <S {...p}>
    <path d="M5 8 H19 L18 20 H6 Z" />
    <path d="M9 8 V6.5 A3 3 0 0 1 15 6.5 V8" />
  </S>
);
export const IconPin = (p: P) => (
  <S {...p}>
    <path d="M12 21 C12 21 5 14.5 5 9.5 A7 7 0 0 1 19 9.5 C19 14.5 12 21 12 21 Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </S>
);
export const IconPlus = (p: P) => (
  <S {...p}>
    <path d="M12 5 V19" />
    <path d="M5 12 H19" />
  </S>
);
export const IconCheck = (p: P) => (
  <S {...p}>
    <path d="M5 12.5 L10 17 L19 7" />
  </S>
);
export const IconClock = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5 V12 L15 14" />
  </S>
);
export const IconShare = (p: P) => (
  <S {...p}>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M8.2 10.8 L15.8 7.2" />
    <path d="M8.2 13.2 L15.8 16.8" />
  </S>
);
export const IconGrid = (p: P) => (
  <S {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </S>
);
export const IconClose = (p: P) => (
  <S {...p}>
    <path d="M6 6 L18 18" />
    <path d="M18 6 L6 18" />
  </S>
);
export const IconUpload = (p: P) => (
  <S {...p}>
    <path d="M12 16 V5" />
    <path d="M7.5 9.5 L12 5 L16.5 9.5" />
    <path d="M5 19 H19" />
  </S>
);
export const IconChevronRight = (p: P) => (
  <S {...p}>
    <path d="M9 6 L15 12 L9 18" />
  </S>
);
export const IconChevronLeft = (p: P) => (
  <S {...p}>
    <path d="M15 6 L9 12 L15 18" />
  </S>
);
export const IconUp = (p: P) => (
  <S {...p}>
    <path d="M6 15 L12 9 L18 15" />
  </S>
);
export const IconDown = (p: P) => (
  <S {...p}>
    <path d="M6 9 L12 15 L18 9" />
  </S>
);
export const IconCompass = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5 L13.5 13.5 L8.5 15.5 L10.5 10.5 Z" />
  </S>
);
export const IconImage = (p: P) => (
  <S {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M4 17 L9.5 12.5 L13 15.5 L16 13 L20 16.5" />
  </S>
);
export const IconRoute = (p: P) => (
  <S {...p}>
    <circle cx="6" cy="18" r="2.2" />
    <circle cx="18" cy="6" r="2.2" />
    <path d="M8 17 C14 17 10 7 16 7" />
  </S>
);
export const IconPlane = (p: P) => (
  <S {...p}>
    <path d="M3 14 L21 8" />
    <path d="M10 11.7 L8 19 L11 18 L14 10.7" />
    <path d="M6 13 L4 9 L6 8.4 L8.5 11.9" />
  </S>
);
export const IconTrash = (p: P) => (
  <S {...p}>
    <path d="M4.5 7 H19.5" />
    <path d="M9.5 7 V4.5 H14.5 V7" />
    <path d="M6.5 7 L7.5 20 H16.5 L17.5 7" />
  </S>
);
export const IconInfo = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11 V16" />
    <path d="M12 8 V8.2" />
  </S>
);
export const IconShield = (p: P) => (
  <S {...p}>
    <path d="M12 3 L19 6 V11.5 C19 15.8 16 19 12 21 C8 19 5 15.8 5 11.5 V6 Z" />
    <path d="M9 12 L11.2 14.2 L15 10.2" />
  </S>
);
export const IconUsers = (p: P) => (
  <S {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19 C3.5 15.5 6 13.5 9 13.5 C12 13.5 14.5 15.5 14.5 19" />
    <circle cx="16.5" cy="9" r="2.6" />
    <path d="M16 13.6 C18.6 13.6 20.5 15.6 20.5 18.5" />
  </S>
);
export const IconCalendar = (p: P) => (
  <S {...p}>
    <rect x="4" y="5.5" width="16" height="14" rx="2" />
    <path d="M4 10 H20" />
    <path d="M8.5 3.5 V7" />
    <path d="M15.5 3.5 V7" />
  </S>
);
export const IconPencil = (p: P) => (
  <S {...p}>
    <path d="M14.5 4.5 L19.5 9.5 L10 19 H5 V14 Z" />
  </S>
);
export const IconFilter = (p: P) => (
  <S {...p}>
    <path d="M4 6 H20" />
    <path d="M7 12 H17" />
    <path d="M10 18 H14" />
  </S>
);
export const IconUser = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20 C5 16 8 14 12 14 C16 14 19 16 19 20" />
  </S>
);

export function Star({ size = 14 }: { size?: number }) {
  return (
    <svg className="star" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 L14.7 8.6 L20.8 9.4 L16.3 13.6 L17.5 19.7 L12 16.7 L6.5 19.7 L7.7 13.6 L3.2 9.4 L9.3 8.6 Z" />
    </svg>
  );
}

export function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="13" fill="#0B6B74" />
      <path d="M15 6 L18.5 15 L15 24 L11.5 15 Z" fill="#FFFFFF" />
      <circle cx="15" cy="15" r="2.2" fill="#0B6B74" />
    </svg>
  );
}

export function CatIcon({ cat, size = 22 }: { cat: Cat; size?: number }) {
  switch (cat) {
    case 'STAY':
      return (
        <S size={size}>
          <path d="M3 11 L12 4 L21 11" />
          <path d="M5 9.5 V20 H19 V9.5" />
          <path d="M10 20 V14 H14 V20" />
        </S>
      );
    case 'PASSAGE':
      return <IconCompass size={size} />;
    case 'TABLE':
      return (
        <S size={size}>
          <path d="M4 13 H20 A8 8 0 0 1 4 13 Z" />
          <path d="M9 9 C9 7.5 10 7 10 5.5" />
          <path d="M14 9 C14 7.5 15 7 15 5.5" />
        </S>
      );
    case 'STUDIO':
      return (
        <S size={size}>
          <path d="M14.5 4.5 L19.5 9.5 L10 19 H5 V14 Z" />
          <path d="M12.5 6.5 L17.5 11.5" />
        </S>
      );
    case 'TRAIL':
      return (
        <S size={size}>
          <path d="M3 19 L9 8 L13 14 L16 10 L21 19 Z" />
        </S>
      );
  }
}
