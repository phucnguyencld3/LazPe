"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { OrderInfo, fetchOrderDetails } from "@/lib/features/orders/orderApi";
import OrderPrintTicket from "@/components/admin/orders/OrderPrintTicket";
import { toast } from "@/lib/toast";

function BatchPrintExecuteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idsParam = searchParams.get("ids");
  
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPdf, setSavingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (!idsParam) {
        setError("Không có danh sách đơn hàng để in.");
        setLoading(false);
        return;
      }

      const ids = idsParam.split(",").filter(id => id.trim() !== "");
      if (ids.length === 0) {
        setError("Danh sách đơn hàng rỗng.");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          setError("Không tìm thấy phiên đăng nhập. Vui lòng quay lại và đăng nhập.");
          setLoading(false);
          return;
        }

        // Gọi API song song để lấy thông tin chi tiết từng đơn
        const promises = ids.map(id => fetchOrderDetails(token, id).catch(e => {
          console.error(`Lỗi tải đơn ${id}:`, e);
          return null; // Bỏ qua đơn lỗi thay vì làm hỏng toàn bộ
        }));
        
        const results = await Promise.all(promises);
        const validOrders = results.filter(o => o !== null) as OrderInfo[];
        
        if (validOrders.length === 0) {
          setError("Không tải được thông tin của bất kỳ đơn hàng nào.");
          setLoading(false);
          return;
        }

        setOrders(validOrders);
        // Xóa đoạn setTimeout auto in. Chờ user bấm nút mới in.
      } catch (err: any) {
        console.error("Lỗi khi tải đơn hàng:", err);
        setError(err.message || "Không thể tải chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
  }, [idsParam]);

  const handleSavePdfAndPrint = async () => {
    try {
      setSavingPdf(true);
      // Require html2pdf dynamically to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      
      const { uploadPrintTicketPdf } = await import('@/lib/features/orders/orderApi');
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) return;

      const updatedOrders = [...orders];

      for (let i = 0; i < updatedOrders.length; i++) {
        const order = updatedOrders[i];
        // Chỉ lưu PDF nếu chưa có, HOẶC nếu nó là URL lỗi (chứa raw/upload)
        if (order.printTicketUrl && !order.printTicketUrl.includes("raw/upload")) continue;

        const element = document.getElementById(`print-ticket-${order.invoiceID}`);
        if (!element) continue;

        // Tự implement html2canvas-pro + jsPDF thay vì dùng html2pdf.js (vì html2pdf.js bị lỗi hàm màu lab() của Tailwind v4)
        const html2canvas = (await import('html2canvas-pro')).default;
        const { jsPDF } = await import('jspdf');

        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        
        const pdf = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'landscape' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], `invoice_${order.invoiceID}.pdf`, { type: 'application/pdf' });

        // Upload to Cloudinary
        const uploadResult = await uploadPrintTicketPdf(token, order.invoiceID.toString(), file);
        if (uploadResult && uploadResult.url) {
          updatedOrders[i].printTicketUrl = uploadResult.url;
        } else {
          updatedOrders[i].printTicketUrl = "uploaded"; // fake url to prevent re-upload
        }
      }
      
      setOrders(updatedOrders);
      toast.success("Đã lưu trữ hóa đơn PDF thành công!");
    } catch (e: any) {
      console.error("Lỗi khi lưu PDF:", e);
      toast.error(e.message || "Đã xảy ra lỗi khi tạo hoặc lưu PDF");
    } finally {
      import('react-dom').then(({ flushSync }) => {
        try {
          flushSync(() => {
            setSavingPdf(false);
          });
        } catch(e) {
            setSavingPdf(false);
        }
        
        // Cần setTimeout 10ms siêu nhỏ để DOM thực sự update xong (xóa overlay) trước khi trình duyệt block thread
        setTimeout(() => {
          const originalTitle = document.title;
          document.title = `Phieu_Giao_Hang_LazPe_${idsParam}`;
          window.print();
          document.title = originalTitle;
        }, 10);
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-800 mb-4"></div>
        <span className="text-slate-800 font-bold text-lg">
          Đang tải {idsParam ? idsParam.split(",").length : 0} phiếu in...
        </span>
      </div>
    );
  }

  if (error || orders.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white p-8 text-center">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Không thể tải thông tin in</h2>
        <p className="text-slate-600 mb-6">{error || "Có lỗi xảy ra trong quá trình tải dữ liệu."}</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 cursor-pointer transition-colors">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const allSaved = orders.every(o => o.printTicketUrl);

  return (
    <div className="bg-white min-h-screen py-8 relative">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A5 landscape;
            margin: 5mm;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}} />

      {/* Overlay loading khi đang lưu PDF - ẩn khi in */}
      {savingPdf && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col justify-center items-center print:hidden">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-800 mb-4"></div>
          <span className="text-slate-800 font-bold text-lg">Đang lưu trữ PDF...</span>
          <span className="text-sm text-slate-500 mt-2">Hệ thống sẽ tự động in sau khi lưu xong</span>
        </div>
      )}

      {/* Container nút điều khiển hiển thị trên màn hình, sẽ bị ẩn khi in ra giấy */}
      <div className="max-w-3xl mx-auto mb-8 flex justify-between items-center print:hidden px-4">
        <button 
          onClick={() => router.back()} 
          disabled={savingPdf}
          className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại
        </button>
        <button 
          onClick={handleSavePdfAndPrint}
          disabled={savingPdf}
          className={`px-8 py-3 text-white font-bold rounded-full transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 ${allSaved ? 'bg-primary hover:bg-primary/90' : 'bg-slate-900 hover:bg-slate-800'}`}
        >
          <span className="material-symbols-outlined">print</span>
          {savingPdf ? "Đang xử lý..." : (allSaved ? `In lại ${orders.length} phiếu` : `In và lưu ${orders.length} phiếu`)}
        </button>
      </div>

      {/* Render từng phiếu in, phân tách trang bằng CSS page-break */}
      {orders.map((order, index) => (
        <div 
          key={order.invoiceID} 
          id={`print-ticket-${order.invoiceID}`}
          style={{ pageBreakAfter: index === orders.length - 1 ? 'auto' : 'always' }}
          className="mb-8 print:mb-0"
        >
          <OrderPrintTicket order={order} />
        </div>
      ))}
    </div>
  );
}

export default function BatchPrintExecutePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen bg-white text-slate-800 font-bold">Đang tải...</div>}>
      <BatchPrintExecuteContent />
    </Suspense>
  );
}
