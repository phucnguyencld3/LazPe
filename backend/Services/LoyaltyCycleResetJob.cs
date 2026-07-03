using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class LoyaltyCycleResetJob
    {
        private readonly ApplicationDbContext _context;

        public LoyaltyCycleResetJob(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task ExecuteAsync()
        {
            await _context.Database.ExecuteSqlRawAsync("EXEC dbo.sp_EndCycleLoyaltyReset");
        }
    }
}
