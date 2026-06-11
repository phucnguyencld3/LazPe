using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class StatisticsService : IStatisticsService
    {
        private readonly ApplicationDbContext _context;

        public StatisticsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<RevenueReportResponseDto> GetRevenueReportAsync(StatisticsFilterDto filter)
        {
            // 1. Normalize dates
            var fromDate = filter.FromDate?.Date ?? DateTime.Today.AddMonths(-1);
            var toDate = filter.ToDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.Today.AddDays(1).AddTicks(-1);

            // 2. Validate maximum date range is 6 months (186 days)
            if ((toDate - fromDate).TotalDays > 186)
            {
                throw new ArgumentException("Chỉ được thống kê trong phạm vi tối đa 6 tháng.");
            }

            // 3. Prepare queries
            var invoiceQuery = _context.Invoices
                .Where(i => !i.IsDeleted && i.CreatedAt >= fromDate && i.CreatedAt <= toDate);

            var detailsQuery = _context.InvoiceDetails
                .Include(id => id.Variant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Category)
                .Include(id => id.Variant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Supplier)
                .Where(id => !id.Invoice.IsDeleted 
                          && id.Invoice.Status == OrderStatus.Completed
                          && id.Invoice.CreatedAt >= fromDate 
                          && id.Invoice.CreatedAt <= toDate);

            // Apply item-level filters
            if (filter.CategoryID.HasValue)
            {
                detailsQuery = detailsQuery.Where(id => id.Variant.Product.CategoryID == filter.CategoryID.Value);
                invoiceQuery = invoiceQuery.Where(i => i.InvoiceDetails.Any(id => id.Variant.Product.CategoryID == filter.CategoryID.Value));
            }
            if (filter.SupplierID.HasValue)
            {
                detailsQuery = detailsQuery.Where(id => id.Variant.Product.SupplierID == filter.SupplierID.Value);
                invoiceQuery = invoiceQuery.Where(i => i.InvoiceDetails.Any(id => id.Variant.Product.SupplierID == filter.SupplierID.Value));
            }
            if (filter.ProductID.HasValue)
            {
                detailsQuery = detailsQuery.Where(id => id.Variant.ProductID == filter.ProductID.Value);
                invoiceQuery = invoiceQuery.Where(i => i.InvoiceDetails.Any(id => id.Variant.ProductID == filter.ProductID.Value));
            }

            // A. KPI Calculations
            var totalOrders = await invoiceQuery.CountAsync();
            var completedOrders = await invoiceQuery.CountAsync(i => i.Status == OrderStatus.Completed);
            var cancelledOrders = await invoiceQuery.CountAsync(i => i.Status == OrderStatus.Cancelled);
            var totalProductsSold = await detailsQuery.SumAsync(id => id.Quantity);
            var totalCustomers = await invoiceQuery
                .Where(i => i.Status == OrderStatus.Completed && i.UserID != null)
                .Select(i => i.UserID)
                .Distinct()
                .CountAsync();

            decimal totalRevenue = 0;
            // If filtering by item attributes, revenue is the sum of filtered details.
            // If no item filter, revenue is the sum of total prices of completed invoices (which includes shipping fees/discounts).
            if (filter.CategoryID.HasValue || filter.SupplierID.HasValue || filter.ProductID.HasValue)
            {
                totalRevenue = await detailsQuery.SumAsync(id => id.TotalPrice);
            }
            else
            {
                totalRevenue = await invoiceQuery
                    .Where(i => i.Status == OrderStatus.Completed)
                    .SumAsync(i => i.TotalPrice);
            }

            var averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

            // B. Growth Rate Calculation (Compare current period to the immediate previous period of identical duration)
            var duration = toDate - fromDate;
            var prevFromDate = fromDate - duration;
            var prevToDate = fromDate;

            var prevInvoiceQuery = _context.Invoices
                .Where(i => !i.IsDeleted && i.CreatedAt >= prevFromDate && i.CreatedAt <= prevToDate);
            var prevDetailsQuery = _context.InvoiceDetails
                .Where(id => !id.Invoice.IsDeleted 
                          && id.Invoice.Status == OrderStatus.Completed
                          && id.Invoice.CreatedAt >= prevFromDate 
                          && id.Invoice.CreatedAt <= prevToDate);

            if (filter.CategoryID.HasValue)
            {
                prevDetailsQuery = prevDetailsQuery.Where(id => id.Variant.Product.CategoryID == filter.CategoryID.Value);
                prevInvoiceQuery = prevInvoiceQuery.Where(i => i.InvoiceDetails.Any(id => id.Variant.Product.CategoryID == filter.CategoryID.Value));
            }
            if (filter.SupplierID.HasValue)
            {
                prevDetailsQuery = prevDetailsQuery.Where(id => id.Variant.Product.SupplierID == filter.SupplierID.Value);
                prevInvoiceQuery = prevInvoiceQuery.Where(i => i.InvoiceDetails.Any(id => id.Variant.Product.SupplierID == filter.SupplierID.Value));
            }
            if (filter.ProductID.HasValue)
            {
                prevDetailsQuery = prevDetailsQuery.Where(id => id.Variant.ProductID == filter.ProductID.Value);
                prevInvoiceQuery = prevInvoiceQuery.Where(i => i.InvoiceDetails.Any(id => id.Variant.ProductID == filter.ProductID.Value));
            }

            decimal prevTotalRevenue = 0;
            if (filter.CategoryID.HasValue || filter.SupplierID.HasValue || filter.ProductID.HasValue)
            {
                prevTotalRevenue = await prevDetailsQuery.SumAsync(id => id.TotalPrice);
            }
            else
            {
                prevTotalRevenue = await prevInvoiceQuery
                    .Where(i => i.Status == OrderStatus.Completed)
                    .SumAsync(i => i.TotalPrice);
            }

            decimal growthRate = 0;
            if (prevTotalRevenue > 0)
            {
                growthRate = ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100;
            }
            else if (totalRevenue > 0)
            {
                growthRate = 100; // 100% growth if there was no revenue previously
            }

            var summary = new DashboardSummaryDto
            {
                TotalRevenue = totalRevenue,
                TotalOrders = totalOrders,
                CompletedOrders = completedOrders,
                CancelledOrders = cancelledOrders,
                TotalProductsSold = totalProductsSold,
                TotalCustomers = totalCustomers,
                AverageOrderValue = averageOrderValue,
                RevenueGrowthRate = Math.Round(growthRate, 2)
            };

            // C. Top Products
            var productGroups = await detailsQuery
                .GroupBy(id => new {
                    id.Variant.Product.ProductID,
                    id.Variant.Product.Code,
                    id.Variant.Product.ProductName,
                    CategoryName = id.Variant.Product.Category != null ? id.Variant.Product.Category.CategoryName : "N/A",
                    SupplierName = id.Variant.Product.Supplier != null ? id.Variant.Product.Supplier.SupplierName : "N/A",
                    id.Variant.Product.Stock
                })
                .Select(g => new ProductStatDto
                {
                    ProductID = g.Key.ProductID,
                    ProductCode = g.Key.Code,
                    ProductName = g.Key.ProductName,
                    CategoryName = g.Key.CategoryName,
                    SupplierName = g.Key.SupplierName,
                    Stock = g.Key.Stock,
                    QuantitySold = g.Sum(id => id.Quantity),
                    TotalRevenue = g.Sum(id => id.TotalPrice)
                })
                .ToListAsync();

            var topProducts = new TopProductsDto
            {
                BestSellers = productGroups.OrderByDescending(p => p.QuantitySold).Take(5).ToList(),
                TopRevenue = productGroups.OrderByDescending(p => p.TotalRevenue).Take(5).ToList()
            };

            // Inventory Tops (Current Snapshots, applying filters)
            var stockProductQuery = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .AsNoTracking();

            if (filter.CategoryID.HasValue)
                stockProductQuery = stockProductQuery.Where(p => p.CategoryID == filter.CategoryID.Value);
            if (filter.SupplierID.HasValue)
                stockProductQuery = stockProductQuery.Where(p => p.SupplierID == filter.SupplierID.Value);
            if (filter.ProductID.HasValue)
                stockProductQuery = stockProductQuery.Where(p => p.ProductID == filter.ProductID.Value);

            topProducts.HighestStock = await stockProductQuery
                .OrderByDescending(p => p.Stock)
                .Take(5)
                .Select(p => new ProductStatDto
                {
                    ProductID = p.ProductID,
                    ProductCode = p.Code,
                    ProductName = p.ProductName,
                    CategoryName = p.Category != null ? p.Category.CategoryName : "N/A",
                    SupplierName = p.Supplier != null ? p.Supplier.SupplierName : "N/A",
                    Stock = p.Stock,
                    QuantitySold = 0,
                    TotalRevenue = 0
                })
                .ToListAsync();

            topProducts.LowestStock = await stockProductQuery
                .OrderBy(p => p.Stock)
                .Take(5)
                .Select(p => new ProductStatDto
                {
                    ProductID = p.ProductID,
                    ProductCode = p.Code,
                    ProductName = p.ProductName,
                    CategoryName = p.Category != null ? p.Category.CategoryName : "N/A",
                    SupplierName = p.Supplier != null ? p.Supplier.SupplierName : "N/A",
                    Stock = p.Stock,
                    QuantitySold = 0,
                    TotalRevenue = 0
                })
                .ToListAsync();

            // D. Category Stats
            var allCategories = await _context.Categories
                .Include(c => c.Products)
                .AsNoTracking()
                .ToListAsync();

            var soldByCategory = await detailsQuery
                .GroupBy(id => id.Variant.Product.CategoryID)
                .Select(g => new {
                    CategoryID = g.Key,
                    QuantitySold = g.Sum(id => id.Quantity),
                    TotalRevenue = g.Sum(id => id.TotalPrice)
                })
                .ToListAsync();

            var categoryStats = new List<CategoryStatDto>();
            decimal overallCategoryRevenue = soldByCategory.Sum(c => c.TotalRevenue);

            foreach (var cat in allCategories)
            {
                if (filter.CategoryID.HasValue && cat.CategoryID != filter.CategoryID.Value)
                    continue;

                var sold = soldByCategory.FirstOrDefault(s => s.CategoryID == cat.CategoryID);
                categoryStats.Add(new CategoryStatDto
                {
                    CategoryID = cat.CategoryID,
                    CategoryName = cat.CategoryName,
                    TotalProducts = cat.Products.Count,
                    QuantitySold = sold?.QuantitySold ?? 0,
                    TotalRevenue = sold?.TotalRevenue ?? 0,
                    RevenueSharePercentage = overallCategoryRevenue > 0 
                        ? Math.Round(((sold?.TotalRevenue ?? 0) / overallCategoryRevenue) * 100, 2) 
                        : 0
                });
            }

            // E. Supplier (Brand) Stats
            var allSuppliers = await _context.Suppliers
                .AsNoTracking()
                .ToListAsync();

            var soldBySupplier = await detailsQuery
                .GroupBy(id => id.Variant.Product.SupplierID)
                .Select(g => new {
                    SupplierID = g.Key,
                    QuantitySold = g.Sum(id => id.Quantity),
                    TotalRevenue = g.Sum(id => id.TotalPrice)
                })
                .ToListAsync();

            var brandStats = new List<BrandStatDto>();
            decimal supplierOverallRevenue = soldBySupplier.Sum(s => s.TotalRevenue);

            foreach (var sup in allSuppliers)
            {
                if (filter.SupplierID.HasValue && sup.SupplierID != filter.SupplierID.Value)
                    continue;

                var sold = soldBySupplier.FirstOrDefault(s => s.SupplierID == sup.SupplierID);
                brandStats.Add(new BrandStatDto
                {
                    SupplierID = sup.SupplierID,
                    SupplierName = sup.SupplierName,
                    QuantitySold = sold?.QuantitySold ?? 0,
                    TotalRevenue = sold?.TotalRevenue ?? 0,
                    RevenueSharePercentage = supplierOverallRevenue > 0 
                        ? Math.Round(((sold?.TotalRevenue ?? 0) / supplierOverallRevenue) * 100, 2) 
                        : 0
                });
            }

            brandStats = brandStats.OrderByDescending(b => b.TotalRevenue).ToList();
            for (int i = 0; i < brandStats.Count; i++)
            {
                brandStats[i].Rank = i + 1;
            }

            // F. Time Series Stats
            var detailsList = await detailsQuery
                .Select(id => new {
                    id.InvoiceID,
                    id.Invoice.CreatedAt,
                    id.Quantity,
                    id.TotalPrice
                })
                .ToListAsync();

            var timeSeriesData = new List<TimeSeriesStatDto>();
            string groupType = filter.GroupType?.ToLower() ?? "day";
            
            if (string.IsNullOrEmpty(filter.GroupType))
            {
                var diffDays = (toDate - fromDate).TotalDays;
                if (diffDays > 31)
                    groupType = "month";
            }

            if (groupType == "day")
            {
                var grouped = detailsList
                    .Where(d => d.CreatedAt.HasValue)
                    .GroupBy(d => d.CreatedAt.Value.Date)
                    .ToDictionary(g => g.Key, g => new {
                        Revenue = g.Sum(x => x.TotalPrice),
                        ProductsSold = g.Sum(x => x.Quantity),
                        OrdersCount = g.Select(x => x.InvoiceID).Distinct().Count()
                    });

                for (var date = fromDate.Date; date <= toDate.Date; date = date.AddDays(1))
                {
                    grouped.TryGetValue(date, out var val);
                    timeSeriesData.Add(new TimeSeriesStatDto
                    {
                        TimeLabel = date.ToString("dd/MM/yyyy"),
                        Revenue = val?.Revenue ?? 0,
                        OrdersCount = val?.OrdersCount ?? 0,
                        ProductsSoldCount = val?.ProductsSold ?? 0
                    });
                }
            }
            else if (groupType == "month")
            {
                var grouped = detailsList
                    .Where(d => d.CreatedAt.HasValue)
                    .GroupBy(d => new { d.CreatedAt.Value.Year, d.CreatedAt.Value.Month })
                    .ToDictionary(g => g.Key, g => new {
                        Revenue = g.Sum(x => x.TotalPrice),
                        ProductsSold = g.Sum(x => x.Quantity),
                        OrdersCount = g.Select(x => x.InvoiceID).Distinct().Count()
                    });

                var startMonth = new DateTime(fromDate.Year, fromDate.Month, 1);
                var endMonth = new DateTime(toDate.Year, toDate.Month, 1);
                for (var month = startMonth; month <= endMonth; month = month.AddMonths(1))
                {
                    var key = new { month.Year, month.Month };
                    grouped.TryGetValue(key, out var val);
                    timeSeriesData.Add(new TimeSeriesStatDto
                    {
                        TimeLabel = month.ToString("MM/yyyy"),
                        Revenue = val?.Revenue ?? 0,
                        OrdersCount = val?.OrdersCount ?? 0,
                        ProductsSoldCount = val?.ProductsSold ?? 0
                    });
                }
            }
            else if (groupType == "quarter")
            {
                var grouped = detailsList
                    .Where(d => d.CreatedAt.HasValue)
                    .GroupBy(d => new {
                        d.CreatedAt.Value.Year,
                        Quarter = (d.CreatedAt.Value.Month - 1) / 3 + 1
                    })
                    .ToDictionary(g => g.Key, g => new {
                        Revenue = g.Sum(x => x.TotalPrice),
                        ProductsSold = g.Sum(x => x.Quantity),
                        OrdersCount = g.Select(x => x.InvoiceID).Distinct().Count()
                    });

                var startQYear = fromDate.Year;
                var startQ = (fromDate.Month - 1) / 3 + 1;
                var endQYear = toDate.Year;
                var endQ = (toDate.Month - 1) / 3 + 1;

                var tempYear = startQYear;
                var tempQ = startQ;

                while (tempYear < endQYear || (tempYear == endQYear && tempQ <= endQ))
                {
                    var key = new { Year = tempYear, Quarter = tempQ };
                    grouped.TryGetValue(key, out var val);
                    timeSeriesData.Add(new TimeSeriesStatDto
                    {
                        TimeLabel = $"Q{tempQ}/{tempYear}",
                        Revenue = val?.Revenue ?? 0,
                        OrdersCount = val?.OrdersCount ?? 0,
                        ProductsSoldCount = val?.ProductsSold ?? 0
                    });

                    tempQ++;
                    if (tempQ > 4)
                    {
                        tempQ = 1;
                        tempYear++;
                    }
                }
            }
            else if (groupType == "year")
            {
                var grouped = detailsList
                    .Where(d => d.CreatedAt.HasValue)
                    .GroupBy(d => d.CreatedAt.Value.Year)
                    .ToDictionary(g => g.Key, g => new {
                        Revenue = g.Sum(x => x.TotalPrice),
                        ProductsSold = g.Sum(x => x.Quantity),
                        OrdersCount = g.Select(x => x.InvoiceID).Distinct().Count()
                    });

                for (var year = fromDate.Year; year <= toDate.Year; year++)
                {
                    grouped.TryGetValue(year, out var val);
                    timeSeriesData.Add(new TimeSeriesStatDto
                    {
                        TimeLabel = year.ToString(),
                        Revenue = val?.Revenue ?? 0,
                        OrdersCount = val?.OrdersCount ?? 0,
                        ProductsSoldCount = val?.ProductsSold ?? 0
                    });
                }
            }

            return new RevenueReportResponseDto
            {
                Summary = summary,
                TopProducts = topProducts,
                CategoryStats = categoryStats.OrderByDescending(c => c.TotalRevenue).ToList(),
                BrandStats = brandStats,
                TimeSeriesData = timeSeriesData
            };
        }

        public async Task<PaginatedListDto<ProductStatDto>> GetProductBreakdownPaginatedAsync(
            StatisticsFilterDto filter, int page, int pageSize, string searchTerm)
        {
            var fromDate = filter.FromDate?.Date ?? DateTime.Today.AddMonths(-1);
            var toDate = filter.ToDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.Today.AddDays(1).AddTicks(-1);

            if ((toDate - fromDate).TotalDays > 186)
            {
                throw new ArgumentException("Chỉ được thống kê trong phạm vi tối đa 6 tháng.");
            }

            var detailsQuery = _context.InvoiceDetails
                .Include(id => id.Variant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Category)
                .Include(id => id.Variant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Supplier)
                .Where(id => !id.Invoice.IsDeleted 
                          && id.Invoice.Status == OrderStatus.Completed
                          && id.Invoice.CreatedAt >= fromDate 
                          && id.Invoice.CreatedAt <= toDate);

            var productsQuery = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .AsNoTracking();

            if (filter.CategoryID.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.CategoryID == filter.CategoryID.Value);
                detailsQuery = detailsQuery.Where(id => id.Variant.Product.CategoryID == filter.CategoryID.Value);
            }
            if (filter.SupplierID.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.SupplierID == filter.SupplierID.Value);
                detailsQuery = detailsQuery.Where(id => id.Variant.Product.SupplierID == filter.SupplierID.Value);
            }
            if (filter.ProductID.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.ProductID == filter.ProductID.Value);
                detailsQuery = detailsQuery.Where(id => id.Variant.ProductID == filter.ProductID.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var normalizedSearch = searchTerm.Trim().ToLower();
                productsQuery = productsQuery.Where(p => p.ProductName.ToLower().Contains(normalizedSearch) 
                                                      || p.Code.ToLower().Contains(normalizedSearch));
            }

            var productsWithStats = productsQuery.Select(p => new ProductStatDto
            {
                ProductID = p.ProductID,
                ProductCode = p.Code,
                ProductName = p.ProductName,
                CategoryName = p.Category != null ? p.Category.CategoryName : "N/A",
                SupplierName = p.Supplier != null ? p.Supplier.SupplierName : "N/A",
                Stock = p.Stock,
                QuantitySold = detailsQuery
                    .Where(id => id.Variant.ProductID == p.ProductID)
                    .Select(id => (int?)id.Quantity)
                    .Sum() ?? 0,
                TotalRevenue = detailsQuery
                    .Where(id => id.Variant.ProductID == p.ProductID)
                    .Select(id => (decimal?)id.TotalPrice)
                    .Sum() ?? 0
            });

            productsWithStats = productsWithStats.OrderByDescending(p => p.QuantitySold).ThenBy(p => p.ProductName);

            var totalItems = await productsWithStats.CountAsync();
            var items = await productsWithStats
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PaginatedListDto<ProductStatDto>
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<byte[]> ExportExcelAsync(StatisticsFilterDto filter)
        {
            var report = await GetRevenueReportAsync(filter);
            
            using var workbook = new XLWorkbook();
            
            // Sheet 1: Dashboard & Summary
            var summarySheet = workbook.Worksheets.Add("Tổng quan");
            
            summarySheet.Cell("A1").Value = "BÁO CÁO DOANH THU & THỐNG KÊ CHI TIẾT";
            summarySheet.Cell("A1").Style.Font.Bold = true;
            summarySheet.Cell("A1").Style.Font.FontSize = 16;
            summarySheet.Cell("A1").Style.Font.FontColor = XLColor.DarkMidnightBlue;
            summarySheet.Range("A1:D1").Merge();
            
            var fromStr = filter.FromDate?.ToString("dd/MM/yyyy") ?? DateTime.Today.AddMonths(-1).ToString("dd/MM/yyyy");
            var toStr = filter.ToDate?.ToString("dd/MM/yyyy") ?? DateTime.Today.ToString("dd/MM/yyyy");
            summarySheet.Cell("A2").Value = $"Từ ngày: {fromStr} - Đến ngày: {toStr}";
            summarySheet.Range("A2:D2").Merge();
            
            summarySheet.Cell("A4").Value = "Chỉ số KPI";
            summarySheet.Cell("A4").Style.Font.Bold = true;
            summarySheet.Cell("A4").Style.Font.FontSize = 12;
            
            summarySheet.Cell("A5").Value = "Tổng doanh thu";
            summarySheet.Cell("B5").Value = report.Summary.TotalRevenue;
            summarySheet.Cell("B5").Style.NumberFormat.Format = "#,##0\"₫\"";
            
            summarySheet.Cell("A6").Value = "Tổng số đơn hàng";
            summarySheet.Cell("B6").Value = report.Summary.TotalOrders;
            
            summarySheet.Cell("A7").Value = "Đơn hoàn tất";
            summarySheet.Cell("B7").Value = report.Summary.CompletedOrders;
            
            summarySheet.Cell("A8").Value = "Đơn đã hủy";
            summarySheet.Cell("B8").Value = report.Summary.CancelledOrders;
            
            summarySheet.Cell("A9").Value = "Số sản phẩm bán ra";
            summarySheet.Cell("B9").Value = report.Summary.TotalProductsSold;
            
            summarySheet.Cell("A10").Value = "Số lượng khách hàng";
            summarySheet.Cell("B10").Value = report.Summary.TotalCustomers;
            
            summarySheet.Cell("A11").Value = "Giá trị đơn hàng trung bình";
            summarySheet.Cell("B11").Value = report.Summary.AverageOrderValue;
            summarySheet.Cell("B11").Style.NumberFormat.Format = "#,##0\"₫\"";
            
            summarySheet.Cell("A12").Value = "Tỷ lệ tăng trưởng doanh thu";
            summarySheet.Cell("B12").Value = report.Summary.RevenueGrowthRate / 100;
            summarySheet.Cell("B12").Style.NumberFormat.Format = "0.0%";

            var kpiRange = summarySheet.Range("A5:B12");
            kpiRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            kpiRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            kpiRange.Style.Border.InsideBorderColor = XLColor.LightGray;
            kpiRange.Style.Border.OutsideBorderColor = XLColor.DarkGray;
            
            summarySheet.Column(1).Width = 30;
            summarySheet.Column(2).Width = 20;

            // Sheet 2: Doanh thu theo thời gian
            var timeSheet = workbook.Worksheets.Add("Doanh thu theo thời gian");
            timeSheet.Cell(1, 1).Value = "Thời gian";
            timeSheet.Cell(1, 2).Value = "Doanh thu";
            timeSheet.Cell(1, 3).Value = "Số đơn hàng";
            timeSheet.Cell(1, 4).Value = "Số sản phẩm bán";
            
            var timeHeaderRange = timeSheet.Range("A1:D1");
            timeHeaderRange.Style.Font.Bold = true;
            timeHeaderRange.Style.Fill.BackgroundColor = XLColor.LightGray;
            
            int row = 2;
            foreach (var ts in report.TimeSeriesData)
            {
                timeSheet.Cell(row, 1).Value = ts.TimeLabel;
                timeSheet.Cell(row, 2).Value = ts.Revenue;
                timeSheet.Cell(row, 2).Style.NumberFormat.Format = "#,##0\"₫\"";
                timeSheet.Cell(row, 3).Value = ts.OrdersCount;
                timeSheet.Cell(row, 4).Value = ts.ProductsSoldCount;
                row++;
            }
            timeSheet.Columns().AdjustToContents();

            // Sheet 3: Danh mục & Thương hiệu
            var catSheet = workbook.Worksheets.Add("Danh mục & Thương hiệu");
            catSheet.Cell(1, 1).Value = "Danh mục";
            catSheet.Cell(1, 2).Value = "Số sản phẩm";
            catSheet.Cell(1, 3).Value = "Số lượng bán";
            catSheet.Cell(1, 4).Value = "Tổng doanh thu";
            catSheet.Cell(1, 5).Value = "Tỷ trọng doanh thu";
            
            var catHeaderRange = catSheet.Range("A1:E1");
            catHeaderRange.Style.Font.Bold = true;
            catHeaderRange.Style.Fill.BackgroundColor = XLColor.LightSkyBlue;
            
            row = 2;
            foreach (var cs in report.CategoryStats)
            {
                catSheet.Cell(row, 1).Value = cs.CategoryName;
                catSheet.Cell(row, 2).Value = cs.TotalProducts;
                catSheet.Cell(row, 3).Value = cs.QuantitySold;
                catSheet.Cell(row, 4).Value = cs.TotalRevenue;
                catSheet.Cell(row, 4).Style.NumberFormat.Format = "#,##0\"₫\"";
                catSheet.Cell(row, 5).Value = cs.RevenueSharePercentage / 100;
                catSheet.Cell(row, 5).Style.NumberFormat.Format = "0.0%";
                row++;
            }
            
            row += 2;
            catSheet.Cell(row, 1).Value = "Thương hiệu";
            catSheet.Cell(row, 2).Value = "Xếp hạng";
            catSheet.Cell(row, 3).Value = "Số lượng bán";
            catSheet.Cell(row, 4).Value = "Tổng doanh thu";
            catSheet.Cell(row, 5).Value = "Tỷ trọng doanh thu";
            
            var brandHeaderRange = catSheet.Range($"A{row}:E{row}");
            brandHeaderRange.Style.Font.Bold = true;
            brandHeaderRange.Style.Fill.BackgroundColor = XLColor.LightGoldenrodYellow;
            
            row++;
            foreach (var bs in report.BrandStats)
            {
                catSheet.Cell(row, 1).Value = bs.SupplierName;
                catSheet.Cell(row, 2).Value = bs.Rank;
                catSheet.Cell(row, 3).Value = bs.QuantitySold;
                catSheet.Cell(row, 4).Value = bs.TotalRevenue;
                catSheet.Cell(row, 4).Style.NumberFormat.Format = "#,##0\"₫\"";
                catSheet.Cell(row, 5).Value = bs.RevenueSharePercentage / 100;
                catSheet.Cell(row, 5).Style.NumberFormat.Format = "0.0%";
                row++;
            }
            catSheet.Columns().AdjustToContents();

            // Sheet 4: Top sản phẩm
            var prodSheet = workbook.Worksheets.Add("Top Sản phẩm");
            prodSheet.Cell(1, 1).Value = "Sản phẩm bán chạy nhất";
            prodSheet.Cell(1, 1).Style.Font.Bold = true;
            prodSheet.Cell(2, 1).Value = "Tên sản phẩm";
            prodSheet.Cell(2, 2).Value = "Số lượng bán";
            prodSheet.Cell(2, 3).Value = "Doanh thu";
            
            var prodHeader1 = prodSheet.Range("A2:C2");
            prodHeader1.Style.Font.Bold = true;
            prodHeader1.Style.Fill.BackgroundColor = XLColor.PaleGreen;
            
            row = 3;
            foreach (var ps in report.TopProducts.BestSellers)
            {
                prodSheet.Cell(row, 1).Value = ps.ProductName;
                prodSheet.Cell(row, 2).Value = ps.QuantitySold;
                prodSheet.Cell(row, 3).Value = ps.TotalRevenue;
                prodSheet.Cell(row, 3).Style.NumberFormat.Format = "#,##0\"₫\"";
                row++;
            }
            
            row += 2;
            prodSheet.Cell(row, 1).Value = "Sản phẩm doanh thu cao nhất";
            prodSheet.Cell(row, 1).Style.Font.Bold = true;
            row++;
            prodSheet.Cell(row, 1).Value = "Tên sản phẩm";
            prodSheet.Cell(row, 2).Value = "Số lượng bán";
            prodSheet.Cell(row, 3).Value = "Doanh thu";
            
            var prodHeader2 = prodSheet.Range($"A{row}:C{row}");
            prodHeader2.Style.Font.Bold = true;
            prodHeader2.Style.Fill.BackgroundColor = XLColor.PaleGoldenrod;
            
            row++;
            foreach (var ps in report.TopProducts.TopRevenue)
            {
                prodSheet.Cell(row, 1).Value = ps.ProductName;
                prodSheet.Cell(row, 2).Value = ps.QuantitySold;
                prodSheet.Cell(row, 3).Value = ps.TotalRevenue;
                prodSheet.Cell(row, 3).Style.NumberFormat.Format = "#,##0\"₫\"";
                row++;
            }
            prodSheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }
    }
}
