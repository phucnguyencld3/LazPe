using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class BabyProfileService : IBabyProfileService
    {
        private readonly ApplicationDbContext _context;

        public BabyProfileService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<BabyProfile>> GetByUserIdAsync(string userId)
        {
            return await _context.BabyProfiles
                .AsNoTracking()
                .Where(b => b.UserID == userId)
                .OrderBy(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<BabyProfile?> GetByIdAsync(int id)
        {
            return await _context.BabyProfiles
                .FirstOrDefaultAsync(b => b.BabyProfileID == id);
        }

        public async Task<BabyProfile> AddAsync(BabyProfile baby)
        {
            baby.CreatedAt = DateTime.Now;
            _context.BabyProfiles.Add(baby);
            await _context.SaveChangesAsync();


            return baby;
        }

        public async Task UpdateAsync(BabyProfile baby)
        {
            _context.Entry(baby).State = EntityState.Modified;
            await _context.SaveChangesAsync();


        }

        public async Task DeleteAsync(int id)
        {
            var baby = await _context.BabyProfiles.FindAsync(id);
            if (baby != null)
            {
                var userId = baby.UserID;
                _context.BabyProfiles.Remove(baby);
                await _context.SaveChangesAsync();

            }
        }


    }
}
