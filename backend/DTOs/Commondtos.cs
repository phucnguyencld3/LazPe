using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    // =============================================
    // COMMON / SHARED DTOs
    // =============================================

    /// <summary>
    /// Generic result wrapper cho tất cả service operations
    /// </summary>
    public class ServiceResult<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }

        public static ServiceResult<T> Ok(T data, string? message = null) =>
            new() { Success = true, Data = data, Message = message };

        public static ServiceResult<T> Fail(string message, List<string>? errors = null) =>
            new() { Success = false, Message = message, Errors = errors };
    }

    /// <summary>
    /// Pagination metadata dùng chung
    /// </summary>
    public class PaginationMeta
    {
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int TotalItems { get; set; }
        public int PageSize { get; set; }
        public bool HasPreviousPage => CurrentPage > 1;
        public bool HasNextPage => CurrentPage < TotalPages;
    }
}