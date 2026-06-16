"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils/formatters";
import { 
  getFlashSalesAdmin, getFlashSaleDetailAdmin, createFlashSale, updateFlashSale, deleteFlashSale, 
  FlashSaleResponseDto, CreateFlashSaleItemDto, FlashSaleItemType, FlashSaleStatus, CreateFlashSaleDto, UpdateFlashSaleDto,
  CampaignType, DiscountType
} from "@/lib/features/flash-sales/flashSaleApi";
import { fetchAdminProducts, fetchAdminProductDetail, AdminProductInfo, AdminVariantInfo } from "@/lib/features/products/productApi";
import { getBundles, BundleResponse } from "@/lib/features/combo/comboApi";

export default function AdminFlashSalesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);

  // View state: "list" | "create" | "edit"
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [activeSaleId, setActiveSaleId] = useState<number | null>(null);

  // List States
  const [sales, setSales] = useState<FlashSaleResponseDto[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "upcoming" | "ended">("all");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Deletion State
  const [saleToDelete, setSaleToDelete] = useState<FlashSaleResponseDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Purchasers Log States
  const [purchaserModalSale, setPurchaserModalSale] = useState<FlashSaleResponseDto | null>(null);
  const [purchasers, setPurchasers] = useState<any[]>([]);
  const [loadingPurchasers, setLoadingPurchasers] = useState(false);

  // Form States
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<CampaignType>(CampaignType.FlashSale);
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formBannerUrl, setFormBannerUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formItems, setFormItems] = useState<any[]>([]); // { type, refId, name, originalPrice, discountPrice, discountType, requiredQty, giftVariantId, giftName, totalQty, maxPerUser, sku, imageUrl }
  const [savingForm, setSavingForm] = useState(false);

  // Modal Selector States
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorTab, setSelectorTab] = useState<"product" | "variant" | "bundle">("product");
  const [selectorSearch, setSelectorSearch] = useState("");
  const [selectorLoading, setSelectorLoading] = useState(false);
  
  // Data for selector
  const [selectorProducts, setSelectorProducts] = useState<AdminProductInfo[]>([]);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<AdminProductInfo | null>(null);
  const [selectedProductVariants, setSelectedProductVariants] = useState<AdminVariantInfo[]>([]);
  const [selectorBundles, setSelectorBundles] = useState<BundleResponse[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!storedToken) {
      toast.error("Vui lòng đăng nhập tài khoản quản trị.");
      router.push("/login");
    } else {
      setToken(storedToken);
    }
    setLoadingToken(false);
  }, [router]);

  useEffect(() => {
    if (token) {
      loadSales();
    }
  }, [token]);

  const loadSales = async () => {
    if (!token) return;
    setLoadingList(true);
    try {
      const data = await getFlashSalesAdmin(token);
      setSales(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách Flash Sale.");
    } finally {
      setLoadingList(false);
    }
  };

  const loadSaleForEdit = async (id: number) => {
    if (!token) return;
    setLoadingList(true);
    try {
      const sale = await getFlashSaleDetailAdmin(id, token);
      setActiveSaleId(id);
      setFormName(sale.name);
      setFormType(sale.type !== undefined ? sale.type : CampaignType.FlashSale);
      setFormBannerUrl(sale.bannerUrl || "");
      setFormDescription(sale.description || "");
      
      // Convert dates to YYYY-MM-DDTHH:mm
      const start = new Date(sale.startTime);
      const end = new Date(sale.endTime);
      start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
      end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
      setFormStartTime(start.toISOString().slice(0, 16));
      setFormEndTime(end.toISOString().slice(0, 16));
      
      setFormIsActive(sale.isActive);

      const items = sale.flashSaleItems.map(item => {
        let displayDiscount = item.discountPrice;
        if (item.discountType === DiscountType.Percentage && item.originalPrice > 0) {
            displayDiscount = Math.round((1 - item.discountPrice / item.originalPrice) * 100);
        }
        
        return {
          type: item.itemType,
          refId: item.referenceId,
          name: item.itemName,
          originalPrice: item.originalPrice,
          discountPrice: displayDiscount,
          discountType: item.discountType !== undefined ? item.discountType : DiscountType.FixedPrice,
          requiredQty: item.requiredQuantity || 0,
          giftVariantId: item.giftVariantId,
          giftName: item.giftName,
          totalQty: item.totalQuantity,
          maxPerUser: item.maxQuantityPerUser,
          sku: item.sku,
          imageUrl: item.imageUrl
        };
      });
      setFormItems(items);
      setView("edit");
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thông tin chi tiết chiến dịch.");
    } finally {
      setLoadingList(false);
    }
  };

  const handleResetForm = () => {
    setFormName("");
    setFormType(CampaignType.FlashSale);
    setFormBannerUrl("");
    setFormDescription("");
    setFormStartTime("");
    setFormEndTime("");
    setFormIsActive(true);
    setFormItems([]);
    setActiveSaleId(null);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (formItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm hoặc combo vào đợt Flash Sale.");
      return;
    }

    const start = new Date(formStartTime);
    const end = new Date(formEndTime);
    const now = new Date();

    if (start >= end) {
      toast.error("Thời gian kết thúc phải lớn hơn thời gian bắt đầu.");
      return;
    }

    if (end <= now) {
      toast.error("Thời gian kết thúc phải lớn hơn thời gian hiện tại.");
      return;
    }

    // Nếu tạo mới, hoặc sửa mà thay đổi StartTime (so với ban đầu)
    if (view === "create") {
      // Cho phép lệch tối đa 2 phút để tránh lỗi trễ mili giây khi ấn nút gửi
      if (start.getTime() < now.getTime() - 2 * 60 * 1000) {
        toast.error("Thời gian bắt đầu không được ở quá khứ.");
        return;
      }
    } else if (view === "edit" && activeSaleId) {
      const originalSale = sales.find(s => s.id === activeSaleId);
      if (originalSale) {
        const origStart = new Date(originalSale.startTime);
        // Nếu thay đổi start time thì không được chọn thời gian quá khứ
        if (Math.abs(start.getTime() - origStart.getTime()) > 1000) {
          if (start.getTime() < now.getTime() - 2 * 60 * 1000) {
            toast.error("Thời gian bắt đầu không được ở quá khứ.");
            return;
          }
        }
      }
    }

    // Validate prices and quantities
    for (const item of formItems) {
      if (item.discountType === DiscountType.FixedPrice && item.discountPrice >= item.originalPrice) {
        toast.error(`Giá sale của "${item.name}" phải nhỏ hơn giá gốc (${formatCurrency(item.originalPrice)}).`);
        return;
      }
      if (item.discountType === DiscountType.Percentage && (item.discountPrice <= 0 || item.discountPrice >= 100)) {
        toast.error(`Mức giảm phần trăm của "${item.name}" phải từ 1% đến 99%.`);
        return;
      }
      if (item.totalQty <= 0) {
        toast.error(`Số lượng sale của "${item.name}" phải lớn hơn 0.`);
        return;
      }
      if (item.discountType === DiscountType.FreeGift && (!item.giftVariantId || item.requiredQty <= 0)) {
        toast.error(`Mặt hàng "${item.name}" chọn loại tặng quà nhưng thiếu sản phẩm tặng hoặc số lượng yêu cầu.`);
        return;
      }
    }

    const dto: CreateFlashSaleDto = {
      name: formName,
      startTime: new Date(formStartTime).toISOString(),
      endTime: new Date(formEndTime).toISOString(),
      type: formType,
      bannerUrl: formBannerUrl,
      description: formDescription,
      isActive: formIsActive,
      flashSaleItems: formItems.map(item => {
        let finalDiscountPrice = Number(item.discountPrice);
        if (item.discountType === DiscountType.Percentage) {
            finalDiscountPrice = Math.round(item.originalPrice * (1 - finalDiscountPrice / 100));
        } else if (item.discountType === DiscountType.FreeGift) {
            finalDiscountPrice = item.originalPrice;
        }

        return {
          itemType: item.type,
          referenceId: item.refId,
          discountPrice: finalDiscountPrice,
          discountType: item.discountType,
          requiredQuantity: Number(item.requiredQty),
          giftVariantId: item.giftVariantId,
          totalQuantity: Number(item.totalQty),
          maxQuantityPerUser: Number(item.maxPerUser)
        };
      })
    };

    setSavingForm(true);
    try {
      if (view === "create") {
        await createFlashSale(dto, token);
        toast.success("Tạo chiến dịch Flash Sale thành công!");
      } else {
        await updateFlashSale(activeSaleId!, dto, token);
        toast.success("Cập nhật chiến dịch Flash Sale thành công!");
      }
      handleResetForm();
      setView("list");
      loadSales();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể lưu chiến dịch Flash Sale.");
    } finally {
      setSavingForm(false);
    }
  };

  const handleDeleteClick = (sale: FlashSaleResponseDto) => {
    setSaleToDelete(sale);
  };

  const confirmDelete = async () => {
    if (!saleToDelete || !token) return;
    setDeleting(true);
    try {
      await deleteFlashSale(saleToDelete.id, token);
      toast.success("Xóa chiến dịch Flash Sale thành công!");
      setSales(prev => prev.filter(s => s.id !== saleToDelete.id));
      setSaleToDelete(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi xóa chiến dịch Flash Sale.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (sale: FlashSaleResponseDto) => {
    if (togglingId !== null || !token) return;
    try {
      setTogglingId(sale.id);
      
      const dto: UpdateFlashSaleDto = {
        name: sale.name,
        startTime: sale.startTime,
        endTime: sale.endTime,
        isActive: !sale.isActive,
        flashSaleItems: sale.flashSaleItems.map(item => ({
          itemType: item.itemType,
          referenceId: item.referenceId,
          discountPrice: item.discountPrice,
          totalQuantity: item.totalQuantity,
          maxQuantityPerUser: item.maxQuantityPerUser
        }))
      };

      await updateFlashSale(sale.id, dto, token);
      toast.success("Cập nhật trạng thái chiến dịch thành công!");
      setSales(prev =>
        prev.map(s => (s.id === sale.id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể cập nhật trạng thái chiến dịch.");
    } finally {
      setTogglingId(null);
    }
  };

  const loadPurchasers = async (sale: FlashSaleResponseDto) => {
    if (!token) return;
    setPurchaserModalSale(sale);
    setLoadingPurchasers(true);
    setPurchasers([]);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const response = await fetch(`${API_BASE_URL}/FlashSale/admin/${sale.id}/purchasers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const text = await response.text();
      if (!response.ok) {
        const errorData = text ? JSON.parse(text) : {};
        throw new Error(errorData.message || "Không thể tải danh sách người mua");
      }
      
      const data = text ? JSON.parse(text) : [];
      setPurchasers(data);
    } catch (err: any) {
      console.error("Failed to load purchasers:", err);
      toast.error(err.message || "Không thể tải danh sách khách hàng đã mua.");
    } finally {
      setLoadingPurchasers(false);
    }
  };

  const removeItemFromForm = (index: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemInForm = (index: number, field: string, value: any) => {
    setFormItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  useEffect(() => {
    if (!isSelectorOpen || !token) return;

    const delayDebounce = setTimeout(() => {
      loadSelectorData();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [selectorSearch, selectorTab, isSelectorOpen]);

  const loadSelectorData = async () => {
    setSelectorLoading(true);
    try {
      if (selectorTab === "product" || selectorTab === "variant") {
        const data = await fetchAdminProducts(token!, 1, 20, selectorSearch, null, true);
        setSelectorProducts(data.products || []);
      } else if (selectorTab === "bundle") {
        const bundles = await getBundles(token!);
        const filtered = bundles.filter(b => b.status && b.name.toLowerCase().includes(selectorSearch.toLowerCase()));
        setSelectorBundles(filtered);
      }
    } catch (err) {
      console.error("Error loading selector data:", err);
    } finally {
      setSelectorLoading(false);
    }
  };

  const handleProductSelectForVariants = async (product: AdminProductInfo) => {
    setSelectorLoading(true);
    try {
      const detail = await fetchAdminProductDetail(token!, product.productID.toString());
      setSelectedProductForVariants(product);
      setSelectedProductVariants(detail.variants || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải biến thể của sản phẩm.");
    } finally {
      setSelectorLoading(false);
    }
  };

  const addProductToSale = (product: AdminProductInfo) => {
    const actualStock = product.variantCount > 0 ? product.totalStock : product.stock;
    if (actualStock <= 0) {
      toast.error("Sản phẩm này đã hết hàng trong tồn kho.");
      return;
    }
    if (formItems.some(item => item.type === FlashSaleItemType.Product && item.refId === product.productID)) {
      toast.warning("Sản phẩm này đã được thêm vào chiến dịch.");
      return;
    }

    const newItem = {
      type: FlashSaleItemType.Product,
      refId: product.productID,
      name: product.productName,
      originalPrice: product.price,
      discountPrice: Math.round(product.price * 0.8), // default 20% off
      discountType: DiscountType.FixedPrice,
      requiredQty: 0,
      giftVariantId: undefined,
      totalQty: 10,
      maxPerUser: 1,
      sku: product.code,
      imageUrl: product.imageUrl
    };

    setFormItems(prev => [...prev, newItem]);
    toast.success(`Đã thêm sản phẩm "${product.productName}"`);
    setIsSelectorOpen(false);
  };

  const addVariantToSale = (variant: AdminVariantInfo, productName: string) => {
    if (variant.stock <= 0) {
      toast.error("Biến thể này đã hết hàng trong tồn kho.");
      return;
    }
    if (formItems.some(item => item.type === FlashSaleItemType.Variant && item.refId === variant.variantID)) {
      toast.warning("Biến thể này đã được thêm vào chiến dịch.");
      return;
    }

    const newItem = {
      type: FlashSaleItemType.Variant,
      refId: variant.variantID,
      name: `${productName} (${variant.variantName})`,
      originalPrice: variant.unitPrice,
      discountPrice: Math.round(variant.unitPrice * 0.8), // default 20% off
      discountType: DiscountType.FixedPrice,
      requiredQty: 0,
      giftVariantId: undefined,
      totalQty: 10,
      maxPerUser: 1,
      sku: variant.sku,
      imageUrl: variant.imageUrl || selectedProductForVariants?.imageUrl
    };

    setFormItems(prev => [...prev, newItem]);
    toast.success(`Đã thêm biến thể "${newItem.name}"`);
    setIsSelectorOpen(false);
    setSelectedProductForVariants(null);
    setSelectedProductVariants([]);
  };

  const addBundleToSale = (bundle: BundleResponse) => {
    const bundleStock = bundle.stock !== undefined ? bundle.stock : 0;
    if (bundleStock <= 0) {
      toast.error("Combo này đã hết hàng trong tồn kho.");
      return;
    }
    if (formItems.some(item => item.type === FlashSaleItemType.Bundle && item.refId === bundle.bundleID)) {
      toast.warning("Combo này đã được thêm vào chiến dịch.");
      return;
    }

    const newItem = {
      type: FlashSaleItemType.Bundle,
      refId: bundle.bundleID,
      name: bundle.name,
      originalPrice: bundle.originalPrice || bundle.price,
      discountPrice: Math.round((bundle.originalPrice || bundle.price) * 0.8), // default 20% off
      discountType: DiscountType.FixedPrice,
      requiredQty: 0,
      giftVariantId: undefined,
      totalQty: 5,
      maxPerUser: 1,
      sku: bundle.code,
      imageUrl: bundle.imageUrl
    };

    setFormItems(prev => [...prev, newItem]);
    toast.success(`Đã thêm Combo "${bundle.name}"`);
    setIsSelectorOpen(false);
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && sale.status === FlashSaleStatus.Active;
    if (statusFilter === "upcoming") return matchesSearch && sale.status === FlashSaleStatus.Upcoming;
    if (statusFilter === "ended") return matchesSearch && sale.status === FlashSaleStatus.Ended;
    
    return matchesSearch;
  });

  const getStatusBadge = (startTimeStr: string, endTimeStr: string, isActive: boolean) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-550 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Tạm khóa
        </span>
      );
    }
    const now = new Date();
    const start = new Date(startTimeStr);
    const end = new Date(endTimeStr);

    if (now < start) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Sắp diễn ra
        </span>
      );
    } else if (now > end) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Hết hạn
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          Đang diễn ra
        </span>
      );
    }
  };

  if (loadingToken || !token) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4 animate-in fade-in duration-300"></div>
        <p className="font-bold text-sm uppercase tracking-wider">Đang xác thực quyền Admin...</p>
      </div>
    );
  }

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">
      {view === "list" ? (
        /* LIST VIEW */
        <div className="space-y-6">
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-3xl">bolt</span>
                Quản lý Chiến dịch Flash Sale
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Tạo các khung giờ vàng giảm giá kịch sàn cho Sản phẩm, Biến thể hoặc các Combo để thu hút khách hàng.
              </p>
            </div>
            <button
              onClick={() => {
                handleResetForm();
                setView("create");
              }}
              className="px-5 py-3 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Tạo Flash Sale Mới
            </button>
          </div>

          {/* Stats Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total */}
            <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng chiến dịch</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-800">{loadingList ? "..." : sales.length}</span>
            </div>

            {/* Active */}
            <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                  <span className="material-symbols-outlined text-[20px] animate-pulse">bolt</span>
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đang diễn ra</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-800">
                {loadingList ? "..." : sales.filter(s => s.status === FlashSaleStatus.Active && s.isActive).length}
              </span>
            </div>

            {/* Upcoming */}
            <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sắp diễn ra</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-800">
                {loadingList ? "..." : sales.filter(s => s.status === FlashSaleStatus.Upcoming && s.isActive).length}
              </span>
            </div>

            {/* Total Sold */}
            <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sản phẩm đã bán</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-800">
                {loadingList ? "..." : sales.reduce((sum, s) => sum + s.flashSaleItems.reduce((iSum, item) => iSum + item.soldQuantity, 0), 0)}
              </span>
            </div>
          </div>

          {/* Main List Section */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
            {/* Search, filters block */}
            <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
              {/* Search box */}
              <div className="flex-1 min-w-[260px] relative">
                <span className="material-symbols-outlined text-slate-400 text-lg absolute left-4.5 top-1/2 -translate-y-1/2">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm chiến dịch theo tên..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[165px] cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang diễn ra</option>
                <option value="upcoming">Sắp diễn ra</option>
                <option value="ended">Đã kết thúc</option>
              </select>

              {/* Reset Filters button */}
              {(searchTerm || statusFilter !== "all") && (
                <button
                  onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                  className="px-6 py-3 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">clear</span>
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loadingList ? (
                <div className="flex justify-center items-center py-24">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-3 text-slate-200">
                    search_off
                  </span>
                  <p className="text-sm font-bold">Không tìm thấy chiến dịch Flash Sale nào</p>
                  <p className="text-xs text-slate-400 mt-1">Hãy thử thay đổi điều kiện lọc hoặc tạo mới chiến dịch</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                      <th className="px-6 py-4 text-center w-[80px]">STT</th>
                      <th className="px-6 py-4">Tên chiến dịch</th>
                      <th className="px-6 py-4">Thời gian bắt đầu</th>
                      <th className="px-6 py-4">Thời gian kết thúc</th>
                      <th className="px-6 py-4 text-center">Đã bán</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredSales.map((sale, index) => (
                      <tr key={sale.id} className="hover:bg-slate-100/70 transition-all duration-200 group">
                        {/* STT */}
                        <td className="px-6 py-4 text-center text-xs font-semibold text-slate-400">
                          {index + 1}
                        </td>
                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm hover:text-primary transition-colors whitespace-normal min-w-[200px] line-clamp-2" title={sale.name}>
                            {sale.name}
                          </div>
                        </td>

                        {/* Start Time */}
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                          {new Date(sale.startTime).toLocaleString("vi-VN")}
                        </td>

                        {/* End Time */}
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                          {new Date(sale.endTime).toLocaleString("vi-VN")}
                        </td>

                        {/* Sold items count */}
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-bold text-orange-600">
                            {sale.flashSaleItems.reduce((sum, item) => sum + item.soldQuantity, 0)} sản phẩm
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="min-w-[90px] text-right">
                              {getStatusBadge(sale.startTime, sale.endTime, sale.isActive)}
                            </div>
                            <label className={`relative inline-flex items-center cursor-pointer select-none ${
                              new Date() > new Date(sale.endTime) ? "opacity-50 cursor-not-allowed" : ""
                            }`}>
                              <input
                                type="checkbox"
                                checked={sale.isActive}
                                disabled={togglingId === sale.id || new Date() > new Date(sale.endTime)}
                                onChange={() => handleToggleStatus(sale)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => loadPurchasers(sale)}
                              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Xem danh sách người mua"
                            >
                              <span className="material-symbols-outlined text-lg">group</span>
                            </button>

                            <button
                              onClick={() => loadSaleForEdit(sale.id)}
                              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              title={sale.status === FlashSaleStatus.Ended ? "Gia hạn" : "Sửa"}
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>

                            <button
                              onClick={() => handleDeleteClick(sale)}
                              className="p-1.5 hover:bg-rose-50 rounded-full text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* CREATE OR EDIT FORM VIEW */
        <div className="space-y-6">
          <header className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setView("list"); handleResetForm(); }}
              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-4xl">bolt</span>
                {view === "create" ? "Tạo Chiến dịch Flash Sale mới" : "Chỉnh sửa Chiến dịch Flash Sale"}
              </h1>
              <p className="text-base text-slate-500 mt-1">
                Thiết lập thời gian và cấu hình giảm giá cho từng mặt hàng trong đợt sale.
              </p>
            </div>
          </header>

          <form onSubmit={handleSaveForm} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Basic configuration */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-5 lg:col-span-1">
              <h3 className="font-bold text-slate-700 text-base border-b border-slate-50 pb-2">Thông tin chiến dịch</h3>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Tên chiến dịch</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Siêu Sale Giữa Tháng 06..."
                  className="w-full px-4 py-3 bg-slate-55/30 border border-slate-100 rounded-xl text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Loại chiến dịch</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(Number(e.target.value) as CampaignType)}
                  className="w-full px-4 py-3 bg-slate-55/30 border border-slate-100 rounded-xl text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer"
                >
                  <option value={CampaignType.FlashSale}>Flash Sale (Giảm giá chớp nhoáng)</option>
                  <option value={CampaignType.BuyXGetY}>Mua X Tặng Y (Quà tặng)</option>
                  <option value={CampaignType.ComboDiscount}>Giảm giá Combo (Mua nhiều giảm sâu)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Thời gian bắt đầu</label>
                <input
                  type="datetime-local"
                  required
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-55/30 border border-slate-100 rounded-xl text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Thời gian kết thúc</label>
                <input
                  type="datetime-local"
                  required
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-55/30 border border-slate-100 rounded-xl text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Ảnh Banner (Tùy chọn)</label>
                <input
                  type="text"
                  value={formBannerUrl}
                  onChange={(e) => setFormBannerUrl(e.target.value)}
                  placeholder="Nhập URL ảnh banner..."
                  className="w-full px-4 py-3 bg-slate-55/30 border border-slate-100 rounded-xl text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Mô tả (Tùy chọn)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả chi tiết chiến dịch..."
                  className="w-full px-4 py-3 bg-slate-55/30 border border-slate-100 rounded-xl text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                <div>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Kích hoạt (Hiển thị)</span>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Bật để kích hoạt đợt sale khi đến giờ</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setView("list"); handleResetForm(); }}
                  className="flex-1 py-3 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-55/10 font-bold text-sm cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="flex-1 py-3 rounded-full bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
                >
                  {savingForm ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>{view === "create" ? "Tạo chiến dịch" : "Cập nhật"}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Flash sale items configuration */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div>
                  <h3 className="font-bold text-slate-700 text-base">Danh sách mặt hàng giảm giá</h3>
                  <p className="text-xs text-slate-450 font-semibold mt-0.5">
                    Thêm sản phẩm, biến thể hoặc combo và cấu hình giá Flash Sale
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectorOpen(true);
                    setSelectorSearch("");
                  }}
                  className="px-5 py-2.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold text-sm flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Thêm mặt hàng</span>
                </button>
              </div>

              {formItems.length === 0 ? (
                <div className="py-20 text-center text-slate-450 flex flex-col items-center justify-center border border-dashed border-slate-100 rounded-3xl">
                  <span className="material-symbols-outlined text-5xl mb-2 text-slate-300">shopping_cart_checkout</span>
                  <p className="text-base font-bold">Chưa có mặt hàng nào được chọn</p>
                  <p className="text-sm text-slate-400 mt-1.5">Bấm nút "Thêm mặt hàng" phía trên để bắt đầu thêm sản phẩm</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formItems.map((item, index) => {
                    let typeBadge = "";
                    let typeIcon = "";
                    if (item.type === FlashSaleItemType.Product) {
                      typeBadge = "bg-purple-50 text-purple-600 border-purple-100";
                      typeIcon = "inventory_2";
                    } else if (item.type === FlashSaleItemType.Variant) {
                      typeBadge = "bg-blue-50 text-blue-600 border-blue-100";
                      typeIcon = "layers";
                    } else {
                      typeBadge = "bg-green-50 text-green-600 border-green-100";
                      typeIcon = "sell";
                    }

                    return (
                      <div 
                        key={index} 
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-100 rounded-2xl gap-4 hover:border-slate-200 transition-all group"
                      >
                        {/* Thumbnail & Title */}
                        <div className="flex items-center gap-3 md:w-1/3">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-300">inventory_2</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-700 text-sm leading-snug line-clamp-2">{item.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className={`px-1.5 py-0.5 border text-[11px] font-bold rounded-md flex items-center gap-1 ${typeBadge}`}>
                                <span className="material-symbols-outlined text-[12px]">{typeIcon}</span>
                                {item.type === FlashSaleItemType.Product ? "SP" : item.type === FlashSaleItemType.Variant ? "Biến thể" : "Combo"}
                              </span>
                              {item.sku && (
                                <span className="text-xs font-bold text-slate-400 font-mono">SKU: {item.sku}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Prices Input */}
                        <div className="flex flex-wrap items-center gap-4 flex-1 md:justify-end">
                          {/* Original Price Label */}
                          <div className="w-24 shrink-0 text-right">
                            <span className="text-xs text-slate-400 font-bold block uppercase tracking-widest">Giá gốc</span>
                            <span className="text-sm font-bold text-slate-500 line-through mt-0.5 block">{formatCurrency(item.originalPrice)}</span>
                          </div>

                          <div className="w-28 shrink-0">
                            <label className="text-xs text-slate-455 font-bold block uppercase tracking-widest">Loại Giảm</label>
                            <select
                              value={item.discountType}
                              onChange={(e) => updateItemInForm(index, "discountType", Number(e.target.value))}
                              className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer"
                            >
                              <option value={DiscountType.FixedPrice}>Giá giảm</option>
                              <option value={DiscountType.Percentage}>Giảm %</option>
                              <option value={DiscountType.FreeGift}>Tặng quà</option>
                            </select>
                          </div>

                          {item.discountType !== DiscountType.FreeGift ? (
                            <div className="w-28 shrink-0">
                              <label className="text-xs text-slate-455 font-bold block uppercase tracking-widest">Mức giảm</label>
                              <input
                                type="number"
                                required
                                min={0}
                                value={item.discountPrice}
                                onChange={(e) => updateItemInForm(index, "discountPrice", e.target.value)}
                                placeholder="Mức giảm"
                                className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="w-24 shrink-0">
                                <label className="text-xs text-slate-455 font-bold block uppercase tracking-widest">SL Yêu cầu</label>
                                <input
                                  type="number"
                                  required
                                  min={1}
                                  value={item.requiredQty}
                                  onChange={(e) => updateItemInForm(index, "requiredQty", e.target.value)}
                                  placeholder="Mua X"
                                  className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                  title="Số lượng sản phẩm khách cần mua để nhận quà"
                                />
                              </div>
                              <div className="w-24 shrink-0">
                                <label className="text-xs text-slate-455 font-bold block uppercase tracking-widest">ID Quà Tặng</label>
                                <input
                                  type="number"
                                  required
                                  min={1}
                                  value={item.giftVariantId || ""}
                                  onChange={(e) => updateItemInForm(index, "giftVariantId", e.target.value ? Number(e.target.value) : undefined)}
                                  placeholder="Tặng Y"
                                  className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                  title="Nhập Variant ID của sản phẩm quà tặng"
                                />
                              </div>
                            </>
                          )}

                          {/* Limit Stock Input */}
                          <div className="w-24 shrink-0">
                            <label className="text-xs text-slate-455 font-bold block uppercase tracking-widest">Số lượng Sale</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={item.totalQty}
                              onChange={(e) => updateItemInForm(index, "totalQty", e.target.value)}
                              placeholder="Tồn Sale"
                              className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                            />
                          </div>

                          {/* User limit quantity */}
                          <div className="w-24 shrink-0">
                            <label className="text-xs text-slate-455 font-bold block uppercase tracking-widest">G.Hạn/Khách</label>
                            <input
                              type="number"
                              required
                              min={0}
                              value={item.maxPerUser}
                              onChange={(e) => updateItemInForm(index, "maxPerUser", e.target.value)}
                              placeholder="Giới hạn"
                              className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                              title="Số lượng tối đa 1 người mua (0 là không giới hạn)"
                            />
                          </div>
                        </div>

                        {/* Remove Action Button */}
                        <div className="shrink-0 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeItemFromForm(index)}
                            className="p-1.5 text-slate-450 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                            title="Xóa khỏi danh sách"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {saleToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-[380px] max-w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-100">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Xác nhận xóa chiến dịch?</h3>
              <p className="text-xs text-slate-400 mt-2 px-1 leading-relaxed text-center">
                Bạn có chắc chắn muốn xóa vĩnh viễn chiến dịch Flash Sale <span className="font-bold text-slate-800">"{saleToDelete.name}"</span>?
                Hành động này sẽ xóa dữ liệu chiến dịch khỏi hệ thống và không thể hoàn tác.
              </p>

              <div className="flex items-center gap-3 w-full mt-6">
                <button
                  type="button"
                  onClick={() => setSaleToDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-55/10 font-bold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    "Xác nhận xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PURCHASERS HISTORY MODAL */}
      {purchaserModalSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ width: "1000px", maxWidth: "100%", height: "600px", maxHeight: "90vh" }}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">group</span>
                  Khách hàng đã mua trong chiến dịch
                </h3>
                <p className="text-xs text-slate-555 mt-1">
                  Chiến dịch: {purchaserModalSale.name}
                </p>
              </div>
              <button 
                onClick={() => setPurchaserModalSale(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Content Table */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {loadingPurchasers ? (
                <div className="flex justify-center items-center py-24">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : purchasers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-455">
                  <span className="material-symbols-outlined text-5xl mb-3 text-slate-200">
                    shopping_cart
                  </span>
                  <p className="text-sm font-bold">Chưa có lượt mua nào trong chiến dịch này</p>
                  <p className="text-xs text-slate-400 mt-1">Giao dịch của khách hàng sẽ tự động ghi nhận tại đây khi đặt hàng.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-55 border-b border-slate-100 text-[10px] font-bold text-slate-550 tracking-wider uppercase">
                        <th className="px-4 py-3">Đơn hàng / Ngày mua</th>
                        <th className="px-4 py-3">Khách hàng</th>
                        <th className="px-4 py-3 text-center">Số lượng</th>
                        <th className="px-4 py-3 text-right">Tổng thanh toán</th>
                        <th className="px-4 py-3 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {purchasers.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-primary block">{p.invoiceCode}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5 font-semibold">
                              {new Date(p.purchasedAt).toLocaleString("vi-VN")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-700 block">{p.customerName}</span>
                            <span className="text-[10px] text-slate-450 block font-mono mt-0.5">{p.customerPhone} ({p.customerEmail})</span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">
                            {p.quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-slate-800">
                            {formatCurrency(p.totalPrice)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                                p.status === "Completed"
                                  ? "bg-green-50 text-green-600 border-green-100"
                                  : p.status === "Cancelled"
                                  ? "bg-rose-50 text-rose-600 border-rose-100"
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}>
                              {p.status === "Pending" ? "Chờ xác nhận" : 
                               p.status === "Confirmed" ? "Đã xác nhận" : 
                               p.status === "Shipped" ? "Đang giao" : 
                               p.status === "Completed" ? "Hoàn tất" : p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 flex items-center justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPurchaserModalSale(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-655 font-bold rounded-full text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELECT MODAL SELECTOR FOR PRODUCTS / VARIANTS / BUNDLES */}
      {isSelectorOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ width: "1000px", maxWidth: "95vw", height: "780px", maxHeight: "90vh" }}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl font-bold animate-pulse">add_shopping_cart</span>
                <h3 className="text-xl font-bold text-slate-900">Thêm mặt hàng vào Flash Sale</h3>
              </div>
              <button 
                onClick={() => {
                  setIsSelectorOpen(false);
                  setSelectedProductForVariants(null);
                  setSelectedProductVariants([]);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-550 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Selector Tabs */}
            {!selectedProductForVariants && (
              <div className="flex border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => { setSelectorTab("product"); setSelectorSearch(""); }}
                  className={`flex-1 py-3.5 text-center text-sm font-bold transition-all border-b-2 ${selectorTab === "product" ? "border-primary text-primary" : "border-transparent text-slate-450 hover:text-slate-655"}`}
                >
                  Sản phẩm (Product)
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectorTab("variant"); setSelectorSearch(""); }}
                  className={`flex-1 py-3.5 text-center text-sm font-bold transition-all border-b-2 ${selectorTab === "variant" ? "border-primary text-primary" : "border-transparent text-slate-450 hover:text-slate-655"}`}
                >
                  Biến thể (Variant)
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectorTab("bundle"); setSelectorSearch(""); }}
                  className={`flex-1 py-3.5 text-center text-sm font-bold transition-all border-b-2 ${selectorTab === "bundle" ? "border-primary text-primary" : "border-transparent text-slate-450 hover:text-slate-655"}`}
                >
                  Combo (Bundle)
                </button>
              </div>
            )}

            {/* Search Input */}
            {!selectedProductForVariants && (
              <div className="p-4 border-b border-slate-100 bg-slate-50/10">
                <div className="relative">
                  <span className="material-symbols-outlined text-slate-400 text-lg absolute left-4 top-1/2 -translate-y-1/2">
                    search
                  </span>
                  <input 
                    type="text"
                    value={selectorSearch}
                    onChange={(e) => setSelectorSearch(e.target.value)}
                    placeholder={selectorTab === "product" || selectorTab === "variant" ? "Tìm sản phẩm theo tên, mã..." : "Tìm Combo theo tên..."}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all placeholder-slate-400"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Main scrollable list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin">
              {/* Back button if in product variant selection */}
              {selectedProductForVariants && (
                <button
                  type="button"
                  onClick={() => { setSelectedProductForVariants(null); setSelectedProductVariants([]); }}
                  className="mb-2.5 text-sm font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Trở lại danh sách sản phẩm
                </button>
              )}

              {selectorLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : selectedProductForVariants ? (
                /* Select variant for selected product */
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Chọn biến thể của: <span className="text-slate-800 font-extrabold text-base">{selectedProductForVariants.productName}</span>
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const availableVariantsForSale = selectedProductVariants.filter(variant => {
                        const isOutOfStock = variant.stock <= 0;
                        const isAlreadyAdded = formItems.some(
                          item => item.type === FlashSaleItemType.Variant && item.refId === variant.variantID
                        );
                        return !isOutOfStock && !isAlreadyAdded;
                      });

                      if (selectedProductVariants.length === 0) {
                        return <p className="text-sm font-semibold text-slate-400 py-4 text-center">Sản phẩm này chưa cấu hình biến thể.</p>;
                      }
                      if (availableVariantsForSale.length === 0) {
                        return <p className="text-sm font-semibold text-slate-400 py-4 text-center">Tất cả các biến thể đã hết hàng hoặc đã được thêm vào chiến dịch.</p>;
                      }

                      return availableVariantsForSale.map((variant) => (
                        <div 
                          key={variant.variantID}
                          onClick={() => addVariantToSale(variant, selectedProductForVariants.productName)}
                          className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-18 h-18 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                              {variant.imageUrl ? (
                                <img src={variant.imageUrl} alt={variant.variantName} className="w-full h-full object-cover" />
                              ) : selectedProductForVariants.imageUrl ? (
                                <img src={selectedProductForVariants.imageUrl} alt={variant.variantName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-slate-355 text-xl">inventory_2</span>
                              )}
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-700 text-sm leading-snug group-hover:text-primary transition-colors">
                                {variant.variantName}
                              </h5>
                              <p className="text-xs font-bold text-slate-400 font-mono mt-1">SKU: {variant.sku || "N/A"}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-slate-700 text-sm">{formatCurrency(variant.unitPrice)}</span>
                            <p className="text-xs font-bold text-slate-450 mt-1">Tồn kho: {variant.stock}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : selectorTab === "product" ? (
                /* Select Product list */
                (() => {
                  const availableProductsForSale = selectorProducts.filter(product => {
                    const actualStock = product.variantCount > 0 ? product.totalStock : product.stock;
                    const isOutOfStock = actualStock <= 0;
                    const isAlreadyAdded = formItems.some(
                      item => item.type === FlashSaleItemType.Product && item.refId === product.productID
                    );
                    return !isOutOfStock && !isAlreadyAdded;
                  });

                  if (selectorProducts.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                        <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">inventory</span>
                        <p className="text-base font-bold">Không tìm thấy sản phẩm</p>
                      </div>
                    );
                  }
                  if (availableProductsForSale.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                        <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">inventory</span>
                        <p className="text-base font-bold">Không tìm thấy sản phẩm khả dụng</p>
                        <p className="text-sm text-slate-400 mt-1.5">Tất cả sản phẩm đã hết hàng hoặc đã được thêm vào chiến dịch.</p>
                      </div>
                    );
                  }

                  return availableProductsForSale.map((product) => (
                    <div 
                      key={product.productID}
                      onClick={() => addProductToSale(product)}
                      className="flex items-center justify-between p-3.5 border border-slate-100 rounded-2xl hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          {product.imageUrl ? (
                             <img src={product.imageUrl} alt={product.productName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-355 text-xl">inventory_2</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                            {product.productName}
                          </h4>
                          <span className="text-xs font-bold text-slate-400 uppercase mt-1 block">{product.categoryName}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-700 text-sm">{formatCurrency(product.price)}</span>
                        <p className="text-xs font-bold text-slate-450 mt-1">Giá gốc</p>
                        <p className="text-xs font-bold text-slate-450 mt-1">Tồn kho: {product.variantCount > 0 ? product.totalStock : product.stock}</p>
                      </div>
                    </div>
                  ));
                })()
              ) : selectorTab === "variant" ? (
                /* Click product to view variants list */
                (() => {
                  const availableProductsForVariants = selectorProducts.filter(product => {
                    const actualStock = product.variantCount > 0 ? product.totalStock : product.stock;
                    return actualStock > 0;
                  });

                  if (selectorProducts.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                        <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">inventory</span>
                        <p className="text-base font-bold">Không tìm thấy sản phẩm</p>
                      </div>
                    );
                  }
                  if (availableProductsForVariants.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                        <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">inventory</span>
                        <p className="text-base font-bold">Không tìm thấy sản phẩm có sẵn biến thể</p>
                        <p className="text-sm text-slate-400 mt-1.5">Tất cả sản phẩm đã hết hàng tồn kho.</p>
                      </div>
                    );
                  }

                  return availableProductsForVariants.map((product) => (
                    <div 
                      key={product.productID}
                      onClick={() => handleProductSelectForVariants(product)}
                      className="flex items-center justify-between p-3.5 border border-slate-100 rounded-2xl hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.productName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-355 text-xl">inventory_2</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-850 text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                            {product.productName}
                          </h4>
                          <p className="text-xs font-bold text-primary mt-1">Click để chọn biến thể ({product.variantCount} biến thể)</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-700 text-sm">{formatCurrency(product.price)}</span>
                        <p className="text-xs font-bold text-slate-450 mt-1">Giá từ</p>
                        <p className="text-xs font-bold text-slate-450 mt-1">Tồn kho: {product.variantCount > 0 ? product.totalStock : product.stock}</p>
                      </div>
                    </div>
                  ));
                })()
              ) : (
                /* Select Bundle list */
                (() => {
                  const availableBundlesForSale = selectorBundles.filter(bundle => {
                    const isOutOfStock = (bundle.stock !== undefined ? bundle.stock : 0) <= 0;
                    const isAlreadyAdded = formItems.some(
                      item => item.type === FlashSaleItemType.Bundle && item.refId === bundle.bundleID
                    );
                    return !isOutOfStock && !isAlreadyAdded;
                  });

                  if (selectorBundles.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                        <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">collections_bookmark</span>
                        <p className="text-base font-bold">Không tìm thấy Combo</p>
                      </div>
                    );
                  }
                  if (availableBundlesForSale.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                        <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">collections_bookmark</span>
                        <p className="text-base font-bold">Không còn Combo khả dụng</p>
                        <p className="text-sm text-slate-400 mt-1.5">Tất cả các Combo đã hết hàng hoặc đã được thêm vào chiến dịch.</p>
                      </div>
                    );
                  }

                  return availableBundlesForSale.map((bundle) => (
                    <div 
                      key={bundle.bundleID}
                      onClick={() => addBundleToSale(bundle)}
                      className="flex items-center justify-between p-3.5 border border-slate-100 rounded-2xl hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                          {bundle.imageUrl ? (
                            <img src={bundle.imageUrl} alt={bundle.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-355 text-xl">inventory_2</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-855 text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                            {bundle.name}
                          </h4>
                          <p className="text-xs font-bold text-slate-400 mt-1">Mã Combo: {bundle.code || `ID: ${bundle.bundleID}`}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-700 text-sm">{formatCurrency(bundle.price)}</span>
                        <p className="text-xs font-bold text-slate-450 mt-1">Giá Combo</p>
                        <p className="text-xs font-bold text-slate-450 mt-1">Tồn kho: {bundle.stock !== undefined ? bundle.stock : 0}</p>
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
