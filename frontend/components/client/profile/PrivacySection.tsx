import React from "react";

export function PrivacySection() {
  return (
    <section className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
      <div className="flex justify-between items-center mb-md pb-3 border-b border-slate-100">
        <h2 className="font-headline-md text-xl font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">policy</span> Chính sách bảo mật
        </h2>
        <span className="text-xs text-slate-400 font-bold">Cập nhật cuối: 31/05/2026</span>
      </div>

      <div className="prose max-w-none text-slate-600 space-y-md text-sm md:text-base leading-relaxed">
        <p className="font-semibold text-slate-700">
          Chào mừng bạn đến với **LazPe**. Chúng tôi coi trọng quyền riêng tư của bạn và cam kết bảo vệ dữ liệu cá nhân của khách hàng một cách an toàn và tối đa nhất. Chính sách Bảo mật này mô tả cách chúng tôi thu thập, sử dụng, chia sẻ và bảo vệ thông tin của bạn khi bạn sử dụng nền tảng thương mại điện tử LazPe.
        </p>

        {/* Section 1 */}
        <div className="space-y-2">
          <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
            Thu thập thông tin cá nhân
          </h3>
          <p className="pl-8">
            Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản, thực hiện đơn hàng, tương tác với đội ngũ chăm sóc khách hàng hoặc gửi đánh giá sản phẩm. Các thông tin này bao gồm:
          </p>
          <ul className="list-disc pl-14 space-y-1">
            <li>Thông tin định danh: Họ tên, Ngày tháng năm sinh.</li>
            <li>Thông tin liên hệ: Số điện thoại, Địa chỉ Email, Địa chỉ giao nhận hàng.</li>
            <li>Thông tin tài khoản: Mật khẩu (được mã hóa một chiều hoàn toàn), Lịch sử mua hàng.</li>
            <li>Thông tin kỹ thuật: Địa chỉ IP, Loại thiết bị, Trình duyệt và Hành vi sử dụng trên hệ thống.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="space-y-2">
          <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
            Mục đích sử dụng thông tin
          </h3>
          <p className="pl-8">
            Dữ liệu cá nhân thu thập được sử dụng cho các mục đích hợp pháp sau:
          </p>
          <ul className="list-disc pl-14 space-y-1">
            <li>Xử lý và vận chuyển các đơn đặt hàng của khách hàng thành công.</li>
            <li>Gửi thông báo cập nhật trạng thái đơn hàng thông qua Email hoặc Zalo.</li>
            <li>Cung cấp mã giảm giá, chương trình khuyến mãi và cập nhật tin tức (khi bạn đồng ý bật cài đặt thông báo).</li>
            <li>Nâng cao chất lượng bảo mật nền tảng thông qua giới hạn request và kiểm soát tấn công DDoS.</li>
            <li>Giải quyết thắc mắc, khiếu nại qua hệ thống hỗ trợ LazPe Care.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-2">
          <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
            An toàn và Bảo mật Dữ liệu
          </h3>
          <p className="pl-8">
            Chúng tôi áp dụng các tiêu chuẩn bảo mật quốc tế để bảo vệ thông tin cá nhân của bạn chống lại việc truy cập, thay đổi hoặc tiết lộ trái phép:
          </p>
          <ul className="list-disc pl-14 space-y-1">
            <li>Sử dụng giao thức mã hóa đường truyền HTTPS an toàn cho toàn bộ luồng kết nối client-backend.</li>
            <li>Mã hóa mật khẩu của bạn bằng thuật toán hash bảo mật cấp cao nhất ở cơ sở dữ liệu.</li>
            <li>Chặn và giới hạn truy cập tự động dựa trên địa chỉ IP (Rate Limiting) để bảo vệ server khỏi các phần mềm độc hại.</li>
            <li>Chỉ nhân viên có thẩm quyền mới được cấp quyền xử lý đơn hàng truy cập vào các dữ liệu liên hệ cần thiết của bạn.</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="space-y-2">
          <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
            Quyền lợi của người dùng
          </h3>
          <p className="pl-8">
            Bạn có toàn quyền kiểm soát dữ liệu cá nhân của mình trên LazPe:
          </p>
          <ul className="list-disc pl-14 space-y-1">
            <li>Xem và thay đổi thông tin cá nhân trực tiếp tại trang hồ sơ tài khoản.</li>
            <li>Thêm mới, sửa đổi hoặc xóa bỏ các địa chỉ nhận hàng đã lưu.</li>
            <li>Bật/tắt việc nhận thông báo email hoặc tin tức khuyến mãi bất cứ lúc nào.</li>
            <li>Liên hệ LazPe Care để yêu cầu khóa hoặc xóa bỏ hoàn toàn tài khoản cá nhân.</li>
          </ul>
        </div>

        {/* Section 5 */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Mọi thắc mắc hoặc phản ánh liên quan đến Chính sách bảo mật dữ liệu, quý khách vui lòng liên hệ hotline **1900-xxxx** hoặc gửi email đến bộ phận pháp lý của chúng tôi tại **privacy@lazpe.com**.
        </div>
      </div>
    </section>
  );
}
