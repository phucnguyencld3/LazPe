using Meilisearch;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class MeiliProductDoc
    {
        public int id { get; set; }
        public string productName { get; set; }
        public string description { get; set; }
        public string code { get; set; }
        public decimal price { get; set; }
    }

    public class SearchEngineService : ISearchEngineService
    {
        private readonly MeilisearchClient _client;
        private readonly string _indexName = "products";

        public SearchEngineService(IConfiguration config)
        {
            var url = config["Meilisearch:Url"] ?? "http://localhost:7700";
            var apiKey = config["Meilisearch:ApiKey"] ?? "LazPeMasterKey123!";
            _client = new MeilisearchClient(url, apiKey);
        }

        private MeiliProductDoc MapToDoc(Product p)
        {
            return new MeiliProductDoc
            {
                id = p.ProductID,
                productName = p.ProductName ?? "",
                description = p.Description ?? "",
                code = p.Code ?? "",
                price = p.Price
            };
        }

        public async Task IndexProductAsync(Product product)
        {
            var index = _client.Index(_indexName);
            await index.AddDocumentsAsync(new[] { MapToDoc(product) }, primaryKey: "id");
        }

        public async Task DeleteProductAsync(int productId)
        {
            var index = _client.Index(_indexName);
            await index.DeleteOneDocumentAsync(productId.ToString());
        }

        public async Task<List<int>> SearchProductsAsync(string keyword)
        {
            var index = _client.Index(_indexName);
            // Meilisearch fuzzy matching by default
            var search = await index.SearchAsync<MeiliProductDoc>(keyword, new SearchQuery
            {
                Limit = 100
            });
            
            return search.Hits.Select(h => h.id).ToList();
        }

        public async Task SyncAllProductsAsync(List<Product> products)
        {
            var index = _client.Index(_indexName);
            var docs = products.Select(MapToDoc).ToList();
            await index.UpdateDocumentsAsync(docs, primaryKey: "id");
            
            // Cấu hình các trường để tìm kiếm (từ khóa sẽ ưu tiên tìm trong tên, sau đó đến description và code)
            await index.UpdateSearchableAttributesAsync(new[] { "productName", "code", "description" });
        }
    }
}
