using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Hubs;
using PolyBabyAPI.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DirectMessageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<DirectMessageHub> _hubContext;
        private readonly IHubContext<ChatHub> _chatHubContext;
        private readonly ILogger<DirectMessageController> _logger;

        public DirectMessageController(
            ApplicationDbContext context,
            IHubContext<DirectMessageHub> hubContext,
            IHubContext<ChatHub> chatHubContext,
            ILogger<DirectMessageController> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _chatHubContext = chatHubContext;
            _logger = logger;
        }

        private async Task<ChatSession> GetOrCreateSession(string userId)
        {
            var sessionId = $"DM_{userId}";
            var session = await _context.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null)
            {
                var dbUser = await _context.Users.FindAsync(userId);
                session = new ChatSession
                {
                    Id = sessionId,
                    UserId = userId,
                    CustomerName = dbUser?.FullName ?? "Khách hàng",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    IsClosed = false // DM is never closed
                };
                _context.ChatSessions.Add(session);
                await _context.SaveChangesAsync();
            }

            return session;
        }

        /// <summary>
        /// Client: Lấy lịch sử chat của chính mình
        /// </summary>
        [HttpGet("history")]
        public async Task<IActionResult> GetMyHistory()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return await GetHistoryForUser(userId, false);
        }

        /// <summary>
        /// Client: Gửi tin nhắn
        /// </summary>
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] DMRequestDto input)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var senderName = User.FindFirstValue("FullName") ?? User.FindFirstValue(ClaimTypes.Name) ?? "Khách hàng";
            return await ProcessSendMessage(userId, userId, senderName, false, input.MessageText, input.ImageUrl);
        }

        /// <summary>
        /// Admin: Lấy lịch sử chat với 1 user cụ thể
        /// </summary>
        [HttpGet("admin/{userId}/history")]
        public async Task<IActionResult> GetAdminHistory(string userId)
        {
            if (!IsAdmin()) return Forbid();
            return await GetHistoryForUser(userId, true);
        }

        /// <summary>
        /// Admin: Gửi tin nhắn cho 1 user cụ thể
        /// </summary>
        [HttpPost("admin/{userId}/send")]
        public async Task<IActionResult> AdminSendMessage(string userId, [FromBody] DMRequestDto input)
        {
            if (!IsAdmin()) return Forbid();
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var adminName = User.FindFirstValue("FullName") ?? User.FindFirstValue(ClaimTypes.Name) ?? "Quản trị viên";
            return await ProcessSendMessage(userId, adminId, adminName, true, input.MessageText, input.ImageUrl);
        }

        private bool IsAdmin()
        {
            return User.IsInRole("Admin") || User.FindAll("Permission").Any(p => p.Value == "Chat.Manage") || User.FindAll("Permission").Any(p => p.Value == "User.Manage");
        }

        private async Task<IActionResult> GetHistoryForUser(string userId, bool isAdminReading)
        {
            try
            {
                var session = await GetOrCreateSession(userId);

                if (isAdminReading)
                {
                    session.UnreadByAdmin = 0;
                }
                else
                {
                    session.UnreadByCustomer = 0;
                }
                await _context.SaveChangesAsync();

                var messages = await _context.ChatMessages
                    .Where(m => m.ChatSessionId == session.Id)
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new
                    {
                        m.Id,
                        m.ChatSessionId,
                        m.SenderId,
                        SenderName = m.Sender != null ? m.Sender.FullName : m.SenderName,
                        m.IsFromAdmin,
                        m.MessageText,
                        m.ImageUrl,
                        m.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, messages });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lấy lịch sử DM cho {UserId}", userId);
                return StatusCode(500, new { message = "Lỗi hệ thống: " + ex.Message });
            }
        }

        private async Task<IActionResult> ProcessSendMessage(string sessionUserId, string senderId, string senderName, bool isFromAdmin, string? messageText, string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(messageText) && string.IsNullOrWhiteSpace(imageUrl))
            {
                return BadRequest(new { message = "Tin nhắn không được để trống" });
            }

            try
            {
                var session = await GetOrCreateSession(sessionUserId);

                var chatMessage = new ChatMessage
                {
                    ChatSessionId = session.Id,
                    SenderId = senderId,
                    SenderName = senderName,
                    IsFromAdmin = isFromAdmin,
                    MessageText = messageText ?? "",
                    ImageUrl = imageUrl,
                    CreatedAt = DateTime.Now
                };

                _context.ChatMessages.Add(chatMessage);

                string lastMessage = string.IsNullOrWhiteSpace(messageText) ? "[Hình ảnh]" : messageText;
                session.LastMessageText = lastMessage.Length > 400 ? lastMessage.Substring(0, 400) : lastMessage;
                session.UpdatedAt = DateTime.Now;

                if (isFromAdmin)
                {
                    session.UnreadByCustomer++;
                }
                else
                {
                    session.UnreadByAdmin++;
                }

                await _context.SaveChangesAsync();

                var messageDto = new
                {
                    chatMessage.Id,
                    chatMessage.ChatSessionId,
                    chatMessage.SenderId,
                    chatMessage.SenderName,
                    chatMessage.IsFromAdmin,
                    chatMessage.MessageText,
                    chatMessage.ImageUrl,
                    chatMessage.CreatedAt
                };

                // Gửi qua SignalR tới room DirectMessage (roomId = DM_{sessionUserId})
                await _hubContext.Clients.Group(session.Id).SendAsync("ReceiveMessage", messageDto);

                // Chỉ phát tín hiệu UpdateAdminSessions qua ChatHub để nhảy thông báo & badge trên Admin
                await _chatHubContext.Clients.All.SendAsync("UpdateAdminSessions");

                return Ok(new { success = true, message = messageDto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi gửi tin nhắn DM");
                return StatusCode(500, new { message = "Lỗi hệ thống: " + ex.Message });
            }
        }
    }

    public class DMRequestDto
    {
        public string? MessageText { get; set; }
        public string? ImageUrl { get; set; }
    }
}
