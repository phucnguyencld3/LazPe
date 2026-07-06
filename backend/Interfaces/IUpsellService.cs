using PolyBabyAPI.DTOs.Upsell;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PolyBabyAPI.Interfaces
{
    public interface IUpsellService
    {
        Task<List<UpsellProductDto>> GetCheckoutUpsellAsync(string userId);
    }
}
