"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Barcode from "react-barcode";
import { OrderInfo, fetchOrderDetails, formatCurrency } from "@/lib/features/orders/orderApi";

import OrderPrintTicket from "@/components/admin/orders/OrderPrintTicket";

export default function PrintOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          setError("Không tìm thấy phiên đăng nhập. Vui lòng quay lại và đăng nhập.");
          setLoading(false);
          return;
        }
        const data = await fetchOrderDetails(token, id as string);
        if (!data || !data.invoiceID) {
           setError("Dữ liệu đơn hàng không hợp lệ.");
           setLoading(false);
           return;
        }
        setOrder(data);
        
        // Đợi một chút cho Barcode và hình ảnh render xong rồi tự động bật bảng in
        setTimeout(() => {
          window.print();
        }, 1000);
      } catch (err: any) {
        console.error("Lỗi khi tải đơn hàng:", err);
        setError(err.message || "Không thể tải chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-800"></div>
        <span className="ml-4 text-slate-800 font-bold">Đang tải phiếu in...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white p-8 text-center">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Không thể tải thông tin đơn hàng</h2>
        <p className="text-slate-600 mb-6">{error || "Đơn hàng không tồn tại hoặc đã bị xóa."}</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 cursor-pointer transition-colors">
          Quay lại đơn hàng
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-8">
      <OrderPrintTicket order={order} />
      
      {/* Nút bấm in lại dành cho màn hình (sẽ ẩn đi khi in ra giấy) */}
      <div className="mt-8 text-center print:hidden">
        <button 
          onClick={() => window.print()} 
          className="px-8 py-3 bg-slate-900 text-white font-bold rounded-[8px] hover:bg-slate-800 transition-colors cursor-pointer"
        >
          In lại phiếu này
        </button>
      </div>
    </div>
  );
}
