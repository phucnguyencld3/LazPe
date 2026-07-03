using Microsoft.AspNetCore.Identity.UI.Services;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Net.Http;
using System.Net.Http.Headers;

namespace PolyBabyAPI.Services
{
    public class EmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailSender> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public EmailSender(IConfiguration configuration, ILogger<EmailSender> logger, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            var sendGridApiKey = _configuration["EmailSettings:SendGridApiKey"];
            var resendApiKey = _configuration["EmailSettings:ResendApiKey"];
            var brevoApiKey = _configuration["EmailSettings:BrevoApiKey"];

            if (!string.IsNullOrWhiteSpace(sendGridApiKey))
            {
                _logger.LogInformation("Attempting to send email via SendGrid API...");
                await SendSendGridEmailAsync(sendGridApiKey, email, subject, htmlMessage);
            }
            else if (!string.IsNullOrWhiteSpace(resendApiKey))
            {
                _logger.LogInformation("Attempting to send email via Resend API...");
                await SendResendEmailAsync(resendApiKey, email, subject, htmlMessage);
            }
            else if (!string.IsNullOrWhiteSpace(brevoApiKey))
            {
                _logger.LogInformation("Attempting to send email via Brevo API...");
                await SendBrevoEmailAsync(brevoApiKey, email, subject, htmlMessage);
            }
            else
            {
                _logger.LogInformation("Attempting to send email via SmtpClient...");
                await SendSmtpEmailAsync(email, subject, htmlMessage);
            }
        }

        private async Task SendBrevoEmailAsync(string apiKey, string email, string subject, string htmlMessage)
        {
            var fromEmail = _configuration["EmailSettings:FromEmail"] ?? "lazpevn@gmail.com";
            var fromName = _configuration["EmailSettings:FromName"] ?? "LazPe";

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("api-key", apiKey);

            var payload = new
            {
                sender = new
                {
                    name = fromName,
                    email = fromEmail
                },
                to = new[]
                {
                    new { email = email }
                },
                subject = subject,
                htmlContent = htmlMessage
            };

            var json = System.Text.Json.JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", content);
            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync();
                throw new Exception($"Brevo API returned error {response.StatusCode}: {responseBody}");
            }

            _logger.LogInformation("Email sent successfully to {Email} via Brevo API", email);
        }

        private async Task SendSendGridEmailAsync(string apiKey, string email, string subject, string htmlMessage)
        {
            var fromEmail = _configuration["EmailSettings:FromEmail"] ?? "lazpevn@gmail.com";
            var fromName = _configuration["EmailSettings:FromName"] ?? "LazPe";

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                personalizations = new[]
                {
                    new
                    {
                        to = new[]
                        {
                            new { email = email }
                        }
                    }
                },
                from = new
                {
                    email = fromEmail,
                    name = fromName
                },
                subject = subject,
                content = new[]
                {
                    new
                    {
                        type = "text/html",
                        value = htmlMessage
                    }
                }
            };

            var json = System.Text.Json.JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync("https://api.sendgrid.com/v3/mail/send", content);
            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync();
                throw new Exception($"SendGrid API returned error {response.StatusCode}: {responseBody}");
            }

            _logger.LogInformation("Email sent successfully to {Email} via SendGrid API", email);
        }

        private async Task SendResendEmailAsync(string apiKey, string email, string subject, string htmlMessage)
        {
            var fromEmail = _configuration["EmailSettings:FromEmail"] ?? "onboarding@resend.dev";
            var fromName = _configuration["EmailSettings:FromName"] ?? "LazPe";

            // Resend onboarding domain requires from address to be onboarding@resend.dev if not verified
            if (fromEmail.Contains("gmail.com") && apiKey.StartsWith("re_"))
            {
                fromEmail = "onboarding@resend.dev";
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                from = $"{fromName} <{fromEmail}>",
                to = new[] { email },
                subject = subject,
                html = htmlMessage
            };

            var json = System.Text.Json.JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync("https://api.resend.com/emails", content);
            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync();
                throw new Exception($"Resend API returned error {response.StatusCode}: {responseBody}");
            }

            _logger.LogInformation("Email sent successfully to {Email} via Resend API", email);
        }

        private async Task SendSmtpEmailAsync(string email, string subject, string htmlMessage)
        {
            var smtpHost = _configuration["EmailSettings:SmtpHost"];
            var smtpPort = _configuration.GetValue("EmailSettings:SmtpPort", 587);
            var smtpUser = _configuration["EmailSettings:SmtpUser"];
            var smtpPassword = _configuration["EmailSettings:SmtpPassword"];
            var enableSsl = _configuration.GetValue("EmailSettings:EnableSsl", true);
            var fromEmail = _configuration["EmailSettings:FromEmail"] ?? smtpUser;
            var fromName = _configuration["EmailSettings:FromName"] ?? "LazPe";

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
                EnableSsl = enableSsl,
                Timeout = 10000 // 10 seconds timeout
            };

            if (!string.IsNullOrWhiteSpace(smtpUser) && !string.IsNullOrWhiteSpace(smtpPassword))
            {
                client.UseDefaultCredentials = false;
                client.Credentials = new NetworkCredential(smtpUser, smtpPassword);
            }

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent to {Email} with subject {Subject} via SMTP", email, subject);
        }
    }
}


