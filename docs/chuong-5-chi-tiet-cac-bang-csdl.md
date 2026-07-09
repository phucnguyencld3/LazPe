# 5.1.4. Chi tiết các thực thể

Phần này mô tả chi tiết các bảng chính trong cơ sở dữ liệu của hệ thống LazPe. Mỗi bảng được trình bày theo các trường dữ liệu, kiểu dữ liệu, khóa chính/khóa ngoại và ý nghĩa sử dụng.

**Mô tả:** Bảng dùng để lưu vai trò mặc định của ASP.NET Identity.

*Bảng 5.1: Bảng AspNetRoles*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | nvarchar(450) | Khóa chính | Mã định danh |
| ConcurrencyStamp | nvarchar(max) |  | Mã kiểm soát đồng thời |
| Name | nvarchar(256) |  | Tên |
| NormalizedName | nvarchar(256) |  | Tên chuẩn hóa |

**Mô tả:** Bảng dùng để lưu claim của vai trò.

*Bảng 5.2: Bảng AspNetRoleClaims*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| ClaimType | nvarchar(max) |  | Loại claim |
| ClaimValue | nvarchar(max) |  | Giá trị claim |
| RoleId | nvarchar(450) | Khóa ngoại | Mã vai trò |

**Mô tả:** Bảng dùng để lưu claim của người dùng.

*Bảng 5.3: Bảng AspNetUserClaims*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| ClaimType | nvarchar(max) |  | Loại claim |
| ClaimValue | nvarchar(max) |  | Giá trị claim |
| UserId | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng dùng để lưu thông tin đăng nhập ngoài như Google.

*Bảng 5.4: Bảng AspNetUserLogins*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| LoginProvider | nvarchar(450) | Khóa chính | Nhà cung cấp đăng nhập |
| ProviderKey | nvarchar(450) | Khóa chính | Khóa nhà cung cấp |
| ProviderDisplayName | nvarchar(max) |  | Tên hiển thị nhà cung cấp |
| UserId | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng trung gian liên kết người dùng và vai trò.

*Bảng 5.5: Bảng AspNetUserRoles*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| UserId | nvarchar(450) | Khóa chính, Khóa ngoại | Mã người dùng |
| RoleId | nvarchar(450) | Khóa chính, Khóa ngoại | Mã vai trò |

**Mô tả:** Bảng dùng để lưu token xác thực của người dùng.

*Bảng 5.6: Bảng AspNetUserTokens*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| UserId | nvarchar(450) | Khóa chính, Khóa ngoại | Mã người dùng |
| LoginProvider | nvarchar(450) | Khóa chính | Nhà cung cấp đăng nhập |
| Name | nvarchar(450) | Khóa chính | Tên |
| Value | nvarchar(max) |  | Giá trị |

**Mô tả:** Bảng dùng để lưu thông tin Address.

*Bảng 5.7: Bảng Address*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| AddressID | int | Khóa chính | Lưu thông tin address id |
| CreatedAt | datetime2 |  | Ngày tạo |
| DetailAddress | nvarchar(500) |  | Địa chỉ chi tiết |
| District | nvarchar(100) |  | Lưu thông tin district |
| IsDefault | bit |  | Đánh dấu mặc định |
| PhoneNumber | nvarchar(15) |  | Số điện thoại |
| Province | nvarchar(100) |  | Lưu thông tin province |
| RecipientName | nvarchar(100) |  | Tên người nhận |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
| Ward | nvarchar(100) |  | Lưu thông tin ward |

**Mô tả:** Bảng dùng để lưu thông tin tài khoản người dùng trong hệ thống.

*Bảng 5.8: Bảng AspNetUsers*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | nvarchar(450) | Khóa chính | Mã định danh |
| AccessFailedCount | int |  | Số lần đăng nhập thất bại |
| Avatar | nvarchar(500) |  | Lưu thông tin avatar |
| CoinsBalance | decimal(18,2) |  | Lưu thông tin coins balance |
| CoinsSignature | nvarchar(256) |  | Lưu thông tin coins signature |
| ConcurrencyStamp | nvarchar(max) |  | Mã kiểm soát đồng thời |
| DateOfBirth | datetime2 |  | Ngày sinh |
| Email | nvarchar(256) |  | Email |
| EmailConfirmed | bit |  | Trạng thái xác thực email |
| FullName | nvarchar(100) |  | Họ và tên |
| IsOnboarded | bit |  | Đánh dấu onboarded |
| IsWishlistPublic | bit |  | Đánh dấu wishlist public |
| LockoutEnabled | bit |  | Cho phép khóa tài khoản |
| LockoutEnd | datetimeoffset |  | Thời điểm hết khóa |
| NormalizedEmail | nvarchar(256) |  | Email chuẩn hóa |
| NormalizedUserName | nvarchar(256) |  | Tên đăng nhập chuẩn hóa |
| PasswordHash | nvarchar(max) |  | Mật khẩu đã mã hóa |
| PaymentPinFailedCount | int |  | Số lượng payment pin failed |
| PaymentPinHash | nvarchar(256) |  | Lưu thông tin payment pin hash |
| PaymentPinLockoutEnd | datetimeoffset |  | Lưu thông tin payment pin lockout end |
| PhoneNumber | nvarchar(13) |  | Số điện thoại |
| PhoneNumberConfirmed | bit |  | Lưu thông tin phone number confirmed |
| ReceiveEmailNotifications | bit |  | Lưu thông tin receive email notifications |
| ReceiveOrderUpdates | bit |  | Lưu thông tin receive order updates |
| ReceivePromotions | bit |  | Lưu thông tin receive promotions |
| ReferralCode | nvarchar(20) |  | Lưu thông tin referral code |
| RefreshToken | nvarchar(max) |  | Lưu thông tin refresh token |
| RefreshTokenExpiryTime | datetime2 |  | Thời gian refresh token expiry |
| RegisterDate | datetime2 |  | Ngày đăng ký |
| RoleTemplateId | int | Khóa ngoại | Mã mẫu quyền |
| SecurityStamp | nvarchar(max) |  | Mã bảo mật |
| Status | bit |  | Trạng thái |
| TwoFactorEnabled | bit |  | Trạng thái xác thực hai lớp |
| UserName | nvarchar(256) |  | Lưu thông tin user name |
| WalletBalance | decimal(18,2) |  | Lưu thông tin wallet balance |
| WalletSignature | nvarchar(256) |  | Lưu thông tin wallet signature |
| WishlistShareToken | nvarchar(max) |  | Lưu thông tin wishlist share token |

**Mô tả:** Bảng dùng để lưu hồ sơ trẻ em của người dùng.

*Bảng 5.9: Bảng BabyProfiles*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| BabyProfileID | int | Khóa chính, Khóa ngoại | Lưu thông tin baby profile id |
| CreatedAt | datetime2 |  | Ngày tạo |
| DateOfBirth | datetime2 |  | Ngày sinh |
| FavoriteColors | nvarchar(200) |  | Lưu thông tin favorite colors |
| Gender | nvarchar(20) |  | Lưu thông tin gender |
| HeightCm | float |  | Lưu thông tin height cm |
| Name | nvarchar(100) |  | Tên |
| Relationship | nvarchar(50) |  | Lưu thông tin relationship |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
| WeightKg | float |  | Lưu thông tin weight kg |

**Mô tả:** Bảng dùng để lưu lịch sử biến động ví, xu và điểm.

*Bảng 5.10: Bảng BalanceTransactions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| Amount | decimal(18,2) |  | Số tiền |
| CreatedAt | datetime2 |  | Ngày tạo |
| Direction | int |  | Lưu thông tin direction |
| HashSignature | nvarchar(256) |  | Đánh dấu h signature |
| IdempotencyKey | nvarchar(200) |  | Lưu thông tin idempotency key |
| InvoiceID | int | Khóa ngoại | Mã đơn hàng |
| Reason | nvarchar(255) |  | Lý do |
| SourceType | int |  | Lưu thông tin source type |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng dùng để lưu banner hiển thị trên website.

*Bảng 5.11: Bảng Banners*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(max) |  | Người tạo |
| Name | nvarchar(100) |  | Tên |
| Page | nvarchar(50) |  | Lưu thông tin page |
| Position | nvarchar(50) |  | Lưu thông tin position |
| PublishedAt | datetime2 |  | Thời điểm published |
| Status | nvarchar(20) |  | Trạng thái |
| Type | nvarchar(50) |  | Loại |
| UpdatedAt | datetime2 |  | Ngày cập nhật |
| Version | nvarchar(50) |  | Lưu thông tin version |

**Mô tả:** Bảng dùng để lưu thông tin BannerVersions.

*Bảng 5.12: Bảng BannerVersions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| BannerId | int | Khóa ngoại | Lưu thông tin banner id |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(max) |  | Người tạo |
| Version | nvarchar(50) |  | Lưu thông tin version |

**Mô tả:** Bảng dùng để lưu thông tin Bundles.

*Bảng 5.13: Bảng Bundles*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| BundleID | int | Khóa chính | Mã combo |
| Code | nvarchar(10) |  | Mã |
| CreatedBy | nvarchar(450) |  | Người tạo |
| CreatedDate | datetime2 |  | Ngày created |
| Description | nvarchar(500) |  | Mô tả |
| DiscountPercent | decimal(5,2) |  | Lưu thông tin discount percent |
| ImageUrl | nvarchar(max) |  | Đường dẫn hình ảnh |
| Name | nvarchar(300) |  | Tên |
| OriginalPrice | decimal(18,2) |  | Lưu thông tin original price |
| Price | decimal(18,2) |  | Giá bán |
| Status | bit |  | Trạng thái |
| UpdatedBy | nvarchar(450) |  | Người cập nhật |
| UpdatedDate | datetime2 |  | Ngày updated |

**Mô tả:** Bảng dùng để lưu thông tin BundleItems.

*Bảng 5.14: Bảng BundleItems*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| BundleItemID | int | Khóa chính | Lưu thông tin bundle item id |
| BundleID | int | Khóa ngoại | Mã combo |
| Quantity | int |  | Số lượng |
| SortOrder | int |  | Lưu thông tin sort order |
| VariantID | int | Khóa ngoại | Mã biến thể |

**Mô tả:** Bảng dùng để lưu giỏ hàng của người dùng.

*Bảng 5.15: Bảng Carts*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| CartID | int | Khóa chính | Mã giỏ hàng |
| CreatedDate | datetime2 |  | Ngày created |
| DiscountAmount | decimal(18,2) |  | Số tiền giảm |
| ShippingDiscountAmount | decimal(18,2) |  | Lưu thông tin shipping discount amount |
| ShippingVoucherID | int | Khóa ngoại | Mã voucher vận chuyển |
| Status | bit |  | Trạng thái |
| SubTotal | decimal(18,2) |  | Lưu thông tin sub total |
| TierDiscountAmount | decimal(18,2) |  | Lưu thông tin tier discount amount |
| TotalAmount | decimal(18,2) |  | Tổng tiền |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
| VoucherID | int | Khóa ngoại | Mã voucher |

**Mô tả:** Bảng dùng để lưu chi tiết sản phẩm trong giỏ hàng.

*Bảng 5.16: Bảng CartDetails*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| CartDetailID | int | Khóa chính | Lưu thông tin cart detail id |
| BundleID | int | Khóa ngoại | Mã combo |
| CartID | int | Khóa ngoại | Mã giỏ hàng |
| IsGift | bit |  | Đánh dấu gift |
| Quantity | int |  | Số lượng |
| TotalPrice | decimal(18,2) |  | Lưu thông tin total price |
| UnitPrice | decimal(18,2) |  | Lưu thông tin unit price |
| VariantID | int | Khóa ngoại | Mã biến thể |

**Mô tả:** Bảng dùng để lưu thông tin Categories.

*Bảng 5.17: Bảng Categories*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| CategoryID | int | Khóa chính | Mã danh mục |
| CategoryName | nvarchar(100) |  | Lưu thông tin category name |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(100) |  | Người tạo |
| Description | nvarchar(500) |  | Mô tả |
| Level | int |  | Lưu thông tin level |
| ParentID | int | Khóa ngoại | Lưu thông tin parent id |
| SortOrder | nvarchar(50) |  | Lưu thông tin sort order |
| Status | bit |  | Trạng thái |

**Mô tả:** Bảng dùng để lưu thông tin ChatMessages.

*Bảng 5.18: Bảng ChatMessages*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| ChatSessionId | nvarchar(450) | Khóa ngoại | Lưu thông tin chat session id |
| CreatedAt | datetime2 |  | Ngày tạo |
| ImageUrl | nvarchar(500) |  | Đường dẫn hình ảnh |
| IsFromAdmin | bit |  | Đánh dấu from admin |
| MessageText | nvarchar(max) |  | Lưu thông tin message text |
| SenderId | nvarchar(450) | Khóa ngoại | Lưu thông tin sender id |
| SenderName | nvarchar(100) |  | Lưu thông tin sender name |

**Mô tả:** Bảng dùng để lưu thông tin ChatSessions.

*Bảng 5.19: Bảng ChatSessions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | nvarchar(450) | Khóa chính | Mã định danh |
| AdminId | nvarchar(450) | Khóa ngoại | Lưu thông tin admin id |
| AdminName | nvarchar(100) |  | Lưu thông tin admin name |
| CreatedAt | datetime2 |  | Ngày tạo |
| CustomerName | nvarchar(100) |  | Lưu thông tin customer name |
| IsClosed | bit |  | Đánh dấu closed |
| IsWaitingForSupport | bit |  | Đánh dấu waiting for support |
| LastMessageText | nvarchar(500) |  | Lưu thông tin last message text |
| UnreadByAdmin | int |  | Lưu thông tin unread by admin |
| UnreadByCustomer | int |  | Lưu thông tin unread by customer |
| UpdatedAt | datetime2 |  | Ngày cập nhật |
| UserId | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng dùng để lưu thông tin Districts.

*Bảng 5.20: Bảng Districts*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| DistrictID | int | Khóa chính | Mã quận/huyện |
| ApiVersion | nvarchar(10) |  | Lưu thông tin api version |
| Code | nvarchar(20) |  | Mã |
| IsActive | bit |  | Trạng thái hoạt động |
| Name | nvarchar(100) |  | Tên |
| Note | nvarchar(max) |  | Ghi chú |
| ProvinceID | int | Khóa ngoại | Mã tỉnh/thành |
| ReplacedByCode | nvarchar(20) |  | Lưu thông tin replaced by code |

**Mô tả:** Bảng dùng để lưu thông tin FlashSales.

*Bảng 5.21: Bảng FlashSales*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| BannerUrl | nvarchar(1000) |  | Đường dẫn banner |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(100) |  | Người tạo |
| Description | nvarchar(max) |  | Mô tả |
| EndTime | datetime2 |  | Thời gian end |
| IsActive | bit |  | Trạng thái hoạt động |
| Name | nvarchar(200) |  | Tên |
| StartTime | datetime2 |  | Thời gian start |
| Status | int |  | Trạng thái |
| Type | int |  | Loại |

**Mô tả:** Bảng dùng để lưu thông tin FlashSaleItems.

*Bảng 5.22: Bảng FlashSaleItems*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| DiscountPrice | decimal(18,2) |  | Lưu thông tin discount price |
| DiscountType | int |  | Lưu thông tin discount type |
| FlashSaleId | int | Khóa ngoại | Lưu thông tin flash sale id |
| GiftVariantIds | nvarchar(max) |  | Lưu thông tin gift variant ids |
| ItemType | int |  | Lưu thông tin item type |
| MaxQuantityPerUser | int |  | Lưu thông tin max quantity per user |
| ReferenceId | int | Khóa ngoại | Lưu thông tin reference id |
| RequiredQuantity | int |  | Lưu thông tin required quantity |
| SoldQuantity | int |  | Lưu thông tin sold quantity |
| TotalQuantity | int |  | Lưu thông tin total quantity |

**Mô tả:** Bảng dùng để lưu thông tin đơn hàng.

*Bảng 5.23: Bảng Invoices*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| InvoiceID | int | Khóa chính | Mã đơn hàng |
| AmountToPay | decimal(18,2) |  | Lưu thông tin amount to pay |
| CancelReason | nvarchar(500) |  | Lưu thông tin cancel reason |
| CancelRefundMethod | int |  | Lưu thông tin cancel refund method |
| CancelledAt | datetime2 |  | Thời điểm cancelled |
| CoinsDiscountAmount | decimal(18,2) |  | Lưu thông tin coins discount amount |
| CompletedAt | datetime2 |  | Thời điểm completed |
| ConfirmedAt | datetime2 |  | Thời điểm confirmed |
| CreatedAt | datetime2 |  | Ngày tạo |
| DiscountAmount | decimal(18,2) |  | Số tiền giảm |
| InvoiceCode | nvarchar(50) |  | Lưu thông tin invoice code |
| IsDeleted | bit |  | Trạng thái xóa mềm |
| IsRefunded | bit |  | Đánh dấu refunded |
| IsReturnReceived | bit |  | Đánh dấu return received |
| Note | nvarchar(500) |  | Ghi chú |
| PayMethod | int |  | Lưu thông tin pay method |
| PointsDiscountAmount | decimal(18,2) |  | Lưu thông tin points discount amount |
| PrintTicketUrl | nvarchar(max) |  | Đường dẫn print ticket |
| RefundMethod | int |  | Lưu thông tin refund method |
| RefundedAt | datetime2 |  | Thời điểm refunded |
| ReturnDescription | nvarchar(1000) |  | Lưu thông tin return description |
| ReturnImageUrls | nvarchar(max) |  | Lưu thông tin return image urls |
| ReturnReason | nvarchar(max) |  | Lưu thông tin return reason |
| ShippedAt | datetime2 |  | Thời điểm shipped |
| ShippingAddress | nvarchar(500) |  | Lưu thông tin shipping address |
| ShippingDiscountAmount | decimal(18,2) |  | Lưu thông tin shipping discount amount |
| ShippingDistrict | nvarchar(100) |  | Lưu thông tin shipping district |
| ShippingFee | decimal(18,2) |  | Lưu thông tin shipping fee |
| ShippingPhone | nvarchar(15) |  | Lưu thông tin shipping phone |
| ShippingProvince | nvarchar(100) |  | Lưu thông tin shipping province |
| ShippingRecipientName | nvarchar(100) |  | Lưu thông tin shipping recipient name |
| ShippingStreetAddress | nvarchar(500) |  | Lưu thông tin shipping street address |
| ShippingVoucherID | int | Khóa ngoại | Mã voucher vận chuyển |
| ShippingWard | nvarchar(100) |  | Lưu thông tin shipping ward |
| Status | int |  | Trạng thái |
| SubTotal | decimal(18,2) |  | Lưu thông tin sub total |
| TierDiscountAmount | decimal(18,2) |  | Lưu thông tin tier discount amount |
| TotalPrice | decimal(18,2) |  | Lưu thông tin total price |
| TrackingCode | nvarchar(50) |  | Lưu thông tin tracking code |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
| VoucherDiscountAmount | decimal(18,2) |  | Lưu thông tin voucher discount amount |
| VoucherID | int | Khóa ngoại | Mã voucher |
| WalletDiscountAmount | decimal(18,2) |  | Lưu thông tin wallet discount amount |

**Mô tả:** Bảng dùng để lưu chi tiết sản phẩm trong đơn hàng.

*Bảng 5.24: Bảng InvoiceDetails*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| InvoiceDetailID | int | Khóa chính | Lưu thông tin invoice detail id |
| BundleID | int | Khóa ngoại | Mã combo |
| InvoiceID | int | Khóa ngoại | Mã đơn hàng |
| Quantity | int |  | Số lượng |
| TotalPrice | decimal(18,2) |  | Lưu thông tin total price |
| UnitPrice | decimal(18,2) |  | Lưu thông tin unit price |
| VariantID | int | Khóa ngoại | Mã biến thể |

**Mô tả:** Bảng dùng để lưu thông tin LoyaltyAuditLogs.

*Bảng 5.25: Bảng LoyaltyAuditLogs*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| LogID | bigint | Khóa chính | Lưu thông tin log id |
| Action | nvarchar(50) |  | Hành động |
| ActorEmail | nvarchar(256) |  | Lưu thông tin actor email |
| ActorID | nvarchar(450) | Khóa ngoại | Lưu thông tin actor id |
| EntityID | nvarchar(100) | Khóa ngoại | Lưu thông tin entity id |
| EntityName | nvarchar(100) |  | Lưu thông tin entity name |
| NewValue | nvarchar(max) |  | Lưu thông tin new value |
| Notes | nvarchar(1000) |  | Lưu thông tin notes |
| OldValue | nvarchar(max) |  | Lưu thông tin old value |
| Timestamp | datetime2 |  | Lưu thông tin timestamp |

**Mô tả:** Bảng dùng để lưu thông tin LoyaltyBirthdayGiftLogs.

*Bảng 5.26: Bảng LoyaltyBirthdayGiftLogs*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| GiftLogID | int | Khóa chính | Lưu thông tin gift log id |
| GiftType | nvarchar(50) |  | Lưu thông tin gift type |
| GiftValue | nvarchar(200) |  | Lưu thông tin gift value |
| IssuedBy | nvarchar(256) |  | Đánh dấu sued by |
| ReceivedAt | datetime2 |  | Thời điểm received |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
| Year | int |  | Lưu thông tin year |

**Mô tả:** Bảng dùng để lưu thông tin LoyaltyEarnPolicies.

*Bảng 5.27: Bảng LoyaltyEarnPolicies*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| PolicyID | int | Khóa chính | Lưu thông tin policy id |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(256) |  | Người tạo |
| EndDate | datetime2 |  | Ngày kết thúc |
| IsActive | bit |  | Trạng thái hoạt động |
| IsCampaign | bit |  | Đánh dấu campaign |
| Multiplier | decimal(5,2) |  | Lưu thông tin multiplier |
| Name | nvarchar(200) |  | Tên |
| PointsEarned | int |  | Lưu thông tin points earned |
| StartDate | datetime2 |  | Ngày bắt đầu |
| VndAmount | decimal(18,2) |  | Lưu thông tin vnd amount |

**Mô tả:** Bảng dùng để lưu thông tin LoyaltyManualRevocations.

*Bảng 5.28: Bảng LoyaltyManualRevocations*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| RevocationID | int | Khóa chính | Lưu thông tin revocation id |
| Amount | int |  | Số tiền |
| AuditorID | nvarchar(450) | Khóa ngoại | Lưu thông tin auditor id |
| CreatedAt | datetime2 |  | Ngày tạo |
| Reason | nvarchar(500) |  | Lý do |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng dùng để lưu thông tin LoyaltyMonthlyVouchers.

*Bảng 5.29: Bảng LoyaltyMonthlyVouchers*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| VoucherConfigID | int | Khóa chính | Lưu thông tin voucher config id |
| CreatedAt | datetime2 |  | Ngày tạo |
| DiscountType | int |  | Lưu thông tin discount type |
| DiscountValue | decimal(18,2) |  | Lưu thông tin discount value |
| IsActive | bit |  | Trạng thái hoạt động |
| MaxDiscount | decimal(18,2) |  | Lưu thông tin max discount |
| MinOrderValue | decimal(18,2) |  | Lưu thông tin min order value |
| TierID | int | Khóa ngoại | Lưu thông tin tier id |
| ValidityDays | int |  | Lưu thông tin validity days |
| VoucherCount | int |  | Số lượng voucher |

**Mô tả:** Bảng dùng để lưu lịch sử điểm thưởng.

*Bảng 5.30: Bảng LoyaltyPointHistories*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| HistoryID | bigint | Khóa chính | Lưu thông tin history id |
| Amount | int |  | Số tiền |
| CreatedAt | datetime2 |  | Ngày tạo |
| Description | nvarchar(500) |  | Mô tả |
| InvoiceID | int | Khóa ngoại | Mã đơn hàng |
| TransactionType | nvarchar(20) |  | Lưu thông tin transaction type |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng dùng để lưu hồ sơ khách hàng thân thiết.

*Bảng 5.31: Bảng LoyaltyProfiles*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| UserID | nvarchar(450) | Khóa chính, Khóa ngoại | Mã người dùng |
| AvailablePoints | int |  | Lưu thông tin available points |
| CurrentCheckInStreak | int |  | Lưu thông tin current check in streak |
| CurrentTierID | int | Khóa ngoại | Lưu thông tin current tier id |
| LastCheckInDate | datetime2 |  | Ngày last check in |
| LastUpdated | datetime2 |  | Lưu thông tin last updated |
| PointsToNextTier | int |  | Lưu thông tin points to next tier |
| RankAdjustmentOffset | int |  | Lưu thông tin rank adjustment offset |
| TotalPoints | int |  | Lưu thông tin total points |

**Mô tả:** Bảng dùng để lưu thông tin LoyaltyRedeemPolicies.

*Bảng 5.32: Bảng LoyaltyRedeemPolicies*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| PolicyID | int | Khóa chính | Lưu thông tin policy id |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(256) |  | Người tạo |
| DiscountVnd | decimal(18,2) |  | Lưu thông tin discount vnd |
| EndDate | datetime2 |  | Ngày kết thúc |
| IsActive | bit |  | Trạng thái hoạt động |
| Name | nvarchar(200) |  | Tên |
| PointsToRedeem | int |  | Lưu thông tin points to redeem |
| StartDate | datetime2 |  | Ngày bắt đầu |
| TierID | int | Khóa ngoại | Lưu thông tin tier id |

**Mô tả:** Bảng dùng để lưu thông tin LoyaltySettings.

*Bảng 5.33: Bảng LoyaltySettings*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| AllowEditReviewTimeLimitMinutes | int |  | Lưu thông tin allow edit review time limit minutes |
| AllowMultipleRewardsPerProduct | bit |  | Lưu thông tin allow multiple rewards per product |
| EnableReviewReward | bit |  | Lưu thông tin enable review reward |
| MaxReviewDaysAfterReceipt | int |  | Lưu thông tin max review days after receipt |
| MinimumReviewChars | int |  | Lưu thông tin minimum review chars |
| MinimumReviewWords | int |  | Lưu thông tin minimum review words |
| RequireDeliveryToReview | bit |  | Lưu thông tin require delivery to review |
| RequiredRatingForReward | int |  | Lưu thông tin required rating for reward |
| ReviewRewardPoints | int |  | Lưu thông tin review reward points |
| ReviewWithImageRewardPoints | int |  | Lưu thông tin review with image reward points |
| ReviewWithVideoRewardPoints | int |  | Lưu thông tin review with video reward points |
| UpdatedAt | datetime2 |  | Ngày cập nhật |
| WelcomeVoucherID | int | Khóa ngoại | Lưu thông tin welcome voucher id |

**Mô tả:** Bảng dùng để lưu thông tin LoyaltyTiers.

*Bảng 5.34: Bảng LoyaltyTiers*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| TierID | int | Khóa chính | Lưu thông tin tier id |
| BadgeIcon | nvarchar(200) |  | Lưu thông tin badge icon |
| ColorHex | nvarchar(50) |  | Lưu thông tin color hex |
| CreatedAt | datetime2 |  | Ngày tạo |
| IsActive | bit |  | Trạng thái hoạt động |
| MinPoints | int |  | Lưu thông tin min points |
| TierName | nvarchar(100) |  | Lưu thông tin tier name |
| UpdatedAt | datetime2 |  | Ngày cập nhật |

**Mô tả:** Bảng dùng để lưu thông tin LoyaltyTierPrivileges.

*Bảng 5.35: Bảng LoyaltyTierPrivileges*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| PrivilegeID | int | Khóa chính | Lưu thông tin privilege id |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(256) |  | Người tạo |
| IsActive | bit |  | Trạng thái hoạt động |
| Name | nvarchar(200) |  | Tên |
| PrivilegeType | nvarchar(50) |  | Lưu thông tin privilege type |
| TierID | int | Khóa ngoại | Lưu thông tin tier id |
| Value | nvarchar(500) |  | Giá trị |

**Mô tả:** Bảng dùng để lưu thông tin LoyaltyVoucherRedemptions.

*Bảng 5.36: Bảng LoyaltyVoucherRedemptions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| CreatedAt | datetime2 |  | Ngày tạo |
| EndDate | datetime2 |  | Ngày kết thúc |
| IsActive | bit |  | Trạng thái hoạt động |
| LimitPerUserPerPeriod | int |  | Lưu thông tin limit per user per period |
| PointCost | int |  | Lưu thông tin point cost |
| ResetCycle | int |  | Lưu thông tin reset cycle |
| ResetDayOfMonth | int |  | Lưu thông tin reset day of month |
| StartDate | datetime2 |  | Ngày bắt đầu |
| TierID | int | Khóa ngoại | Lưu thông tin tier id |
| TotalQuotaPerPeriod | int |  | Lưu thông tin total quota per period |
| UpdatedAt | datetime2 |  | Ngày cập nhật |
| VoucherID | int | Khóa ngoại | Mã voucher |

**Mô tả:** Bảng dùng để lưu thông tin LoyaltyVoucherRedemptionHistories.

*Bảng 5.37: Bảng LoyaltyVoucherRedemptionHistories*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| PeriodKey | nvarchar(20) |  | Lưu thông tin period key |
| PointCost | int |  | Lưu thông tin point cost |
| RedeemedAt | datetime2 |  | Thời điểm redeemed |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
| UserVoucherID | int | Khóa ngoại | Lưu thông tin user voucher id |
| VoucherID | int | Khóa ngoại | Mã voucher |

**Mô tả:** Bảng dùng để lưu thông báo hệ thống.

*Bảng 5.38: Bảng Notifications*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| ActionType | int |  | Lưu thông tin action type |
| ActionUrl | nvarchar(500) |  | Đường dẫn action |
| BannerImage | nvarchar(500) |  | Lưu thông tin banner image |
| Code | nvarchar(50) |  | Mã |
| Content | nvarchar(max) |  | Nội dung |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(100) |  | Người tạo |
| CustomTypeName | nvarchar(100) |  | Lưu thông tin custom type name |
| ExpiredAt | datetime2 |  | Thời điểm expired |
| HangfireJobId | nvarchar(100) | Khóa ngoại | Lưu thông tin hangfire job id |
| IsDeleted | bit |  | Trạng thái xóa mềm |
| IsPinned | bit |  | Đánh dấu pinned |
| Priority | int |  | Lưu thông tin priority |
| PublishedAt | datetime2 |  | Thời điểm published |
| ShortDescription | nvarchar(500) |  | Lưu thông tin short description |
| Status | int |  | Trạng thái |
| TargetType | int |  | Lưu thông tin target type |
| TargetValue | nvarchar(max) |  | Lưu thông tin target value |
| ThumbnailImage | nvarchar(500) |  | Lưu thông tin thumbnail image |
| Title | nvarchar(200) |  | Tiêu đề |
| Type | int |  | Loại |
| UpdatedAt | datetime2 |  | Ngày cập nhật |

**Mô tả:** Bảng dùng để lưu thông tin NotificationTemplates.

*Bảng 5.39: Bảng NotificationTemplates*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| CreatedAt | datetime2 |  | Ngày tạo |
| IsActive | bit |  | Trạng thái hoạt động |
| TemplateCode | nvarchar(50) |  | Lưu thông tin template code |
| TemplateContent | nvarchar(max) |  | Lưu thông tin template content |
| TemplateName | nvarchar(100) |  | Lưu thông tin template name |
| UpdatedAt | datetime2 |  | Ngày cập nhật |

**Mô tả:** Bảng dùng để lưu giao dịch thanh toán.

*Bảng 5.40: Bảng PaymentTransactions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| PaymentTransactionId | int | Khóa chính | Lưu thông tin payment transaction id |
| Amount | decimal(18,2) |  | Số tiền |
| CompletedAt | datetime2 |  | Thời điểm completed |
| CreatedAt | datetime2 |  | Ngày tạo |
| FailedAt | datetime2 |  | Thời điểm failed |
| FailureReason | nvarchar(500) |  | Lưu thông tin failure reason |
| InvoiceID | int | Khóa ngoại | Mã đơn hàng |
| PaidAt | datetime2 |  | Thời điểm paid |
| Provider | nvarchar(50) |  | Lưu thông tin provider |
| RawQuery | nvarchar(2000) |  | Lưu thông tin raw query |
| ResponseCode | nvarchar(10) |  | Lưu thông tin response code |
| Status | int |  | Trạng thái |
| TxnRef | nvarchar(50) |  | Lưu thông tin txn ref |
| VnPayTransactionNo | nvarchar(50) |  | Lưu thông tin vn pay transaction no |

**Mô tả:** Bảng dùng để lưu danh sách quyền chức năng.

*Bảng 5.41: Bảng Permissions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| Action | nvarchar(50) |  | Hành động |
| CreatedAt | datetime2 |  | Ngày tạo |
| Description | nvarchar(255) |  | Mô tả |
| IsActive | bit |  | Trạng thái hoạt động |
| Name | nvarchar(100) |  | Tên |
| Resource | nvarchar(50) |  | Tài nguyên áp dụng |

**Mô tả:** Bảng dùng để lưu thông tin sản phẩm kinh doanh.

*Bảng 5.42: Bảng Products*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| ProductID | int | Khóa chính | Mã sản phẩm |
| AverageRating | float |  | Lưu thông tin average rating |
| CategoryID | int | Khóa ngoại | Mã danh mục |
| Code | nvarchar(50) |  | Mã |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(max) |  | Người tạo |
| Description | nvarchar(max) |  | Mô tả |
| IsDeleted | bit |  | Trạng thái xóa mềm |
| MetaDescription | nvarchar(500) |  | Lưu thông tin meta description |
| MetaTitle | nvarchar(255) |  | Lưu thông tin meta title |
| Price | decimal(18,2) |  | Giá bán |
| ProductDiscountPercent | decimal(5,2) |  | Lưu thông tin product discount percent |
| ProductName | nvarchar(200) |  | Lưu thông tin product name |
| ReviewCount | int |  | Số lượng review |
| Slug | nvarchar(255) |  | Đường dẫn SEO |
| Specifications | nvarchar(max) |  | Lưu thông tin specifications |
| Status | bit |  | Trạng thái |
| Stock | int |  | Số lượng tồn kho |
| SupplierID | int | Khóa ngoại | Mã thương hiệu/nhà cung cấp |
| SupportsSubscription | bit |  | Lưu thông tin supports subscription |

**Mô tả:** Bảng dùng để lưu thông tin ProductAlerts.

*Bảng 5.43: Bảng ProductAlerts*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| AlertType | int |  | Lưu thông tin alert type |
| CreatedAt | datetime2 |  | Ngày tạo |
| IsActive | bit |  | Trạng thái hoạt động |
| LastNotifiedAt | datetime2 |  | Thời điểm last notified |
| ProductId | int | Khóa ngoại | Mã sản phẩm |
| TargetPrice | decimal(18,2) |  | Lưu thông tin target price |
| UserId | nvarchar(450) | Khóa ngoại | Mã người dùng |
| VariantId | int | Khóa ngoại | Mã biến thể |

**Mô tả:** Bảng dùng để lưu thông tin ProductImages.

*Bảng 5.44: Bảng ProductImages*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| ProductImageID | int | Khóa chính | Lưu thông tin product image id |
| DisplayOrder | int |  | Lưu thông tin display order |
| ImageUrl | nvarchar(max) |  | Đường dẫn hình ảnh |
| ProductID | int | Khóa ngoại | Mã sản phẩm |

**Mô tả:** Bảng dùng để lưu thông tin ProductOptions.

*Bảng 5.45: Bảng ProductOptions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| ProductOptionID | int | Khóa chính | Lưu thông tin product option id |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(100) |  | Người tạo |
| DisplayOrder | int |  | Lưu thông tin display order |
| Name | nvarchar(100) |  | Tên |
| ProductID | int | Khóa ngoại | Mã sản phẩm |

**Mô tả:** Bảng dùng để lưu thông tin ProductOptionValues.

*Bảng 5.46: Bảng ProductOptionValues*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| ProductOptionValueID | int | Khóa chính | Lưu thông tin product option value id |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(100) |  | Người tạo |
| DisplayOrder | int |  | Lưu thông tin display order |
| IsDeleted | bit |  | Trạng thái xóa mềm |
| Price | decimal(18,2) |  | Giá bán |
| ProductOptionID | int | Khóa ngoại | Lưu thông tin product option id |
| Value | nvarchar(50) |  | Giá trị |

**Mô tả:** Bảng dùng để lưu thông tin Provinces.

*Bảng 5.47: Bảng Provinces*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| ProvinceID | int | Khóa chính | Mã tỉnh/thành |
| ApiVersion | nvarchar(10) |  | Lưu thông tin api version |
| Code | nvarchar(20) |  | Mã |
| IsActive | bit |  | Trạng thái hoạt động |
| Name | nvarchar(100) |  | Tên |
| Note | nvarchar(max) |  | Ghi chú |
| ReplacedByCode | nvarchar(20) |  | Lưu thông tin replaced by code |

**Mô tả:** Bảng dùng để lưu thông tin ReferralRecords.

*Bảng 5.48: Bảng ReferralRecords*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| CreatedAt | datetime2 |  | Ngày tạo |
| HasCompletedFirstOrder | bit |  | Đánh dấu completed first order |
| IsPermanentlyActive | bit |  | Đánh dấu permanently active |
| ReferredUserId | nvarchar(450) | Khóa ngoại | Lưu thông tin referred user id |
| ReferrerId | nvarchar(450) | Khóa ngoại | Lưu thông tin referrer id |

**Mô tả:** Bảng dùng để lưu đánh giá sản phẩm.

*Bảng 5.49: Bảng Reviews*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| ReviewID | int | Khóa chính | Mã đánh giá |
| AutoModerationStatus | nvarchar(max) |  | Lưu thông tin auto moderation status |
| BundleID | int | Khóa ngoại | Mã combo |
| CensorshipReason | nvarchar(max) |  | Lưu thông tin censorship reason |
| Content | nvarchar(500) |  | Nội dung |
| CreatedAt | datetime2 |  | Ngày tạo |
| FlaggedReason | nvarchar(max) |  | Lưu thông tin flagged reason |
| HasEarnedRewardPoints | bit |  | Đánh dấu earned reward points |
| IsHidden | bit |  | Đánh dấu hidden |
| LoyaltyPointsEarned | int |  | Lưu thông tin loyalty points earned |
| Rating | int |  | Lưu thông tin rating |
| UpdatedAt | datetime2 |  | Ngày cập nhật |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
| VariantID | int | Khóa ngoại | Mã biến thể |
| ViolationScore | int |  | Lưu thông tin violation score |

**Mô tả:** Bảng dùng để lưu thông tin ReviewCensorshipLogs.

*Bảng 5.50: Bảng ReviewCensorshipLogs*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| LogID | int | Khóa chính | Lưu thông tin log id |
| Action | nvarchar(50) |  | Hành động |
| ActorID | nvarchar(450) | Khóa ngoại | Lưu thông tin actor id |
| Reason | nvarchar(500) |  | Lý do |
| ReviewID | int | Khóa ngoại | Mã đánh giá |
| Timestamp | datetime2 |  | Lưu thông tin timestamp |

**Mô tả:** Bảng dùng để lưu thông tin ReviewComments.

*Bảng 5.51: Bảng ReviewComments*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| CommentID | int | Khóa chính | Lưu thông tin comment id |
| Content | nvarchar(500) |  | Nội dung |
| CreatedAt | datetime2 |  | Ngày tạo |
| IsHidden | bit |  | Đánh dấu hidden |
| ParentCommentID | int | Khóa ngoại | Lưu thông tin parent comment id |
| ReviewID | int | Khóa ngoại | Mã đánh giá |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng dùng để lưu thông tin ReviewLikes.

*Bảng 5.52: Bảng ReviewLikes*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| LikeID | int | Khóa chính | Lưu thông tin like id |
| CreatedAt | datetime2 |  | Ngày tạo |
| ReviewID | int | Khóa ngoại | Mã đánh giá |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng dùng để lưu thông tin ReviewMedia.

*Bảng 5.53: Bảng ReviewMedia*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| MediaID | int | Khóa chính | Lưu thông tin media id |
| CreatedAt | datetime2 |  | Ngày tạo |
| MediaType | nvarchar(50) |  | Lưu thông tin media type |
| ReviewID | int | Khóa ngoại | Mã đánh giá |
| Url | nvarchar(2048) |  | Đường dẫn  |

**Mô tả:** Bảng dùng để lưu thông tin ReviewSensitiveKeywords.

*Bảng 5.54: Bảng ReviewSensitiveKeywords*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| KeywordID | int | Khóa chính | Lưu thông tin keyword id |
| Category | nvarchar(50) |  | Lưu thông tin category |
| CreatedAt | datetime2 |  | Ngày tạo |
| Severity | nvarchar(20) |  | Lưu thông tin severity |
| Word | nvarchar(100) |  | Lưu thông tin word |

**Mô tả:** Bảng dùng để lưu mẫu quyền.

*Bảng 5.55: Bảng RoleTemplates*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| CreatedAt | datetime2 |  | Ngày tạo |
| Description | nvarchar(255) |  | Mô tả |
| IsActive | bit |  | Trạng thái hoạt động |
| Name | nvarchar(100) |  | Tên |

**Mô tả:** Bảng dùng để lưu thông tin mua hàng định kỳ.

*Bảng 5.56: Bảng Subscriptions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| SubscriptionID | int | Khóa chính | Lưu thông tin subscription id |
| CompletedOccurrences | int |  | Lưu thông tin completed occurrences |
| CreatedAt | datetime2 |  | Ngày tạo |
| EndDate | datetime2 |  | Ngày kết thúc |
| FrequencyType | int |  | Lưu thông tin frequency type |
| FrequencyValue | int |  | Lưu thông tin frequency value |
| MaxOccurrences | int |  | Lưu thông tin max occurrences |
| NextBillingDate | datetime2 |  | Ngày next billing |
| ProductID | int | Khóa ngoại | Mã sản phẩm |
| Quantity | int |  | Số lượng |
| ShippingAddressId | int | Khóa ngoại | Lưu thông tin shipping address id |
| StartDate | datetime2 |  | Ngày bắt đầu |
| Status | int |  | Trạng thái |
| SubscribedPrice | decimal(18,2) |  | Lưu thông tin subscribed price |
| UpdatedAt | datetime2 |  | Ngày cập nhật |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
| VariantID | int | Khóa ngoại | Mã biến thể |

**Mô tả:** Bảng dùng để lưu thông tin SubscriptionPaymentHistories.

*Bảng 5.57: Bảng SubscriptionPaymentHistories*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| HistoryID | int | Khóa chính | Lưu thông tin history id |
| Amount | decimal(18,2) |  | Số tiền |
| CoinUsed | decimal(18,2) |  | Lưu thông tin coin used |
| InvoiceID | int | Khóa ngoại | Mã đơn hàng |
| Message | nvarchar(max) |  | Nội dung thông điệp |
| PaymentDate | datetime2 |  | Ngày payment |
| PaymentStatus | int |  | Lưu thông tin payment status |
| SubscriptionID | int | Khóa ngoại | Lưu thông tin subscription id |
| WalletUsed | decimal(18,2) |  | Lưu thông tin wallet used |

**Mô tả:** Bảng dùng để lưu thông tin Suppliers.

*Bảng 5.58: Bảng Suppliers*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| SupplierID | int | Khóa chính | Mã thương hiệu/nhà cung cấp |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(100) |  | Người tạo |
| Description | nvarchar(500) |  | Mô tả |
| Logo | nvarchar(max) |  | Lưu thông tin logo |
| Status | bit |  | Trạng thái |
| SupplierName | nvarchar(200) |  | Lưu thông tin supplier name |

**Mô tả:** Bảng dùng để lưu các quyền thuộc mẫu quyền.

*Bảng 5.59: Bảng TemplatePermissions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| TemplateId | int | Khóa chính, Khóa ngoại | Mã mẫu quyền |
| PermissionId | int | Khóa chính, Khóa ngoại | Mã quyền |

**Mô tả:** Bảng dùng để lưu thông tin UserAddresses.

*Bảng 5.60: Bảng UserAddresses*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| AddressID | int | Khóa chính | Lưu thông tin address id |
| CreatedAt | datetime2 |  | Ngày tạo |
| DistrictID | int | Khóa ngoại | Mã quận/huyện |
| IsDefault | bit |  | Đánh dấu mặc định |
| PhoneNumber | nvarchar(15) |  | Số điện thoại |
| ProvinceID | int | Khóa ngoại | Mã tỉnh/thành |
| RecipientName | nvarchar(100) |  | Tên người nhận |
| StreetAddress | nvarchar(500) |  | Lưu thông tin street address |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
| WardID | int | Khóa ngoại | Mã phường/xã |

**Mô tả:** Bảng dùng để lưu thông tin UserNotifications.

*Bảng 5.61: Bảng UserNotifications*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| CreatedAt | datetime2 |  | Ngày tạo |
| IsDeleted | bit |  | Trạng thái xóa mềm |
| IsRead | bit |  | Đánh dấu read |
| NotificationId | int | Khóa ngoại | Lưu thông tin notification id |
| ReadAt | datetime2 |  | Thời điểm read |
| UserId | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng dùng để lưu quyền được gán cho từng người dùng.

*Bảng 5.62: Bảng UserPermissions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| UserId | nvarchar(450) | Khóa chính, Khóa ngoại | Mã người dùng |
| PermissionId | int | Khóa chính, Khóa ngoại | Mã quyền |
| GrantedAt | datetime2 |  | Thời điểm granted |
| GrantedBy | nvarchar(max) |  | Lưu thông tin granted by |
| IsGranted | bit |  | Đánh dấu granted |

**Mô tả:** Bảng dùng để lưu voucher thuộc ví voucher của từng người dùng.

*Bảng 5.63: Bảng UserVouchers*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| UserVoucherID | int | Khóa chính | Lưu thông tin user voucher id |
| CollectedAt | datetime2 |  | Thời điểm collected |
| InvoiceID | int | Khóa ngoại | Mã đơn hàng |
| IssuedCode | nvarchar(50) |  | Đánh dấu sued code |
| SourceType | int |  | Lưu thông tin source type |
| Status | int |  | Trạng thái |
| UsedAt | datetime2 |  | Thời điểm used |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
| VoucherID | int | Khóa ngoại | Mã voucher |

**Mô tả:** Bảng dùng để lưu các biến thể của sản phẩm.

*Bảng 5.64: Bảng Variants*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| VariantID | int | Khóa chính | Mã biến thể |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(100) |  | Người tạo |
| Description | nvarchar(max) |  | Mô tả |
| ImageUrl | nvarchar(max) |  | Đường dẫn hình ảnh |
| IsDeleted | bit |  | Trạng thái xóa mềm |
| ProductID | int | Khóa ngoại | Mã sản phẩm |
| SKU | nvarchar(100) |  | Mã SKU |
| Status | bit |  | Trạng thái |
| Stock | int |  | Số lượng tồn kho |
| UnitPrice | decimal(18,2) |  | Lưu thông tin unit price |
| VariantDiscountPercent | decimal(5,2) |  | Lưu thông tin variant discount percent |
| VariantName | nvarchar(300) |  | Lưu thông tin variant name |

**Mô tả:** Bảng dùng để lưu thông tin VariantOptionValues.

*Bảng 5.65: Bảng VariantOptionValues*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| VariantID | int | Khóa chính, Khóa ngoại | Mã biến thể |
| ProductOptionValueID | int | Khóa chính, Khóa ngoại | Lưu thông tin product option value id |
| VariantOptionValueID | int | Khóa ngoại | Lưu thông tin variant option value id |

**Mô tả:** Bảng dùng để lưu thông tin voucher và mã giảm giá.

*Bảng 5.66: Bảng Vouchers*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| VoucherID | int | Khóa chính | Mã voucher |
| Code | nvarchar(50) |  | Mã |
| DiscountType | int |  | Lưu thông tin discount type |
| DiscountValue | decimal(18,2) |  | Lưu thông tin discount value |
| EndDate | datetime2 |  | Ngày kết thúc |
| ExclusiveType | int |  | Lưu thông tin exclusive type |
| IsFreeShipping | bit |  | Đánh dấu free shipping |
| MaxDiscount | decimal(18,2) |  | Lưu thông tin max discount |
| MaxShippingDiscount | decimal(18,2) |  | Lưu thông tin max shipping discount |
| MinOrderValue | decimal(18,2) |  | Lưu thông tin min order value |
| Name | nvarchar(200) |  | Tên |
| StartDate | datetime2 |  | Ngày bắt đầu |
| Status | bit |  | Trạng thái |
| TotalQuantity | int |  | Lưu thông tin total quantity |
| UsageLimitPerUser | int |  | Lưu thông tin usage limit per user |
| UsedQuantity | int |  | Lưu thông tin used quantity |
| VisibilityType | int |  | Lưu thông tin visibility type |
| VoucherType | int |  | Lưu thông tin voucher type |

**Mô tả:** Bảng dùng để lưu lịch sử sử dụng voucher.

*Bảng 5.67: Bảng VoucherUsages*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| CartID | int | Khóa ngoại | Mã giỏ hàng |
| DiscountAmount | decimal(18,2) |  | Số tiền giảm |
| InvoiceID | int | Khóa ngoại | Mã đơn hàng |
| OrderValue | decimal(18,2) |  | Lưu thông tin order value |
| UsedAt | datetime2 |  | Thời điểm used |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
| VoucherID | int | Khóa ngoại | Mã voucher |

**Mô tả:** Bảng dùng để lưu thông tin Wards.

*Bảng 5.68: Bảng Wards*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| WardID | int | Khóa chính | Mã phường/xã |
| ApiVersion | nvarchar(10) |  | Lưu thông tin api version |
| Code | nvarchar(20) |  | Mã |
| DistrictID | int | Khóa ngoại | Mã quận/huyện |
| IsActive | bit |  | Trạng thái hoạt động |
| Name | nvarchar(100) |  | Tên |
| Note | nvarchar(max) |  | Ghi chú |
| ReplacedByCode | nvarchar(20) |  | Lưu thông tin replaced by code |

**Mô tả:** Bảng dùng để lưu thông tin Wishlists.

*Bảng 5.69: Bảng Wishlists*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| UserID | nvarchar(450) | Khóa chính, Khóa ngoại | Mã người dùng |
| ProductID | int | Khóa chính, Khóa ngoại | Mã sản phẩm |
| CreatedAt | datetime2 |  | Ngày tạo |

**Mô tả:** Bảng dùng để lưu thông tin WithdrawRequests.

*Bảng 5.70: Bảng WithdrawRequests*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| RequestID | int | Khóa chính | Lưu thông tin request id |
| AdminNote | nvarchar(500) |  | Lưu thông tin admin note |
| Amount | decimal(18,2) |  | Số tiền |
| BankAccount | nvarchar(50) |  | Lưu thông tin bank account |
| BankName | nvarchar(100) |  | Lưu thông tin bank name |
| BankOwnerName | nvarchar(100) |  | Lưu thông tin bank owner name |
| CreatedAt | datetime2 |  | Ngày tạo |
| ProcessedAt | datetime2 |  | Thời điểm processed |
| Status | nvarchar(50) |  | Trạng thái |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |
