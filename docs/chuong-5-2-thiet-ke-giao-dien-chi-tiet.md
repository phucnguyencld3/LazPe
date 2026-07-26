# 5.2. Thiết kế giao diện

Phần này trình bày các giao diện chính của hệ thống LazPe theo hai nhóm: giao diện khách hàng và giao diện quản trị viên. Mỗi giao diện được mô tả theo mục đích sử dụng, thành phần hiển thị, luồng hoạt động và gợi ý ảnh chụp để đưa vào báo cáo.

**Lưu ý:** Các tab chỉ dùng để lọc trạng thái như Tất cả, Chờ xác nhận, Đang giao, Hoàn thành không tách thành giao diện riêng. Tài liệu chỉ tách các tab/màn hình có nghiệp vụ khác nhau như thông tin cá nhân, đơn hàng, ví, voucher, loyalty, quyền, thống kê và kiểm duyệt.

## 5.2.1. Giao diện khách hàng

### 5.2.1.1. Giao diện trang chủ

**Đường dẫn:** http://localhost:3000/

**Mô tả:** Đây là giao diện đầu tiên khi khách hàng truy cập website LazPe. Trang chủ được thiết kế để giới thiệu nhanh các nhóm sản phẩm, chương trình khuyến mãi, sản phẩm nổi bật và các tiện ích mua sắm dành cho phụ huynh.

**Thành phần giao diện chính:**
- Header gồm logo, thanh tìm kiếm, giỏ hàng, tài khoản, menu danh mục và điều hướng nhanh.
- Khu vực banner/hero hiển thị chương trình nổi bật, hình ảnh quảng bá và nút điều hướng đến sản phẩm hoặc voucher.
- Các khối flash sale, voucher, sản phẩm nổi bật, sản phẩm gợi ý, danh mục sản phẩm và tiện ích dành cho khách hàng.
- Widget chat hỗ trợ và vòng quay may mắn nếu đang được kích hoạt.

**Công dụng:**
- Giúp khách hàng nắm nhanh các chương trình bán hàng đang diễn ra.
- Dẫn người dùng đến các luồng chính như xem sản phẩm, nhận voucher, xem flash sale và đăng nhập tài khoản.
- Tạo điểm bắt đầu cho hành trình mua sắm trên website.

**Hoạt động:**
- Khách hàng truy cập trang chủ, hệ thống tải banner, danh mục, sản phẩm và voucher đang hoạt động.
- Người dùng có thể tìm kiếm sản phẩm, chọn danh mục, bấm vào banner, nhận voucher hoặc mở chi tiết sản phẩm.
- Khi có hành động thêm giỏ hàng hoặc mở nhanh sản phẩm, hệ thống cập nhật dữ liệu tương ứng và hiển thị phản hồi.

**Gợi ý chụp màn hình:** Chụp toàn trang đầu hoặc vùng trên cùng gồm header, banner chính, flash sale và sản phẩm nổi bật.

### 5.2.1.2. Giao diện đăng ký, đăng nhập và xác thực tài khoản

**Đường dẫn:** http://localhost:3000/login, http://localhost:3000/register, http://localhost:3000/verify-otp, http://localhost:3000/forgot-password, http://localhost:3000/reset-password

**Mô tả:** Nhóm giao diện này phục vụ quản lý truy cập của khách hàng, bao gồm đăng ký tài khoản mới, đăng nhập, xác thực OTP, quên mật khẩu và đặt lại mật khẩu.

**Thành phần giao diện chính:**
- Form đăng nhập gồm email, mật khẩu, nút đăng nhập, đăng nhập Google và liên kết quên mật khẩu.
- Form đăng ký gồm email, mật khẩu, họ tên, ngày sinh, số điện thoại, giới tính và bước xác thực OTP.
- Màn hình OTP gồm ô nhập mã xác thực, nút xác nhận và tùy chọn gửi lại mã.
- Màn hình quên/đặt lại mật khẩu gồm email, mã xác thực và mật khẩu mới.

**Công dụng:**
- Cho phép khách hàng tạo và truy cập tài khoản cá nhân.
- Đảm bảo các chức năng cá nhân như thanh toán, hồ sơ, đơn hàng, ví và voucher chỉ thực hiện khi người dùng đã xác thực.
- Tăng tính bảo mật cho tài khoản thông qua OTP và quy trình khôi phục mật khẩu.

**Hoạt động:**
- Người dùng nhập thông tin, hệ thống kiểm tra định dạng email, độ dài mật khẩu và các trường bắt buộc.
- Khi đăng ký, hệ thống gửi OTP để xác minh tài khoản trước khi cho phép sử dụng đầy đủ chức năng.
- Khi đăng nhập thành công, hệ thống lưu trạng thái đăng nhập và điều hướng người dùng về trang phù hợp.

**Gợi ý chụp màn hình:** Chụp từng màn hình chính: đăng nhập, đăng ký, OTP và quên mật khẩu. Không cần chụp các thông báo lỗi lặp lại.

### 5.2.1.3. Giao diện danh sách và tìm kiếm sản phẩm

**Đường dẫn:** http://localhost:3000/products

**Mô tả:** Giao diện danh sách sản phẩm cho phép khách hàng xem toàn bộ sản phẩm đang kinh doanh, tìm kiếm theo từ khóa, lọc theo danh mục/thương hiệu/giá và sắp xếp kết quả.

**Thành phần giao diện chính:**
- Khu vực hero hoặc banner đầu trang sản phẩm.
- Thanh tìm kiếm, nút tìm bằng giọng nói, tìm bằng hình ảnh và bộ lọc nhanh.
- Sidebar hoặc thanh lọc theo danh mục, thương hiệu, khoảng giá, trạng thái và đánh giá.
- Lưới sản phẩm gồm ảnh, tên, giá, giá khuyến mãi, trạng thái, đánh giá, nút yêu thích, so sánh và thêm nhanh vào giỏ.
- Modal thêm nhanh sản phẩm để chọn biến thể, số lượng và xác nhận thêm vào giỏ.

**Công dụng:**
- Giúp khách hàng tìm đúng sản phẩm phù hợp với nhu cầu của trẻ em.
- Hỗ trợ so sánh, yêu thích và thêm nhanh sản phẩm mà không phải rời khỏi danh sách.
- Tăng khả năng khám phá sản phẩm thông qua lọc, sắp xếp và gợi ý.

**Hoạt động:**
- Hệ thống tải danh sách sản phẩm và hiển thị theo phân trang hoặc tải thêm.
- Khi người dùng nhập từ khóa hoặc chọn bộ lọc, hệ thống gọi API để cập nhật danh sách kết quả.
- Khi người dùng mở modal thêm nhanh, hệ thống yêu cầu chọn biến thể hợp lệ trước khi thêm vào giỏ hàng.

**Gợi ý chụp màn hình:** Chụp danh sách sản phẩm có bộ lọc đang mở và thêm một ảnh chụp QuickAddModal.

### 5.2.1.4. Giao diện chi tiết sản phẩm

**Đường dẫn:** http://localhost:3000/products/[id]

**Mô tả:** Giao diện chi tiết sản phẩm trình bày đầy đủ thông tin của một sản phẩm, giúp khách hàng xem ảnh, chọn biến thể, đọc mô tả, xem đánh giá và quyết định mua hàng.

**Thành phần giao diện chính:**
- Thư viện ảnh sản phẩm gồm ảnh chính, ảnh phụ và hình ảnh theo biến thể nếu có.
- Khối thông tin sản phẩm gồm tên, thương hiệu, danh mục, giá, giá giảm, tồn kho, điểm đánh giá và trạng thái.
- Khu vực chọn biến thể gồm thuộc tính như màu sắc, kích cỡ, độ tuổi, số lượng và các nút thêm giỏ hàng/mua ngay.
- Các tab mô tả, thông số, hướng dẫn, đánh giá và bình luận của khách hàng.
- Khu vực sản phẩm liên quan, sản phẩm gợi ý, sản phẩm đã xem gần đây, modal cảnh báo sản phẩm và modal mua định kỳ.

**Công dụng:**
- Cung cấp thông tin chi tiết để khách hàng đánh giá sản phẩm trước khi mua.
- Cho phép chọn chính xác biến thể và số lượng cần mua.
- Hỗ trợ khách theo dõi sản phẩm, đăng ký mua định kỳ và xem phản hồi thực tế từ khách hàng khác.

**Hoạt động:**
- Khi mở trang, hệ thống tải chi tiết sản phẩm, ảnh, biến thể, đánh giá và gợi ý liên quan.
- Khi khách chọn thuộc tính, hệ thống xác định biến thể tương ứng, cập nhật giá và tồn kho.
- Nếu khách thêm vào giỏ hoặc mua ngay, hệ thống kiểm tra tồn kho và cập nhật giỏ hàng.
- Khách có thể mở ProductAlertModal để nhận cảnh báo hoặc SubscriptionModal để đặt lịch mua định kỳ.

**Gợi ý chụp màn hình:** Chụp vùng ảnh + thông tin + biến thể; chụp thêm tab đánh giá và một modal cảnh báo/mua định kỳ nếu cần.

### 5.2.1.5. Giao diện giỏ hàng

**Đường dẫn:** http://localhost:3000/cart

**Mô tả:** Giao diện giỏ hàng hiển thị các sản phẩm khách đã chọn trước khi thanh toán, cho phép điều chỉnh số lượng, xóa sản phẩm, áp dụng voucher và kiểm tra tổng tiền.

**Thành phần giao diện chính:**
- CartHeader hiển thị tiêu đề, số lượng sản phẩm và trạng thái giỏ hàng.
- CartItemList hiển thị từng sản phẩm, biến thể, giá, số lượng, quà tặng và nút xóa.
- VoucherModal dùng để chọn, áp dụng hoặc gỡ voucher.
- CartSummary hiển thị tạm tính, giảm giá, phí dự kiến, tổng tiền và nút thanh toán.
- EmptyCart hiển thị khi người dùng chưa có sản phẩm trong giỏ.

**Công dụng:**
- Giúp khách rà soát sản phẩm trước khi đặt hàng.
- Cho phép thay đổi số lượng và áp dụng ưu đãi trước khi thanh toán.
- Làm bước trung gian giữa chọn sản phẩm và tạo đơn hàng.

**Hoạt động:**
- Người dùng tăng/giảm số lượng, hệ thống kiểm tra tồn kho và cập nhật tổng tiền.
- Khi áp dụng voucher, hệ thống kiểm tra điều kiện voucher và tính lại giá trị giảm.
- Khi bấm thanh toán, hệ thống chuyển người dùng sang trang checkout với dữ liệu giỏ hàng hợp lệ.

**Gợi ý chụp màn hình:** Chụp giỏ hàng có nhiều sản phẩm, khu vực tổng tiền và modal chọn voucher.

### 5.2.1.6. Giao diện thanh toán

**Đường dẫn:** http://localhost:3000/checkout

**Mô tả:** Giao diện thanh toán là bước cuối để khách xác nhận đơn hàng, chọn địa chỉ giao, phương thức thanh toán, voucher, điểm thưởng, xu và ghi chú đơn hàng.

**Thành phần giao diện chính:**
- CheckoutHeader hiển thị tiến trình thanh toán và thông tin tóm tắt.
- ShippingAddressSection cho phép chọn địa chỉ có sẵn hoặc mở AddressModal để thêm/sửa địa chỉ.
- PaymentMethodSection cho phép chọn COD, VNPay, ví hệ thống hoặc phương thức được hỗ trợ.
- Khu vực voucher, điểm thưởng, xu, ghi chú đơn hàng và điều kiện áp dụng ưu đãi.
- OrderSummarySidebar hiển thị sản phẩm, phí vận chuyển, giảm giá, tổng tiền và nút đặt hàng.
- CheckoutUpsellInline/CheckoutUpsellModal gợi ý sản phẩm mua kèm nếu có.

**Công dụng:**
- Xác nhận đầy đủ thông tin trước khi tạo đơn hàng.
- Giúp khách sử dụng ưu đãi và lựa chọn phương thức thanh toán phù hợp.
- Đảm bảo hệ thống có đủ dữ liệu giao hàng và thanh toán để xử lý đơn.

**Hoạt động:**
- Khách chọn địa chỉ, hệ thống kiểm tra thông tin người nhận và khu vực giao hàng.
- Khách chọn phương thức thanh toán, hệ thống kiểm tra điều kiện COD, VNPay hoặc ví.
- Khi bấm đặt hàng, hệ thống kiểm tra lại giỏ hàng, tồn kho, voucher, điểm và tạo hóa đơn.
- Nếu thanh toán online, hệ thống điều hướng sang cổng thanh toán và cập nhật kết quả khi quay lại.

**Gợi ý chụp màn hình:** Chụp toàn bộ trang checkout gồm địa chỉ, phương thức thanh toán và sidebar tổng đơn; chụp thêm AddressModal.

### 5.2.1.7. Giao diện hồ sơ cá nhân khách hàng

**Đường dẫn:** http://localhost:3000/profile

**Mô tả:** Giao diện hồ sơ cá nhân là trung tâm quản lý tài khoản của khách hàng. Màn hình này gồm nhiều tab nghiệp vụ khác nhau, giúp khách theo dõi thông tin cá nhân, đơn hàng, ví, voucher, loyalty, hồ sơ bé và cài đặt bảo mật.

**Thành phần giao diện chính:**
- ProfileHeader hiển thị ảnh đại diện, tên khách hàng, cấp thành viên, điểm thưởng và thông tin tóm tắt.
- Tab Thông tin cá nhân và EditProfileModal để xem, sửa họ tên, ngày sinh, giới tính, số điện thoại, email và ảnh đại diện.
- Tab Địa chỉ giao hàng và ProfileAddressModal để thêm, sửa, xóa, đặt mặc định địa chỉ nhận hàng.
- Tab Đơn hàng và OrderDetailView để xem danh sách đơn, chi tiết đơn, lịch sử trạng thái, hủy đơn, yêu cầu trả hàng và mua lại.
- Tab Ví hệ thống và WalletSecurityModal để xem số dư, lịch sử giao dịch, thiết lập mã PIN và xác thực giao dịch.
- Tab Voucher của tôi, Đổi điểm lấy voucher và LoyaltySection để quản lý voucher, điểm thưởng, hạng thành viên, điểm danh và lịch sử điểm.
- Tab Hồ sơ bé, Theo dõi bé, AddGrowthRecordModal, AddVaccinationRecordModal và UpdateWeightModal để quản lý thông tin phát triển của bé.
- Tab Đánh giá, Thông báo, Tin nhắn, Cảnh báo sản phẩm, Mua định kỳ, Thống kê chi tiêu, Quyền riêng tư và Bảo mật cài đặt.

**Công dụng:**
- Cho phép khách tự quản lý toàn bộ dữ liệu cá nhân và hoạt động mua sắm.
- Tập trung các chức năng hậu mãi như đơn hàng, trả hàng, voucher, ví và đánh giá.
- Hỗ trợ trải nghiệm cá nhân hóa theo hồ sơ bé, lịch sử mua hàng và chương trình khách hàng thân thiết.

**Hoạt động:**
- Khi vào hồ sơ, hệ thống tải thông tin tài khoản và hiển thị tab mặc định.
- Người dùng chuyển tab để xem từng nhóm chức năng; hệ thống tải dữ liệu tương ứng như đơn hàng, voucher, ví hoặc hồ sơ bé.
- Khi thêm/sửa/xóa dữ liệu qua modal, hệ thống kiểm tra dữ liệu nhập và cập nhật lại giao diện sau khi API xử lý thành công.
- Các tab trạng thái trong đơn hàng hoặc voucher chỉ đóng vai trò lọc dữ liệu, không cần mô tả thành giao diện riêng.

**Gợi ý chụp màn hình:** Chụp màn hình tổng quan profile và chụp riêng các tab chính: Thông tin, Địa chỉ, Đơn hàng, Ví, Voucher, Loyalty, Hồ sơ bé, Bảo mật.

### 5.2.1.8. Giao diện điểm thưởng, voucher và ưu đãi khách hàng

**Đường dẫn:** http://localhost:3000/rewards, http://localhost:3000/vouchers

**Mô tả:** Nhóm giao diện này giúp khách hàng xem điểm thưởng, cấp thành viên, chương trình đổi quà và các voucher công khai có thể thu thập hoặc sử dụng trong đơn hàng.

**Thành phần giao diện chính:**
- Trang Rewards hiển thị điểm hiện có, hạng thành viên, tiến độ lên hạng, quyền lợi và lịch sử điểm.
- Khu vực điểm danh nhận điểm, chuỗi ngày điểm danh và kết quả cộng điểm.
- Danh sách voucher/quà đổi bằng điểm, điều kiện đổi, số điểm cần dùng và nút xác nhận đổi.
- Trang Vouchers hiển thị voucher công khai, điều kiện áp dụng, thời hạn và nút lưu voucher vào ví.

**Công dụng:**
- Khuyến khích khách hàng quay lại mua sắm và tương tác với hệ thống.
- Giúp khách nắm rõ quyền lợi thành viên và ưu đãi đang có.
- Liên kết chương trình loyalty với quá trình đặt hàng và thanh toán.

**Hoạt động:**
- Khách mở trang điểm thưởng hoặc voucher, hệ thống tải dữ liệu điểm, hạng và danh sách ưu đãi.
- Khi khách điểm danh hoặc đổi điểm, hệ thống kiểm tra điều kiện rồi cập nhật điểm/voucher.
- Khi lưu voucher công khai, hệ thống thêm voucher vào ví voucher của người dùng nếu còn lượt nhận.

**Gợi ý chụp màn hình:** Chụp trang Rewards gồm điểm, hạng và đổi quà; chụp trang Vouchers gồm danh sách voucher công khai.

### 5.2.1.9. Giao diện theo dõi đơn hàng và hóa đơn

**Đường dẫn:** http://localhost:3000/order-tracking, http://localhost:3000/Invoice

**Mô tả:** Nhóm giao diện này hỗ trợ khách hàng tra cứu trạng thái đơn hàng, xem kết quả đặt hàng và thông tin hóa đơn sau khi thanh toán.

**Thành phần giao diện chính:**
- Form tra cứu bằng mã đơn, mã theo dõi hoặc thông tin đơn hàng.
- Khu vực hiển thị tiến trình xử lý đơn, trạng thái thanh toán, thông tin giao nhận và sản phẩm.
- Trang Invoice hiển thị kết quả tạo đơn, mã hóa đơn, tổng tiền, trạng thái thanh toán và hướng dẫn tiếp theo.

**Công dụng:**
- Giúp khách theo dõi đơn ngay cả khi không ở trong hồ sơ cá nhân.
- Cung cấp xác nhận sau khi đặt hàng hoặc thanh toán.
- Giảm nhu cầu liên hệ hỗ trợ để hỏi trạng thái đơn.

**Hoạt động:**
- Khách nhập mã tra cứu, hệ thống kiểm tra và trả về dữ liệu đơn nếu hợp lệ.
- Sau khi đặt hàng, hệ thống điều hướng đến trang kết quả để hiển thị mã đơn và trạng thái thanh toán.
- Nếu thanh toán online thất bại hoặc đang chờ xử lý, giao diện hiển thị trạng thái để khách biết bước tiếp theo.

**Gợi ý chụp màn hình:** Chụp form tra cứu đơn và trang kết quả hóa đơn sau khi tạo đơn thành công.

### 5.2.1.10. Giao diện wishlist, so sánh và thông báo

**Đường dẫn:** http://localhost:3000/wishlist, http://localhost:3000/compare, http://localhost:3000/notifications

**Mô tả:** Nhóm giao diện này hỗ trợ khách lưu sản phẩm quan tâm, so sánh nhiều sản phẩm và theo dõi thông báo cá nhân từ hệ thống.

**Thành phần giao diện chính:**
- Wishlist hiển thị sản phẩm yêu thích, nút xóa, thêm vào giỏ và chia sẻ danh sách bằng token.
- Compare hiển thị bảng so sánh sản phẩm theo ảnh, giá, thương hiệu, thuộc tính, tồn kho và đánh giá.
- Notifications hiển thị danh sách thông báo, trạng thái đã đọc/chưa đọc, chi tiết thông báo và thao tác xóa.

**Công dụng:**
- Giúp khách lưu lại sản phẩm chưa mua ngay.
- Hỗ trợ khách ra quyết định bằng cách so sánh nhiều sản phẩm.
- Cập nhật thông tin quan trọng về đơn hàng, voucher, bảo mật và chương trình khuyến mãi.

**Hoạt động:**
- Người dùng thêm/xóa sản phẩm khỏi wishlist hoặc mở sản phẩm từ danh sách yêu thích.
- Người dùng chọn các sản phẩm cần so sánh, hệ thống hiển thị dữ liệu theo dạng bảng.
- Người dùng mở thông báo, hệ thống cập nhật trạng thái đã đọc và điều hướng đến nội dung liên quan nếu có.

**Gợi ý chụp màn hình:** Chụp wishlist có sản phẩm, bảng so sánh và danh sách thông báo.

### 5.2.1.11. Giao diện hồ sơ bé và dòng thời gian phát triển

**Đường dẫn:** http://localhost:3000/baby-timeline/[id]

**Mô tả:** Giao diện này hiển thị quá trình phát triển của bé dựa trên hồ sơ khách hàng đã tạo, hỗ trợ theo dõi chỉ số tăng trưởng, tiêm chủng và gợi ý sản phẩm phù hợp.

**Thành phần giao diện chính:**
- Thông tin bé gồm tên, ngày sinh, giới tính, chiều cao, cân nặng và ghi chú chăm sóc.
- Biểu đồ tăng trưởng, timeline mốc phát triển và lịch sử cập nhật chỉ số.
- Timeline tiêm chủng, mốc cần theo dõi và gợi ý thông minh liên quan đến độ tuổi của bé.
- Các modal thêm chỉ số tăng trưởng, cập nhật cân nặng và thêm mốc tiêm chủng trong khu vực profile.

**Công dụng:**
- Giúp phụ huynh theo dõi sự phát triển của bé trong cùng hệ thống mua sắm.
- Hỗ trợ cá nhân hóa sản phẩm theo độ tuổi, giới tính và nhu cầu chăm sóc.
- Tạo thêm giá trị sử dụng ngoài thao tác mua hàng thông thường.

**Hoạt động:**
- Người dùng mở hồ sơ bé, hệ thống tải dữ liệu tăng trưởng và tiêm chủng.
- Khi thêm chỉ số hoặc mốc tiêm chủng, hệ thống cập nhật biểu đồ và dòng thời gian.
- Dữ liệu hồ sơ bé được dùng để hỗ trợ gợi ý sản phẩm phù hợp hơn.

**Gợi ý chụp màn hình:** Chụp trang baby timeline có biểu đồ tăng trưởng và lịch sử mốc phát triển.

## 5.2.2. Giao diện quản trị viên

### 5.2.2.1. Giao diện dashboard quản trị

**Đường dẫn:** http://localhost:3000/admin

**Mô tả:** Dashboard là giao diện tổng quan dành cho quản trị viên sau khi đăng nhập vào khu vực quản trị, dùng để theo dõi nhanh tình hình vận hành của hệ thống.

**Thành phần giao diện chính:**
- Các thẻ chỉ số tổng quan như doanh thu, đơn hàng, người dùng, sản phẩm và cảnh báo cần xử lý.
- Biểu đồ hoặc danh sách nhanh về đơn hàng mới, sản phẩm bán chạy và hoạt động gần đây.
- Menu điều hướng đến các phân hệ quản lý sản phẩm, đơn hàng, khách hàng, voucher, loyalty và thống kê.

**Công dụng:**
- Giúp quản trị viên nắm tình hình hệ thống ngay khi truy cập.
- Cung cấp lối tắt đến các nghiệp vụ thường dùng.
- Hỗ trợ phát hiện nhanh các vấn đề cần xử lý trong vận hành.

**Hoạt động:**
- Quản trị viên đăng nhập, hệ thống kiểm tra quyền và tải dữ liệu tổng quan.
- Người dùng chọn các thẻ hoặc menu để chuyển sang phân hệ chi tiết.
- Các chỉ số được cập nhật theo dữ liệu đơn hàng, sản phẩm và khách hàng hiện có.

**Gợi ý chụp màn hình:** Chụp màn hình dashboard gồm sidebar, header và các thẻ chỉ số tổng quan.

### 5.2.2.2. Giao diện quản lý sản phẩm

**Đường dẫn:** http://localhost:3000/admin/products, http://localhost:3000/admin/products/new, http://localhost:3000/admin/products/edit/[id], http://localhost:3000/admin/products/[id]/options, http://localhost:3000/admin/products/[id]/variants

**Mô tả:** Giao diện quản lý sản phẩm là phân hệ trung tâm để quản trị viên tạo mới, cập nhật, import, cấu hình thuộc tính và quản lý biến thể sản phẩm.

**Thành phần giao diện chính:**
- Trang danh sách sản phẩm gồm bảng dữ liệu, tìm kiếm, bộ lọc, phân trang, trạng thái và thao tác xem/sửa/xóa.
- Form thông tin chung gồm tên, slug, danh mục, thương hiệu, mô tả, ảnh đại diện, thư viện ảnh, SEO và trạng thái hiển thị.
- Form giá và kho gồm giá bán, giá khuyến mãi, tồn kho, SKU, cân nặng, giới hạn mua và trạng thái kinh doanh.
- Màn hình options để CRUD nhóm thuộc tính như màu sắc, kích cỡ, độ tuổi và giá trị thuộc tính.
- Màn hình variants để CRUD biến thể, sinh nhanh tổ hợp biến thể, cập nhật ảnh, giá, tồn kho và trạng thái.
- Màn hình import sản phẩm, ImportResolutionModal và ImageConflictModal để xử lý lỗi file Excel hoặc xung đột hình ảnh.

**Công dụng:**
- Quản lý toàn bộ dữ liệu sản phẩm hiển thị cho khách hàng.
- Đảm bảo sản phẩm có đủ thông tin, ảnh, giá, tồn kho và biến thể để bán hàng.
- Hỗ trợ nhập liệu hàng loạt và giảm thao tác thủ công khi có nhiều sản phẩm.

**Hoạt động:**
- Admin tìm kiếm hoặc lọc sản phẩm trong danh sách.
- Khi thêm/sửa sản phẩm, hệ thống kiểm tra dữ liệu bắt buộc, định dạng giá, ảnh và danh mục.
- Admin cấu hình thuộc tính rồi tạo biến thể; hệ thống liên kết biến thể với các giá trị thuộc tính.
- Khi import, hệ thống kiểm tra file, báo lỗi từng dòng và cho phép xử lý xung đột trước khi lưu.

**Gợi ý chụp màn hình:** Chụp danh sách sản phẩm, form thêm/sửa sản phẩm, màn hình options, màn hình variants và modal xử lý import.

### 5.2.2.3. Giao diện quản lý danh mục và thương hiệu

**Đường dẫn:** http://localhost:3000/admin/categories, http://localhost:3000/admin/brands

**Mô tả:** Nhóm giao diện này dùng để tổ chức dữ liệu nền cho sản phẩm, bao gồm danh mục sản phẩm và thương hiệu/nhà cung cấp.

**Thành phần giao diện chính:**
- Danh sách danh mục/thương hiệu gồm bảng dữ liệu, tìm kiếm, lọc, phân trang và thao tác CRUD.
- Form thêm/sửa gồm tên, mô tả, ảnh/logo, trạng thái, slug và các trường liên quan.
- Màn hình chi tiết hiển thị dữ liệu đầy đủ trước khi chỉnh sửa.
- Màn hình import Excel kèm modal xử lý lỗi hoặc dữ liệu trùng.
- CategoryStats và các modal mô tả/xóa danh mục để hỗ trợ quản lý chi tiết.

**Công dụng:**
- Giúp sản phẩm được phân loại rõ ràng trên website.
- Hỗ trợ lọc sản phẩm theo danh mục và thương hiệu.
- Đảm bảo dữ liệu danh mục, thương hiệu nhất quán trước khi tạo sản phẩm.

**Hoạt động:**
- Admin xem danh sách, tìm kiếm, thêm mới, chỉnh sửa hoặc xóa danh mục/thương hiệu.
- Khi xóa dữ liệu, hệ thống kiểm tra liên kết với sản phẩm để tránh mất dữ liệu quan trọng.
- Khi import, hệ thống kiểm tra trùng lặp và hiển thị modal xử lý các dòng lỗi.

**Gợi ý chụp màn hình:** Chụp danh sách danh mục, form thêm/sửa, danh sách thương hiệu và modal import nếu có.

### 5.2.2.4. Giao diện quản lý đơn hàng

**Đường dẫn:** http://localhost:3000/admin/orders, http://localhost:3000/admin/orders/[id], http://localhost:3000/admin/orders/[id]/print, http://localhost:3000/admin/orders/batch-print

**Mô tả:** Giao diện quản lý đơn hàng hỗ trợ quản trị viên theo dõi, xác nhận, cập nhật trạng thái, in phiếu giao hàng và xử lý hủy/trả hàng.

**Thành phần giao diện chính:**
- OrderSummaryCards hiển thị số lượng đơn theo nhóm trạng thái và các chỉ số nhanh.
- OrderFilters hỗ trợ tìm kiếm theo mã đơn, khách hàng, ngày, trạng thái và phương thức thanh toán.
- OrderTable hiển thị danh sách đơn, tổng tiền, khách hàng, thanh toán, trạng thái và thao tác nhanh.
- Trang chi tiết đơn gồm OrderCustomerInfo, OrderShippingDetails, OrderProductList, OrderCostSummary và OrderActionBar.
- CancelOrderModal và ReturnOrderModal dùng để nhập lý do, xác nhận hủy hoặc xử lý trả hàng.
- Màn hình in một đơn và in hàng loạt để tạo phiếu giao hàng.

**Công dụng:**
- Giúp quản trị viên xử lý vòng đời đơn hàng từ lúc tạo đến khi hoàn tất.
- Hỗ trợ kiểm tra thông tin khách hàng, sản phẩm, thanh toán và vận chuyển.
- Đảm bảo các thao tác hủy, trả hàng và in phiếu được ghi nhận rõ ràng.

**Hoạt động:**
- Admin lọc đơn cần xử lý và mở chi tiết đơn.
- Admin xác nhận đơn, cập nhật trạng thái, xử lý thanh toán, in phiếu hoặc liên hệ khách hàng.
- Khi hủy/trả hàng, hệ thống yêu cầu lý do và cập nhật trạng thái đơn sau khi xác nhận.
- Với in hàng loạt, admin chọn nhiều đơn và hệ thống tạo danh sách phiếu giao để in liên tục.

**Gợi ý chụp màn hình:** Chụp danh sách đơn, chi tiết đơn, modal hủy/trả hàng và màn hình in phiếu giao hàng.

### 5.2.2.5. Giao diện quản lý voucher, flash sale và combo

**Đường dẫn:** http://localhost:3000/admin/vouchers, http://localhost:3000/admin/flash-sales, http://localhost:3000/admin/combo

**Mô tả:** Nhóm giao diện này phục vụ quản lý các chương trình bán hàng và khuyến mãi như voucher, flash sale và combo sản phẩm.

**Thành phần giao diện chính:**
- Danh sách voucher gồm tìm kiếm, lọc loại voucher, trạng thái, thời hạn, số lượng và thao tác CRUD.
- VoucherForm để tạo/sửa mã giảm giá, điều kiện áp dụng, số lượng, thời gian, giới hạn mỗi người và loại ưu đãi.
- VoucherDetail và trang voucher đã phát để xem điều kiện, lịch sử cấp phát và người dùng nhận voucher.
- Flash sale gồm danh sách chương trình, thời gian diễn ra, sản phẩm tham gia, giá sale và số lượng giới hạn.
- Combo gồm ComboList, ComboForm, ComboDetailAdmin, ProductSelectModal và ProductOptionsModal để chọn sản phẩm/biến thể vào gói combo.

**Công dụng:**
- Tạo và quản lý các chương trình khuyến mãi trong hệ thống.
- Hỗ trợ tăng doanh số thông qua giảm giá, bán nhanh và bán theo gói.
- Đảm bảo điều kiện ưu đãi được kiểm soát trước khi hiển thị cho khách hàng.

**Hoạt động:**
- Admin tạo mới hoặc chỉnh sửa voucher, hệ thống kiểm tra mã, thời hạn, số lượng và điều kiện áp dụng.
- Admin cấu hình flash sale bằng cách chọn sản phẩm, đặt giá sale, số lượng và thời gian hiệu lực.
- Admin tạo combo, chọn sản phẩm/biến thể, cấu hình giá gói và bật/tắt trạng thái kinh doanh.

**Gợi ý chụp màn hình:** Chụp danh sách voucher, form voucher, danh sách flash sale, form combo và modal chọn sản phẩm.

### 5.2.2.6. Giao diện quản lý người dùng và phân quyền

**Đường dẫn:** http://localhost:3000/admin/users, http://localhost:3000/admin/users/[id], http://localhost:3000/admin/permissions, http://localhost:3000/admin/role-templates

**Mô tả:** Nhóm giao diện này dùng để quản lý tài khoản khách hàng/quản trị, xem chi tiết người dùng, khóa/mở khóa tài khoản và cấu hình quyền truy cập hệ thống.

**Thành phần giao diện chính:**
- UserStats, UserFilters và UserTable hiển thị tổng quan người dùng, bộ lọc, tìm kiếm và danh sách tài khoản.
- Trang chi tiết người dùng hiển thị thông tin cá nhân, trạng thái, dữ liệu liên quan và thao tác quản trị.
- Trang phân quyền người dùng cho phép gán, thu hồi hoặc áp dụng mẫu quyền.
- PermissionSummaryCards, PermissionUsersTab và PermissionRoleTemplatesTab hiển thị tổng quan quyền, người dùng được cấp quyền và mẫu quyền.
- RoleTemplates dùng để CRUD mẫu quyền và danh sách quyền thuộc mẫu.

**Công dụng:**
- Quản lý tài khoản và trạng thái truy cập của người dùng.
- Đảm bảo admin chỉ thao tác trong phạm vi quyền được cấp.
- Hỗ trợ tạo mẫu quyền để gán nhanh cho nhiều tài khoản quản trị.

**Hoạt động:**
- Admin lọc/tìm người dùng, mở chi tiết và thực hiện khóa hoặc mở khóa khi cần.
- Admin vào màn hình quyền để gán hoặc thu hồi quyền theo từng người dùng.
- Admin tạo mẫu quyền, chọn các quyền chức năng và áp dụng mẫu cho tài khoản phù hợp.

**Gợi ý chụp màn hình:** Chụp danh sách người dùng, chi tiết người dùng, tab người dùng trong phân quyền và màn hình mẫu quyền.

### 5.2.2.7. Giao diện quản lý đánh giá sản phẩm

**Đường dẫn:** http://localhost:3000/admin/reviews

**Mô tả:** Giao diện quản lý đánh giá cho phép quản trị viên theo dõi chất lượng phản hồi của khách hàng, kiểm duyệt đánh giá, quản lý từ khóa nhạy cảm và phản hồi bình luận.

**Thành phần giao diện chính:**
- AnalyticsTab hiển thị thống kê số lượng đánh giá, điểm trung bình, tỷ lệ đánh giá và sản phẩm có nhiều phản hồi.
- ModerationTab hiển thị danh sách đánh giá cần xử lý, trạng thái, nội dung, hình ảnh/video và thao tác duyệt/ẩn/từ chối.
- SettingsTab cấu hình quy tắc kiểm duyệt, hiển thị đánh giá và giới hạn nội dung.
- KeywordsTab CRUD từ khóa nhạy cảm dùng cho kiểm duyệt tự động.
- CensorshipModal, CensorshipLogsModal, KeywordModal, LightboxModal và ReplyModal phục vụ kiểm duyệt, xem media và phản hồi.

**Công dụng:**
- Kiểm soát chất lượng nội dung do người dùng tạo.
- Phát hiện đánh giá vi phạm hoặc chứa từ khóa nhạy cảm.
- Tăng tương tác chăm sóc khách hàng thông qua phản hồi đánh giá.

**Hoạt động:**
- Admin xem thống kê để đánh giá tình hình phản hồi khách hàng.
- Admin mở tab kiểm duyệt, xem chi tiết đánh giá, media và chọn duyệt, ẩn hoặc từ chối.
- Admin thêm/sửa từ khóa nhạy cảm và cấu hình quy tắc kiểm duyệt tự động.
- Khi phản hồi đánh giá, hệ thống lưu bình luận của admin và cập nhật trạng thái hiển thị.

**Gợi ý chụp màn hình:** Chụp 4 tab chính của trang reviews và các modal kiểm duyệt, từ khóa, xem ảnh, phản hồi.

### 5.2.2.8. Giao diện quản lý loyalty

**Đường dẫn:** http://localhost:3000/admin/loyalty

**Mô tả:** Giao diện quản lý loyalty cho phép quản trị viên cấu hình toàn bộ chương trình khách hàng thân thiết, bao gồm tích điểm, đổi điểm, hạng thành viên, đặc quyền, voucher hàng tháng và quà sinh nhật.

**Thành phần giao diện chính:**
- Dashboard loyalty hiển thị tổng quan thành viên, tổng điểm, điểm đã đổi, voucher đã phát và số liệu theo hạng.
- Khu vực chính sách tích điểm để CRUD quy tắc cộng điểm theo mua hàng, đánh giá, điểm danh, sinh nhật hoặc hành động khác.
- Khu vực chính sách đổi điểm và VoucherRedemptionConfig để cấu hình tỷ lệ đổi, voucher đổi điểm, số lượng, thời hạn và điều kiện.
- Khu vực hạng thành viên để CRUD tên hạng, ngưỡng điểm, màu hiển thị và trạng thái.
- Khu vực đặc quyền theo hạng, voucher hàng tháng, phát quà sinh nhật, bù/trừ điểm thủ công và lịch sử điểm.
- Khu vực audit log để theo dõi thay đổi cấu hình và thao tác của admin.

**Công dụng:**
- Quản lý chương trình khách hàng thân thiết một cách linh hoạt.
- Khuyến khích khách hàng mua lại, đánh giá sản phẩm và tương tác thường xuyên.
- Giúp admin theo dõi minh bạch các thao tác cộng/trừ điểm, phát voucher và thay đổi chính sách.

**Hoạt động:**
- Admin mở từng tab/khu vực để cấu hình chính sách tích điểm, đổi điểm, hạng và quyền lợi.
- Khi thêm/sửa chính sách, hệ thống kiểm tra điều kiện, thời gian hiệu lực và trạng thái kích hoạt.
- Admin có thể bù hoặc thu hồi điểm thủ công, hệ thống yêu cầu lý do và ghi lịch sử.
- Khi phát voucher/quà sinh nhật, hệ thống kiểm tra điều kiện người nhận và ghi lại lịch sử phát.

**Gợi ý chụp màn hình:** Chụp dashboard loyalty, chính sách tích điểm, đổi điểm, hạng thành viên, voucher hàng tháng, bù/trừ điểm và audit log.

### 5.2.2.9. Giao diện quản lý banner và thông báo

**Đường dẫn:** http://localhost:3000/admin/banners, http://localhost:3000/admin/notifications

**Mô tả:** Nhóm giao diện này dùng để quản lý nội dung truyền thông trên website và các thông báo gửi đến người dùng.

**Thành phần giao diện chính:**
- BannerForm để nhập tiêu đề, ảnh, liên kết, vị trí hiển thị, thời gian và trạng thái.
- BannerConfigBuilder cấu hình bố cục, nội dung và hành vi hiển thị banner.
- BannerPreview xem trước banner trước khi xuất bản hoặc rollback phiên bản.
- Danh sách chiến dịch thông báo, trạng thái gửi, đối tượng nhận, thời gian gửi và thao tác gửi/hủy/xóa.
- Form tạo/sửa thông báo gồm tiêu đề, nội dung, loại thông báo, người nhận, lịch gửi, liên kết và hình ảnh nếu có.
- Hộp thư admin hiển thị thông báo nội bộ dành cho quản trị viên.

**Công dụng:**
- Quản lý nội dung quảng bá và truyền thông hiển thị trên website.
- Gửi thông báo đến khách hàng hoặc admin theo từng nghiệp vụ.
- Hỗ trợ truyền tải thông tin khuyến mãi, đơn hàng, bảo mật và hệ thống kịp thời.

**Hoạt động:**
- Admin tạo banner, xem trước và xuất bản khi nội dung đã đúng.
- Admin tạo chiến dịch thông báo, chọn đối tượng nhận và thời điểm gửi.
- Hệ thống cập nhật trạng thái gửi và cho phép theo dõi thông báo đã tạo.

**Gợi ý chụp màn hình:** Chụp danh sách banner, form banner, preview banner, danh sách thông báo và form tạo thông báo.

### 5.2.2.10. Giao diện thống kê và báo cáo

**Đường dẫn:** http://localhost:3000/admin/statistics

**Mô tả:** Giao diện thống kê giúp quản trị viên phân tích tình hình kinh doanh, doanh thu, sản phẩm, xu hướng và hỗ trợ xuất báo cáo.

**Thành phần giao diện chính:**
- OverviewTab hiển thị KPI tổng quan như doanh thu, đơn hàng, khách hàng, tăng trưởng và cảnh báo.
- RevenueTab hiển thị biểu đồ doanh thu theo thời gian, phương thức thanh toán, đơn hủy/hoàn và bộ lọc ngày.
- ProductsTab hiển thị sản phẩm bán chạy, doanh thu theo sản phẩm, danh mục, thương hiệu và tồn kho.
- TrendsTab hiển thị xu hướng, phân tích AI/dự báo nếu có và nút xuất Excel hoặc huấn luyện dữ liệu.

**Công dụng:**
- Giúp quản trị viên đánh giá hiệu quả kinh doanh.
- Hỗ trợ ra quyết định về nhập hàng, khuyến mãi và sản phẩm cần ưu tiên.
- Cung cấp dữ liệu báo cáo phục vụ quản lý hệ thống.

**Hoạt động:**
- Admin chọn khoảng thời gian và tab báo cáo cần xem.
- Hệ thống tải dữ liệu thống kê, tính toán chỉ số và hiển thị biểu đồ/bảng dữ liệu.
- Admin có thể xuất báo cáo hoặc chạy tác vụ huấn luyện/dự báo nếu hệ thống hỗ trợ.

**Gợi ý chụp màn hình:** Chụp đủ 4 tab Overview, Revenue, Products và Trends.

### 5.2.2.11. Giao diện bảo mật, IP bị chặn và nhật ký hệ thống

**Đường dẫn:** http://localhost:3000/admin/blocked-ips, http://localhost:3000/admin/security-logs

**Mô tả:** Nhóm giao diện này giúp quản trị viên theo dõi các hành vi rủi ro, log bảo mật và danh sách IP bị chặn do spam hoặc vi phạm quy tắc checkout.

**Thành phần giao diện chính:**
- Danh sách IP bị chặn gồm IP, lý do, thời gian chặn, thời gian hết hạn, trạng thái và người dùng liên quan.
- Thao tác chặn, mở chặn, lọc và tìm kiếm IP.
- Danh sách security logs gồm IP, user, loại hành động, mô tả, điểm rủi ro/request count và thời gian phát sinh.

**Công dụng:**
- Hỗ trợ phát hiện và xử lý hành vi spam đặt hàng.
- Cho phép admin kiểm tra lịch sử cảnh báo bảo mật.
- Tăng khả năng bảo vệ hệ thống khỏi thao tác bất thường.

**Hoạt động:**
- Admin xem danh sách IP bị chặn, kiểm tra lý do và mở chặn nếu cần.
- Hệ thống ghi log khi bộ lọc anti-spam phát hiện hành vi rủi ro.
- Admin xem security logs để phân tích các trường hợp bị cảnh báo hoặc shadow ban.

**Gợi ý chụp màn hình:** Chụp danh sách blocked IP và danh sách security logs.

### 5.2.2.12. Giao diện chat, mua định kỳ, rút tiền và hồ sơ admin

**Đường dẫn:** http://localhost:3000/admin/chats, http://localhost:3000/admin/subscriptions, http://localhost:3000/admin/withdrawals, http://localhost:3000/admin/profile

**Mô tả:** Nhóm giao diện này phục vụ các nghiệp vụ vận hành bổ trợ gồm hỗ trợ khách hàng qua chat, theo dõi mua định kỳ, xử lý yêu cầu rút tiền và quản lý hồ sơ quản trị viên.

**Thành phần giao diện chính:**
- Trang chats hiển thị danh sách phiên chat, nội dung tin nhắn, trạng thái chờ hỗ trợ và khung phản hồi.
- Trang subscriptions hiển thị đăng ký mua định kỳ, sản phẩm, chu kỳ giao, ngày giao tiếp theo và trạng thái.
- Trang withdrawals hiển thị yêu cầu rút tiền, số tiền, thông tin nhận tiền, trạng thái duyệt và lý do xử lý.
- Trang admin profile gồm AdminSummaryCard, PersonalInfoCard, PasswordCard, PermissionsCard, NotificationSettingsCard và TwoFactorCard.
- Email2FaModal và AuthenticatorModal hỗ trợ bật xác thực hai lớp cho tài khoản quản trị.

**Công dụng:**
- Giúp admin xử lý các nghiệp vụ chăm sóc khách hàng và vận hành nội bộ.
- Theo dõi các yêu cầu cần xử lý ngoài luồng bán hàng chính.
- Bảo vệ tài khoản admin thông qua đổi mật khẩu, phân quyền và xác thực hai lớp.

**Hoạt động:**
- Admin mở phiên chat để trả lời khách hàng và theo dõi lịch sử trao đổi.
- Admin kiểm tra lịch mua định kỳ, xử lý yêu cầu rút tiền và cập nhật trạng thái nghiệp vụ.
- Admin cập nhật hồ sơ, đổi mật khẩu, bật/tắt thông báo và cấu hình xác thực hai lớp.

**Gợi ý chụp màn hình:** Chụp trang chat admin, subscriptions, withdrawals và hồ sơ admin kèm modal 2FA nếu có.

## 5.2.3. Danh sách màn hình cần chụp

Để thể hiện đầy đủ các chức năng chính và các chức năng phụ trọng tâm, báo cáo nên sử dụng khoảng 40-50 ảnh chụp giao diện. Trong đó, các màn hình được đánh dấu Chính nên ưu tiên chụp, còn Phụ trọng tâm dùng để bổ sung khi cần minh họa modal, form hoặc luồng xử lý quan trọng.

*Bảng 5.77: Danh sách màn hình khách hàng cần chụp*

| STT | Mức độ | Màn hình cần chụp | Đường dẫn | Nội dung cần thể hiện |
|---|---|---|---|---|
| 1 | Chính | Trang chủ | http://localhost:3000/ | Chụp header, banner chính, flash sale, voucher và sản phẩm nổi bật. |
| 2 | Chính | Đăng nhập | http://localhost:3000/login | Chụp form đăng nhập, nút đăng nhập Google và liên kết quên mật khẩu. |
| 3 | Chính | Đăng ký | http://localhost:3000/register | Chụp form đăng ký có đầy đủ thông tin cá nhân. |
| 4 | Phụ trọng tâm | Xác thực OTP | http://localhost:3000/verify-otp | Chụp màn hình nhập mã OTP và nút xác nhận. |
| 5 | Chính | Danh sách sản phẩm | http://localhost:3000/products | Chụp lưới sản phẩm kèm bộ lọc danh mục, thương hiệu và giá. |
| 6 | Phụ trọng tâm | Tìm kiếm sản phẩm | http://localhost:3000/products | Chụp trạng thái sau khi nhập từ khóa hoặc dùng tìm kiếm nâng cao. |
| 7 | Phụ trọng tâm | Modal thêm nhanh giỏ hàng | http://localhost:3000/products | Chụp QuickAddModal khi chọn biến thể và số lượng. |
| 8 | Chính | Chi tiết sản phẩm | http://localhost:3000/products/[id] | Chụp ảnh sản phẩm, thông tin, giá, biến thể và nút mua hàng. |
| 9 | Phụ trọng tâm | Tab mô tả/thông số sản phẩm | http://localhost:3000/products/[id] | Chụp phần tab nội dung mô tả hoặc thông số kỹ thuật. |
| 10 | Phụ trọng tâm | Tab đánh giá sản phẩm | http://localhost:3000/products/[id] | Chụp danh sách đánh giá, điểm sao và phản hồi. |
| 11 | Phụ trọng tâm | Cảnh báo hoặc mua định kỳ | http://localhost:3000/products/[id] | Chụp ProductAlertModal hoặc SubscriptionModal. |
| 12 | Chính | Giỏ hàng | http://localhost:3000/cart | Chụp danh sách sản phẩm trong giỏ, số lượng và tổng tiền. |
| 13 | Phụ trọng tâm | Modal voucher trong giỏ hàng | http://localhost:3000/cart | Chụp VoucherModal khi chọn voucher áp dụng. |
| 14 | Chính | Thanh toán | http://localhost:3000/checkout | Chụp địa chỉ, phương thức thanh toán, voucher, điểm/xu và tổng đơn. |
| 15 | Phụ trọng tâm | Modal địa chỉ thanh toán | http://localhost:3000/checkout | Chụp AddressModal khi thêm hoặc sửa địa chỉ nhận hàng. |
| 16 | Chính | Kết quả đặt hàng/hóa đơn | http://localhost:3000/Invoice | Chụp mã đơn, trạng thái thanh toán và tổng tiền sau khi đặt hàng. |
| 17 | Chính | Hồ sơ cá nhân tổng quan | http://localhost:3000/profile | Chụp ProfileHeader, điểm thưởng, hạng thành viên và menu tab. |
| 18 | Chính | Profile - tab Thông tin cá nhân | http://localhost:3000/profile | Chụp thông tin cá nhân và nút mở EditProfileModal. |
| 19 | Chính | Profile - tab Đơn hàng | http://localhost:3000/profile | Chụp danh sách đơn hàng; không cần chụp từng tab trạng thái. |
| 20 | Chính | Profile - chi tiết đơn hàng | http://localhost:3000/profile | Chụp OrderDetailView gồm sản phẩm, địa chỉ, thanh toán và trạng thái. |
| 21 | Chính | Profile - tab Ví | http://localhost:3000/profile | Chụp số dư ví, lịch sử giao dịch và thao tác bảo mật ví. |
| 22 | Chính | Profile - tab Voucher | http://localhost:3000/profile | Chụp voucher đã lưu và điều kiện sử dụng. |
| 23 | Chính | Profile - tab Loyalty/điểm thưởng | http://localhost:3000/profile | Chụp điểm hiện có, hạng thành viên, lịch sử điểm và điểm danh. |
| 24 | Chính | Profile - tab Hồ sơ bé/Theo dõi bé | http://localhost:3000/profile | Chụp thông tin bé, biểu đồ tăng trưởng hoặc lịch tiêm chủng. |
| 25 | Phụ trọng tâm | Thông báo, Wishlist hoặc So sánh | http://localhost:3000/notifications, http://localhost:3000/wishlist, http://localhost:3000/compare | Chụp một trong các màn hình hỗ trợ khách hàng sau mua hoặc trước mua. |

*Bảng 5.78: Danh sách màn hình admin cần chụp*

| STT | Mức độ | Màn hình cần chụp | Đường dẫn | Nội dung cần thể hiện |
|---|---|---|---|---|
| 1 | Chính | Dashboard admin | http://localhost:3000/admin | Chụp sidebar, header và các thẻ chỉ số tổng quan. |
| 2 | Chính | Danh sách sản phẩm | http://localhost:3000/admin/products | Chụp bảng sản phẩm, bộ lọc, tìm kiếm và thao tác nhanh. |
| 3 | Chính | Form thêm/sửa sản phẩm | http://localhost:3000/admin/products/new | Chụp thông tin chung, danh mục, thương hiệu, ảnh, giá và kho. |
| 4 | Chính | Quản lý thuộc tính sản phẩm | http://localhost:3000/admin/products/[id]/options | Chụp danh sách option và giá trị option. |
| 5 | Chính | Quản lý biến thể sản phẩm | http://localhost:3000/admin/products/[id]/variants | Chụp bảng biến thể, SKU, giá, tồn kho và trạng thái. |
| 6 | Phụ trọng tâm | Import sản phẩm | http://localhost:3000/admin/products/import | Chụp màn hình import và modal xử lý lỗi/xung đột nếu có. |
| 7 | Chính | Danh sách đơn hàng | http://localhost:3000/admin/orders | Chụp thẻ tổng quan, bộ lọc và bảng đơn hàng. |
| 8 | Chính | Chi tiết đơn hàng | http://localhost:3000/admin/orders/[id] | Chụp thông tin khách, địa chỉ, sản phẩm, tổng tiền và action bar. |
| 9 | Phụ trọng tâm | Modal hủy/trả hàng | http://localhost:3000/admin/orders/[id] | Chụp CancelOrderModal hoặc ReturnOrderModal. |
| 10 | Phụ trọng tâm | In phiếu giao hàng | http://localhost:3000/admin/orders/[id]/print | Chụp mẫu phiếu giao hàng hoặc màn hình batch print. |
| 11 | Chính | Quản lý voucher | http://localhost:3000/admin/vouchers | Chụp danh sách voucher, trạng thái, thời hạn và thao tác. |
| 12 | Chính | Form tạo/sửa voucher | http://localhost:3000/admin/vouchers/create | Chụp điều kiện áp dụng, loại giảm giá, số lượng và thời hạn. |
| 13 | Chính | Flash sale | http://localhost:3000/admin/flash-sales | Chụp danh sách chương trình và sản phẩm tham gia sale. |
| 14 | Chính | Combo sản phẩm | http://localhost:3000/admin/combo | Chụp danh sách/form combo và modal chọn sản phẩm. |
| 15 | Chính | Quản lý người dùng | http://localhost:3000/admin/users | Chụp thống kê, bộ lọc và bảng tài khoản. |
| 16 | Phụ trọng tâm | Chi tiết người dùng | http://localhost:3000/admin/users/[id] | Chụp thông tin tài khoản và trạng thái người dùng. |
| 17 | Chính | Phân quyền người dùng | http://localhost:3000/admin/permissions | Chụp tab người dùng, quyền được gán và thao tác cấp/thu hồi quyền. |
| 18 | Chính | Mẫu quyền | http://localhost:3000/admin/role-templates | Chụp danh sách hoặc form tạo mẫu quyền. |
| 19 | Chính | Đánh giá - thống kê | http://localhost:3000/admin/reviews | Chụp AnalyticsTab với chỉ số đánh giá. |
| 20 | Chính | Đánh giá - kiểm duyệt | http://localhost:3000/admin/reviews | Chụp ModerationTab và modal duyệt/ẩn/từ chối đánh giá. |
| 21 | Chính | Loyalty - tổng quan | http://localhost:3000/admin/loyalty | Chụp dashboard loyalty, số điểm, thành viên và voucher. |
| 22 | Chính | Loyalty - chính sách tích/đổi điểm | http://localhost:3000/admin/loyalty | Chụp chính sách tích điểm, đổi điểm hoặc VoucherRedemptionConfig. |
| 23 | Chính | Loyalty - hạng thành viên/voucher tháng | http://localhost:3000/admin/loyalty | Chụp cấu hình hạng thành viên, đặc quyền và voucher hàng tháng. |
| 24 | Chính | Banner và thông báo | http://localhost:3000/admin/banners, http://localhost:3000/admin/notifications | Chụp form/preview banner và danh sách hoặc form thông báo. |
| 25 | Chính | Thống kê doanh thu/sản phẩm | http://localhost:3000/admin/statistics | Chụp RevenueTab hoặc ProductsTab với biểu đồ và bộ lọc thời gian. |
