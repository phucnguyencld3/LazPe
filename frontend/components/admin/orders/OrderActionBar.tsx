import React from "react";
import { OrderInfo, getStatusLabel } from "@/lib/features/orders/orderApi";
import Button from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";

interface OrderActionBarProps {
  order: OrderInfo;
  onUpdateStatus: (action: string) => void;
  onShowCancelModal: () => void;
  onPrintOrder: () => void;
}

export const OrderActionBar: React.FC<OrderActionBarProps> = ({
  order,
  onUpdateStatus,
  onShowCancelModal,
  onPrintOrder,
}) => {
  const getBadgeColor = (statusCode: number) => {
    switch (statusCode) {
      case 0: // Pending (Chờ xác nhận)
        return "warning";
      case 1: // Confirmed (Đang xử lý)
        return "info";
      case 2: // Shipping (Đang giao)
        return "primary";
      case 3: // Received (Đã nhận)
      case 4: // Completed (Hoàn thành)
        return "success";
      case 5: // Cancelled (Đã hủy)
      default:
        return "error";
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 font-outfit">
      <div className="flex flex-wrap gap-2.5">
        <Badge
          color={getBadgeColor(order.statusCode)}
          variant="light"
          size="md"
          startIcon={<span className="w-1.5 h-1.5 bg-current rounded-full"></span>}
        >
          {getStatusLabel(order.statusCode)}
        </Badge>
        <Badge
          color="light"
          variant="light"
          size="md"
        >
          Thanh toán: {order.payMethod || "COD"}
        </Badge>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onPrintOrder}
          variant="outline"
          className="font-bold"
          startIcon={<span className="material-symbols-outlined text-[18px]">print</span>}
        >
          In đơn hàng
        </Button>
        
        {order.statusCode === 0 && (
          <Button
            onClick={() => onUpdateStatus('confirm')}
            variant="primary"
            className="font-bold"
          >
            Xác nhận đơn
          </Button>
        )}
        
        {order.statusCode === 1 && (
          <Button
            onClick={() => onUpdateStatus('mark-shipped')}
            variant="primary"
            className="font-bold"
          >
            Bắt đầu giao hàng
          </Button>
        )}

        {(order.statusCode < 3 && order.statusCode !== 5) && (
          <Button 
            onClick={onShowCancelModal}
            variant="danger"
            className="font-bold"
            startIcon={<span className="material-symbols-outlined text-[18px]">cancel</span>}
          >
            Hủy đơn
          </Button>
        )}
      </div>
    </div>
  );
};
