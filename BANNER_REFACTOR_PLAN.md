# Banner Refactor Plan

## 1. Current State Audit

Qua quá trình phân tích module Banner (`frontend/app/(admin)/admin/banners/page.tsx`, `BannerForm.tsx`, `BannerPreview.tsx`, `BannerConfigBuilder.tsx`), dưới đây là hiện trạng và các vấn đề phát hiện:

- **Functional (Chức năng):**
  - Chức năng CRUD cơ bản hoạt động.
  - Tuy nhiên, hệ thống đang sử dụng `alert()` và `window.confirm()` tại nhiều nơi (ví dụ: `BannerForm.tsx` dòng 32, 55, 59 khi upload ảnh lỗi, dòng 133 khi xóa ảnh; `page.tsx` dòng 95 khi xóa banner). Điều này chặn luồng thao tác của người dùng, UX không tốt.
- **State & Logic (Trạng thái & Logic):**
  - `BannerPreview.tsx` đang sử dụng `useEffect` để `postMessage` dữ liệu sang iframe ngay lập tức mỗi khi `formData` thay đổi. Việc này không được debounce, dẫn đến tình trạng giật/lag (flicker) nếu người dùng gõ văn bản hoặc thay đổi form liên tục.
- **UI (Giao diện):**
  - Giao diện `admin/banners/page.tsx` chỉ hiển thị một danh sách dạng bảng đơn giản. Đối chiếu với tab Quản lý mới (như `admin/flash-sales/page.tsx`), tab Banner thiếu các thành phần: Bento Grid thống kê (Số lượng, Đã xuất bản, Nháp), thanh tìm kiếm, và bộ lọc trạng thái.

## 2. Proposed Changes

- **Thay đổi UI:**
  - Nâng cấp `BannersPage` để có cấu trúc tương tự `FlashSalesPage`: Thêm Bento Grid (Tổng số banner, Đang hiển thị, Bản nháp), ô Tìm kiếm banner theo tên, Dropdown lọc theo trạng thái/vị trí.
  - Thêm Empty State đẹp mắt khi không có banner hoặc khi Live Preview trống.
- **Thay đổi UX:**
  - Loại bỏ hoàn toàn `alert()` và `window.confirm()`.
  - Sử dụng hệ thống Toast (`sonner` thông qua `toast` từ `@/lib/toast`) cho tất cả thông báo lỗi, cảnh báo, thành công.
  - Các thao tác xóa sẽ sử dụng Toast kèm Action (Undo/Xác nhận) hoặc Modal Xác nhận để không chặn trình duyệt.
- **Thay đổi Kiến trúc:**
  - Thêm cơ chế **Debounce** (khoảng 300ms) cho Live Preview để giảm tải re-render iframe.

## 3. Notification Redesign

- **Before:**
  - Lỗi upload: `alert("Bạn cần đăng nhập để tải ảnh lên.")`
  - Xác nhận xóa: `if (!confirm('Bạn có chắc chắn muốn xóa?')) return;`
- **After:**
  - Lỗi upload: `toast.error("Bạn cần đăng nhập để tải ảnh lên.", { description: "Vui lòng kiểm tra lại phiên đăng nhập." })`
  - Xác nhận xóa: Sử dụng `toast.warning("Bạn có chắc chắn muốn xóa?", { action: { label: "Xóa", onClick: () => executeDelete() } })` hoặc một Modal Xác nhận custom.
- **Component Đề xuất:** Tận dụng thư viện `sonner` đã có sẵn trong dự án.

## 4. Live Preview Improvements

- **Vấn đề:** Gửi dữ liệu liên tục qua `postMessage` khi form change, dễ lag.
- **Giải pháp:**
  - Áp dụng custom hook `useDebounce` hoặc `setTimeout` trong `useEffect` của `BannerPreview` (delay ~300ms).
  - Thêm trạng thái Loading / Skeleton trong iframe khi iframe đang load.
- **Flow Dữ liệu Mới:**
  - `Form` -> `formData` (state) -> (Debounce 300ms) -> `postMessage` -> `Iframe`.

## 5. Technical Changes

- **Component/File bị ảnh hưởng:**
  - `frontend/app/(admin)/admin/banners/page.tsx` (Refactor UI, Thêm Stats, Lọc, Xóa confirm).
  - `frontend/components/admin/banner/BannerForm.tsx` (Thay `alert`/`confirm` bằng `toast`).
  - `frontend/components/admin/banner/BannerPreview.tsx` (Thêm Debounce, loading state).
  - `frontend/components/admin/banner/BannerConfigBuilder.tsx` (Logic kết nối).
- **Dependency mới:** Không có (sử dụng các thư viện sẵn có).

## 6. Execution Plan

- **Phase 1 (Notification & UX):**
  - Thay thế toàn bộ `alert` và `window.confirm` thành `toast` trong `BannerForm` và `BannersPage`.
- **Phase 2 (UI Consistency - Banners Page):**
  - Tái cấu trúc `BannersPage`: Thêm Bento grid thống kê (Tính toán từ data đã fetch).
  - Thêm Search box và Status filter. Cải thiện bảng danh sách giống Flash Sales.
- **Phase 3 (Live Preview & Polish):**
  - Áp dụng Debounce cho Live Preview `postMessage`.
  - Tối ưu hóa UI/UX các phần loading, responsive, empty state. Test lại luồng lưu và xuất bản.

## 7. Risk Assessment

- **Rủi ro:** Việc thêm Debounce vào Live Preview có thể khiến preview hiển thị chậm hơn một chút so với gõ phím. Cấu trúc UI mới cho trang danh sách có thể có khác biệt về logic filter so với cũ.
- **Phương án Rollback:** Lưu giữ lại cấu trúc component cũ, có thể revert commit nếu Debounce gây lỗi (do iframe không nhận đủ sự kiện).

## 8. Acceptance Checklist

- [ ] Không còn bất kỳ hàm `alert()` hay `confirm()` nào trong module Banner.
- [ ] Thông báo lỗi/thành công/cảnh báo hiển thị qua toast UI hiện đại, không chặn màn hình.
- [ ] Live Preview được debounce, không gây giật lag khi gõ text nhanh.
- [ ] Trang danh sách Banners có Bento Grid, ô Tìm kiếm, Bộ lọc trạng thái đồng bộ với phong cách Admin (Flash Sales).
- [ ] Backward compatibility: Flow tạo mới, chỉnh sửa, lưu, upload ảnh vẫn hoạt động bình thường.
