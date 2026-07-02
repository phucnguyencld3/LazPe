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
    // Save to localStorage for unauthenticated users (or as fallback)
    if (typeof window !== "undefined") {
      try {
        const localViews = localStorage.getItem("lazpe_recent_views");
        let viewsArray = localViews ? localViews.split(',').filter(id => id) : [];
        const productIdStr = productId.toString();
        
        // Remove if exists and add to beginning
        viewsArray = viewsArray.filter(id => id !== productIdStr);
        viewsArray.unshift(productIdStr);
        
        // Keep only last 20
        if (viewsArray.length > 20) {
          viewsArray = viewsArray.slice(0, 20);
        }
        
        localStorage.setItem("lazpe_recent_views", viewsArray.join(','));
      } catch (e) {
        console.error("Failed to save to localStorage", e);
      }
    }

    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) return; // Only log to backend for logged in users

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

export async function getRecentlyViewed(limit: number = 10, recentIds?: string): Promise<any[]> {
  try {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let url = `${API_BASE_URL}/Recommendation/recently-viewed?limit=${limit}`;
    if (recentIds) {
      url += `&recentIds=${recentIds}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.error("Failed to fetch recently viewed:", response.statusText);
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
        inStock: true
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching recently viewed:", error);
    return [];
  }
}
