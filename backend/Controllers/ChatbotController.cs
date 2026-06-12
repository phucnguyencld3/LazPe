using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.DTOs;
using System.Text;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatbotController : ControllerBase
    {
        private readonly IGeminiService _geminiService;

        public ChatbotController(IGeminiService geminiService)
        {
            _geminiService = geminiService;
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
                var response = await _geminiService.GenerateTextAsync(request.Message);
                return Ok(new { text = response });
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
                await foreach (var chunk in _geminiService.StreamTextAsync(request.Message))
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
        public string Message { get; set; } = string.Empty;
    }
}
