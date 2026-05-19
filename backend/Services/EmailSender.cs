using Microsoft.AspNetCore.Identity.UI.Services;
using System.Net;
using System.Net.Mail;

namespace PolyBabyAPI.Services
{
    public class EmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailSender> _logger;

        public EmailSender(IConfiguration configuration, ILogger<EmailSender> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            return SendSmtpEmailAsync(email, subject, htmlMessage);
        }

        private async Task SendSmtpEmailAsync(string email, string subject, string htmlMessage)
        {
            var smtpHost = _configuration["EmailSettings:SmtpHost"];
            var smtpPort = _configuration.GetValue("EmailSettings:SmtpPort", 587);
            var smtpUser = _configuration["EmailSettings:SmtpUser"];
            var smtpPassword = _configuration["EmailSettings:SmtpPassword"];
            var enableSsl = _configuration.GetValue("EmailSettings:EnableSsl", true);
            var fromEmail = _configuration["EmailSettings:FromEmail"] ?? smtpUser;
            var fromName = _configuration["EmailSettings:FromName"] ?? "PolyBaby";

            if (string.IsNullOrWhiteSpace(smtpHost) || string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException("EmailSettings chưa được cấu hình đầy đủ (SmtpHost/FromEmail).");
            }

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = htmlMessage,
                IsBodyHtml = true
            };
            message.To.Add(email);

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = enableSsl
            };

            if (!string.IsNullOrWhiteSpace(smtpUser) && !string.IsNullOrWhiteSpace(smtpPassword))
            {
                client.UseDefaultCredentials = false;
                client.Credentials = new NetworkCredential(smtpUser, smtpPassword);
            }

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent to {Email} with subject {Subject}", email, subject);
        }
    }
}


