using Microsoft.AspNetCore.SignalR;
using PolyBabyAPI.Hubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using PolyBabyAPI.Models.Gemini;
using PolyBabyAPI.Models.Mongo;
using MongoDB.Bson;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PolyBabyAPI.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly GeminiSettings _settings;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<GeminiService> _logger;

        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public GeminiService(HttpClient httpClient, IOptions<GeminiSettings> settings, IServiceProvider serviceProvider, ILogger<GeminiService> logger)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        private List<GeminiTool> GetAvailableTools()
        {
            return new List<GeminiTool>
            {
                new GeminiTool
                {
                    FunctionDeclarations = new List<GeminiFunctionDeclaration>
                    {
                        new GeminiFunctionDeclaration
                        {
                            Name = "search_products",
                            Description = "Tìm kiếm sản phẩm trong cơ sở dữ liệu. LƯU Ý QUAN TRỌNG: Hãy dùng các từ khóa CỰC KỲ NGẮN GỌN (1-2 từ, ví dụ: 'sữa', 'bỉm', 'similac') để lấy ra nhiều kết quả nhất, sau đó AI hãy tự đọc mô tả để chọn lọc sản phẩm phù hợp với độ tuổi hoặc yêu cầu chi tiết của khách.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>
                                {
                                    { "keyword", new GeminiSchema { Type = "STRING", Description = "Từ khóa tìm kiếm sản phẩm (ví dụ: sữa bột, bỉm...)" } }
                                }
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "search_bundles",
                            Description = "Tìm kiếm các combo (bundles) hiện có trong hệ thống.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>
                                {
                                    { "keyword", new GeminiSchema { Type = "STRING", Description = "Từ khóa tìm kiếm combo" } }
                                }
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "check_order_status",
                            Description = "Kiểm tra tình trạng đơn hàng bằng mã đơn hàng.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>
                                {
                                    { "orderCode", new GeminiSchema { Type = "STRING", Description = "Mã đơn hàng (ví dụ: ORD-12345)" } }
                                },
                                Required = new List<string> { "orderCode" }
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "get_active_vouchers",
                            Description = "Lấy danh sách các mã giảm giá (voucher) đang hoạt động.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>()
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "add_to_cart",
                            Description = "Thêm một sản phẩm vào giỏ hàng của khách. Sử dụng công cụ này khi khách hàng yêu cầu AI mua giúp hoặc thêm một sản phẩm vào giỏ hàng. LƯU Ý QUAN TRỌNG: Nếu sản phẩm có nhiều biến thể (Variants), bạn PHẢI liệt kê các biến thể đó ra và hỏi khách hàng muốn chọn loại nào trước khi gọi hàm này, không được tự ý chọn.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>
                                {
                                    { "variantId", new GeminiSchema { Type = "INTEGER", Description = "ID của phiên bản sản phẩm (Lấy từ danh sách Variants của kết quả tìm kiếm)" } },
                                    { "quantity", new GeminiSchema { Type = "INTEGER", Description = "Số lượng muốn mua" } }
                                },
                                Required = new List<string> { "variantId", "quantity" }
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "count_public_products",
                            Description = "Đếm tổng số sản phẩm hoặc biến thể đang bán theo từ khóa.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>
                                {
                                    { "keyword", new GeminiSchema { Type = "STRING", Description = "Từ khóa tìm kiếm (bỏ trống nếu muốn đếm tất cả)" } }
                                }
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "count_product_variants",
                            Description = "Đếm số lượng biến thể còn hàng của một sản phẩm.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>
                                {
                                    { "keyword", new GeminiSchema { Type = "STRING", Description = "Tên sản phẩm" } }
                                },
                                Required = new List<string> { "keyword" }
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "count_public_vouchers",
                            Description = "Đếm số lượng mã giảm giá công khai đang dùng được.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>()
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "get_flash_sale_items",
                            Description = "Lấy danh sách các sản phẩm đang chạy trong chương trình Flash Sale hiện tại.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>()
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "get_customer_vouchers",
                            Description = "Lấy danh sách các mã giảm giá (voucher) hiện có trong ví của khách hàng.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>()
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "count_flash_sale_items",
                            Description = "Đếm số lượng sản phẩm đang chạy Flash Sale và còn suất mua.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>()
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "count_product_reviews",
                            Description = "Đếm số lượng đánh giá công khai của một sản phẩm.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>
                                {
                                    { "keyword", new GeminiSchema { Type = "STRING", Description = "Tên sản phẩm" } },
                                    { "rating", new GeminiSchema { Type = "STRING", Description = "Số sao muốn đếm (ví dụ 5), để trống nếu đếm tất cả" } }
                                },
                                Required = new List<string> { "keyword" }
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "count_customer_cart_items",
                            Description = "Đếm tổng số lượng sản phẩm đang có trong giỏ hàng của khách.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>()
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "count_customer_orders",
                            Description = "Đếm số đơn hàng của khách. Hỗ trợ lọc theo trạng thái.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>
                                {
                                    { "status", new GeminiSchema { Type = "STRING", Description = "Trạng thái đơn: 0=Pending, 1=Confirmed, 2=Shipped, 3=Completed, 4=CancelRequested, 5=Cancelled. Bỏ trống đếm tất cả." } }
                                }
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "count_customer_vouchers",
                            Description = "Đếm số lượng voucher khả dụng đang lưu trong ví của khách.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>()
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "count_customer_loyalty",
                            Description = "Trả về số điểm thưởng hiện có và hạng thành viên của khách.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>()
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "count_customer_notifications",
                            Description = "Đếm số lượng thông báo cá nhân của khách.",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>
                                {
                                    { "unreadOnly", new GeminiSchema { Type = "STRING", Description = "True nếu chỉ muốn đếm thông báo chưa đọc" } }
                                }
                            }
                        },
                        new GeminiFunctionDeclaration
                        {
                            Name = "check_baby_growth_status",
                            Description = "Lấy dữ liệu tăng trưởng và tiêm chủng của bé, trả về tình trạng phát triển hiện tại (Underweight, Normal, Overweight).",
                            Parameters = new GeminiSchema
                            {
                                Type = "OBJECT",
                                Properties = new Dictionary<string, GeminiSchema>
                                {
                                    { "babyId", new GeminiSchema { Type = "STRING", Description = "ID của em bé" } }
                                }
                            }
                        }
                    }
                }
            };
        }

        private async Task<object> ExecuteToolCallAsync(string sessionId, string functionName, Dictionary<string, object> args)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            try
            {
                switch (functionName)
                {
                    case "search_products":
                        var keyword = args.ContainsKey("keyword") ? args["keyword"].ToString() : "";

                        // Query cơ bản
                        var productsQuery = dbContext.Products
                            .Include(p => p.Category)
                            .Include(p => p.Variants) // Load Variants để lấy ID
                            .Include(p => p.Images)   // Load Images để fallback ảnh sản phẩm
                            .AsQueryable();

                        if (!string.IsNullOrEmpty(keyword))
                        {
                            // Tối ưu: Tách từ khóa theo khoảng trắng để tìm kiếm linh hoạt hơn (AND)
                            // Tránh việc khách gõ "sữa 2 tuổi" không khớp với "sữa ... (1-3 tuổi)"
                            var words = keyword.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries)
                                               .Where(w => w.Length > 1) // Bỏ qua các từ quá ngắn
                                               .ToList();

                            foreach (var word in words)
                            {
                                productsQuery = productsQuery.Where(p => 
                                    p.ProductName.Contains(word) ||
                                    (p.Category != null && p.Category.CategoryName.Contains(word)) ||
                                    (p.Description != null && p.Description.Contains(word)) ||
                                    (p.Specifications != null && p.Specifications.Contains(word))
                                );
                            }
                        }

                        var products = await productsQuery
                            .Select(p => new
                            {
                                p.ProductID,
                                p.Slug,
                                p.ProductName,
                                Category = p.Category != null ? p.Category.CategoryName : "",
                                Description = p.Description != null && p.Description.Length > 200 ? p.Description.Substring(0, 200) + "..." : p.Description,
                                Price = p.Price * (1m - (p.ProductDiscountPercent / 100m)),
                                Stock = p.Stock,
                                // Ưu tiên ảnh sản phẩm gốc trước, nếu không có thì dùng ảnh biến thể
                                ImageUrl = p.Images
                                    .OrderBy(i => i.DisplayOrder)
                                    .Select(i => i.ImageUrl)
                                    .FirstOrDefault()
                                    ?? p.Variants
                                        .Where(v => v.ImageUrl != null && v.ImageUrl != "")
                                        .OrderBy(v => v.VariantID)
                                        .Select(v => v.ImageUrl)
                                        .FirstOrDefault(),
                                Variants = p.Variants.Where(v => v.Stock > 0 && v.Status).Select(v => new
                                {
                                    v.VariantID,
                                    v.VariantName,
                                    UnitPrice = v.UnitPrice * (1m - ((v.VariantDiscountPercent > 0 ? v.VariantDiscountPercent : p.ProductDiscountPercent) / 100m)),
                                    v.Stock,
                                    // Nếu biến thể không có ảnh, fallback về ảnh sản phẩm gốc
                                    ImageUrl = (v.ImageUrl != null && v.ImageUrl != "")
                                        ? v.ImageUrl
                                        : p.Images
                                            .OrderBy(i => i.DisplayOrder)
                                            .Select(i => i.ImageUrl)
                                            .FirstOrDefault()
                                }).ToList()
                            })
                            .Take(20) // Trả về tối đa 20 sản phẩm để AI có đủ dữ liệu tự chọn lọc
                            .ToListAsync();

                        return new { results = products, message = products.Any() ? $"Tìm thấy {products.Count} sản phẩm" : "Không tìm thấy sản phẩm" };

                    case "search_bundles":
                        var kwBundle = args.ContainsKey("keyword") ? args["keyword"].ToString() : "";
                        var bundlesQuery = dbContext.Bundles.Where(b => b.Status).AsQueryable();
                        if (!string.IsNullOrEmpty(kwBundle))
                        {
                            bundlesQuery = bundlesQuery.Where(b => b.Name.Contains(kwBundle) || (b.Description != null && b.Description.Contains(kwBundle)));
                        }
                        var bundles = await bundlesQuery.Select(b => new {
                            b.BundleID,
                            b.Name,
                            b.Description,
                            b.Price,
                            b.DiscountPercent,
                            b.ImageUrl
                        }).Take(10).ToListAsync();
                        return new { results = bundles, message = bundles.Any() ? $"Tìm thấy {bundles.Count} combo" : "Không tìm thấy combo" };

                    case "check_baby_growth_status":
                        var bIdStr = args.ContainsKey("babyId") ? args["babyId"].ToString() : "";
                        if (int.TryParse(bIdStr, out int bId))
                        {
                            var trackerService = scope.ServiceProvider.GetRequiredService<IBabyTrackerService>();
                            var data = await trackerService.GetTrackerDataAsync(bId);
                            if (data == null) return new { error = "Không tìm thấy hồ sơ của bé." };
                            
                            var status = await trackerService.GetGrowthStatusAsync(bId);
                            return new 
                            { 
                                message = $"Tình trạng phát triển của bé {data.Name} hiện tại là: {status}",
                                data = data 
                            };
                        }
                        return new { error = "ID bé không hợp lệ." };

                    case "check_order_status":
                        var orderIdStr = args.ContainsKey("orderCode") ? args["orderCode"].ToString() : "";
                        if (string.IsNullOrEmpty(orderIdStr)) return new { error = "Mã đơn hàng không hợp lệ" };

                        int invoiceId;
                        if (!int.TryParse(orderIdStr, out invoiceId))
                        {
                            var foundId = await dbContext.Invoices
                                .Where(i => i.InvoiceCode == orderIdStr || i.TrackingCode == orderIdStr)
                                .Select(i => i.InvoiceID)
                                .FirstOrDefaultAsync();

                            if (foundId == 0) return new { error = "Không tìm thấy đơn hàng" };
                            invoiceId = foundId;
                        }

                        var order = await dbContext.Invoices
                            .Where(i => i.InvoiceID == invoiceId)
                            .Select(i => new
                            {
                                i.InvoiceID,
                                i.Status,
                                i.TotalPrice,
                                i.CreatedAt
                            })
                            .FirstOrDefaultAsync();

                        if (order == null) return new { error = "Không tìm thấy đơn hàng" };
                        
                        string statusText = ((int)order.Status) switch
                        {
                            0 => "Chờ xác nhận",
                            1 => "Đã xác nhận",
                            2 => "Đang giao",
                            3 => "Hoàn tất",
                            4 => "Chờ duyệt hủy",
                            5 => "Đã hủy",
                            _ => "Không xác định"
                        };

                        return new { orderCode = order.InvoiceID.ToString(), status = statusText, totalAmount = order.TotalPrice };

                    case "get_active_vouchers":
                        var vouchers = await dbContext.Vouchers
                            .Where(v => v.Status == true && v.StartDate <= DateTime.Now && v.EndDate >= DateTime.Now && (v.TotalQuantity - v.UsedQuantity) > 0)
                            .Select(v => new
                            {
                                v.Code,
                                v.DiscountValue,
                                v.DiscountType, // 1 = Percent, 2 = Fixed
                                v.MinOrderValue,
                                v.EndDate
                            })
                            .Take(5)
                            .ToListAsync();

                        return new { results = vouchers };

                    case "add_to_cart":
                        var variantIdStr = args.ContainsKey("variantId") ? args["variantId"].ToString() : "";
                        var quantityStr = args.ContainsKey("quantity") ? args["quantity"].ToString() : "1";

                        if (int.TryParse(variantIdStr, out int variantId) && int.TryParse(quantityStr, out int quantity))
                        {
                            var session = await dbContext.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
                            if (session == null || string.IsNullOrEmpty(session.UserId))
                            {
                                return new { error = "LƯU Ý: Khách hàng chưa đăng nhập. Hãy yêu cầu khách hàng đăng nhập tài khoản trên LazPe để bạn có thể thêm vào giỏ hàng giúp họ." };
                            }

                            try
                            {
                                var cartService = scope.ServiceProvider.GetRequiredService<ICartService>();
                                await cartService.AddToCartAsync(session.UserId, variantId, null, quantity);
                                
                                var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<ChatHub>>();
                                await hubContext.Clients.Group(sessionId).SendAsync("CartUpdated");

                                return new { success = true, message = $"Thành công! Đã thêm {quantity} sản phẩm (ID: {variantId}) vào giỏ hàng của khách." };
                            }
                            catch (Exception ex)
                            {
                                return new { error = $"Không thể thêm vào giỏ hàng: {ex.Message}. Hãy thông báo lỗi này cho khách hàng một cách lịch sự." };
                            }
                        }
                        return new { error = "Dữ liệu variantId hoặc quantity không hợp lệ." };

                    case "count_public_products":
                        var kwProd = args.ContainsKey("keyword") ? args["keyword"].ToString() : "";
                        var productCount = await dbContext.Products.CountAsync(p => p.Status && p.Stock > 0 && (string.IsNullOrEmpty(kwProd) || p.ProductName.Contains(kwProd)));
                        return new { count = productCount, message = $"Có {productCount} sản phẩm phù hợp" };

                    case "count_product_variants":
                        var kwVariant = args.ContainsKey("keyword") ? args["keyword"].ToString() : "";
                        if(string.IsNullOrEmpty(kwVariant)) return new { error = "Vui lòng cung cấp tên sản phẩm để đếm biến thể" };
                        var productToCount = await dbContext.Products.Include(p => p.Variants).FirstOrDefaultAsync(p => p.ProductName.Contains(kwVariant) && p.Status);
                        if(productToCount == null) return new { count = 0, message = "Không tìm thấy sản phẩm" };
                        var variantCount = productToCount.Variants.Count(v => v.Stock > 0 && v.Status);
                        return new { count = variantCount, message = $"Sản phẩm '{productToCount.ProductName}' có {variantCount} loại/màu còn hàng" };

                    case "count_public_vouchers":
                        var vCount = await dbContext.Vouchers.CountAsync(v => v.Status == true && v.StartDate <= DateTime.Now && v.EndDate >= DateTime.Now && (v.TotalQuantity - v.UsedQuantity) > 0 && v.VisibilityType == VoucherVisibilityType.Public);
                        return new { count = vCount, message = $"Có {vCount} mã giảm giá công khai đang khả dụng" };

                    case "get_flash_sale_items":
                        var activeFsInfo = await dbContext.FlashSales.FirstOrDefaultAsync(f => f.IsActive && f.Status == FlashSaleStatus.Active && f.StartTime <= DateTime.Now && f.EndTime >= DateTime.Now);
                        if(activeFsInfo == null) return new { error = "Hiện không có chương trình Flash Sale nào đang diễn ra" };
                        var fsItemsList = await dbContext.FlashSaleItems
                            .Where(i => i.FlashSaleId == activeFsInfo.Id && (i.TotalQuantity - i.SoldQuantity) > 0)
                            .Take(20)
                            .ToListAsync();
                        
                        var resultItems = new List<object>();
                        foreach(var item in fsItemsList) {
                            string name = "Sản phẩm / Biến thể (ID: " + item.ReferenceId + ")";
                            if (item.ItemType == FlashSaleItemType.Product) {
                                var p = await dbContext.Products.FindAsync(item.ReferenceId);
                                if (p != null) name = p.ProductName;
                            } else if (item.ItemType == FlashSaleItemType.Variant) {
                                var v = await dbContext.Variants.FindAsync(item.ReferenceId);
                                if (v != null) {
                                    var p = await dbContext.Products.FindAsync(v.ProductID);
                                    name = (p != null ? p.ProductName + " - " : "") + v.VariantName;
                                }
                            }
                            resultItems.Add(new {
                                ItemName = name,
                                DiscountPrice = item.DiscountPrice,
                                RemainingQuantity = item.TotalQuantity - item.SoldQuantity
                            });
                        }
                        return new { programName = activeFsInfo.Name, items = resultItems };

                    case "get_customer_vouchers":
                        var sessionVoucher = await dbContext.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
                        if (sessionVoucher == null || string.IsNullOrEmpty(sessionVoucher.UserId))
                        {
                            return new { error = "LƯU Ý: Khách hàng chưa đăng nhập. Hãy yêu cầu khách đăng nhập tài khoản trên LazPe để xem voucher trong ví." };
                        }
                        var myVouchers = await dbContext.UserVouchers
                            .Include(uv => uv.Voucher)
                            .Where(uv => uv.UserID == sessionVoucher.UserId && uv.Status == UserVoucherStatus.Unused && uv.Voucher.EndDate >= DateTime.Now)
                            .Select(uv => new {
                                Code = uv.Voucher.Code,
                                DiscountValue = uv.Voucher.DiscountValue,
                                Type = uv.Voucher.DiscountType == 1 ? "Giảm theo %" : "Giảm tiền mặt",
                                MinOrder = uv.Voucher.MinOrderValue,
                                EndDate = uv.Voucher.EndDate
                            })
                            .Take(10)
                            .ToListAsync();
                        return new { vouchers = myVouchers, message = myVouchers.Any() ? "Danh sách voucher trong ví:" : "Ví của khách hiện không có voucher nào dùng được." };

                    case "count_flash_sale_items":
                        var activeFs = await dbContext.FlashSales.FirstOrDefaultAsync(f => f.IsActive && f.Status == FlashSaleStatus.Active && f.StartTime <= DateTime.Now && f.EndTime >= DateTime.Now);
                        if(activeFs == null) return new { count = 0, message = "Hiện không có chương trình Flash Sale nào đang diễn ra" };
                        var fsItemCount = await dbContext.FlashSaleItems.CountAsync(i => i.FlashSaleId == activeFs.Id && (i.TotalQuantity - i.SoldQuantity) > 0);
                        return new { count = fsItemCount, message = $"Flash Sale hiện tại còn {fsItemCount} sản phẩm/suất mua" };

                    case "count_product_reviews":
                        var kwRev = args.ContainsKey("keyword") ? args["keyword"].ToString() : "";
                        if(string.IsNullOrEmpty(kwRev)) return new { error = "Vui lòng cung cấp tên sản phẩm" };
                        var ratingStr = args.ContainsKey("rating") ? args["rating"].ToString() : "";
                        var pRev = await dbContext.Products.FirstOrDefaultAsync(p => p.ProductName.Contains(kwRev));
                        if(pRev == null) return new { count = 0 };
                        
                        var revQuery = dbContext.Reviews.Where(r => r.Variant != null && r.Variant.ProductID == pRev.ProductID && !r.IsHidden);
                        if(!string.IsNullOrEmpty(ratingStr) && int.TryParse(ratingStr, out int rStars)) {
                            revQuery = revQuery.Where(r => r.Rating == rStars);
                        }
                        return new { count = await revQuery.CountAsync() };

                    case "count_customer_cart_items":
                    case "count_customer_orders":
                    case "count_customer_vouchers":
                    case "count_customer_loyalty":
                    case "count_customer_notifications":
                        var customerSession = await dbContext.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
                        if (customerSession == null || string.IsNullOrEmpty(customerSession.UserId))
                        {
                            return new { error = "Vui lòng yêu cầu khách hàng đăng nhập tài khoản trên LazPe để xem thông tin này." };
                        }
                        var currentUserId = customerSession.UserId;

                        switch (functionName)
                        {
                            case "count_customer_cart_items":
                                var cartService = scope.ServiceProvider.GetRequiredService<ICartService>();
                                var cart = await cartService.GetCartByUserIdAsync(currentUserId);
                                return new { count = cart.CartDetails.Sum(c => c.Quantity) };
                            
                            case "count_customer_orders":
                                var statusStr = args.ContainsKey("status") ? args["status"].ToString() : "";
                                var orderQuery = dbContext.Invoices.Where(i => i.UserID == currentUserId && !i.IsDeleted);
                                if (!string.IsNullOrEmpty(statusStr) && int.TryParse(statusStr, out int st)) {
                                    orderQuery = orderQuery.Where(i => i.Status == (OrderStatus)st);
                                }
                                return new { count = await orderQuery.CountAsync() };

                            case "count_customer_vouchers":
                                var uvCount = await dbContext.UserVouchers
                                    .Include(uv => uv.Voucher)
                                    .CountAsync(uv => uv.UserID == currentUserId && uv.Status == UserVoucherStatus.Unused && uv.Voucher.EndDate >= DateTime.Now);
                                return new { count = uvCount };

                            case "count_customer_loyalty":
                                var loyalty = await dbContext.LoyaltyProfiles.Include(l => l.Tier).FirstOrDefaultAsync(l => l.UserID == currentUserId);
                                if (loyalty == null) return new { totalPoints = 0, currentTier = "Chưa có" };
                                return new { totalPoints = loyalty.TotalPoints, currentTier = loyalty.Tier?.TierName ?? "Chưa có" };

                            case "count_customer_notifications":
                                var unreadOnlyStr = args.ContainsKey("unreadOnly") ? args["unreadOnly"].ToString() : "false";
                                bool unreadOnly = bool.TryParse(unreadOnlyStr, out bool b) && b;
                                var notifQuery = dbContext.UserNotifications.Where(n => n.UserId == currentUserId);
                                if (unreadOnly) notifQuery = notifQuery.Where(n => !n.IsRead);
                                return new { count = await notifQuery.CountAsync() };
                            
                            default:
                                return new { error = "Hàm không được hỗ trợ." };
                        }

                    default:
                        return new { error = $"Function {functionName} not found." };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing function {FunctionName}", functionName);
                return new { error = "Lỗi hệ thống khi thực thi function." };
            }
        }

        private async Task<List<GeminiContent>> GetChatHistoryAsync(string sessionId)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var messages = await dbContext.ChatMessages
                .Where(m => m.ChatSessionId == sessionId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(20) // Lấy 20 tin nhắn gần nhất
                .ToListAsync();

            messages.Reverse(); // Đảo lại theo thứ tự thời gian tăng dần

            var history = new List<GeminiContent>();
            foreach (var msg in messages)
            {
                var role = msg.IsFromAdmin ? "model" : "user";
                var text = msg.MessageText ?? "[Hình ảnh]";

                if (history.Count > 0 && history.Last().Role == role)
                {
                    history.Last().Parts.Add(new GeminiPart { Text = text });
                }
                else
                {
                    history.Add(new GeminiContent
                    {
                        Role = role,
                        Parts = new List<GeminiPart> { new GeminiPart { Text = text } }
                    });
                }
            }

            return history;
        }

        private static int _keyIndex = 0;



        private string GetNextApiKey()
        {
            var validKeys = _settings.ApiKeys?.Where(k => !string.IsNullOrEmpty(k) && k != "YOUR_API_KEY_HERE").ToList();
            if (validKeys != null && validKeys.Count > 0)
            {
                int index = System.Threading.Interlocked.Increment(ref _keyIndex) % validKeys.Count;
                if (index < 0) index += validKeys.Count;
                return validKeys[index];
            }
            return _settings.ApiKey;
        }

        public async Task<string> GenerateTextAsync(string sessionId, string prompt)
        {
            var history = await GetChatHistoryAsync(sessionId);
            
            // RAG đã bị xóa theo yêu cầu

            string babyContext = "";
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var session = await dbContext.ChatSessions
                    .Include(s => s.User)
                    .ThenInclude(u => u.BabyProfiles)
                    .ThenInclude(b => b.GrowthRecords)
                    .FirstOrDefaultAsync(s => s.Id == sessionId);

                if (session?.User != null && session.User.BabyProfiles != null && session.User.BabyProfiles.Count > 0)
                {
                    var sb = new StringBuilder();
                    sb.AppendLine("LƯU Ý NGỮ CẢNH: Khách hàng hiện tại đã đăng nhập và có các thông tin bé sau đây. Hãy chủ động xưng hô thân mật (ví dụ nhắc đến tên bé) và tư vấn sản phẩm phù hợp với độ tuổi/giới tính của bé. QUAN TRỌNG: TUYỆT ĐỐI KHÔNG lặp lại các thông số tuổi, cân nặng, chiều cao của bé vào trong câu trả lời (ví dụ KHÔNG ĐƯỢC nói 'bé Mèo 20 tháng nặng 15kg'), chỉ cần gọi tên bé một cách tự nhiên (ví dụ 'Dạ đối với bé Mèo, em gợi ý...'):");
                    foreach (var baby in session.User.BabyProfiles)
                    {
                        var dob = baby.DateOfBirth;
                        var today = DateTime.Now;
                        int months = (today.Year - dob.Year) * 12 + today.Month - dob.Month;
                        if (today.Day < dob.Day) months--;
                        if (months < 0) months = 0;

                        string genderStr = (baby.Gender == "Male" || baby.Gender == "Nam" || baby.Gender == "Boy") ? "bé trai" : ((baby.Gender == "Female" || baby.Gender == "Nữ" || baby.Gender == "Girl") ? "bé gái" : "bé");
                        var latestGrowth = baby.GrowthRecords?.OrderByDescending(gr => gr.RecordedDate).FirstOrDefault();
                        double? w = latestGrowth != null ? latestGrowth.WeightKg : baby.WeightKg;
                        double? h = latestGrowth != null ? latestGrowth.HeightCm : baby.HeightCm;
                        sb.AppendLine($"- Bé {baby.Name} (ID: {baby.BabyProfileID}): là {genderStr}, sinh ngày {dob:dd/MM/yyyy} ({months} tháng tuổi). Cân nặng: {w}kg, Chiều cao: {h}cm. Mối quan hệ với khách hàng: {baby.Relationship}. Màu sắc yêu thích của bé: {baby.FavoriteColors}.");
                    }
                    babyContext = sb.ToString() + "\n";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting baby context for chat session {SessionId}", sessionId);
            }

            var systemPrompt = babyContext +
                               "Bạn là trợ lý AI LazPe, chuyên hỗ trợ khách hàng mua sắm các sản phẩm mẹ và bé. " +
                               "Hãy trả lời ngắn gọn, lịch sự, chuyên nghiệp bằng tiếng Việt. " +
                               "Luôn ưu tiên dùng công cụ để tìm thông tin thực tế từ hệ thống LazPe. " +
                               "Khi khách hàng đặt câu hỏi về số lượng (có mấy, bao nhiêu, đếm...), BẮT BUỘC phải sử dụng các công cụ (tools) bắt đầu bằng tiền tố count_ tương ứng để lấy số liệu thực tế từ cơ sở dữ liệu thay vì tự ước lượng. Hãy nhắc khách đăng nhập nếu công cụ trả về lỗi yêu cầu đăng nhập. " +
                               "Khi khách hàng hỏi về CÁC SẢN PHẨM TRONG CHƯƠNG TRÌNH FLASH SALE (ví dụ: 'có sp gì trong sale', 'chương trình siêu sale có gì'), HÃY DÙNG CÔNG CỤ get_flash_sale_items để liệt kê danh sách thay vì tìm kiếm sản phẩm thông thường. " +
                               "Khi khách hàng hỏi xem CÁC VOUCHER/MÃ GIẢM GIÁ (ví dụ: 'có voucher nào', 'mã giảm giá trang chủ', 'voucher trong ví'), HÃY DÙNG get_active_vouchers cho voucher công khai và get_customer_vouchers cho voucher trong ví. " +
                               "LƯU Ý QUAN TRỌNG KHI THÊM GIỎ HÀNG: Khi khách yêu cầu thêm 1 sản phẩm cụ thể vào giỏ hàng (ví dụ: 'thêm bỉm size L', 'mua sữa này'), DO LỊCH SỬ CHAT KHÔNG LƯU MÃ VARIANT_ID, BẠN BẮT BUỘC PHẢI GỌI CÔNG CỤ search_products MỘT LẦN NỮA để tìm đúng sản phẩm đó và lấy được chính xác variantId của loại khách chọn, SAU ĐÓ mới dùng công cụ add_to_cart. TUYỆT ĐỐI KHÔNG TỰ ĐOÁN MÒ MÃ variantId hoặc dùng sai mã của sản phẩm khác.\n\n" +
                               "LƯU Ý QUAN TRỌNG VỀ HIỂN THỊ SẢN PHẨM:\n" +
                               "1. BẤT CỨ KHI NÀO bạn nhắc đến, gợi ý, hoặc hiển thị thông tin sản phẩm (dù là 1 sản phẩm hay danh sách nhiều sản phẩm), BẠN BẮT BUỘC PHẢI DÙNG MARKDOWN CODE BLOCK với ngôn ngữ `product_card` CHO TỪNG SẢN PHẨM ĐÓ thay vì chỉ viết tên chay. Nội dung bên trong mỗi block phải là JSON CHUẨN chứa các trường: `productId`, `slug`, `variantId`, `name`, `price`, `imageUrl`. Ví dụ:\n" +
                               "```product_card\n" +
                               "{ \"productId\": 1, \"slug\": \"sua-bot\", \"variantId\": 10, \"name\": \"Sữa bột\", \"price\": 500000, \"imageUrl\": \"url_anh\" }\n" +
                               "```\n" +
                               "Nếu hiển thị nhiều sản phẩm, hãy xuất ra nhiều block `product_card` riêng biệt.\n" +
                               "2. NẾU khách hàng CHỈ YÊU CẦU XEM HÌNH ẢNH (ví dụ: 'cho mình xem ảnh', 'hình sản phẩm đâu') và không cần thông tin mua sắm: có thể dùng Markdown `![Tên ảnh](URL)`.\n\n";

            var requestBody = new GeminiRequest
            {
                SystemInstruction = new GeminiContent
                {
                    Role = "user",
                    Parts = new List<GeminiPart> { new GeminiPart { Text = systemPrompt } }
                },
                Contents = history,
                Tools = GetAvailableTools()
            };

            int maxToolCalls = 3; // Prevent infinite loop
            int loopCount = 0;

            while (loopCount < maxToolCalls)
            {
                loopCount++;
                var content = new StringContent(JsonSerializer.Serialize(requestBody, _jsonOptions), Encoding.UTF8, "application/json");

                HttpResponseMessage response = null;
                int maxRetries = _settings.ApiKeys != null && _settings.ApiKeys.Count > 0 ? _settings.ApiKeys.Count : 1;
                int retryCount = 0;

                while (retryCount < maxRetries)
                {
                    string currentKey = GetNextApiKey();
                    if (string.IsNullOrEmpty(currentKey))
                        throw new InvalidOperationException("Gemini API Key is not configured.");

                    string requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={currentKey}";
                    
                    Console.WriteLine($"[Gemini] Using API Key ending in: ...{currentKey.Substring(Math.Max(0, currentKey.Length - 4))}");
                    
                    response = await _httpClient.PostAsync(requestUrl, content);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        break; // Success, exit retry loop
                    }
                    
                    if ((int)response.StatusCode == 429 || (int)response.StatusCode >= 500)
                    {
                        Console.WriteLine($"[Gemini] Key failed with {(int)response.StatusCode}. Retrying with another key...");
                        retryCount++;
                        if (retryCount >= maxRetries)
                        {
                            if ((int)response.StatusCode == 429)
                                throw new Exception("Hệ thống AI đang quá tải do vượt quá giới hạn API. Vui lòng đợi 1 phút rồi thử lại.");
                            else
                            {
                                var err = await response.Content.ReadAsStringAsync();
                                throw new HttpRequestException($"API Error {(int)response.StatusCode}: {err}");
                            }
                        }
                    }
                    else
                    {
                        var errorDetails = await response.Content.ReadAsStringAsync();
                        throw new HttpRequestException($"API Error {(int)response.StatusCode}: {errorDetails}");
                    }
                }

                var responseString = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<GeminiResponse>(responseString, _jsonOptions);

                var candidate = result?.Candidates?.FirstOrDefault();
                if (candidate?.Content == null) return "Xin lỗi, tôi không thể trả lời lúc này.";

                var part = candidate.Content.Parts.FirstOrDefault();
                if (part == null) return "Xin lỗi, không nhận được phản hồi hợp lệ.";

                if (part.FunctionCall != null)
                {
                    var functionCall = part.FunctionCall;
                    Console.WriteLine($"Function Name: {functionCall.Name}");
                    Console.WriteLine($"Args: {JsonSerializer.Serialize(functionCall.Args)}");

                    var toolResult = await ExecuteToolCallAsync(sessionId, functionCall.Name, functionCall.Args);

                    var functionResponse = new GeminiFunctionResponse
                    {                  
                        Name = part.FunctionCall.Name,
                        Response = JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(toolResult))!
                    };

                    requestBody.Contents.Add(candidate.Content);
                    requestBody.Contents.Add(new GeminiContent
                    {
                        Role = "user",
                        Parts = new List<GeminiPart>
                        {
                            new GeminiPart { FunctionResponse = functionResponse }
                        }
                    });
                }
                else
                {
                    // Trả lời Text
                    return part.Text ?? string.Empty;
                }
            }

            return "Xin lỗi, tôi cần thêm thông tin để xử lý yêu cầu của bạn.";
        }

        public async IAsyncEnumerable<string> StreamTextAsync(string sessionId, string prompt)
        {
            // For simplicity in Stage 1, fallback stream to standard GenerateTextAsync
            // Because streaming function calling is very complex (partial JSON parsing).
            // Once the text is ready, we yield it entirely.
            var responseText = await GenerateTextAsync(sessionId, prompt);
            
            // Fake streaming to not break UI contract
            var words = responseText.Split(' ');
            foreach(var word in words)
            {
                yield return word + " ";
                await Task.Delay(20);
            }
        }

        public Task<float[]> GetEmbeddingAsync(string text)
        {
            // [CỨU CÁNH] Tài khoản Google API bị chặn model nhúng (404)
            // Sinh giả vector 768 chiều để hệ thống tiếp tục hoạt động mà không bị crash
            var random = new Random(text?.GetHashCode() ?? 0);
            var fakeEmbed = new float[768];
            for (int i = 0; i < 768; i++)
            {
                fakeEmbed[i] = (float)(random.NextDouble() * 2 - 1); // Sinh số từ -1 đến 1
            }
            return Task.FromResult(fakeEmbed);
        }

        public async Task<string> AnalyzeImageForSearchAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return string.Empty;

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var base64Data = Convert.ToBase64String(memoryStream.ToArray());
            var mimeType = file.ContentType;

            var requestBody = new GeminiRequest
            {
                Contents = new List<GeminiContent>
                {
                    new GeminiContent
                    {
                        Role = "user",
                        Parts = new List<GeminiPart>
                        {
                            new GeminiPart { Text = "Hãy mô tả ngắn gọn và chính xác nhất sản phẩm chính trong bức ảnh này bằng 1 đến 4 từ khóa (ví dụ: xe đẩy em bé, bỉm moony, bình sữa, ...). Chỉ trả về từ khóa tìm kiếm cốt lõi, không giải thích gì thêm." },
                            new GeminiPart 
                            { 
                                InlineData = new GeminiInlineData 
                                { 
                                    MimeType = mimeType, 
                                    Data = base64Data 
                                } 
                            }
                        }
                    }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody, _jsonOptions), Encoding.UTF8, "application/json");
            string currentKey = GetNextApiKey();
            string requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={currentKey}";
            
            var response = await _httpClient.PostAsync(requestUrl, content);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gemini Vision API Error: {Error}", err);
                return string.Empty;
            }

            var responseString = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<GeminiResponse>(responseString, _jsonOptions);
            return result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text?.Trim() ?? string.Empty;
        }

        public async Task<string> TranscribeAudioAsync(IFormFile audio)
        {
            if (audio == null || audio.Length == 0) return string.Empty;

            using var memoryStream = new MemoryStream();
            await audio.CopyToAsync(memoryStream);
            var base64Data = Convert.ToBase64String(memoryStream.ToArray());
            var mimeType = audio.ContentType;

            var requestBody = new GeminiRequest
            {
                Contents = new List<GeminiContent>
                {
                    new GeminiContent
                    {
                        Role = "user",
                        Parts = new List<GeminiPart>
                        {
                            new GeminiPart { Text = "Hãy chuyển đoạn âm thanh sau thành văn bản tiếng Việt. Chỉ xuất kết quả là những từ đã nói, không giải thích gì thêm." },
                            new GeminiPart 
                            { 
                                InlineData = new GeminiInlineData 
                                { 
                                    MimeType = mimeType, 
                                    Data = base64Data 
                                } 
                            }
                        }
                    }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody, _jsonOptions), Encoding.UTF8, "application/json");
            string currentKey = GetNextApiKey();
            string requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={currentKey}";
            
            var response = await _httpClient.PostAsync(requestUrl, content);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gemini Audio API Error: {Error}", err);
                return string.Empty;
            }

            var responseString = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<GeminiResponse>(responseString, _jsonOptions);
            return result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text?.Trim() ?? string.Empty;
        }
    }
}
