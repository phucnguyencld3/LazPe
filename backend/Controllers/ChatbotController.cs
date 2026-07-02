using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Models;
using System.Text;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using System.IO;

using Microsoft.AspNetCore.SignalR;
using PolyBabyAPI.Hubs;
using Google.Cloud.TextToSpeech.V1;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatbotController : ControllerBase
    {
        private readonly IGeminiService _geminiService;
        private readonly ApplicationDbContext _dbContext;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IConfiguration _configuration;

        public ChatbotController(IGeminiService geminiService, ApplicationDbContext dbContext, IHubContext<ChatHub> hubContext, IConfiguration configuration)
        {
            _geminiService = geminiService;
            _dbContext = dbContext;
            _hubContext = hubContext;
            _configuration = configuration;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] ChatbotRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Message cannot be empty." });
            }

            try
            {
                // Validate or Create AI Session
                var session = await _dbContext.ChatSessions.FirstOrDefaultAsync(s => s.Id == request.SessionId);
                if (session == null)
                {
                    session = new ChatSession
                    {
                        Id = request.SessionId,
                        CustomerName = "Khách hàng AI",
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };
                    _dbContext.ChatSessions.Add(session);
                }

                // Save user message
                var userMsg = new ChatMessage
                {
                    ChatSessionId = request.SessionId,
                    SenderName = session.CustomerName,
                    IsFromAdmin = false,
                    MessageText = request.Message,
                    CreatedAt = DateTime.Now
                };
                _dbContext.ChatMessages.Add(userMsg);
                await _dbContext.SaveChangesAsync();

                // Predefined FAQ responses to save time and API calls
                string responseText;
                var faqMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    { "Thời gian giao hàng là bao lâu?", "Thời gian giao hàng nội thành thường từ 1-2 ngày. Đối với các tỉnh thành khác, thời gian giao hàng khoảng 3-5 ngày làm việc ạ." },
                    { "Chính sách đổi trả hàng như thế nào?", "LazPe hỗ trợ đổi trả hàng miễn phí trong vòng 7 ngày kể từ khi nhận hàng nếu sản phẩm bị lỗi từ nhà sản xuất hoặc giao sai mẫu. Bạn vui lòng giữ nguyên tem mác và bao bì nhé!" },
                    { "Kiểm tra trạng thái đơn hàng của tôi", "Để kiểm tra đơn hàng, bạn vui lòng truy cập vào mục 'Tài khoản' > 'Đơn hàng của tôi'. Hoặc bạn có thể yêu cầu kết nối CSKH và cung cấp mã đơn hàng để được hỗ trợ kiểm tra nhé!" },
                    { "Tôi muốn thay đổi địa chỉ nhận hàng", "Nếu đơn hàng chưa được giao cho đơn vị vận chuyển, bạn có thể tự thay đổi địa chỉ trong phần chi tiết đơn hàng. Nếu đơn đã xuất kho, vui lòng yêu cầu kết nối với Nhân viên CSKH để được hỗ trợ kịp thời ạ." },
                    { "Shop có chương trình khuyến mãi nào không?", "Hiện tại LazPe đang có nhiều chương trình ưu đãi hấp dẫn như miễn phí vận chuyển, voucher giảm giá cho thành viên mới và các combo tiết kiệm. Bạn có thể xem chi tiết tại trang chủ hoặc mục Voucher nhé!" }
                };

                if (faqMap.TryGetValue(request.Message.Trim(), out var staticResponse))
                {
                    responseText = staticResponse;
                }
                else
                {
                    responseText = await _geminiService.GenerateTextAsync(request.SessionId, request.Message);
                }

                // Save AI message
                var aiMsg = new ChatMessage
                {
                    ChatSessionId = request.SessionId,
                    SenderName = "LazPe AI",
                    IsFromAdmin = true,
                    MessageText = responseText,
                    CreatedAt = DateTime.Now
                };
                _dbContext.ChatMessages.Add(aiMsg);
                session.UpdatedAt = DateTime.Now;
                session.LastMessageText = responseText.Length > 400 ? responseText.Substring(0, 400) : responseText;
                await _dbContext.SaveChangesAsync();

                // Broadcast AI message via SignalR
                var aiMsgDto = new
                {
                    Id = aiMsg.Id,
                    ChatSessionId = aiMsg.ChatSessionId,
                    SenderId = aiMsg.SenderId,
                    SenderName = aiMsg.SenderName,
                    IsFromAdmin = aiMsg.IsFromAdmin,
                    MessageText = aiMsg.MessageText,
                    ImageUrl = aiMsg.ImageUrl,
                    CreatedAt = aiMsg.CreatedAt
                };
                await _hubContext.Clients.Group(request.SessionId).SendAsync("ReceiveMessage", aiMsgDto);
                await _hubContext.Clients.All.SendAsync("UpdateAdminSessions");

                return Ok(new { success = true, text = responseText, message = aiMsgDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error communicating with AI service", error = ex.Message });
            }
        }

        [HttpPost("stream")]
        public async Task StreamAsk([FromBody] ChatbotRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                Response.StatusCode = 400;
                await Response.WriteAsync("Message cannot be empty.");
                return;
            }

            Response.Headers.Add("Content-Type", "text/event-stream");
            Response.Headers.Add("Cache-Control", "no-cache");
            Response.Headers.Add("Connection", "keep-alive");

            try
            {
                await foreach (var chunk in _geminiService.StreamTextAsync(request.SessionId, request.Message))
                {
                    var data = $"data: {chunk.Replace("\n", "\\n")}\n\n";
                    await Response.WriteAsync(data);
                    await Response.Body.FlushAsync();
                }

                await Response.WriteAsync("data: [DONE]\n\n");
                await Response.Body.FlushAsync();
            }
            catch (Exception ex)
            {
                var errorData = $"event: error\ndata: {ex.Message}\n\n";
                await Response.WriteAsync(errorData);
                await Response.Body.FlushAsync();
            }
        }

        [HttpGet("tts")]
        public async Task<IActionResult> GetTts([FromQuery] string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return BadRequest("Text cannot be empty.");
            }

            try
            {
                var credentialsPath = _configuration["GoogleCloud:CredentialsPath"];
                if (string.IsNullOrEmpty(credentialsPath) || !System.IO.File.Exists(credentialsPath))
                {
                    return StatusCode(500, new { message = "Google Cloud Credentials not configured or file not found." });
                }

                var clientBuilder = new TextToSpeechClientBuilder
                {
                    CredentialsPath = credentialsPath
                };
                var client = await clientBuilder.BuildAsync();

                var input = new SynthesisInput { Text = text };
                var voice = new VoiceSelectionParams
                {
                    LanguageCode = "vi-VN",
                    Name = "vi-VN-Neural2-A" // Sử dụng giọng Neural2 cao cấp, cực kỳ tự nhiên, ít "đậm chất AI" nhất
                };
                var audioConfig = new AudioConfig
                {
                    AudioEncoding = AudioEncoding.Mp3
                };

                var response = await client.SynthesizeSpeechAsync(input, voice, audioConfig);
                return File(response.AudioContent.ToByteArray(), "audio/mpeg");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi tạo giọng nói", error = ex.Message });
            }
        }
    }

    public class ChatbotRequestDto
    {
        public string SessionId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
