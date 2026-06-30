namespace PolyBabyAPI.Interfaces
{
    public interface IWithdrawEmailService
    {
        Task SendNewRequestAdminEmailAsync(string adminEmail, string userFullName, decimal amount, DateTime createdAt);
        Task SendProcessRequestUserEmailAsync(string userEmail, string userFullName, decimal amount, bool isApproved, string? adminNote, DateTime processedAt);
        Task SendDailyAdminReportEmailAsync(string adminEmail, int pendingCount, DateTime asOfTime);
        Task SendAutoRejectUserEmailAsync(string userEmail, string userFullName, decimal amount, DateTime rejectedAt);
    }
}
