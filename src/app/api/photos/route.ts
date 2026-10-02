import { allPlaces } from '@/lib/catalog';
import { getCountries } from '@/lib/catalog-service';
import { validatePhotos } from '@/lib/gallery';

/**
 * POST /api/photos — BẢN GIẢ LẬP. Nhận thông tin ảnh khách muốn đăng (địa điểm,
 * chú thích, thẻ, tên/kích thước file) nhưng KHÔNG nhận nội dung file và không lưu
 * gì: chưa có kho ảnh (S3 + hàng đợi duyệt). Trên production trả 503 trừ khi
 * NEXT_PUBLIC_PHOTO_UPLOADS=mock, khớp với nút gửi bị khoá trong UploadDialog.
 *
 *   202 { id, status: 'PENDING' }   đã nhận để duyệt
 *   400 { error }                   body không phải JSON
 *   422 { error, errors }           sai dữ liệu
 *   503 { error }                   chưa mở trên máy chủ này
 */
export async function POST(request: Request) {
  const open = process.env.NEXT_PUBLIC_PHOTO_UPLOADS === 'mock' || process.env.NODE_ENV !== 'production';
  if (!open) {
    return Response.json({ error: 'Đăng ảnh chưa mở — chúng tôi đang hoàn thiện kho lưu ảnh.' }, { status: 503 });
  }

  const raw: unknown = await request.json().catch(() => undefined);
  if (raw === undefined) return Response.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });

  const keys = new Set(allPlaces(await getCountries()).map((p) => p.key));
  const result = validatePhotos(raw, (k) => keys.has(k));
  if (!result.ok) {
    return Response.json({ error: 'Vui lòng kiểm tra lại thông tin.', errors: result.errors }, { status: 422 });
  }

  const id = `P${Date.now().toString(36).toUpperCase()}`;
  console.info('[photos] nhận (giả lập, không lưu file)', id, result.value.place, `${result.value.files.length} ảnh`);
  return Response.json({ id, status: 'PENDING' }, { status: 202 });
}
