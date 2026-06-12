using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Models;
using System.Text;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatbotController : ControllerBase
    {
        private readonly IGeminiService _geminiService;
        private readonly ApplicationDbContext _dbContext;

        public ChatbotController(IGeminiService geminiService, ApplicationDbContext dbContext)
        {
            _geminiService = geminiService;
            _dbContext = dbContext;
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

                var responseText = await _geminiService.GenerateTextAsync(request.SessionId, request.Message);

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

                return Ok(new { text = responseText });
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
    }

    public class ChatbotRequestDto
    {
        public string SessionId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
