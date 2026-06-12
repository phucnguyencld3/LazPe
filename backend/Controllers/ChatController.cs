using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Hubs;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            ApplicationDbContext context,
            ICloudinaryService cloudinaryService,
            IHubContext<ChatHub> hubContext,
            ILogger<ChatController> logger)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
            _hubContext = hubContext;
            _logger = logger;
        }

        /// <summary>
        /// Khởi tạo hoặc lấy lại phòng chat cho khách hàng
        /// </summary>
        [HttpPost("session")]
        public async Task<IActionResult> GetOrCreateSession([FromBody] SessionRequestDto request)
        {
            try
            {
                var isAuthenticated = User.Identity?.IsAuthenticated ?? false;
                ChatSession? session = null;

                if (isAuthenticated)
                {
                    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                    var dbUser = await _context.Users.FindAsync(userId);
                    var fullName = dbUser?.FullName ?? User.FindFirstValue("FullName") ?? User.FindFirstValue(ClaimTypes.Name) ?? User.Identity?.Name ?? "Khách hàng";

                    // Tìm cuộc trò chuyện chưa đóng của user đã đăng nhập
                    if (!request.ForceNew)
                    {
                        session = await _context.ChatSessions
                            .FirstOrDefaultAsync(s => s.UserId == userId && !s.IsClosed);
                    }
                    else
                    {
                        // Đóng tất cả các phiên chat cũ nếu yêu cầu tạo phiên mới
                        var oldSessions = await _context.ChatSessions
                            .Where(s => s.UserId == userId && !s.IsClosed)
                            .ToListAsync();
                        foreach (var s in oldSessions)
                        {
                            s.IsClosed = true;
                            s.UpdatedAt = DateTime.Now;
                        }
                        await _context.SaveChangesAsync();
                    }
                        
                    if (session != null && session.CustomerName != fullName)
                    {
                        session.CustomerName = fullName;
                        await _context.SaveChangesAsync();
                    }

                    if (session == null)
                    {
                        session = new ChatSession
                        {
                            Id = Guid.NewGuid().ToString(),
                            UserId = userId,
                            CustomerName = fullName,
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };
                        _context.ChatSessions.Add(session);
                        await _context.SaveChangesAsync();
                        
                        // Thông báo cho admin có session mới
                        await _hubContext.Clients.All.SendAsync("UpdateAdminSessions");
                    }
                }
                else
                {
                    // Cho khách vãng lai
                    if (string.IsNullOrEmpty(request.GuestSessionId))
                    {
                        return BadRequest(new { message = "GuestSessionId là bắt buộc đối với khách vãng lai." });
                    }

                    session = await _context.ChatSessions
                        .FirstOrDefaultAsync(s => s.Id == request.GuestSessionId);

                    if (session == null)
                    {
                        session = new ChatSession
                        {
                            Id = request.GuestSessionId,
                            UserId = null,
                            CustomerName = string.IsNullOrWhiteSpace(request.CustomerName) ? "Khách vãng lai" : request.CustomerName,
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };
                        _context.ChatSessions.Add(session);
                        await _context.SaveChangesAsync();

                        // Thông báo cho admin có session mới
                        await _hubContext.Clients.All.SendAsync("UpdateAdminSessions");
                    }
                }

                return Ok(new
                {
                    success = true,
                    session = new
                    {
                        session.Id,
                        session.UserId,
                        session.CustomerName,
                        session.AdminId,
                        session.AdminName,
                        session.IsClosed,
                        session.CreatedAt,
                        session.UpdatedAt,
                        session.UnreadByCustomer
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy hoặc tạo phiên chat.");
                return StatusCode(500, new { message = "Có lỗi xảy ra: " + ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách tin nhắn của phòng chat
        /// </summary>
        [HttpGet("session/{sessionId}/messages")]
        public async Task<IActionResult> GetMessages(string sessionId)
        {
            try
            {
                var session = await _context.ChatSessions
                    .FirstOrDefaultAsync(s => s.Id == sessionId);

                if (session == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiên chat này." });
                }

                // Đánh dấu đã đọc dựa trên vai trò
                var isAdmin = User.Identity?.IsAuthenticated == true && (User.IsInRole("Admin") || User.FindAll("Permission").Any(p => p.Value == "Chat.Manage"));
                
                if (isAdmin)
                {
                    session.UnreadByAdmin = 0;
                }
                else
                {
                    session.UnreadByCustomer = 0;
                }
                
                await _context.SaveChangesAsync();

                var messages = await _context.ChatMessages
                    .Where(m => m.ChatSessionId == sessionId)
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

                // Cũng thông báo cho admin cập nhật danh sách vì unread count đã về 0
                await _hubContext.Clients.All.SendAsync("UpdateAdminSessions");

                return Ok(new
                {
                    success = true,
                    messages
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lấy tin nhắn cho session {SessionId}", sessionId);
                return StatusCode(500, new { message = "Có lỗi xảy ra: " + ex.Message });
            }
        }

        /// <summary>
        /// Gửi tin nhắn mới (hỗ trợ đính kèm ảnh)
        /// </summary>
        [HttpPost("session/{sessionId}/message")]
        public async Task<IActionResult> SendMessage(string sessionId, [FromForm] MessageSendDto input)
        {
            try
            {
                var session = await _context.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
                if (session == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiên chat." });
                }

                if (session.IsClosed)
                {
                    // Nếu admin đã đóng, tự động mở lại khi khách gửi tin nhắn mới
                    var isAdminUser = User.Identity?.IsAuthenticated == true && (User.IsInRole("Admin") || User.FindAll("Permission").Any(p => p.Value == "Chat.Manage"));
                    if (!isAdminUser)
                    {
                        session.IsClosed = false;
                        _logger.LogInformation("Tự động mở lại phiên chat {SessionId} do khách gửi tin nhắn mới.", sessionId);
                    }
                }

                string? imageUrl = null;
                if (input.ImageFile != null && input.ImageFile.Length > 0)
                {
                    return BadRequest(new { message = "Chức năng tải lên hình ảnh đã bị loại bỏ." });
                }

                // Xác định người gửi
                var isAuthenticated = User.Identity?.IsAuthenticated ?? false;
                var senderId = isAuthenticated ? User.FindFirstValue(ClaimTypes.NameIdentifier) : null;
                var isFromAdmin = false;
                var senderName = session.CustomerName;

                if (isAuthenticated)
                {
                    var isUserAdmin = User.IsInRole("Admin") || User.FindAll("Permission").Any(p => p.Value == "Chat.Manage");
                    var dbUser = await _context.Users.FindAsync(senderId);
                    var displayName = dbUser?.FullName ?? User.FindFirstValue("FullName") ?? User.FindFirstValue(ClaimTypes.Name);
                    
                    if (isUserAdmin)
                    {
                        isFromAdmin = true;
                        senderName = displayName ?? "Quản trị viên";
                    }
                    else
                    {
                        isFromAdmin = false;
                        senderName = displayName ?? "Khách hàng";
                    }
                }

                if (!isFromAdmin && session.UserId != null)
                {
                    var dbCust = await _context.Users.FindAsync(session.UserId);
                    if (dbCust != null)
                    {
                        senderName = dbCust.FullName;
                        
                        // Cập nhật tên mới nhất của khách hàng vào phiên chat nếu có thay đổi
                        if (session.CustomerName != dbCust.FullName)
                        {
                            session.CustomerName = dbCust.FullName;
                        }
                    }
                }

                // Kiểm tra phân phối nhân viên (Chỉ 1 nhân viên nhận chat)
                if (isFromAdmin)
                {
                    if (string.IsNullOrEmpty(session.AdminId))
                    {
                        // Tự động nhận hỗ trợ cuộc chat này nếu chưa có ai nhận
                        session.AdminId = senderId;
                        session.AdminName = senderName;

                        // Tạo tin nhắn hệ thống thông báo nhân viên tham gia cuộc chat
                        var claimMsg = new ChatMessage
                        {
                            ChatSessionId = sessionId,
                            SenderId = null,
                            SenderName = "Hệ thống",
                            IsFromAdmin = true,
                            MessageText = $"Nhân viên {senderName} đã tham gia hỗ trợ cuộc trò chuyện.",
                            CreatedAt = DateTime.Now.AddMilliseconds(-50)
                        };
                        _context.ChatMessages.Add(claimMsg);
                    }
                    else if (session.AdminId != senderId)
                    {
                        // Bị chặn nếu đã có nhân viên khác nhận hỗ trợ
                        return BadRequest(new { message = $"Cuộc hội thoại này đã được nhận bởi nhân viên {session.AdminName}." });
                    }
                }

                // Kiểm tra xem đây có phải tin nhắn khách hàng gửi đầu tiên không
                var isFirstCustomerMessage = false;
                if (!isFromAdmin)
                {
                    var hasPreviousMsg = await _context.ChatMessages
                        .AnyAsync(m => m.ChatSessionId == sessionId && !m.IsFromAdmin);
                    
                    if (!hasPreviousMsg)
                    {
                        isFirstCustomerMessage = true;
                    }
                }

                var chatMessage = new ChatMessage
                {
                    ChatSessionId = sessionId,
                    SenderId = senderId,
                    SenderName = senderName,
                    IsFromAdmin = isFromAdmin,
                    MessageText = input.MessageText,
                    ImageUrl = imageUrl,
                    CreatedAt = DateTime.Now
                };

                _context.ChatMessages.Add(chatMessage);

                // Cập nhật trạng thái phiên chat
                var rawMessage = string.IsNullOrEmpty(input.MessageText) ? "[Hình ảnh]" : input.MessageText;
                session.LastMessageText = rawMessage.Length > 400 ? rawMessage.Substring(0, 400) : rawMessage;
                session.UpdatedAt = DateTime.Now;

                if (isFromAdmin)
                {
                    session.UnreadByCustomer++;
                }
                else
                {
                    session.UnreadByAdmin++;
                }

                // Nếu là tin nhắn đầu của khách hàng, sinh câu chào tự động từ hệ thống
                ChatMessage? autoReply = null;
                if (isFirstCustomerMessage)
                {
                    autoReply = new ChatMessage
                    {
                        ChatSessionId = sessionId,
                        SenderId = null,
                        SenderName = "Hệ thống",
                        IsFromAdmin = true,
                        MessageText = $"Xin chào bạn {session.CustomerName}, xin vui lòng đợi trong giây lát sẽ có nhân viên hỗ trợ bạn.",
                        CreatedAt = DateTime.Now.AddSeconds(1)
                    };
                    _context.ChatMessages.Add(autoReply);
                    session.LastMessageText = autoReply.MessageText.Length > 400 ? autoReply.MessageText.Substring(0, 400) : autoReply.MessageText;
                    session.UnreadByCustomer++;
                }

                await _context.SaveChangesAsync();

                // Gửi tin nhắn mới qua SignalR
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
                await _hubContext.Clients.Group(sessionId).SendAsync("ReceiveMessage", messageDto);

                // Nếu có tin chào tự động, gửi realtime qua SignalR
                if (autoReply != null)
                {
                    var autoReplyDto = new
                    {
                        autoReply.Id,
                        autoReply.ChatSessionId,
                        autoReply.SenderId,
                        autoReply.SenderName,
                        autoReply.IsFromAdmin,
                        autoReply.MessageText,
                        autoReply.ImageUrl,
                        autoReply.CreatedAt
                    };
                    await _hubContext.Clients.Group(sessionId).SendAsync("ReceiveMessage", autoReplyDto);
                }

                // Thông báo cho toàn bộ admin cập nhật danh sách phòng chat
                await _hubContext.Clients.All.SendAsync("UpdateAdminSessions");

                return Ok(new { success = true, message = messageDto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi gửi tin nhắn cho session {SessionId}", sessionId);
                return StatusCode(500, new { message = "Có lỗi xảy ra: " + ex.Message });
            }
        }

        /// <summary>
        /// Lấy tất cả các phiên chat đang hoạt động (Chỉ dành cho Admin)
        /// </summary>
        [HttpGet("admin/sessions")]
        [Authorize]
        public async Task<IActionResult> GetAdminSessions()
        {
            try
            {
                var isAdmin = User.IsInRole("Admin") || User.FindAll("Permission").Any(p => p.Value == "Chat.Manage");
                if (!isAdmin)
                {
                    return Forbid();
                }

                var sessions = await _context.ChatSessions
                    .OrderByDescending(s => s.UpdatedAt)
                    .Select(s => new
                    {
                        s.Id,
                        s.UserId,
                        CustomerName = s.User != null ? s.User.FullName : s.CustomerName,
                        s.AdminId,
                        AdminName = s.Admin != null ? s.Admin.FullName : s.AdminName,
                        s.CreatedAt,
                        s.UpdatedAt,
                        s.IsClosed,
                        s.LastMessageText,
                        s.UnreadByAdmin,
                        s.UnreadByCustomer
                    })
                    .ToListAsync();

                return Ok(new { success = true, sessions });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lấy danh sách phiên chat admin.");
                return StatusCode(500, new { message = "Có lỗi xảy ra: " + ex.Message });
            }
        }

        /// <summary>
        /// Đóng phiên chat (Chỉ dành cho Admin)
        /// </summary>
        [HttpPost("admin/session/{sessionId}/close")]
        [Authorize]
        public async Task<IActionResult> CloseSession(string sessionId)
        {
            try
            {
                var isAdmin = User.IsInRole("Admin") || User.FindAll("Permission").Any(p => p.Value == "Chat.Manage");
                if (!isAdmin)
                {
                    return Forbid();
                }

                var session = await _context.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
                if (session == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiên chat." });
                }

                session.IsClosed = true;
                session.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                // Gửi thông báo đóng phòng qua SignalR
                await _hubContext.Clients.Group(sessionId).SendAsync("SessionClosed", sessionId);
                await _hubContext.Clients.All.SendAsync("UpdateAdminSessions");

                return Ok(new { success = true, message = "Đã đóng phiên chat thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đóng phiên chat {SessionId}", sessionId);
                return StatusCode(500, new { message = "Có lỗi xảy ra: " + ex.Message });
            }
        }

        /// <summary>
        /// Nhân viên nhận hỗ trợ cuộc chat
        /// </summary>
        [HttpPost("admin/session/{sessionId}/claim")]
        [Authorize]
        public async Task<IActionResult> ClaimSession(string sessionId)
        {
            try
            {
                var isAdmin = User.IsInRole("Admin") || User.FindAll("Permission").Any(p => p.Value == "Chat.Manage");
                if (!isAdmin)
                {
                    return Forbid();
                }

                var session = await _context.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
                if (session == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiên chat." });
                }

                if (!string.IsNullOrEmpty(session.AdminId))
                {
                    return BadRequest(new { message = $"Cuộc chat này đã được nhận bởi nhân viên {session.AdminName}." });
                }

                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var dbAdmin = await _context.Users.FindAsync(adminId);
                var adminName = dbAdmin?.FullName ?? User.FindFirstValue("FullName") ?? User.FindFirstValue(ClaimTypes.Name) ?? "Quản trị viên";

                session.AdminId = adminId;
                session.AdminName = adminName;
                session.UpdatedAt = DateTime.Now;

                // Thêm tin nhắn hệ thống thông báo nhân viên đã tham gia cuộc chat
                var systemMsg = new ChatMessage
                {
                    ChatSessionId = sessionId,
                    SenderId = null,
                    SenderName = "Hệ thống",
                    IsFromAdmin = true,
                    MessageText = $"Nhân viên {adminName} đã tham gia hỗ trợ cuộc trò chuyện.",
                    CreatedAt = DateTime.Now
                };
                _context.ChatMessages.Add(systemMsg);
                session.LastMessageText = systemMsg.MessageText.Length > 400 ? systemMsg.MessageText.Substring(0, 400) : systemMsg.MessageText;

                await _context.SaveChangesAsync();

                var msgDto = new
                {
                    systemMsg.Id,
                    systemMsg.ChatSessionId,
                    systemMsg.SenderId,
                    systemMsg.SenderName,
                    systemMsg.IsFromAdmin,
                    systemMsg.MessageText,
                    systemMsg.ImageUrl,
                    systemMsg.CreatedAt
                };

                // Broadcast
                await _hubContext.Clients.Group(sessionId).SendAsync("ReceiveMessage", msgDto);
                await _hubContext.Clients.All.SendAsync("UpdateAdminSessions");

                return Ok(new { success = true, adminId, adminName, message = msgDto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi nhận hỗ trợ session {SessionId}", sessionId);
                return StatusCode(500, new { message = "Có lỗi xảy ra: " + ex.Message });
            }
        }
    }

    public class SessionRequestDto
    {
        public string? GuestSessionId { get; set; }
        public string? CustomerName { get; set; }
        public bool ForceNew { get; set; } = false;
    }

    public class MessageSendDto
    {
        public string? MessageText { get; set; }
        public IFormFile? ImageFile { get; set; }
    }
}
