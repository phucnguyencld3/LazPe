using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IVnPayService _vnPayService;
        private readonly IZaloPayService _zaloPayService;
        private readonly ApplicationDbContext _context;
        private readonly VnPayOptions _vnPayOptions;
        private readonly ZaloPayOptions _zaloPayOptions;
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(
            IVnPayService vnPayService,
            IZaloPayService zaloPayService,
            ApplicationDbContext context,
            IOptions<VnPayOptions> vnPayOptions,
            IOptions<ZaloPayOptions> zaloPayOptions,
            IInvoiceService invoiceService,
            ILogger<PaymentController> logger)
        {
            _vnPayService = vnPayService;
            _zaloPayService = zaloPayService;
            _context = context;
            _vnPayOptions = vnPayOptions.Value;
            _zaloPayOptions = zaloPayOptions.Value;
            _invoiceService = invoiceService;
            _logger = logger;
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

            // VNPay yêu cầu vnp_TxnRef phải là duy nhất cho mỗi lần giao dịch (kể cả khi thanh toán lại cùng 1 đơn hàng)
            // Vì vậy ta thêm Ticks vào sau Mã Hóa Đơn để đảm bảo tính duy nhất.
            var baseRef = invoice.InvoiceCode ?? request.InvoiceId.ToString();
            var txnRef = $"{baseRef}_{DateTime.Now.Ticks}";
            var orderInfo = string.IsNullOrWhiteSpace(request.OrderInfo)
                ? $"ThanhToanDonHang_{txnRef}"
                : request.OrderInfo.Replace(" ", "");

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

                // Tách lấy mã hóa đơn gốc (bỏ đi phần _Ticks)
                var originalRef = txnRef.Contains('_') ? txnRef.Split('_')[0] : txnRef;

                Invoice? invoice = null;
                if (int.TryParse(originalRef, out var invoiceId))
                {
                    invoice = await _context.Invoices.FirstOrDefaultAsync(x => x.InvoiceID == invoiceId && !x.IsDeleted);
                }
                else
                {
                    invoice = await _context.Invoices.FirstOrDefaultAsync(x => x.InvoiceCode == originalRef && !x.IsDeleted);
                }

                if (invoice != null)
                {
                    var tx = await _context.PaymentTransactions
                        .Where(x => x.InvoiceID == invoice.InvoiceID && x.TxnRef == txnRef)
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

                    bool isPendingBefore = invoice.Status == OrderStatus.Pending;
                    if (success && isPendingBefore)
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
                    ? $"{baseUrl}/Invoice?payment=success&invoiceId={originalRef}&txnNo={transactionNo}"
                    : $"{baseUrl}/profile?tab=orders&id={originalRef}&payment=failed&code={responseCode}";

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

        // ======== ZaloPay Endpoints ========
        [HttpPost("create-zalopay-url")]
        public async Task<IActionResult> CreateZaloPayUrl([FromBody] CreateZaloPayUrlRequest request)
        {
            if (request == null || request.Amount <= 0 || request.InvoiceId <= 0)
            {
                return BadRequest(new { success = false, message = "Dữ liệu tạo thanh toán không hợp lệ." });
            }

            var invoice = await _context.Invoices.FirstOrDefaultAsync(x => x.InvoiceID == request.InvoiceId && !x.IsDeleted);
            if (invoice == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy hóa đơn." });
            }

            // Format app_trans_id: yyMMdd_InvoiceId_Ticks
            var datePrefix = DateTime.Now.ToString("yyMMdd");
            var appTransId = $"{datePrefix}_{request.InvoiceId}_{DateTime.Now.Ticks % 100000}";
            var description = string.IsNullOrWhiteSpace(request.OrderInfo)
                ? $"Thanh toan don hang #{invoice.InvoiceCode ?? request.InvoiceId.ToString()}"
                : request.OrderInfo;

            var result = await _zaloPayService.CreatePaymentUrlAsync(
                appTransId,
                request.Amount,
                description,
                request.ReturnUrl);

            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.Message });
            }

            var tx = new PaymentTransaction
            {
                InvoiceID = request.InvoiceId,
                TxnRef = appTransId,
                Provider = "ZaloPay",
                Amount = request.Amount,
                Status = PaymentTransactionStatus.Pending
            };

            _context.PaymentTransactions.Add(tx);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                paymentUrl = result.PaymentUrl,
                appTransId
            });
        }

        [HttpPost("zalopay-callback")]
        public async Task<IActionResult> ZaloPayCallback([FromBody] System.Text.Json.JsonElement payload)
        {
            var resultDict = new Dictionary<string, object>();
            try
            {
                if (!payload.TryGetProperty("data", out var dataProp) || !payload.TryGetProperty("mac", out var macProp))
                {
                    resultDict["return_code"] = -1;
                    resultDict["return_message"] = "invalid payload format";
                    return Ok(resultDict);
                }

                string data = dataProp.GetString() ?? "";
                string mac = macProp.GetString() ?? "";

                bool isValid = _zaloPayService.ValidateCallback(data, mac);
                if (!isValid)
                {
                    resultDict["return_code"] = -1;
                    resultDict["return_message"] = "mac not equal";
                    return Ok(resultDict);
                }

                using var dataDoc = System.Text.Json.JsonDocument.Parse(data);
                var dataRoot = dataDoc.RootElement;
                string appTransId = dataRoot.GetProperty("app_trans_id").GetString() ?? "";
                string zpTransId = dataRoot.GetProperty("zp_trans_id").ToString();

                var parts = appTransId.Split('_');
                if (parts.Length >= 2 && int.TryParse(parts[1], out var invoiceId))
                {
                    var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);
                    if (invoice != null)
                    {
                        var tx = await _context.PaymentTransactions
                            .Where(x => x.InvoiceID == invoice.InvoiceID && x.TxnRef == appTransId)
                            .OrderByDescending(x => x.PaymentTransactionId)
                            .FirstOrDefaultAsync();

                        if (tx != null)
                        {
                            tx.Status = PaymentTransactionStatus.Success;
                            tx.PaidAt = DateTime.Now;
                            tx.VnPayTransactionNo = zpTransId;
                            tx.RawQuery = data;
                        }

                        if (invoice.Status == OrderStatus.Pending)
                        {
                            invoice.Status = OrderStatus.Confirmed;
                            invoice.ConfirmedAt = DateTime.Now;
                        }

                        await _context.SaveChangesAsync();
                    }
                }

                resultDict["return_code"] = 1;
                resultDict["return_message"] = "success";
                return Ok(resultDict);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing ZaloPay Callback");
                resultDict["return_code"] = 0;
                resultDict["return_message"] = ex.Message;
                return Ok(resultDict);
            }
        }

        [HttpGet("zalopay-return")]
        public async Task<IActionResult> ZaloPayReturn()
        {
            try
            {
                var status = Request.Query["status"].ToString();
                var appTransId = Request.Query["apptransid"].ToString();

                bool isSuccess = status == "1";

                var parts = appTransId.Split('_');
                string invoiceRef = parts.Length >= 2 ? parts[1] : appTransId;

                if (int.TryParse(invoiceRef, out var invoiceId))
                {
                    var invoice = await _context.Invoices.FirstOrDefaultAsync(x => x.InvoiceID == invoiceId && !x.IsDeleted);
                    if (invoice != null && isSuccess && invoice.Status == OrderStatus.Pending)
                    {
                        invoice.Status = OrderStatus.Confirmed;
                        invoice.ConfirmedAt = DateTime.Now;
                        await _context.SaveChangesAsync();
                    }
                }

                var baseUrl = string.IsNullOrWhiteSpace(_zaloPayOptions.FrontendBaseUrl)
                    ? "http://localhost:3000"
                    : _zaloPayOptions.FrontendBaseUrl.Trim().TrimEnd('/');

                var redirectUrl = isSuccess
                    ? $"{baseUrl}/Invoice?payment=success&invoiceId={invoiceRef}&provider=zalopay"
                    : $"{baseUrl}/profile?tab=orders&id={invoiceRef}&payment=failed&provider=zalopay";

                return Content($@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset='utf-8' />
                        <title>Đang chuyển hướng...</title>
                        <script>window.location.href = '{redirectUrl}';</script>
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
                _logger.LogError(ex, "ZaloPay Return Error");
                var baseUrl = string.IsNullOrWhiteSpace(_zaloPayOptions.FrontendBaseUrl)
                    ? "http://localhost:3000"
                    : _zaloPayOptions.FrontendBaseUrl.Trim().TrimEnd('/');

                return Content($@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset='utf-8' />
                        <script>window.location.href = '{baseUrl}/profile?tab=orders';</script>
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

        public class CreateZaloPayUrlRequest
        {
            public int InvoiceId { get; set; }
            public decimal Amount { get; set; }
            public string? OrderInfo { get; set; }
            public string ReturnUrl { get; set; } = string.Empty;
        }
    }
}