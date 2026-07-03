using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interfaces
{
    public interface ISearchEngineService
    {
        Task IndexProductAsync(Product product);
        Task DeleteProductAsync(int productId);
        Task<List<int>> SearchProductsAsync(string keyword);
        Task SyncAllProductsAsync(List<Product> products);
    }
}
