using Microsoft.AspNetCore.Authorization;
using PolyBabyAPI.Filters;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models.Mongo;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Permission("System.Audit")]
    public class SecurityAuditLogController : ControllerBase
    {
        private readonly IMongoDbService _mongoDbService;

        public SecurityAuditLogController(IMongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var totalCount = await _mongoDbService.SecurityAuditLogs.CountDocumentsAsync(Builders<SecurityAuditLog>.Filter.Empty);
            
            var logs = await _mongoDbService.SecurityAuditLogs.Find(Builders<SecurityAuditLog>.Filter.Empty)
                .SortByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            return Ok(new { 
                success = true, 
                data = logs,
                pagination = new {
                    total = totalCount,
                    page = page,
                    pageSize = pageSize,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            });
        }
    }
}
