using Microsoft.AspNetCore.Identity.UI.Services;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Services
{
    public class WithdrawEmailService : IWithdrawEmailService
    {
        private readonly IEmailSender _emailSender;
        private const string BrandColor = "#10b981"; // Emerald-500
        private const string BgColor = "#f8fafc";
        private const string BrandName = "LazPe";

        public WithdrawEmailService(IEmailSender emailSender)
        {
            _emailSender = emailSender;
        }

        private string GetBaseTemplate(string title, string content)
        {
            return $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: {BgColor}; padding: 20px; border-radius: 12px;'>
                    <div style='text-align: center; margin-bottom: 20px;'>
                        <h1 style='color: {BrandColor}; margin: 0; font-size: 28px;'>{BrandName}</h1>
                        <p style='color: #64748b; margin: 5px 0 0 0; font-size: 14px;'>Hệ thống Ví điện tử an toàn & tiện lợi</p>
                    </div>
                    <div style='background-color: #ffffff; padding: 24px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>
                        <h2 style='color: #1e293b; margin-top: 0; font-size: 20px; text-align: center;'>{title}</h2>
                        <div style='color: #475569; font-size: 15px; line-height: 1.6;'>
                            {content}
                        </div>
                    </div>
                    <div style='text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;'>
                        <p>&copy; {DateTime.Now.Year} {BrandName}. All rights reserved.</p>
                        <p>Đây là email tự động, vui lòng không trả lời.</p>
                    </div>
                </div>";
        }

        public async Task SendNewRequestAdminEmailAsync(string adminEmail, string userFullName, decimal amount, DateTime createdAt)
        {
            string content = $@"
                <p>Xin chào Admin,</p>
                <p>Hệ thống vừa nhận được một yêu cầu rút tiền mới cần được xử lý:</p>
                <table style='width: 100%; border-collapse: collapse; margin: 15px 0;'>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Người yêu cầu</td>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;'>{userFullName}</td>
                    </tr>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Số tiền</td>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: {BrandColor};'>{amount:N0} VNĐ</td>
                    </tr>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Thời gian</td>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b;'>{createdAt:dd/MM/yyyy HH:mm:ss}</td>
                    </tr>
                </table>
                <p>Vui lòng đăng nhập vào trang Quản trị để kiểm tra và duyệt yêu cầu này.</p>
                <div style='text-align: center; margin-top: 25px;'>
                    <a href='https://lazpe.com/admin' style='background-color: {BrandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Đi đến Trang Quản trị</a>
                </div>
            ";

            var html = GetBaseTemplate("Yêu cầu rút tiền mới", content);
            await _emailSender.SendEmailAsync(adminEmail, $"[{BrandName}] Có yêu cầu rút tiền mới từ {userFullName}", html);
        }

        public async Task SendProcessRequestUserEmailAsync(string userEmail, string userFullName, decimal amount, bool isApproved, string? adminNote, DateTime processedAt)
        {
            string statusText = isApproved ? "<span style='color: #10b981;'>Đã Duyệt</span>" : "<span style='color: #ef4444;'>Đã Từ Chối</span>";
            string subject = isApproved ? $"[{BrandName}] Yêu cầu rút tiền của bạn đã được duyệt" : $"[{BrandName}] Yêu cầu rút tiền của bạn đã bị từ chối";

            string content = $@"
                <p>Xin chào <strong>{userFullName}</strong>,</p>
                <p>Yêu cầu rút tiền của bạn đã được quản trị viên xử lý.</p>
                <table style='width: 100%; border-collapse: collapse; margin: 15px 0;'>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Số tiền</td>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: {BrandColor};'>{amount:N0} VNĐ</td>
                    </tr>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Kết quả</td>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;'>{statusText}</td>
                    </tr>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Thời gian xử lý</td>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b;'>{processedAt:dd/MM/yyyy HH:mm:ss}</td>
                    </tr>
                    {(!string.IsNullOrEmpty(adminNote) ? $@"
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Ghi chú từ Admin</td>
                        <td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569; font-style: italic;'>{adminNote}</td>
                    </tr>" : "")}
                </table>
                <p>{(isApproved 
                    ? "Số tiền sẽ được chuyển vào tài khoản ngân hàng của bạn trong vòng 24 giờ tới (không tính ngày lễ, T7, CN). Vui lòng kiểm tra tài khoản." 
                    : "Rất tiếc yêu cầu của bạn đã bị từ chối. Số tiền tạm giữ đã được hoàn lại đầy đủ vào Ví LazPe của bạn.")}</p>
                <p>Cảm ơn bạn đã sử dụng dịch vụ của <strong>{BrandName}</strong>!</p>
            ";

            var html = GetBaseTemplate("Kết quả xử lý rút tiền", content);
            await _emailSender.SendEmailAsync(userEmail, subject, html);
        }

        public async Task SendDailyAdminReportEmailAsync(string adminEmail, int pendingCount, DateTime asOfTime)
        {
            string content = $@"
                <p>Xin chào Admin,</p>
                <p>Đây là báo cáo hàng ngày về các yêu cầu rút tiền đang chờ xử lý trên hệ thống.</p>
                <div style='background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;'>
                    <p style='margin: 0; color: #991b1b; font-size: 16px;'>
                        Hiện đang có <strong>{pendingCount}</strong> yêu cầu rút tiền (tạo trước 09:59 AM) đang chờ được duyệt.
                    </p>
                </div>
                <p>Vui lòng xử lý các yêu cầu này sớm nhất có thể để đảm bảo trải nghiệm tốt cho khách hàng.</p>
                <p><i>Báo cáo được tạo lúc: {asOfTime:dd/MM/yyyy HH:mm:ss}</i></p>
                <div style='text-align: center; margin-top: 25px;'>
                    <a href='https://lazpe.com/admin' style='background-color: {BrandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Đi đến Trang Quản trị</a>
                </div>
            ";

            var html = GetBaseTemplate("Báo cáo Yêu cầu Rút tiền hàng ngày", content);
            await _emailSender.SendEmailAsync(adminEmail, $"[{BrandName}] Báo cáo: Có {pendingCount} yêu cầu rút tiền chờ duyệt", html);
        }

        public async Task SendAutoRejectUserEmailAsync(string userEmail, string userFullName, decimal amount, DateTime rejectedAt)
        {
            string content = $@"
                <p>Xin chào <strong>{userFullName}</strong>,</p>
                <p>Hệ thống xin thông báo về tình trạng yêu cầu rút tiền của bạn:</p>
                <div style='background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;'>
                    <p style='margin: 0; color: #92400e;'>
                        Yêu cầu rút <strong>{amount:N0} VNĐ</strong> của bạn chưa được hỗ trợ xử lý do đã quá hạn 3 ngày. Yêu cầu này hiện đã bị hủy tự động trên hệ thống.
                    </p>
                </div>
                <p>Chúng tôi đã hoàn lại toàn bộ số dư tạm giữ vào Ví LazPe của bạn.</p>
                <p><strong>Bạn vui lòng gửi lại yêu cầu rút tiền mới để chúng tôi có thể ưu tiên hỗ trợ trong thời gian sớm nhất.</strong></p>
                <p>Chúng tôi thành thật xin lỗi vì sự bất tiện này!</p>
                <p>Trân trọng,<br>Đội ngũ {BrandName}</p>
            ";

            var html = GetBaseTemplate("Thông báo tự động: Yêu cầu rút tiền hết hạn", content);
            await _emailSender.SendEmailAsync(userEmail, $"[{BrandName}] Yêu cầu rút tiền của bạn chưa được xử lý", html);
        }
    }
}
