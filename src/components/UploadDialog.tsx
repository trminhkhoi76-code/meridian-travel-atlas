'use client';

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Place } from '@/lib/catalog';
import { slugify } from '@/lib/catalog';
import type { PhotoErrors } from '@/lib/gallery';
import { MAX_CAPTION, MAX_PHOTOS, PHOTO_ENDPOINT, PHOTO_TAGS, validatePhotos } from '@/lib/gallery';
import { useCatalog } from './CatalogProvider';
import { IconCheck, IconClose, IconPin, IconUpload } from './Icons';

/**
 * Hộp thoại Đăng ảnh, mở từ bất kỳ trang nào qua `useUpload().open(placeKey?)`.
 *
 * Chưa có kho ảnh: API /api/photos là bản giả lập chỉ nhận thông tin (địa điểm,
 * chú thích, tên file), KHÔNG nhận nội dung file. Vì vậy trên production nút gửi
 * bị khoá kèm thông báo, trừ khi đặt NEXT_PUBLIC_PHOTO_UPLOADS=mock — để khách
 * không tưởng ảnh của mình đã được lưu.
 */
export const PHOTO_UPLOADS_OPEN =
  process.env.NEXT_PUBLIC_PHOTO_UPLOADS === 'mock' || process.env.NODE_ENV !== 'production';

interface UploadValue {
  open: (placeKey?: string) => void;
}

const Ctx = createContext<UploadValue>({ open: () => {} });
export const useUpload = () => useContext(Ctx);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ n: number; place?: string } | null>(null);
  const open = useCallback((place?: string) => setState((s) => ({ n: (s?.n ?? 0) + 1, place })), []);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {state && <UploadDialog key={state.n} initialPlace={state.place} onClosed={() => setState(null)} />}
    </Ctx.Provider>
  );
}

/** Nút mở hộp thoại — dùng được trong Server Component (chỉ truyền prop thuần). */
export function UploadButton({
  place,
  className = 'btn-p press',
  children,
}: {
  place?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useUpload();
  return (
    <button type="button" className={className} onClick={() => open(place)}>
      {children}
    </button>
  );
}

interface Picked {
  id: string;
  file: File;
  url: string;
}

function PlacePicker({
  value,
  onChange,
  error,
}: {
  value: Place | undefined;
  onChange: (p: Place | undefined) => void;
  error?: string;
}) {
  const { places } = useCatalog();
  const id = useId();
  const [q, setQ] = useState(value?.name ?? '');
  const [openList, setOpenList] = useState(false);
  const [active, setActive] = useState(0);

  const options = useMemo(() => {
    const needle = slugify(q);
    const all = [...places.values()];
    if (!needle || (value && q === value.name)) return all.slice(0, 8);
    return all
      .filter((p) => slugify(`${p.name} ${p.city.name} ${p.country.name}`).includes(needle))
      .slice(0, 8);
  }, [q, places, value]);

  function pick(p: Place) {
    onChange(p);
    setQ(p.name);
    setOpenList(false);
  }

  return (
    <div className={'field combo' + (error ? ' invalid' : '')}>
      <label htmlFor={`${id}-in`} className="lab">
        Địa điểm <span className="req">*</span>
      </label>
      <span className="inputwrap">
        <IconPin size={18} />
        <input
          id={`${id}-in`}
          role="combobox"
          aria-expanded={openList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={openList && options[active] ? `${id}-o${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint`}
          autoComplete="off"
          value={q}
          placeholder="Gõ tên địa điểm, ví dụ Bãi Sao"
          onChange={(e) => {
            setQ(e.target.value);
            setOpenList(true);
            setActive(0);
            if (value && e.target.value !== value.name) onChange(undefined);
          }}
          onFocus={() => setOpenList(true)}
          onBlur={() => setTimeout(() => setOpenList(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpenList(true);
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && openList && options[active]) {
              e.preventDefault();
              pick(options[active]);
            } else if (e.key === 'Escape' && openList) {
              e.preventDefault();
              e.stopPropagation();
              setOpenList(false);
            }
          }}
        />
        {value && (
          <small>
            {value.city.name}, {value.country.name}
          </small>
        )}
      </span>
      {openList && options.length > 0 && (
        <ul id={`${id}-list`} role="listbox" aria-label="Địa điểm gợi ý">
          {options.map((p, i) => (
            <li
              key={p.key}
              id={`${id}-o${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(p);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span>{p.name}</span>
              <small>
                {p.city.name}, {p.country.name}
              </small>
            </li>
          ))}
        </ul>
      )}
      <span className="hint" id={`${id}-hint`}>
        Chọn từ danh sách để ảnh hiện đúng chỗ trên bản đồ.
      </span>
      {error && <span className="ferr">{error}</span>}
    </div>
  );
}

function UploadDialog({ initialPlace, onClosed }: { initialPlace?: string; onClosed: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { places } = useCatalog();
  const [place, setPlace] = useState<Place | undefined>(initialPlace ? places.get(initialPlace) : undefined);
  const [files, setFiles] = useState<Picked[]>([]);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [over, setOver] = useState(false);
  const [errors, setErrors] = useState<PhotoErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<number | null>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  // Thu hồi URL xem trước khi đóng hộp thoại.
  const filesRef = useRef(files);
  filesRef.current = files;
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const images = Array.from(list).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => {
      const room = MAX_PHOTOS - prev.length;
      const next = images.slice(0, Math.max(0, room)).map((file, i) => ({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        url: URL.createObjectURL(file),
      }));
      return [...prev, ...next];
    });
    setErrors((e) => ({ ...e, files: undefined }));
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const gone = prev.find((f) => f.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((f) => f.id !== id);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending || !PHOTO_UPLOADS_OPEN) return;
    setFailure(null);
    const body = {
      place: place?.key ?? '',
      caption,
      tags,
      consent,
      files: files.map((f) => ({ name: f.file.name, size: f.file.size, type: f.file.type })),
    };
    const result = validatePhotos(body, (k) => places.has(k));
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const res = await fetch(PHOTO_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.value),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: PhotoErrors };
      if (!res.ok) {
        setErrors(data.errors ?? {});
        setFailure(data.error ?? 'Chưa gửi được. Vui lòng thử lại.');
        return;
      }
      setSent(files.length);
    } catch {
      setFailure('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
    } finally {
      setSending(false);
    }
  }

  const n = files.length;

  return (
    <dialog ref={ref} className="dlg" aria-labelledby="up-title" onClose={onClosed}>
      <form method="dialog" className="dlg-head">
        <h2 id="up-title">Đăng ảnh chuyến đi</h2>
        <button type="submit" className="icon-btn press" aria-label="Đóng" style={{ border: 0 }}>
          <IconClose />
        </button>
      </form>

      {sent !== null ? (
        <div className="dlg-body" style={{ gridTemplateColumns: '1fr' }}>
          <div className="empty pop" style={{ borderStyle: 'solid' }}>
            <p style={{ display: 'flex', justifyContent: 'center', color: 'var(--teal)' }}>
              <IconCheck size={32} />
            </p>
            <p>
              <b>Đã gửi {sent} ảnh ở {place?.name} để duyệt.</b>
            </p>
            <p className="note">Ảnh sẽ hiện trong thư viện sau khi được duyệt.</p>
          </div>
        </div>
      ) : (
        <form id="upload-form" className="dlg-body" noValidate onSubmit={submit}>
          <div className="dlg-col">
            <label
              className={'dropzone' + (over ? ' over' : '')}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <span className="bubble">
                <IconUpload size={24} />
              </span>
              <b>Kéo ảnh vào đây hoặc bấm để chọn</b>
              <span>JPG, PNG hoặc HEIC · tối đa {MAX_PHOTOS} ảnh mỗi lần</span>
              <input
                type="file"
                accept="image/*"
                multiple
                aria-label="Chọn ảnh"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
            {errors.files && <span className="ferr">{errors.files}</span>}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <b style={{ fontSize: 14 }}>{n} ảnh đã chọn</b>
              {n > 0 && <span className="note">Ảnh đầu tiên làm ảnh bìa</span>}
            </div>
            {n > 0 && (
              <div className="previews">
                {files.map((f, i) => (
                  <div key={f.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước từ blob: URL */}
                    <img src={f.url} alt={`Ảnh ${i + 1}: ${f.file.name}`} />
                    {i === 0 && <span className="cover">Ảnh bìa</span>}
                    <button type="button" className="press" aria-label={`Bỏ ảnh ${i + 1}`} onClick={() => removeFile(f.id)}>
                      <IconClose size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="info">
              <span>Ảnh được duyệt trước khi hiện công khai, và luôn gắn với địa điểm bạn chọn.</span>
            </p>
          </div>

          <div className="dlg-col form">
            <PlacePicker value={place} onChange={setPlace} error={errors.place} />
            <div className={'field' + (errors.caption ? ' invalid' : '')}>
              <label htmlFor="up-caption">Chú thích</label>
              <textarea
                id="up-caption"
                rows={4}
                maxLength={MAX_CAPTION}
                placeholder="Kể ngắn về khoảnh khắc này…"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <span className="counter" aria-live="polite">
                {caption.length} / {MAX_CAPTION}
              </span>
              {errors.caption && <span className="ferr">{errors.caption}</span>}
            </div>
            <fieldset>
              <legend className="lab" style={{ padding: 0, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                Thẻ
              </legend>
              <div className="tagpicks">
                {PHOTO_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="pill press"
                    aria-pressed={tags.includes(t)}
                    onClick={() => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="check">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={errors.consent ? true : undefined} />
              Tôi là người chụp các ảnh này và đồng ý cho Meridian hiển thị chúng trên trang địa điểm.
            </label>
            {errors.consent && <span className="ferr">{errors.consent}</span>}
          </div>
        </form>
      )}

      <div className="dlg-foot">
        {!PHOTO_UPLOADS_OPEN && sent === null && (
          <span className="note" style={{ marginRight: 'auto' }} role="status">
            Đăng ảnh chưa mở — chúng tôi đang hoàn thiện kho lưu ảnh.
          </span>
        )}
        {failure && (
          <span className="ferr" style={{ marginRight: 'auto' }} role="alert">
            {failure}
          </span>
        )}
        <form method="dialog">
          <button type="submit" className="btn-s press">
            {sent !== null ? 'Đóng' : 'Huỷ'}
          </button>
        </form>
        {sent === null && (
          <button
            type="submit"
            form="upload-form"
            className="btn-p press"
            disabled={!PHOTO_UPLOADS_OPEN || sending}
            aria-busy={sending}
          >
            {sending ? 'Đang gửi…' : n > 0 ? `Đăng ${n} ảnh` : 'Đăng ảnh'}
          </button>
        )}
      </div>
    </dialog>
  );
}
