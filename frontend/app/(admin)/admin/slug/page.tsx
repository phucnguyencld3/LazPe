"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";

import { API_BASE_URL } from "@/lib/api";

export default function SlugAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSyncSeo = async () => {
    setLoading(true);
    setResult(null);
    try {
      const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
      
      const response = await fetch(`${API_BASE_URL}/Product/sync-seo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || "Đồng bộ thành công!");
        setResult(data.data);
      } else {
        toast.error(data.message || "Có lỗi xảy ra khi đồng bộ.");
      }
    } catch (error) {
      console.error("Lỗi đồng bộ SEO:", error);
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="font-headline-md text-headline-md text-primary font-bold">Công cụ tự động hóa SEO</h1>
        <p className="font-body-md text-body-md text-on-surface-variant/70 mt-1">Trang ẩn dành riêng cho quản trị viên. Công cụ này sẽ quét toàn bộ dữ liệu sản phẩm và tự động điền các trường Slug, Meta Title, Meta Description bị thiếu.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-800">Khởi chạy đồng bộ hóa SEO</h2>
            <p className="text-sm text-slate-500">Chỉ những sản phẩm bị thiếu dữ liệu SEO mới được cập nhật. Sản phẩm đã có đầy đủ sẽ không bị ghi đè.</p>
          </div>
          <button
            onClick={handleSyncSeo}
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : "Khởi động"}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-[fadeIn_0.3s_ease-out]">
          <h3 className="font-bold text-emerald-600 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Đã đồng bộ {result.count} sản phẩm
          </h3>
          
          {result.count > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold border-b border-slate-200">ID</th>
                    <th className="px-4 py-3 font-semibold border-b border-slate-200">Sản phẩm</th>
                    <th className="px-4 py-3 font-semibold border-b border-slate-200">Slug tạo mới</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.products?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 font-medium">#{p.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 text-primary">{p.slug}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Tuyệt vời! Hiện tại không có sản phẩm nào bị thiếu dữ liệu SEO.</p>
          )}
        </div>
      )}
    </div>
  );
}
