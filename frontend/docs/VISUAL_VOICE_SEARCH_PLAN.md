# KẾ HOẠCH THỰC HIỆN VISUAL & VOICE SEARCH

## 1. Kiến trúc hiện tại
- **Backend (ASP.NET Core 8)**: 
  - Đã có `UploadController` với `CloudinaryService` xử lý upload ảnh.
  - Tìm kiếm text đang dùng `ProductController.GetProductsForShop`, dưới tầng Service sử dụng Entity Framework và `Meilisearch` (`SearchEngineService`).
  - Hệ thống ML hiện tại (`RecommendationService`, `RecommendationModel.zip`) sử dụng `Matrix Factorization` để gợi ý sản phẩm dựa trên tương tác người dùng (User-Product Rating). Mô hình này **không phù hợp** cho Image Similarity. Do đó, cần thiết lập pipeline mới cho trích xuất đặc trưng ảnh (Image Embedding).
  - Có `GeminiService` có thể tận dụng cho Voice/Text processing.
- **Frontend (Next.js 16)**:
  - Component tìm kiếm chính nằm tại `HeaderV2.tsx` với logic debounce và API call `getProducts()`.
  - Cấu trúc thư mục tương đối chuẩn chỉ (`hooks`, `components/client`, `lib/api`).

## 2. File đã đọc
- `backend/Controllers/ProductController.cs`
- `backend/Controllers/UploadController.cs`
- `backend/Controllers/RecommendationController.cs`
- `backend/Services/RecommendationService.cs`
- `backend/Services/SearchEngineService.cs`
- `backend/Models/Product.cs`
- `frontend/components/client/layout/HeaderV2.tsx`

## 3. Luồng dữ liệu
### Tìm kiếm bằng hình ảnh (Visual Search)
1. User click icon Camera trên `HeaderV2.tsx` -> Upload ảnh.
2. Frontend validate ảnh (định dạng: jpg, png, webp) và resize -> Gọi API POST `/api/search/image`.
3. Backend nhận file, kiểm tra validate.
4. Đưa qua Image Pipeline (Trích xuất vector đặc trưng - Embedding).
5. Tính toán độ tương đồng (Cosine Similarity) với các Product Images.
6. Trả về danh sách sản phẩm có `matchedScore` cao.

### Tìm kiếm bằng giọng nói (Voice Search)
1. User click icon Mic trên `HeaderV2.tsx`.
2. Frontend sử dụng `Web Speech API` để nghe và chuyển giọng nói thành text trực tiếp trên trình duyệt.
3. Normalize Text (Xóa khoảng trắng thừa, chuẩn hóa).
4. Đẩy text vào input search hiện tại -> Gọi search hiện có.
5. Fallback: Nếu trình duyệt không hỗ trợ, ghi âm gửi file audio qua POST `/api/search/voice` -> Backend xử lý Speech-to-Text -> Trả về query string.

## 4. API contract

**POST /api/search/image**
- **Request**: `multipart/form-data` chứa `file` (ảnh).
- **Response**:
```json
{
  "products": [
    {
      "productId": 1,
      "productName": "Tên SP",
      "price": 100000,
      "imageUrl": "..."
    }
  ],
  "matchedScore": 0.95
}
```

**POST /api/search/voice** (Fallback)
- **Request**: `multipart/form-data` chứa `audio`.
- **Response**:
```json
{
  "query": "xe đẩy em bé",
  "products": [...]
}
```

## 5. Cấu trúc sau thay đổi
- Frontend: Bổ sung icon [🔍 Search] [📷 Image] [🎙 Voice] vào ô tìm kiếm hiện tại trong `HeaderV2.tsx`. Không phá vỡ layout cũ. Tách module xử lý sang hooks riêng (`useImageSearch`, `useVoiceSearch`).
- Backend: Tạo mới hoàn toàn module Search nâng cao trong thư mục API, đảm bảo Single Responsibility, không nhồi nhét vào `ProductController` hiện có.

## 6. File tạo mới
**Frontend:**
- `components/search/ImageSearchButton.tsx`
- `components/search/VoiceSearchButton.tsx`
- `components/search/SearchResult.tsx`
- `hooks/useVoiceSearch.ts`
- `hooks/useImageSearch.ts`
- `lib/speech/speechToText.ts`
- `lib/speech/normalizeText.ts`
- `lib/vision/extractImageFeature.ts`
- `lib/vision/matchProduct.ts`
- `lib/api/search.ts`
- `types/search.ts`

**Backend:**
- `Controllers/SearchController.cs`
- `DTOs/ImageSearchRequest.cs`
- `DTOs/VoiceSearchRequest.cs`
- `DTOs/SearchResultDTO.cs`
- `Interfaces/IImageSearchService.cs`
- `Interfaces/IVoiceSearchService.cs`
- `Services/ImageSearchService.cs`
- `Services/VoiceSearchService.cs`
- `Services/SearchService.cs`
- `Helpers/ImageHelper.cs`
- `Helpers/SpeechHelper.cs`
- `Models/SearchModel.cs`
- `Settings/SearchSettings.cs`

## 7. File sửa
- `frontend/components/client/layout/HeaderV2.tsx` (Thêm UI button, gọi hook).
- `backend/Program.cs` (Đăng ký Dependency Injection cho các Service mới).
- Có thể thêm package ML hoặc HttpClient cấu hình API cho xử lý Voice/Image trong `.csproj`.

## 8. Test plan
**Frontend:**
- Test UI upload ảnh, drag/drop.
- Test Mic denied (Báo lỗi cho user).
- Kiểm tra các trạng thái Loading spinners và trạng thái Empty.
**Backend:**
- API quăng lỗi 400 nếu truyền sai định dạng file hoặc file hỏng.
- Timeout handling (Xử lý quá lâu).
- Search return 0 result nếu matchedScore quá thấp so với threshold.

## 9. Rollback plan
- Code độc lập: Khi có lỗi, trên Frontend chỉ cần revert phần bổ sung `ImageSearchButton` và `VoiceSearchButton` ở `HeaderV2.tsx`.
- Backend chỉ cần revert `Program.cs` và vô hiệu hóa endpoint `/api/search/` mà không ảnh hưởng tới `ProductController` hay hệ thống đang chạy.
