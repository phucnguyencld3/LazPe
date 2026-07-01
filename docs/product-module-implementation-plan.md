# Product Module Implementation Plan

## 1. Mục tiêu

Nâng cấp Module Product từ mức e-commerce MVP/đồ án nâng cao lên kiến trúc có thể mở rộng cho catalog lớn, có search/filter chính xác, bảo mật tốt hơn, vận hành ổn định hơn và sẵn sàng bổ sung các tính năng AI, personalization, marketplace trong tương lai.

## 2. Phạm vi triển khai

Module Product hiện bao gồm:

- Product CRUD.
- Product variant, option, option value.
- Product image gallery và variant image.
- Import/export Excel.
- Product SEO: slug, meta title, meta description.
- Soft delete.
- Rating cache.
- Bundle/combo.
- Flash sale.
- Wishlist, compare, recently viewed.
- Price drop alert, back-in-stock alert.
- Review media và moderation.
- Recommendation dựa trên MongoDB + ML.NET.
- Meilisearch search cơ bản.

Kế hoạch này tập trung vào:

- Hoàn thiện nghiệp vụ core.
- Tối ưu database/search/cache.
- Tăng bảo mật.
- Tăng hiệu năng khi dữ liệu lớn.
- Chuẩn bị nền cho AI và mở rộng thương mại điện tử hiện đại.

## 3. Đánh giá hiện trạng ngắn gọn

Điểm hiện tại: **72/100**.

Điểm mạnh:

- Kiến trúc đã vượt CRUD cơ bản.
- Có variant, option, image, combo, flash sale, alert, review, recommendation.
- Có Hangfire, MongoDB, Meilisearch, Cloudinary.
- Có phân quyền admin ở nhiều endpoint.
- Có soft delete và rating cache.

Điểm yếu chính:

- Search/filter chưa đủ mạnh cho catalog lớn.
- Một số filter ở frontend đang xử lý trên dữ liệu một trang, dễ sai total/pagination.
- Export Excel load toàn bộ dữ liệu, dễ timeout/OOM khi catalog lớn.
- Chưa có unique index rõ ràng cho Product Code và Variant SKU.
- Specs đang lưu dạng JSON string, khó lọc thông minh.
- Chưa có inventory ledger và stock reservation.
- Endpoint sync Meilisearch đang để public, cần khóa quyền.
- Upload image cần kiểm tra sâu hơn extension/content-type.
- Cache hiện dùng memory cache, chưa phù hợp khi scale nhiều instance.

## 4. Giai đoạn 1 - Bắt buộc

Mục tiêu: đưa module về trạng thái ổn định, an toàn, đúng dữ liệu và sẵn sàng vận hành catalog lớn vừa phải.

| Tính năng | Mô tả | Lý do cần bổ sung | Mức độ ưu tiên | Độ khó triển khai | Giá trị mang lại | Ảnh hưởng Database | Ảnh hưởng Backend | Ảnh hưởng Frontend | Khuyến nghị triển khai |
|---|---|---|---|---|---|---|---|---|---|
| Khóa endpoint vận hành | Bảo vệ sync SEO, sync Meilisearch, export/import | Tránh người lạ gọi API nặng hoặc làm sai search index | Cao | Dễ | Tăng bảo mật production | Không đổi | Thêm `[Permission]` hoặc `[Authorize(Roles="Admin")]` | Không đổi | Làm ngay |
| Unique Product Code | Không cho trùng mã sản phẩm | Tránh sai dữ liệu, sai import, sai tracking | Cao | Dễ | Dữ liệu sạch | Unique filtered index `Products.Code` | Validate create/update/import | Hiển thị lỗi trùng mã | Làm ngay |
| Unique Variant SKU | Không cho trùng SKU biến thể | SKU dùng cho kho, đơn hàng, barcode | Cao | Dễ | Vận hành kho chuẩn | Unique index `Variants.SKU` | Validate create/bulk/import | Hiển thị lỗi trùng SKU | Làm ngay |
| Search engine chuẩn | Mở rộng Meilisearch/OpenSearch document | Search hiện mới index name/code/description | Cao | Trung bình | Tìm nhanh, đúng, có facet | Không bắt buộc | Index thêm category, supplier, price, stock, rating, specs | Dùng kết quả backend thay vì filter client-side | Làm trước khi scale |
| Server-side filter | Đẩy price/rating/sale/out-of-stock filter về backend/search | Client filter trên một page sẽ sai pagination | Cao | Trung bình | Kết quả chính xác | Có thể cần index | API nhận đầy đủ filter | Bỏ filter client-side sai | Làm cùng search |
| Redis cache | Cache product detail, category, listing phổ biến | Memory cache không phù hợp multi-instance | Cao | Trung bình | Tăng tốc API, giảm DB load | Không đổi | Thêm Redis distributed cache | Giảm loading | Làm sau search |
| Async export Excel | Export bằng Hangfire job theo batch | Export hiện load toàn bộ catalog | Cao | Trung bình | Không timeout/OOM | Có thể thêm `ExportJobs` | Job tạo file, lưu object storage/local | UI xem trạng thái/tải file | Làm sớm |
| Import batch | Import theo batch, log lỗi từng dòng | Import lớn dễ chậm, khó debug | Cao | Trung bình | Vận hành tốt hơn | Có thể thêm `ImportJobs`, `ImportErrors` | Validate và commit theo batch | UI preview/log lỗi | Làm cùng export |
| Flash sale stock safety | Chống oversell | Nhiều user mua cùng lúc dễ race condition | Cao | Khó | Bảo vệ doanh thu và uy tín | `StockReservations`, `InventoryTransactions` | Atomic transaction, optimistic concurrency | Hiển thị remaining chính xác | Làm trước production |
| Upload hardening | Kiểm tra magic bytes, giới hạn folder, strip EXIF | Extension/content-type chưa đủ an toàn | Cao | Trung bình | Giảm rủi ro file độc hại | Lưu image metadata nếu cần | Validate sâu, scan, transcode | Báo lỗi rõ | Làm sớm |
| HTML sanitization | Sanitize mô tả/review rich text | Chống XSS | Cao | Trung bình | An toàn người dùng | Không đổi | Sanitize input/output | Render HTML an toàn | Làm sớm |
| Audit log đầy đủ | Log create/update/delete/status/price/stock | Hiện audit mới một phần | Cao | Trung bình | Truy vết vận hành | Có thể mở rộng audit schema | Ghi log các thay đổi quan trọng | Admin xem lịch sử | Làm sau bảo mật |

### Acceptance Criteria - Giai đoạn 1

- Không endpoint vận hành nhạy cảm nào public.
- Product Code và Variant SKU không thể trùng ở cấp database.
- Listing product filter đúng total item và total page.
- Search trả kết quả nhanh với category, supplier, price, rating, stock.
- Export 100.000 sản phẩm không timeout request.
- Import file lớn có log lỗi từng dòng.
- Flash sale không oversell khi nhiều request đồng thời.
- Upload từ chối file giả mạo extension.
- Product description/review không thể inject script.

## 5. Giai đoạn 2 - Nâng cao

Mục tiêu: nâng chất lượng trải nghiệm mua hàng và vận hành catalog.

| Tính năng | Mô tả | Lý do cần bổ sung | Mức độ ưu tiên | Độ khó triển khai | Giá trị mang lại | Ảnh hưởng Database | Ảnh hưởng Backend | Ảnh hưởng Frontend | Khuyến nghị triển khai |
|---|---|---|---|---|---|---|---|---|---|
| Product Attribute Schema | Tách specs thành attribute có cấu trúc | JSON string khó filter/search | Cao | Trung bình | Dữ liệu sạch, lọc thông minh | `ProductAttributes`, `ProductAttributeValues`, `CategoryAttributes` | API attribute theo category | Form specs động | Làm trước smart filter |
| Smart Filter | Lọc theo size, màu, brand, tuổi, chất liệu, rating | UX e-commerce cần lọc sâu | Cao | Trung bình | Tăng conversion | Dựa trên attribute/search index | Facet API | Sidebar/filter bar nâng cấp | Làm cùng search |
| Product Badge/Label | Best Seller, Trending, New Arrival, Deal | Tăng khả năng merchandising | Trung bình | Dễ | Tăng CTR | `ProductBadges` hoặc computed cache | Rule engine/cron job | Badge trên card/PDP | Làm sớm |
| Related Products | Sản phẩm liên quan theo category/brand/attribute | Tăng khám phá sản phẩm | Trung bình | Trung bình | Tăng page depth | Có thể không cần bảng riêng | API related | Block PDP | Làm sau attribute |
| Frequently Bought Together | Gợi ý mua kèm | Tăng AOV | Trung bình | Trung bình | Tăng doanh thu | `ProductCoPurchaseStats` | Job tính từ invoice | Block mua kèm | Làm sau có order data đủ |
| Product Q&A | Hỏi đáp trên PDP | Giảm rào cản mua hàng | Trung bình | Trung bình | Tăng niềm tin | `ProductQuestions`, `ProductAnswers` | CRUD + moderation | Tab Q&A | Có anti-spam |
| Rating Criteria | Rating theo tiêu chí | Review sâu hơn | Trung bình | Trung bình | Insight tốt hơn | `ReviewCriteria`, `ReviewCriterionScores` | Aggregate rating | Form review + chart | Làm sau review hiện tại |
| Product Version History | Lưu version mô tả, giá, ảnh, SEO | Dễ rollback và audit | Trung bình | Trung bình | Vận hành an toàn | `ProductVersions` | Snapshot trước update | Admin xem version | Làm cùng audit |
| Warranty | Quản lý bảo hành | Hữu ích với hàng có cam kết | Trung bình | Trung bình | Hậu mãi tốt | `ProductWarranties` | API warranty lookup | PDP/admin warranty | Theo ngành hàng |
| Product QR Code | QR tra cứu sản phẩm/bảo hành | Tăng tiện ích offline | Thấp/Trung bình | Dễ | Hỗ trợ kho/bảo hành | Có thể lưu QR URL | Generate QR | Hiển thị/tải QR | Làm sau warranty |
| Product Sitemap | Sitemap sản phẩm tự động | Tốt cho SEO | Trung bình | Dễ | Tăng index search engine | Không đổi | Endpoint sitemap XML | Không đổi | Làm sau SEO ổn |
| Product Compare nâng cao | So sánh theo attribute | Compare hiện có nhưng cần sâu hơn | Trung bình | Trung bình | Hỗ trợ quyết định mua | Dựa trên attributes | API compare details | Bảng compare động | Làm sau attribute schema |

### Acceptance Criteria - Giai đoạn 2

- Admin có thể cấu hình thuộc tính theo danh mục.
- Client có thể lọc sản phẩm bằng facet và kết quả phân trang đúng.
- Product card/PDP có badge chính xác.
- PDP hiển thị related products và frequently bought together.
- Review hỗ trợ tiêu chí nếu được bật.
- Admin xem được lịch sử thay đổi sản phẩm.
- Sitemap product/category hoạt động.

## 6. Giai đoạn 3 - Thông minh

Mục tiêu: dùng AI để giảm công vận hành và cá nhân hóa trải nghiệm.

| Tính năng | Mô tả | Lý do cần bổ sung | Mức độ ưu tiên | Độ khó triển khai | Giá trị mang lại | Ảnh hưởng Database | Ảnh hưởng Backend | Ảnh hưởng Frontend | Khuyến nghị triển khai |
|---|---|---|---|---|---|---|---|---|---|
| AI Generated Description | Sinh mô tả sản phẩm | Tăng tốc nhập liệu | Trung bình | Trung bình | Giảm công admin | Lưu AI draft/version | AI service + approval | Nút tạo mô tả | Không auto publish |
| AI Generated SEO | Sinh meta title/description | Tối ưu SEO nhanh | Trung bình | Trung bình | Cải thiện organic traffic | Lưu SEO draft | Prompt + validation độ dài | Admin review | Làm sau SEO fields ổn |
| AI Auto Translate | Dịch sản phẩm | Chuẩn bị multi-language | Thấp/Trung bình | Khó | Mở rộng thị trường | `ProductTranslations` | Translation job | Locale UI | Làm sau i18n |
| AI Category Suggestion | Gợi ý danh mục khi tạo/import | Giảm lỗi phân loại | Trung bình | Trung bình | Dữ liệu catalog sạch hơn | Log suggestion | Classification service | Suggest trong form/import | Làm sau attribute schema |
| AI Duplicate Detection | Phát hiện sản phẩm trùng | Tránh catalog rác | Trung bình | Khó | Dữ liệu sạch | Embedding/vector index | Similarity service | Cảnh báo khi tạo/import | Làm sau search |
| AI Image Optimization | Tối ưu ảnh, alt text, nền ảnh | Nâng chất lượng visual | Trung bình | Trung bình | Tăng UX/SEO | Image metadata | Image job | Preview ảnh tối ưu | Làm sau upload hardening |
| Recommendation Ranking | Nâng cấp recommendation hiện tại | ML.NET hiện chưa production-grade | Trung bình | Khó | Cá nhân hóa tốt hơn | Aggregate interactions | Candidate + ranking pipeline | Block đề xuất cá nhân | Làm khi có data |
| A/B Testing | Thử nghiệm thuật toán/banner/badge | Đo hiệu quả thật | Thấp | Khó | Tối ưu conversion | `Experiments`, `ExposureLogs` | Assignment + tracking | Tracking frontend | Làm sau analytics |
| Dynamic Pricing | Giá động theo tồn kho/nhu cầu | Tối ưu doanh thu | Thấp/Trung bình | Khó | Biên lợi nhuận tốt hơn | Price rules/history | Pricing engine | Hiển thị lý do deal | Cần kiểm soát kỹ |

### Acceptance Criteria - Giai đoạn 3

- AI chỉ tạo bản nháp, admin duyệt trước khi publish.
- Recommendation không loop toàn bộ productIds khi catalog lớn.
- Có log tương tác và tracking đủ để đánh giá hiệu quả.
- Duplicate detection chạy được trong create/import flow.
- AI output có validation độ dài, nội dung và ngôn ngữ.

## 7. Giai đoạn 4 - Mở rộng

Mục tiêu: mở rộng mô hình kinh doanh và kênh bán hàng.

| Tính năng | Mô tả | Lý do cần bổ sung | Mức độ ưu tiên | Độ khó triển khai | Giá trị mang lại | Ảnh hưởng Database | Ảnh hưởng Backend | Ảnh hưởng Frontend | Khuyến nghị triển khai |
|---|---|---|---|---|---|---|---|---|---|
| Multi Currency | Nhiều tiền tệ | Mở rộng thị trường | Thấp | Khó | Quốc tế hóa | `CurrencyRates`, `ProductPriceLists` | Currency pricing service | Hiển thị theo locale | Làm khi có nhu cầu |
| Multi Language | Nhiều ngôn ngữ | SEO và thị trường mới | Thấp/Trung bình | Khó | Mở rộng user | `ProductTranslations` | Locale API | i18n UI | Làm sau AI translate |
| Pre-order | Đặt trước sản phẩm | Bán hàng chưa có sẵn | Trung bình | Khó | Tăng doanh thu sớm | `PreOrders` | Order/payment flow | PDP preorder state | Cần inventory ledger |
| Product Reservation | Giữ hàng trong thời gian ngắn | Tránh mất hàng khi checkout | Trung bình | Khó | Checkout công bằng | `StockReservations` | Expiry job | Countdown checkout | Làm cùng stock safety |
| Product Subscription | Mua định kỳ | Hợp hàng tiêu dùng | Thấp/Trung bình | Khó | Doanh thu lặp lại | `SubscriptionPlans` | Billing scheduler | Chọn chu kỳ | Làm sau payment ổn |
| Digital Product | Sản phẩm số | Mở rộng danh mục | Thấp | Trung bình | Business mới | `DigitalAssets`, licenses | Fulfillment digital | Download/license UI | Theo định hướng |
| Gift Wrap/Gift Product | Quà tặng/gói quà | Tăng AOV | Thấp/Trung bình | Trung bình | Trải nghiệm tốt hơn | Gift options | Checkout extension | PDP/cart gift UI | Làm sau bundle |
| Marketplace/Multi Vendor | Nhiều nhà bán | Mở rộng quy mô kinh doanh | Cao nếu theo marketplace | Rất khó | Tăng catalog nhanh | `Sellers`, `SellerProducts`, commissions | Seller service | Seller dashboard | Làm thành project riêng |
| Headless Commerce | API-first cho nhiều kênh | Dùng chung web/mobile/PWA | Trung bình | Khó | Kiến trúc linh hoạt | Không bắt buộc | API versioning | FE/mobile dùng API | Làm trước mobile app |
| PWA/Mobile App | App/mobile commerce | Tăng retention | Trung bình | Trung bình | UX mobile tốt hơn | Device tokens | Push notification | PWA/app shell | Làm sau API ổn |
| Livestream Shopping | Bán hàng live | Tăng tương tác | Thấp/Trung bình | Khó | Social commerce | Live session/product pin | Live API | Live UI | Làm sau core ổn |
| Affiliate Marketing | Cộng tác viên | Tăng kênh bán | Trung bình | Khó | Tăng doanh số | Affiliate links, commission | Tracking + payout | Affiliate dashboard | Làm sau order/payment ổn |

## 8. Database Implementation Detail

### 8.1 Index cần bổ sung

Khuyến nghị thêm:

- `Products(Code)` unique filtered index nếu `Code` nullable.
- `Variants(SKU)` unique filtered index nếu `SKU` nullable.
- `Products(Status, IsDeleted, CategoryID, CreatedAt)`.
- `Products(SupplierID, Status, IsDeleted)`.
- `Products(Price)`.
- `Products(AverageRating, ReviewCount)`.
- `ProductImages(ProductID, DisplayOrder)`.
- `Variants(ProductID, Status, IsDeleted)`.
- `Variants(ProductID, Stock)`.
- `ProductAlerts(ProductId, AlertType, IsActive)`.
- `FlashSales(IsActive, StartTime, EndTime, Status)`.
- `FlashSaleItems(ItemType, ReferenceId)`.
- `Reviews(VariantID, IsHidden, CreatedAt)`.
- `Wishlists(ProductID)`.

### 8.2 Bảng mới đề xuất

```text
ProductAttributes
- Id
- CategoryId
- Name
- DataType
- Unit
- IsFilterable
- IsSearchable
- DisplayOrder
- IsRequired

ProductAttributeValues
- Id
- ProductId
- AttributeId
- ValueText
- ValueNumber
- ValueBoolean
- ValueDate

InventoryTransactions
- Id
- ProductId
- VariantId
- Type
- Quantity
- BeforeStock
- AfterStock
- ReferenceType
- ReferenceId
- CreatedBy
- CreatedAt

StockReservations
- Id
- VariantId
- UserId
- Quantity
- Status
- ExpiresAt
- CreatedAt

ProductVersions
- Id
- ProductId
- VersionNo
- SnapshotJson
- ChangeReason
- CreatedBy
- CreatedAt

ProductBadges
- Id
- ProductId
- BadgeType
- Label
- StartAt
- EndAt
- Priority
- IsActive

ProductQuestions
- Id
- ProductId
- UserId
- Content
- Status
- CreatedAt

ProductAnswers
- Id
- QuestionId
- UserId
- Content
- IsOfficial
- CreatedAt
```

## 9. Backend Implementation Detail

### 9.1 Product Service

Việc cần làm:

- Tách query listing thành query object.
- Thêm filter: price range, rating, in stock, has discount, supplier, attribute filters.
- Không fallback SQL `Contains` cho catalog lớn nếu Meilisearch lỗi; thay bằng degraded response hoặc limited fallback.
- Cache product detail theo `product:{id}` và `product:slug:{slug}`.
- Invalidate cache khi update/delete/toggle/variant update.
- Không load toàn bộ matching IDs từ search nếu kết quả lớn; dùng search engine pagination.

### 9.2 Search Engine Service

Meilisearch document nên có:

```json
{
  "id": 1,
  "slug": "example-product",
  "productName": "Example Product",
  "code": "SP000001",
  "description": "...",
  "categoryId": 10,
  "categoryName": "Diapers",
  "supplierId": 2,
  "supplierName": "Brand",
  "price": 100000,
  "minPrice": 90000,
  "maxPrice": 120000,
  "minEffectivePrice": 80000,
  "maxEffectivePrice": 110000,
  "status": true,
  "isDeleted": false,
  "inStock": true,
  "totalStock": 50,
  "rating": 4.7,
  "ratingCount": 120,
  "hasDiscount": true,
  "attributes": {
    "color": ["red", "blue"],
    "size": ["M", "L"],
    "age": ["0-6 months"]
  },
  "createdAt": "2026-07-01T00:00:00"
}
```

Search settings:

- Searchable: productName, code, description, supplierName, categoryName.
- Filterable: categoryId, supplierId, status, isDeleted, inStock, hasDiscount, price, rating, attributes.
- Sortable: createdAt, price, minEffectivePrice, rating, ratingCount, totalSold, totalWishlist.

### 9.3 Import/Export

Export flow đề xuất:

1. Admin bấm export.
2. Backend tạo `ExportJob`.
3. Hangfire xử lý theo batch.
4. File được lưu vào storage.
5. Admin nhận notification khi xong.
6. Frontend tải file bằng signed URL hoặc endpoint có quyền.

Import flow đề xuất:

1. Upload file.
2. Validate cấu trúc sheet.
3. Parse theo batch.
4. Trả preview lỗi/trùng.
5. Admin chọn xử lý: skip/update/create new.
6. Commit bằng job.
7. Ghi log lỗi từng dòng.

### 9.4 Flash Sale / Stock

Yêu cầu kỹ thuật:

- Khi thêm vào cart có thể chưa reserve hoặc reserve ngắn hạn.
- Khi checkout phải reserve stock bằng transaction.
- Khi payment fail/cancel/timeout phải release reservation.
- Khi order completed thì convert reservation thành inventory transaction.
- `SoldQuantity` phải cập nhật atomic.

## 10. Frontend Implementation Detail

### 10.1 Client Product Listing

Việc cần làm:

- Bỏ filter client-side đối với price/rating/sale/out-of-stock.
- Gửi toàn bộ filter lên backend/search API.
- Thêm debounce search 300-500ms.
- Đồng bộ URL query rõ ràng:
  - `q`
  - `categoryId`
  - `supplierId`
  - `minPrice`
  - `maxPrice`
  - `rating`
  - `inStock`
  - `hasDiscount`
  - `attributes[color]=red`
  - `sort`
  - `page`
- Thêm skeleton grid thay spinner.
- Lazy load image với width/height.
- Thêm empty state theo từng filter.

### 10.2 Product Detail Page

Việc cần làm:

- Cache product detail.
- Hiển thị badge, warranty, Q&A, rating criteria.
- Hiển thị stock/reservation state rõ ràng.
- Thêm recently viewed và recommendation ổn định hơn.
- Thêm structured data JSON-LD cho SEO.

### 10.3 Admin Product

Việc cần làm:

- Form thuộc tính động theo category.
- Cảnh báo duplicate product bằng AI/similarity.
- Cho xem Product Version History.
- Cho xem Inventory Ledger.
- Cho export/import job status.
- Thêm bulk action:
  - Bulk publish/unpublish.
  - Bulk assign badge.
  - Bulk update category.
  - Bulk update price/discount.
  - Bulk sync search index.

## 11. Bảo mật

Checklist triển khai:

- Khóa endpoint sync/index/export/import bằng permission.
- Sanitize HTML description/review.
- Thêm Content Security Policy.
- Không render HTML chưa sanitize.
- Check magic bytes file upload.
- Không cho upload SVG nếu chưa sanitize SVG.
- Strip EXIF metadata.
- Giới hạn folder upload whitelist.
- Rate limit riêng cho:
  - Search.
  - Upload.
  - Review.
  - Product alert subscribe.
  - Import.
- Log audit:
  - Create product.
  - Update product.
  - Delete product.
  - Toggle status.
  - Update price.
  - Update stock.
  - Update SEO.
  - Import commit.
  - Export request.

## 12. Hiệu năng

### 100.000 sản phẩm

Bắt buộc:

- Index đầy đủ.
- Meilisearch facet.
- Redis cache.
- Pagination server-side.
- Async export.
- CDN image.

### 1.000.000 sản phẩm

Bắt buộc:

- Search engine là nguồn chính cho listing.
- Cursor/keyset pagination cho admin.
- Read replica cho reporting.
- Background job cho import/export/sync.
- Precomputed stats:
  - Total sold.
  - Wishlist count.
  - Rating count.
  - Average rating.
  - Trending score.

### 10.000.000 sản phẩm

Bắt buộc:

- Search cluster.
- Event-driven indexing.
- Partition hoặc sharding theo category/seller.
- Redis cluster.
- Object storage + CDN.
- Async mọi tác vụ nặng.
- Product read model denormalized.
- Queue cho stock, recommendation, image processing.

## 13. Roadmap tổng hợp

### Phase 1 - Core Stabilization

Thời lượng tham khảo: 1-2 tuần.

- Khóa endpoint nhạy cảm.
- Unique Code/SKU.
- Index DB.
- Server-side filter.
- Search engine facet.
- Redis cache.
- Upload hardening.
- Sanitize HTML.
- Async export/import.

### Phase 2 - Catalog Experience

Thời lượng tham khảo: 2-4 tuần.

- Product Attribute Schema.
- Smart Filter.
- Product Badge/Label.
- Related Products.
- Frequently Bought Together.
- Q&A.
- Rating Criteria.
- Product Version History.
- Inventory Ledger.

### Phase 3 - AI & Personalization

Thời lượng tham khảo: 3-6 tuần.

- AI description.
- AI SEO.
- AI category suggestion.
- AI duplicate detection.
- AI image optimization.
- Recommendation ranking.
- A/B testing.

### Phase 4 - Business Expansion

Thời lượng tham khảo: 1-3 tháng tùy phạm vi.

- Multi-language.
- Multi-currency.
- Pre-order.
- Product reservation.
- Subscription.
- Digital product.
- Marketplace/multi-vendor.
- Headless commerce.
- PWA/mobile app.
- Affiliate/social/livestream commerce.

## 14. Thứ tự ưu tiên cụ thể

1. Khóa `sync-meilisearch`.
2. Thêm unique index Product Code và Variant SKU.
3. Thêm index cho Product/Variant/Review/FlashSale/ProductAlert.
4. Sửa product listing để filter đúng ở backend/search.
5. Mở rộng Meilisearch document và facet.
6. Chuyển cache sang Redis.
7. Chuyển export Excel sang Hangfire job.
8. Nâng import Excel thành batch job có log lỗi.
9. Làm inventory ledger và stock reservation.
10. Làm upload hardening và HTML sanitization.
11. Chuẩn hóa specs thành Product Attribute Schema.
12. Làm Smart Filter.
13. Làm Product Badge/Label.
14. Làm Related Products và Frequently Bought Together.
15. Làm Product Q&A và Rating Criteria.
16. Làm Product Version History.
17. Làm AI Generated Description/SEO.
18. Làm AI Category Suggestion và Duplicate Detection.
19. Làm recommendation ranking.
20. Mở rộng multi-language, multi-currency, preorder, subscription, marketplace.

## 15. Kết quả kỳ vọng

Sau Phase 1:

- Điểm module tăng từ **72/100** lên khoảng **82-85/100**.
- Hệ thống an toàn hơn.
- Listing/search đúng hơn.
- Export/import không còn là điểm nghẽn lớn.
- Có nền tốt cho catalog lớn.

Sau Phase 2:

- Điểm module có thể đạt **88-90/100**.
- Trải nghiệm lọc/tìm kiếm tốt hơn nhiều.
- Admin vận hành catalog chuyên nghiệp hơn.
- PDP có đủ yếu tố tăng chuyển đổi.

Sau Phase 3 và Phase 4:

- Điểm module có thể đạt **90+/100**.
- Có AI hỗ trợ vận hành.
- Có personalization.
- Có khả năng mở rộng mô hình kinh doanh thành marketplace/headless/mobile/social commerce.

