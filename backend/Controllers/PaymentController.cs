using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IVnPayService _vnPayService;
        private readonly ApplicationDbContext _context;
        private readonly VnPayOptions _vnPayOptions;

        public PaymentController(
            IVnPayService vnPayService,
            ApplicationDbContext context,
            IOptions<VnPayOptions> vnPayOptions)
        {
            _vnPayService = vnPayService;
            _context = context;
            _vnPayOptions = vnPayOptions.Value;
        }

        [HttpPost("create-vnpay-url")]
        public async Task<IActionResult> CreateVnPayUrl([FromBody] CreateVnPayUrlRequest request)
        {
            if (request == null || request.Amount <= 0 || string.IsNullOrWhiteSpace(request.ReturnUrl) || request.InvoiceId <= 0)
            {
                return BadRequest(new { success = false, message = "Dữ liệu tạo thanh toán không hợp lệ." });
            }

            var invoice = await _context.Invoices.FirstOrDefaultAsync(x => x.InvoiceID == request.InvoiceId && !x.IsDeleted);
            if (invoice == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy hóa đơn." });
            }

            var txnRef = request.InvoiceId.ToString();
            var orderInfo = string.IsNullOrWhiteSpace(request.OrderInfo)
                ? $"Thanh toan don hang {request.InvoiceId}"
                : request.OrderInfo;

            var paymentUrl = _vnPayService.CreatePaymentUrl(
                HttpContext,
                txnRef,
                request.Amount,
                orderInfo,
                request.ReturnUrl);

            var tx = new PaymentTransaction
            {
                InvoiceID = request.InvoiceId,
                TxnRef = txnRef,
                Status = PaymentTransactionStatus.Pending
            };

            _context.PaymentTransactions.Add(tx);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                paymentUrl,
                txnRef
            });
        }

        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VnPayReturn()
        {
            try
            {
                var success = _vnPayService.ValidateReturn(Request.Query, out var responseCode, out var txnRef, out var transactionNo);

                if (int.TryParse(txnRef, out var invoiceId))
                {
                    var invoice = await _context.Invoices.FirstOrDefaultAsync(x => x.InvoiceID == invoiceId && !x.IsDeleted);
                    var tx = await _context.PaymentTransactions
                        .Where(x => x.InvoiceID == invoiceId && x.TxnRef == txnRef)
                        .OrderByDescending(x => x.PaymentTransactionId)
                        .FirstOrDefaultAsync();

                    if (tx != null)
                    {
                        tx.ResponseCode = responseCode;
                        tx.VnPayTransactionNo = transactionNo;
                        tx.RawQuery = Request.QueryString.Value;
                        if (success)
                        {
                            tx.Status = PaymentTransactionStatus.Success;
                            tx.PaidAt = DateTime.Now;
                        }
                        else if (responseCode == "24")
                        {
                            tx.Status = PaymentTransactionStatus.Pending;
                        }
                        else
                        {
                            tx.Status = PaymentTransactionStatus.Failed;
                            tx.PaidAt = null;
                        }
                    }

                    if (invoice != null && success && invoice.Status == OrderStatus.Pending)
                    {
                        invoice.Status = OrderStatus.Confirmed;
                        invoice.ConfirmedAt = DateTime.Now;
                    }

                    await _context.SaveChangesAsync();
                }

                var baseUrl = string.IsNullOrWhiteSpace(_vnPayOptions.FrontendBaseUrl)
                    ? "http://localhost:3000"
                    : _vnPayOptions.FrontendBaseUrl.Trim().TrimEnd('/');

                var redirectUrl = success
                    ? $"{baseUrl}/Invoice?payment=success&invoiceId={txnRef}&txnNo={transactionNo}"
                    : $"{baseUrl}/profile?tab=orders&id={txnRef}&payment=failed&code={responseCode}";

                // Trả về HTML chứa script redirect để tránh lỗi Mixed Content (HTTPS -> HTTP) của trình duyệt
                return Content($@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset='utf-8' />
                        <title>Đang chuyển hướng...</title>
                        <script>
                            window.location.href = '{redirectUrl}';
                        </script>
                    </head>
                    <body>
                        <div style='text-align: center; margin-top: 100px; font-family: sans-serif;'>
                            <h2>Đang chuyển hướng về LazPe...</h2>
                            <p>Nếu trình duyệt không tự động chuyển hướng, vui lòng <a href='{redirectUrl}'>nhấp vào đây</a>.</p>
                        </div>
                    </body>
                    </html>", "text/html");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"VnPayReturn Error: {ex}");
                
                var baseUrl = string.IsNullOrWhiteSpace(_vnPayOptions.FrontendBaseUrl)
                    ? "http://localhost:3000"
                    : _vnPayOptions.FrontendBaseUrl.Trim().TrimEnd('/');

                return Content($@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset='utf-8' />
                        <script>
                            window.location.href = '{baseUrl}/profile?tab=orders';
                        </script>
                    </head>
                    <body>
                        <script>window.location.href = '{baseUrl}/profile?tab=orders';</script>
                    </body>
                    </html>", "text/html");
            }
        }

        public class CreateVnPayUrlRequest
        {
            public int InvoiceId { get; set; }
            public decimal Amount { get; set; }
            public string? OrderInfo { get; set; }
            public string ReturnUrl { get; set; } = string.Empty;
        }
    }
}