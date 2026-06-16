let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.endsWith('/api')) {
  apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api`;
}
const API_BASE_URL = apiUrl;

export async function getRecommendations(limit: number = 10): Promise<any[]> {
  try {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/Recommendation/for-you?limit=${limit}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.error("Failed to fetch recommendations:", response.statusText);
      return [];
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data.map((item: any) => ({
        id: item.productID ?? item.id,
        name: item.productName ?? item.name,
        price: item.price ?? 0,
        discountPrice: item.discountPrice,
        image: item.imageUrl ?? "",
        categoryName: item.categoryName,
        rating: item.rating,
        ratingCount: item.reviewsCount,
        inStock: true // default for recommendations
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}

export async function logProductView(productId: number): Promise<void> {
  try {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) return; // Only log for logged in users

    await fetch(`${API_BASE_URL}/Recommendation/log-view/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error logging product view:", error);
  }
}
