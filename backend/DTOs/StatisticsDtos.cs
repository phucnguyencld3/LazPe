using System;
using System.Collections.Generic;

namespace PolyBabyAPI.DTOs
{
    public class StatisticsFilterDto
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? ProductID { get; set; }
        public int? CategoryID { get; set; }
        public int? SupplierID { get; set; }
        public string? GroupType { get; set; } // "Day", "Month", "Quarter", "Year"
    }

    public class DashboardSummaryDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int CompletedOrders { get; set; }
        public int CancelledOrders { get; set; }
        public int TotalProductsSold { get; set; }
        public int TotalCustomers { get; set; }
        public decimal AverageOrderValue { get; set; }
        public decimal RevenueGrowthRate { get; set; }
    }

    public class ProductStatDto
    {
        public int ProductID { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public int Stock { get; set; }
        public int QuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class CategoryStatDto
    {
        public int CategoryID { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int TotalProducts { get; set; }
        public int QuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal RevenueSharePercentage { get; set; }
    }

    public class BrandStatDto
    {
        public int SupplierID { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal RevenueSharePercentage { get; set; }
        public int Rank { get; set; }
    }

    public class TimeSeriesStatDto
    {
        public string TimeLabel { get; set; } = string.Empty; // e.g. "01/05/2026", "05/2026", "Q1/2026", "2026"
        public decimal Revenue { get; set; }
        public int OrdersCount { get; set; }
        public int ProductsSoldCount { get; set; }
    }

    public class TopProductsDto
    {
        public List<ProductStatDto> BestSellers { get; set; } = new();
        public List<ProductStatDto> TopRevenue { get; set; } = new();
        public List<ProductStatDto> HighestStock { get; set; } = new();
        public List<ProductStatDto> LowestStock { get; set; } = new();
    }

    public class RevenueReportResponseDto
    {
        public DashboardSummaryDto Summary { get; set; } = new();
        public TopProductsDto TopProducts { get; set; } = new();
        public List<CategoryStatDto> CategoryStats { get; set; } = new();
        public List<BrandStatDto> BrandStats { get; set; } = new();
        public List<TimeSeriesStatDto> TimeSeriesData { get; set; } = new();
    }

    public class PaginatedListDto<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);
    }
}
