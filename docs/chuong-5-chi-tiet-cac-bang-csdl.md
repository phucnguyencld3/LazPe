# 5.1.4. Chi tiết các thực thể

Phần này mô tả chi tiết các bảng chính trong cơ sở dữ liệu của hệ thống LazPe. Mỗi bảng được trình bày theo các trường dữ liệu, kiểu dữ liệu, khóa chính/khóa ngoại và ý nghĩa sử dụng.

**Mô tả:** Bảng có chức năng quản lý các vai trò đăng nhập mặc định của hệ thống, làm cơ sở phân nhóm tài khoản và kiểm soát phạm vi truy cập theo cơ chế xác thực ASP.NET Identity.

*Bảng 5.1: Bảng AspNetRoles*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | nvarchar(450) | Khóa chính | Mã định danh |
| ConcurrencyStamp | nvarchar(max) |  | Mã kiểm soát đồng thời |
| Name | nvarchar(256) |  | Tên |
| NormalizedName | nvarchar(256) |  | Tên chuẩn hóa |

**Mô tả:** Bảng có chức năng khai báo các quyền mở rộng gắn với từng vai trò, giúp hệ thống xác định vai trò đó được phép thực hiện những thao tác nghiệp vụ nào.

*Bảng 5.2: Bảng AspNetRoleClaims*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| ClaimType | nvarchar(max) |  | Loại claim |
| ClaimValue | nvarchar(max) |  | Giá trị claim |
| RoleId | nvarchar(450) | Khóa ngoại | Mã vai trò |

**Mô tả:** Bảng có chức năng ghi nhận các quyền hoặc thuộc tính xác thực riêng của từng tài khoản, phục vụ các trường hợp cần phân quyền chi tiết hơn vai trò chung.

*Bảng 5.3: Bảng AspNetUserClaims*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| ClaimType | nvarchar(max) |  | Loại claim |
| ClaimValue | nvarchar(max) |  | Giá trị claim |
| UserId | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng có chức năng quản lý thông tin đăng nhập qua nhà cung cấp bên ngoài như Google, giúp người dùng có thể liên kết tài khoản hệ thống với tài khoản đăng nhập xã hội.

*Bảng 5.4: Bảng AspNetUserLogins*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| LoginProvider | nvarchar(450) | Khóa chính | Nhà cung cấp đăng nhập |
| ProviderKey | nvarchar(450) | Khóa chính | Khóa nhà cung cấp |
| ProviderDisplayName | nvarchar(max) |  | Tên hiển thị nhà cung cấp |
| UserId | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng có chức năng liên kết tài khoản người dùng với vai trò tương ứng, từ đó xác định người dùng thuộc nhóm quyền nào trong hệ thống.

*Bảng 5.5: Bảng AspNetUserRoles*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| UserId | nvarchar(450) | Khóa chính, Khóa ngoại | Mã người dùng |
| RoleId | nvarchar(450) | Khóa chính, Khóa ngoại | Mã vai trò |

**Mô tả:** Bảng có chức năng quản lý các token xác thực của người dùng, hỗ trợ đăng nhập, xác minh tài khoản, khôi phục mật khẩu và các nghiệp vụ bảo mật liên quan.

*Bảng 5.6: Bảng AspNetUserTokens*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| UserId | nvarchar(450) | Khóa chính, Khóa ngoại | Mã người dùng |
| LoginProvider | nvarchar(450) | Khóa chính | Nhà cung cấp đăng nhập |
| Name | nvarchar(450) | Khóa chính | Tên |
| Value | nvarchar(max) |  | Giá trị |

**Mô tả:** Bảng có chức năng quản lý địa chỉ giao hàng chung, bao gồm thông tin người nhận, số điện thoại và khu vực giao nhận để phục vụ quá trình đặt hàng.

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

**Mô tả:** Bảng có chức năng quản lý tài khoản người dùng của hệ thống, bao gồm thông tin đăng nhập, thông tin cá nhân, trạng thái tài khoản, ví, xu, bảo mật và các thiết lập liên quan.

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

**Mô tả:** Bảng có chức năng quản lý hồ sơ trẻ em của khách hàng, phục vụ cá nhân hóa gợi ý sản phẩm, theo dõi thông tin phát triển và chăm sóc bé.

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

**Mô tả:** Bảng có chức năng ghi nhận biến động số dư ví, xu và điểm của người dùng, giúp đối soát các giao dịch cộng/trừ phát sinh trong hệ thống.

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

**Mô tả:** Bảng có chức năng quản lý banner hiển thị trên website, phục vụ truyền thông chương trình khuyến mãi, danh mục nổi bật và nội dung quảng bá.

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

**Mô tả:** Bảng có chức năng quản lý các phiên bản của banner, hỗ trợ lưu bản nháp, xuất bản, khôi phục phiên bản cũ và kiểm soát lịch sử thay đổi nội dung hiển thị.

*Bảng 5.12: Bảng BannerVersions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| BannerId | int | Khóa ngoại | Lưu thông tin banner id |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(max) |  | Người tạo |
| Version | nvarchar(50) |  | Lưu thông tin version |

**Mô tả:** Bảng có chức năng quản lý các gói combo sản phẩm, cho phép hệ thống bán nhiều sản phẩm theo nhóm với giá ưu đãi hoặc chương trình riêng.

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

**Mô tả:** Bảng có chức năng quản lý danh sách sản phẩm thuộc từng combo, xác định sản phẩm, biến thể, số lượng và giá trị của từng thành phần trong gói.

*Bảng 5.14: Bảng BundleItems*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| BundleItemID | int | Khóa chính | Lưu thông tin bundle item id |
| BundleID | int | Khóa ngoại | Mã combo |
| Quantity | int |  | Số lượng |
| SortOrder | int |  | Lưu thông tin sort order |
| VariantID | int | Khóa ngoại | Mã biến thể |

**Mô tả:** Bảng có chức năng quản lý giỏ hàng của từng khách hàng, làm nơi tập hợp các sản phẩm khách đã chọn trước khi chuyển sang thanh toán.

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

**Mô tả:** Bảng có chức năng quản lý chi tiết từng sản phẩm trong giỏ hàng, bao gồm biến thể, số lượng, quà tặng và trạng thái chọn mua.

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

**Mô tả:** Bảng có chức năng quản lý danh mục sản phẩm, hỗ trợ phân loại hàng hóa, lọc sản phẩm, hiển thị menu và tổ chức cấu trúc kinh doanh.

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

**Mô tả:** Bảng có chức năng ghi nhận nội dung tin nhắn trong các phiên chat, giúp khách hàng và quản trị viên trao đổi, hỗ trợ và theo dõi lịch sử tư vấn.

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

**Mô tả:** Bảng có chức năng quản lý phiên trò chuyện giữa khách hàng và bộ phận hỗ trợ, theo dõi trạng thái xử lý, người phụ trách và thời điểm trao đổi.

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

**Mô tả:** Bảng có chức năng quản lý dữ liệu quận/huyện, hỗ trợ chuẩn hóa địa chỉ giao hàng và liên kết với tỉnh/thành phố trong quy trình vận chuyển.

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

**Mô tả:** Bảng có chức năng quản lý chương trình flash sale, bao gồm thời gian diễn ra, trạng thái và cấu hình khuyến mãi theo từng đợt bán nhanh.

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

**Mô tả:** Bảng có chức năng quản lý các sản phẩm tham gia flash sale, xác định giá khuyến mãi, số lượng giới hạn và hiệu lực của từng sản phẩm trong chương trình.

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

**Mô tả:** Bảng có chức năng quản lý đơn hàng/hóa đơn của khách hàng, bao gồm thông tin giao hàng, thanh toán, trạng thái xử lý, giảm giá và tổng tiền.

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

**Mô tả:** Bảng có chức năng quản lý chi tiết sản phẩm trong từng đơn hàng, giúp lưu lại mặt hàng, biến thể, số lượng, đơn giá và thành tiền tại thời điểm mua.

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

**Mô tả:** Bảng có chức năng theo dõi nhật ký thay đổi trong phân hệ khách hàng thân thiết, giúp kiểm tra ai đã thay đổi chính sách, điểm, hạng hoặc voucher.

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

**Mô tả:** Bảng có chức năng ghi nhận lịch sử phát quà sinh nhật cho khách hàng, hỗ trợ kiểm soát điều kiện nhận quà và tránh phát trùng.

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

**Mô tả:** Bảng có chức năng quản lý chính sách tích điểm, quy định người dùng được cộng điểm từ những hành động như mua hàng, đánh giá, điểm danh hoặc hoàn thiện hồ sơ.

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

**Mô tả:** Bảng có chức năng ghi nhận các thao tác thu hồi hoặc điều chỉnh điểm thủ công, phục vụ xử lý khiếu nại và kiểm soát nghiệp vụ của quản trị viên.

*Bảng 5.28: Bảng LoyaltyManualRevocations*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| RevocationID | int | Khóa chính | Lưu thông tin revocation id |
| Amount | int |  | Số tiền |
| AuditorID | nvarchar(450) | Khóa ngoại | Lưu thông tin auditor id |
| CreatedAt | datetime2 |  | Ngày tạo |
| Reason | nvarchar(500) |  | Lý do |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng có chức năng quản lý voucher phát định kỳ hàng tháng cho thành viên, thường áp dụng theo hạng khách hàng hoặc chiến dịch chăm sóc khách hàng.

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

**Mô tả:** Bảng có chức năng ghi nhận lịch sử cộng, trừ và sử dụng điểm thưởng của khách hàng, giúp người dùng và quản trị viên tra cứu nguồn phát sinh điểm.

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

**Mô tả:** Bảng có chức năng quản lý hồ sơ khách hàng thân thiết, bao gồm điểm hiện có, hạng thành viên, tiến độ nâng hạng và thông tin hoạt động loyalty.

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

**Mô tả:** Bảng có chức năng quản lý chính sách đổi điểm, quy định tỷ lệ đổi, điều kiện áp dụng, giới hạn sử dụng và loại phần thưởng có thể quy đổi.

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

**Mô tả:** Bảng có chức năng quản lý cấu hình chung của phân hệ loyalty, giúp bật/tắt các cơ chế tích điểm, đổi điểm, điểm danh, sinh nhật và các giới hạn vận hành.

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

**Mô tả:** Bảng có chức năng quản lý các hạng thành viên, xác định tên hạng, ngưỡng điểm, điều kiện đạt hạng và cách hiển thị cấp bậc khách hàng.

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

**Mô tả:** Bảng có chức năng quản lý đặc quyền theo từng hạng thành viên, như ưu đãi giảm giá, freeship, quà tặng, voucher riêng hoặc quyền lợi chăm sóc khách hàng.

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

**Mô tả:** Bảng có chức năng quản lý các voucher có thể đổi bằng điểm thưởng, xác định số điểm cần đổi, số lượng, thời hạn và điều kiện nhận voucher.

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

**Mô tả:** Bảng có chức năng ghi nhận lịch sử người dùng đổi điểm lấy voucher, giúp kiểm soát lượt đổi, điểm đã sử dụng và voucher đã cấp.

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

**Mô tả:** Bảng có chức năng quản lý các thông báo hệ thống gửi đến người dùng hoặc quản trị viên, bao gồm nội dung, đối tượng nhận, trạng thái và thời gian gửi.

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

**Mô tả:** Bảng có chức năng quản lý mẫu thông báo dùng lại, giúp chuẩn hóa nội dung gửi cho các nghiệp vụ như đơn hàng, voucher, bảo mật và chương trình khuyến mãi.

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

**Mô tả:** Bảng có chức năng quản lý giao dịch thanh toán, ghi nhận kết quả thanh toán qua ví, VNPay hoặc phương thức khác để phục vụ đối soát đơn hàng.

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

**Mô tả:** Bảng có chức năng quản lý danh mục quyền chức năng trong hệ thống, làm cơ sở để gán quyền cho người dùng hoặc tạo mẫu quyền quản trị.

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

**Mô tả:** Bảng có chức năng quản lý thông tin sản phẩm kinh doanh, bao gồm tên, mô tả, giá, danh mục, thương hiệu, tồn kho, SEO và trạng thái hiển thị.

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

**Mô tả:** Bảng có chức năng quản lý các yêu cầu nhận cảnh báo sản phẩm của khách hàng, như thông báo khi sản phẩm còn hàng, giảm giá hoặc thay đổi thông tin.

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

**Mô tả:** Bảng có chức năng quản lý thư viện hình ảnh của sản phẩm, hỗ trợ hiển thị ảnh chính, ảnh phụ và thứ tự ảnh trên giao diện mua sắm.

*Bảng 5.44: Bảng ProductImages*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| ProductImageID | int | Khóa chính | Lưu thông tin product image id |
| DisplayOrder | int |  | Lưu thông tin display order |
| ImageUrl | nvarchar(max) |  | Đường dẫn hình ảnh |
| ProductID | int | Khóa ngoại | Mã sản phẩm |

**Mô tả:** Bảng có chức năng quản lý các nhóm thuộc tính lựa chọn của sản phẩm như màu sắc, kích cỡ, độ tuổi hoặc dung tích, làm cơ sở tạo biến thể.

*Bảng 5.45: Bảng ProductOptions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| ProductOptionID | int | Khóa chính | Lưu thông tin product option id |
| CreatedAt | datetime2 |  | Ngày tạo |
| CreatedBy | nvarchar(100) |  | Người tạo |
| DisplayOrder | int |  | Lưu thông tin display order |
| Name | nvarchar(100) |  | Tên |
| ProductID | int | Khóa ngoại | Mã sản phẩm |

**Mô tả:** Bảng có chức năng quản lý các giá trị cụ thể của từng thuộc tính sản phẩm, ví dụ đỏ, xanh, size S, size M hoặc nhóm độ tuổi, để khách chọn đúng biến thể cần mua.

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

**Mô tả:** Bảng có chức năng quản lý dữ liệu tỉnh/thành phố, hỗ trợ chuẩn hóa địa chỉ giao hàng và liên kết với quận/huyện, phường/xã trong hệ thống.

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

**Mô tả:** Bảng có chức năng ghi nhận hoạt động giới thiệu người dùng, theo dõi người giới thiệu, người được giới thiệu và phần thưởng phát sinh từ chương trình referral.

*Bảng 5.48: Bảng ReferralRecords*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| CreatedAt | datetime2 |  | Ngày tạo |
| HasCompletedFirstOrder | bit |  | Đánh dấu completed first order |
| IsPermanentlyActive | bit |  | Đánh dấu permanently active |
| ReferredUserId | nvarchar(450) | Khóa ngoại | Lưu thông tin referred user id |
| ReferrerId | nvarchar(450) | Khóa ngoại | Lưu thông tin referrer id |

**Mô tả:** Bảng có chức năng quản lý đánh giá sản phẩm của khách hàng, bao gồm điểm đánh giá, nội dung nhận xét, trạng thái kiểm duyệt và liên kết đơn hàng/sản phẩm.

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

**Mô tả:** Bảng có chức năng ghi nhận lịch sử kiểm duyệt đánh giá, giúp quản trị viên theo dõi quyết định duyệt, ẩn, từ chối hoặc xử lý nội dung vi phạm.

*Bảng 5.50: Bảng ReviewCensorshipLogs*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| LogID | int | Khóa chính | Lưu thông tin log id |
| Action | nvarchar(50) |  | Hành động |
| ActorID | nvarchar(450) | Khóa ngoại | Lưu thông tin actor id |
| Reason | nvarchar(500) |  | Lý do |
| ReviewID | int | Khóa ngoại | Mã đánh giá |
| Timestamp | datetime2 |  | Lưu thông tin timestamp |

**Mô tả:** Bảng có chức năng quản lý bình luận hoặc phản hồi dưới đánh giá, hỗ trợ trao đổi giữa khách hàng và quản trị viên về trải nghiệm sản phẩm.

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

**Mô tả:** Bảng có chức năng quản lý lượt thích đối với đánh giá, giúp hệ thống xác định đánh giá hữu ích và tăng tính tương tác của người dùng.

*Bảng 5.52: Bảng ReviewLikes*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| LikeID | int | Khóa chính | Lưu thông tin like id |
| CreatedAt | datetime2 |  | Ngày tạo |
| ReviewID | int | Khóa ngoại | Mã đánh giá |
| UserID | nvarchar(450) | Khóa ngoại | Mã người dùng |

**Mô tả:** Bảng có chức năng quản lý hình ảnh hoặc video đính kèm trong đánh giá, giúp khách hàng minh họa trải nghiệm thực tế khi sử dụng sản phẩm.

*Bảng 5.53: Bảng ReviewMedia*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| MediaID | int | Khóa chính | Lưu thông tin media id |
| CreatedAt | datetime2 |  | Ngày tạo |
| MediaType | nvarchar(50) |  | Lưu thông tin media type |
| ReviewID | int | Khóa ngoại | Mã đánh giá |
| Url | nvarchar(2048) |  | Đường dẫn |

**Mô tả:** Bảng có chức năng quản lý danh sách từ khóa nhạy cảm phục vụ kiểm duyệt tự động đánh giá, bình luận và nội dung người dùng nhập.

*Bảng 5.54: Bảng ReviewSensitiveKeywords*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| KeywordID | int | Khóa chính | Lưu thông tin keyword id |
| Category | nvarchar(50) |  | Lưu thông tin category |
| CreatedAt | datetime2 |  | Ngày tạo |
| Severity | nvarchar(20) |  | Lưu thông tin severity |
| Word | nvarchar(100) |  | Lưu thông tin word |

**Mô tả:** Bảng có chức năng quản lý mẫu quyền, giúp quản trị viên tạo sẵn bộ quyền theo nhóm chức năng để gán nhanh cho tài khoản quản trị.

*Bảng 5.55: Bảng RoleTemplates*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | int | Khóa chính | Mã định danh |
| CreatedAt | datetime2 |  | Ngày tạo |
| Description | nvarchar(255) |  | Mô tả |
| IsActive | bit |  | Trạng thái hoạt động |
| Name | nvarchar(100) |  | Tên |

**Mô tả:** Bảng có chức năng quản lý đăng ký mua hàng định kỳ của khách hàng, bao gồm sản phẩm, chu kỳ giao, ngày giao tiếp theo, trạng thái và thông tin thanh toán.

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

**Mô tả:** Bảng có chức năng ghi nhận lịch sử thanh toán của các đơn mua định kỳ, giúp kiểm soát thanh toán thành công, thất bại hoặc cần xử lý lại.

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

**Mô tả:** Bảng có chức năng quản lý thương hiệu hoặc nhà cung cấp sản phẩm, hỗ trợ phân loại sản phẩm, lọc theo thương hiệu và quản lý nguồn hàng.

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

**Mô tả:** Bảng có chức năng liên kết mẫu quyền với các quyền cụ thể, xác định một mẫu quyền bao gồm những quyền thao tác nào trong hệ thống.

*Bảng 5.59: Bảng TemplatePermissions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| TemplateId | int | Khóa chính, Khóa ngoại | Mã mẫu quyền |
| PermissionId | int | Khóa chính, Khóa ngoại | Mã quyền |

**Mô tả:** Bảng có chức năng quản lý các địa chỉ giao hàng riêng của từng người dùng, hỗ trợ thêm, sửa, xóa và chọn địa chỉ mặc định khi thanh toán.

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

**Mô tả:** Bảng có chức năng quản lý trạng thái thông báo theo từng người dùng, cho biết thông báo nào đã gửi, đã đọc, đã xóa hoặc còn hiển thị.

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

**Mô tả:** Bảng có chức năng quản lý quyền được gán trực tiếp cho từng người dùng, hỗ trợ phân quyền chi tiết ngoài vai trò hoặc mẫu quyền.

*Bảng 5.62: Bảng UserPermissions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| UserId | nvarchar(450) | Khóa chính, Khóa ngoại | Mã người dùng |
| PermissionId | int | Khóa chính, Khóa ngoại | Mã quyền |
| GrantedAt | datetime2 |  | Thời điểm granted |
| GrantedBy | nvarchar(max) |  | Lưu thông tin granted by |
| IsGranted | bit |  | Đánh dấu granted |

**Mô tả:** Bảng có chức năng quản lý ví voucher của người dùng, ghi nhận voucher đã nhận, đã dùng, còn hạn hoặc hết hạn để áp dụng khi mua hàng.

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

**Mô tả:** Bảng có chức năng quản lý các biến thể sản phẩm, xác định SKU, giá, tồn kho, ảnh, trạng thái và tổ hợp lựa chọn mà khách hàng có thể mua.

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

**Mô tả:** Bảng có chức năng liên kết biến thể với các giá trị thuộc tính, giúp xác định một biến thể cụ thể được tạo từ màu sắc, kích cỡ hoặc lựa chọn nào.

*Bảng 5.65: Bảng VariantOptionValues*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| VariantID | int | Khóa chính, Khóa ngoại | Mã biến thể |
| ProductOptionValueID | int | Khóa chính, Khóa ngoại | Lưu thông tin product option value id |
| VariantOptionValueID | int | Khóa ngoại | Lưu thông tin variant option value id |

**Mô tả:** Bảng có chức năng quản lý mã giảm giá và ưu đãi của hệ thống, bao gồm điều kiện áp dụng, loại giảm giá, số lượng, thời hạn và trạng thái phát hành.

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

**Mô tả:** Bảng có chức năng ghi nhận lịch sử sử dụng voucher trong đơn hàng, giúp kiểm soát lượt dùng, giới hạn theo người dùng và hiệu quả chương trình khuyến mãi.

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

**Mô tả:** Bảng có chức năng quản lý dữ liệu phường/xã, hỗ trợ chuẩn hóa địa chỉ giao hàng chi tiết và liên kết với quận/huyện.

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

**Mô tả:** Bảng có chức năng quản lý danh sách sản phẩm yêu thích của người dùng, hỗ trợ lưu sản phẩm quan tâm, chia sẻ wishlist và chuyển sản phẩm sang giỏ hàng.

*Bảng 5.69: Bảng Wishlists*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| UserID | nvarchar(450) | Khóa chính, Khóa ngoại | Mã người dùng |
| ProductID | int | Khóa chính, Khóa ngoại | Mã sản phẩm |
| CreatedAt | datetime2 |  | Ngày tạo |

**Mô tả:** Bảng có chức năng quản lý yêu cầu rút tiền từ ví của người dùng, bao gồm số tiền, thông tin nhận tiền, trạng thái duyệt và lý do xử lý.

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
