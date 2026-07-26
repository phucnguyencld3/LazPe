# 5.1.5. Chi tiết các collection MongoDB

Bên cạnh cơ sở dữ liệu SQL Server, hệ thống sử dụng MongoDB cho các dữ liệu dạng nhật ký, bảo mật và hành vi người dùng. Phần này chỉ trình bày các collection MongoDB đang được hệ thống đọc/ghi trong mã nguồn hiện tại.

**Lưu ý:** Collection KnowledgeArticles có khai báo trong MongoDbService nhưng chưa thấy luồng nghiệp vụ đang sử dụng, nên không đưa vào danh sách chính.

**Mô tả:** Collection có chức năng ghi nhận hành vi tương tác của người dùng với sản phẩm, phục vụ hệ thống gợi ý sản phẩm, huấn luyện mô hình đề xuất và xác định mức độ quan tâm của khách hàng.

**Vị trí sử dụng:** RecommendationService, RecommendationController

*Bảng 5.M1: Collection UserInteractions*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | ObjectId/String | Khóa chính | Mã định danh duy nhất của bản ghi tương tác. |
| UserId | String |  | Mã người dùng thực hiện hành vi tương tác. |
| ProductId | Int32 |  | Mã sản phẩm được người dùng tương tác. |
| InteractionType | String/Enum |  | Loại tương tác: View, Wishlist, Cart, Review hoặc Purchase. |
| Score | Float |  | Điểm trọng số của hành vi, dùng để xếp hạng mức độ quan tâm. |
| CreatedAt | DateTime |  | Thời điểm phát sinh hành vi tương tác. |

**Mô tả:** Collection có chức năng ghi nhật ký thao tác nghiệp vụ trong hệ thống, giúp quản trị viên kiểm tra hành động thêm, sửa, xóa, cập nhật dữ liệu và đối chiếu thay đổi trước/sau.

**Vị trí sử dụng:** AuditLogService

*Bảng 5.M2: Collection AuditLogs*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | ObjectId/String | Khóa chính | Mã định danh duy nhất của nhật ký. |
| Action | String |  | Tên hành động được thực hiện, ví dụ tạo mới, cập nhật, xóa hoặc thay đổi trạng thái. |
| UserId | String |  | Mã người dùng hoặc quản trị viên thực hiện thao tác. |
| EntityName | String |  | Tên đối tượng nghiệp vụ bị tác động. |
| EntityId | String |  | Mã bản ghi nghiệp vụ bị tác động. |
| OldValues | String |  | Dữ liệu cũ trước khi thay đổi. |
| NewValues | String |  | Dữ liệu mới sau khi thay đổi. |
| Description | String |  | Nội dung mô tả chi tiết thao tác. |
| IpAddress | String |  | Địa chỉ IP phát sinh thao tác. |
| Timestamp | DateTime |  | Thời điểm ghi nhận nhật ký. |

**Mô tả:** Collection có chức năng quản lý danh sách IP bị chặn do vi phạm bảo mật hoặc spam đặt hàng, hỗ trợ chặn tạm thời, mở chặn và kiểm tra IP trước khi cho phép thao tác tiếp.

**Vị trí sử dụng:** IpBlockService, IpBlockController

*Bảng 5.M3: Collection BlockedIps*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | ObjectId/String | Khóa chính | Mã định danh duy nhất của bản ghi IP bị chặn. |
| IpAddress | String |  | Địa chỉ IP bị hệ thống chặn. |
| Reason | String |  | Lý do chặn IP. |
| BlockedAt | DateTime |  | Thời điểm bắt đầu chặn IP. |
| ExpiresAt | DateTime? |  | Thời điểm hết hạn chặn, nếu có. |
| IsActive | Boolean |  | Trạng thái còn hiệu lực chặn hay đã được mở chặn. |
| UserId | String |  | Mã người dùng liên quan đến IP bị chặn, nếu xác định được. |
| UserEmail | String |  | Email người dùng liên quan đến IP bị chặn. |
| RecentInvoices | Array<String> |  | Danh sách mã đơn gần đây liên quan đến hành vi bất thường. |

**Mô tả:** Collection có chức năng ghi nhận nhật ký bảo mật và chống spam trong quá trình checkout, đặc biệt các trường hợp cảnh báo rủi ro, bắt buộc thanh toán online hoặc shadow ban.

**Vị trí sử dụng:** AntiSpamCheckoutFilter, SecurityAuditLogController

*Bảng 5.M4: Collection SecurityAuditLogs*

| Tên | Kiểu dữ liệu | Khóa chính/Khóa ngoại | Mô tả |
|---|---|---|---|
| Id | ObjectId/String | Khóa chính | Mã định danh duy nhất của nhật ký bảo mật. |
| IpAddress | String |  | Địa chỉ IP phát sinh hành vi rủi ro. |
| UserId | String |  | Mã người dùng liên quan, nếu người dùng đã đăng nhập. |
| ActionType | String |  | Loại hành động bảo mật như Warning, Challenge_ForceVNPay, ShadowBan, BlockAccount hoặc BlockIP. |
| Description | String |  | Mô tả chi tiết lý do hệ thống ghi nhận cảnh báo. |
| RequestCount | Int32 |  | Số lượng yêu cầu hoặc điểm rủi ro được ghi nhận tại thời điểm kiểm tra. |
| CreatedAt | DateTime |  | Thời điểm phát sinh nhật ký bảo mật. |
