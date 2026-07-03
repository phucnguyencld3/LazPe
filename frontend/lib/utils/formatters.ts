export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatAddress = (address: string | null | undefined): string => {
  if (!address) return '';
  return address
    .split(',')
    .map(part => part.trim())
    .filter(part => part && part !== '-' && part.toLowerCase() !== 'null')
    .join(', ');
};

export const formatLocationName = (name: string | null | undefined): string => {
  if (!name) return "";

  const locationMap: Record<string, string> = {
    "Ho Chi Minh": "Hồ Chí Minh",
    "Ha Noi": "Hà Nội",
    "Da Nang": "Đà Nẵng",
    "Hai Phong": "Hải Phòng",
    "Can Tho": "Cần Thơ",
    "Binh Duong": "Bình Dương",
    "Dong Nai": "Đồng Nai",
    "Quang Ninh": "Quảng Ninh",
    "Ba Ria - Vung Tau": "Bà Rịa - Vũng Tàu",
    "Thua Thien Hue": "Thừa Thiên Huế",
    // common ones
  };

  // Direct match
  if (locationMap[name]) {
    return locationMap[name];
  }

  // Handle prefix combinations
  if (name.includes("Thanh pho Ho Chi Minh") || name.includes("TP Ho Chi Minh")) {
    return "Thành phố Hồ Chí Minh";
  }

  return name;
};

export function formatPrivilegeDetailLines(type: string, valueStr?: string): string[] {
  if (!valueStr) return [];
  try {
    const val = JSON.parse(valueStr);
    switch (type.toUpperCase()) {
      case "VOUCHER":
        if (val.mode === "CUSTOM") {
          const discountDesc = val.discountType === "PERCENT"
            ? `Giảm ${val.discountValue || 0}% (Tối đa ${(val.maxDiscount || 0).toLocaleString()}đ)`
            : `Giảm ${(val.discountValue || 0).toLocaleString()}đ`;
          return [
            `Voucher riêng × ${val.quantity || 0} voucher/tháng`,
            `Chi tiết: ${discountDesc}, Đơn tối thiểu từ ${(val.minOrderValue || 0).toLocaleString()}đ`,
            `Hạn sử dụng: ${val.validityDays || 30} ngày`
          ];
        } else {
          return [
            `Voucher ${val.voucherCode || "N/A"} × ${val.quantity || 0} voucher/tháng`,
            val.validityDays ? `Hạn sử dụng: ${val.validityDays} ngày` : "Hạn sử dụng: Theo voucher gốc"
          ];
        }
      case "FREESHIP":
        return [
          `${val.quantity || 0} lượt/tháng`,
          `Hỗ trợ tối đa ${(val.maxSupport || 0).toLocaleString()}đ`,
          `Đơn tối thiểu từ ${(val.minOrderValue || 0).toLocaleString()}đ`
        ];
      case "DISCOUNT":
        if (val.discountType === "PERCENT") {
          return [
            `Giảm ${val.discountValue || 0}%`,
            `Giảm tối đa ${(val.maxDiscount || 0).toLocaleString()}đ`
          ];
        } else {
          return [`Giảm ${(val.discountValue || 0).toLocaleString()}đ`];
        }
      case "CASHBACK":
        return [
          `Hoàn xu ${val.cashbackRate || 0}%`,
          `Tối đa ${(val.maxCashback || 0).toLocaleString()} xu/tháng`
        ];
      case "SUPPORT":
        return ["Được ưu tiên xử lý yêu cầu trước các hạng thấp hơn."];
      case "BIRTHDAY_GIFT":
        switch (val.giftType?.toUpperCase()) {
          case "VOUCHER":
            return [`Tặng ${val.quantity || 0} voucher ${val.voucherCode || "N/A"}`];
          case "POINTS":
            return [`Tặng ${(val.points || 0).toLocaleString()} điểm`];
          case "COINS":
            return [`Tặng ${(val.coins || 0).toLocaleString()} xu`];
          case "PHYSICAL":
            return [
              `Tặng quà vật lý: ${val.giftName || "N/A"}`,
              val.giftDesc ? `Mô tả: ${val.giftDesc}` : null
            ].filter(Boolean) as string[];
          default:
            return ["Quà sinh nhật"];
        }
      default:
        return [valueStr];
    }
  } catch (e) {
    return [valueStr];
  }
}

