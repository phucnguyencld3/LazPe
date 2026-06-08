import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { 
    fetchCategoriesForSelect, 
    fetchSuppliersForSelect, 
    CategorySelectOption, 
    SupplierSelectOption 
} from "@/lib/features/products/productApi";

interface ImportResolutionModalProps {
    previewData: any;
    onClose: () => void;
    onCommit: (data: any) => void;
}

export default function ImportResolutionModal({ previewData, onClose, onCommit }: ImportResolutionModalProps) {
    const [products, setProducts] = useState<any[]>(previewData.products || []);
    const [variants, setVariants] = useState<any[]>(previewData.variants || []);
    const [errors, setErrors] = useState<any[]>(previewData.errors || []);
    const [duplicates, setDuplicates] = useState<any[]>(previewData.duplicates || []);
    
    const [allCategories, setAllCategories] = useState<CategorySelectOption[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<SupplierSelectOption[]>([]);
    const [editingErrorIndex, setEditingErrorIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>("");

    // Manage Bulk Actions for duplicates
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadSelectOptions = async () => {
            try {
                const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
                const [cats, sups] = await Promise.all([
                    fetchCategoriesForSelect(token),
                    fetchSuppliersForSelect(token)
                ]);
                setAllCategories(cats || []);
                setAllSuppliers(sups || []);
            } catch (err) {
                console.error("Lỗi khi tải danh mục hoặc nhà cung cấp:", err);
            }
        };
        loadSelectOptions();
    }, []);

    const getFieldNameInJs = (field: string) => {
        switch (field) {
            case "ProductCode": return "productCode";
            case "ProductName": return "productName";
            case "CategoryName": return "categoryName";
            case "SupplierName": return "supplierName";
            case "BasePrice": return "basePrice";
            case "SKU": return "sku";
            case "Price": return "price";
            case "Stock": return "stock";
            default: return field.charAt(0).toLowerCase() + field.slice(1);
        }
    };

    const getFieldLabel = (field: string) => {
        switch (field) {
            case "ProductCode": return "Mã sản phẩm";
            case "ProductName": return "Tên sản phẩm";
            case "CategoryName": return "Tên danh mục";
            case "SupplierName": return "Tên nhà cung cấp";
            case "BasePrice": return "Giá cơ bản";
            case "SKU": return "Mã SKU";
            case "Price": return "Giá bán";
            case "Stock": return "Tồn kho";
            default: return field;
        }
    };

    const revalidateData = (updatedProducts: any[], updatedVariants: any[]) => {
        const newErrors: any[] = [];
        const seenProductCodes = new Set<string>();

        // Check Products
        updatedProducts.forEach((p) => {
            let isValid = true;
            
            if (!p.productName || p.productName.trim() === "") {
                isValid = false;
                newErrors.push({
                    sheet: "Products",
                    row: p.excelRow,
                    field: "ProductName",
                    message: "Tên sản phẩm trống"
                });
            }

            if (!p.categoryName || p.categoryName.trim() === "") {
                isValid = false;
                newErrors.push({
                    sheet: "Products",
                    row: p.excelRow,
                    field: "CategoryName",
                    message: "Danh mục trống"
                });
            } else {
                const catExists = allCategories.some(c => c.categoryName.toLowerCase() === p.categoryName.toLowerCase());
                if (!catExists && allCategories.length > 0) {
                    isValid = false;
                    newErrors.push({
                        sheet: "Products",
                        row: p.excelRow,
                        field: "CategoryName",
                        message: `Danh mục '${p.categoryName}' không tồn tại`
                    });
                }
            }

            if (!p.supplierName || p.supplierName.trim() === "") {
                isValid = false;
                newErrors.push({
                    sheet: "Products",
                    row: p.excelRow,
                    field: "SupplierName",
                    message: "Nhà cung cấp trống"
                });
            } else {
                const supExists = allSuppliers.some(s => s.supplierName.toLowerCase() === p.supplierName.toLowerCase());
                if (!supExists && allSuppliers.length > 0) {
                    isValid = false;
                    newErrors.push({
                        sheet: "Products",
                        row: p.excelRow,
                        field: "SupplierName",
                        message: `Nhà cung cấp '${p.supplierName}' không tồn tại`
                    });
                }
            }

            if (p.productCode && p.productCode.trim() !== "") {
                if (seenProductCodes.has(p.productCode)) {
                    isValid = false;
                    newErrors.push({
                        sheet: "Products",
                        row: p.excelRow,
                        field: "ProductCode",
                        message: "Mã sản phẩm trùng lặp trong file Excel"
                    });
                } else {
                    seenProductCodes.add(p.productCode);
                }
            } else {
                isValid = false;
                newErrors.push({
                    sheet: "Products",
                    row: p.excelRow,
                    field: "ProductCode",
                    message: "Mã sản phẩm không được để trống"
                });
            }

            p.isValid = isValid;
        });

        // Check Variants
        const seenSkus = new Set<string>();
        const productCodesList = new Set(updatedProducts.map(p => p.productCode));

        updatedVariants.forEach((v) => {
            let isValid = true;

            if (!productCodesList.has(v.productCode)) {
                isValid = false;
                newErrors.push({
                    sheet: "Variants",
                    row: v.excelRow,
                    field: "ProductCode",
                    message: `Mã sản phẩm '${v.productCode}' không tồn tại trong sheet Products`
                });
            }

            if (!v.sku || v.sku.trim() === "") {
                isValid = false;
                newErrors.push({
                    sheet: "Variants",
                    row: v.excelRow,
                    field: "SKU",
                    message: "SKU không được để trống"
                });
            } else {
                if (seenSkus.has(v.sku)) {
                    isValid = false;
                    newErrors.push({
                        sheet: "Variants",
                        row: v.excelRow,
                        field: "SKU",
                        message: "SKU trùng lặp trong file Excel"
                    });
                } else {
                    seenSkus.add(v.sku);
                }
            }

            v.isValid = isValid;
        });

        setErrors(newErrors);
    };

    const startEditing = (idx: number, currentVal: any) => {
        setEditingErrorIndex(idx);
        setEditValue(currentVal?.toString() || "");
    };

    const saveEdit = (idx: number, err: any) => {
        const isProduct = err.sheet === "Products";
        const fieldName = getFieldNameInJs(err.field);

        let updatedProducts = [...products];
        let updatedVariants = [...variants];

        if (isProduct) {
            updatedProducts = products.map(p => {
                if (p.excelRow === err.row) {
                    const updated = { ...p, [fieldName]: editValue };
                    if (err.field === "CategoryName") {
                        const cat = allCategories.find(c => c.categoryName.toLowerCase() === editValue.toLowerCase());
                        if (cat) updated.categoryId = cat.categoryID;
                    }
                    if (err.field === "SupplierName") {
                        const sup = allSuppliers.find(s => s.supplierName.toLowerCase() === editValue.toLowerCase());
                        if (sup) updated.supplierId = sup.supplierID;
                    }
                    return updated;
                }
                return p;
            });
            setProducts(updatedProducts);
        } else {
            updatedVariants = variants.map(v => {
                if (v.excelRow === err.row) {
                    return { ...v, [fieldName]: editValue };
                }
                return v;
            });
            setVariants(updatedVariants);
        }

        setEditingErrorIndex(null);
        setEditValue("");

        // Run validation immediately
        revalidateData(updatedProducts, updatedVariants);
        toast.success("Đã cập nhật dữ liệu.");
    };

    const handleActionChange = (itemCode: string, action: string) => {
        setDuplicates(prev => prev.map(d => d.itemCode === itemCode ? { ...d, resolvingAction: action } : d));
    };

    const toggleSelection = (itemCode: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemCode)) newSet.delete(itemCode);
        else newSet.add(itemCode);
        setSelectedItems(newSet);
    };

    const selectAll = () => {
        if (selectedItems.size === duplicates.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(duplicates.map(d => d.itemCode)));
        }
    };

    const applyBulkAction = (action: string) => {
        if (selectedItems.size === 0) {
            toast.error("Vui lòng chọn ít nhất 1 mục");
            return;
        }
        setDuplicates(prev => prev.map(d => selectedItems.has(d.itemCode) ? { ...d, resolvingAction: action } : d));
        toast.success(`Đã áp dụng hành động cho ${selectedItems.size} mục.`);
        setSelectedItems(new Set());
    };

    const handleCommit = () => {
        const finalData = {
            ...previewData,
            duplicates: duplicates,
            products: products.filter((p: any) => p.isValid),
            variants: variants.filter((v: any) => v.isValid),
        };
        onCommit(finalData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">Giải Quyết Lỗi & Trùng Lặp</h2>
                        <p className="text-slate-500 mt-1">
                            {errors.length} lỗi và {duplicates.length} trùng lặp cần xử lý
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
                    {/* Error Section */}
                    {errors.length > 0 && (
                        <section>
                            <h3 className="text-lg font-bold text-rose-600 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined">error</span>
                                Dữ liệu lỗi (Nhấp đúp hoặc bấm Sửa để chỉnh sửa trực tiếp)
                            </h3>
                            <div className="border border-rose-200 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-left bg-rose-50/30 table-fixed">
                                    <thead className="bg-rose-100 text-rose-800 text-sm">
                                        <tr>
                                            <th className="p-3 w-24">Sheet</th>
                                            <th className="p-3 w-16">Dòng</th>
                                            <th className="p-3 w-36">Trường</th>
                                            <th className="p-3 w-64">Giá trị lỗi/mới</th>
                                            <th className="p-3">Thông báo lỗi</th>
                                            <th className="p-3 w-28 text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {errors.map((err: any, idx: number) => {
                                            const isProduct = err.sheet === "Products";
                                            const item = isProduct 
                                                ? products.find(p => p.excelRow === err.row)
                                                : variants.find(v => v.excelRow === err.row);
                                            const fieldName = getFieldNameInJs(err.field);
                                            const currentValue = item ? item[fieldName] : "";
                                            const isEditing = editingErrorIndex === idx;

                                            return (
                                                <tr key={idx} className="border-t border-rose-100 hover:bg-rose-50/50 transition-colors">
                                                    <td className="p-3 font-bold text-slate-600">{err.sheet}</td>
                                                    <td className="p-3 text-slate-500">{err.row}</td>
                                                    <td className="p-3 text-rose-600 font-medium">{getFieldLabel(err.field)}</td>
                                                    <td className="p-3 overflow-hidden text-ellipsis whitespace-nowrap">
                                                        {isEditing ? (
                                                            err.field === "CategoryName" ? (
                                                                <select 
                                                                    value={editValue} 
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-800"
                                                                >
                                                                    <option value="">-- Chọn danh mục --</option>
                                                                    {allCategories.map(c => (
                                                                        <option key={c.categoryID} value={c.categoryName}>{c.categoryName}</option>
                                                                    ))}
                                                                </select>
                                                            ) : err.field === "SupplierName" ? (
                                                                <select 
                                                                    value={editValue} 
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-800"
                                                                >
                                                                    <option value="">-- Chọn nhà cung cấp --</option>
                                                                    {allSuppliers.map(s => (
                                                                        <option key={s.supplierID} value={s.supplierName}>{s.supplierName}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <input 
                                                                    type="text" 
                                                                    value={editValue} 
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-800"
                                                                />
                                                            )
                                                        ) : (
                                                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                                                {currentValue || "(trống)"}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-slate-600 text-sm">{err.message}</td>
                                                    <td className="p-3 text-center">
                                                        {isEditing ? (
                                                            <div className="flex gap-2 justify-center">
                                                                <button 
                                                                    onClick={() => saveEdit(idx, err)} 
                                                                    className="p-1 text-green-600 hover:bg-green-100 rounded flex items-center justify-center"
                                                                    title="Lưu"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">check</span>
                                                                </button>
                                                                <button 
                                                                    onClick={() => setEditingErrorIndex(null)} 
                                                                    className="p-1 text-rose-600 hover:bg-rose-100 rounded flex items-center justify-center"
                                                                    title="Hủy"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">close</span>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => startEditing(idx, currentValue)} 
                                                                className="px-3 py-1 bg-pink-100 text-primary font-bold text-xs rounded hover:bg-pink-200 flex items-center gap-1 mx-auto"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">edit</span>
                                                                Sửa
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                             </div>
                             <p className="text-sm text-slate-500 mt-2">* Các dòng còn lỗi sau khi sửa sẽ tự động bị bỏ qua trong quá trình Import.</p>
                        </section>
                    )}

                    {/* Duplicates Section */}
                    {duplicates.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-amber-600 flex items-center gap-2">
                                    <span className="material-symbols-outlined">warning</span>
                                    Xử lý trùng lặp ({duplicates.length})
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-500 mr-2">Hành động hàng loạt:</span>
                                    <button onClick={() => applyBulkAction('Skip')} className="px-3 py-1 bg-slate-200 text-slate-700 text-sm font-bold rounded hover:bg-slate-300">Bỏ qua</button>
                                    <button onClick={() => applyBulkAction('Update')} className="px-3 py-1 bg-primary text-white text-sm font-bold rounded hover:bg-primary/90">Cập nhật đè</button>
                                    <button onClick={() => applyBulkAction('CreateNew')} className="px-3 py-1 bg-secondary text-white text-sm font-bold rounded hover:bg-secondary/90">Tạo mới</button>
                                </div>
                            </div>
                            <div className="border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-left bg-amber-50/30">
                                    <thead className="bg-amber-100 text-amber-800 text-sm">
                                        <tr>
                                            <th className="p-3 w-12 text-center">
                                                <input type="checkbox" checked={selectedItems.size === duplicates.length && duplicates.length > 0} onChange={selectAll} className="w-4 h-4 rounded border-slate-300"/>
                                            </th>
                                            <th className="p-3">Phân loại</th>
                                            <th className="p-3">Dòng</th>
                                            <th className="p-3">Mã sản phẩm / SKU bị trùng</th>
                                            <th className="p-3">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {duplicates.map((dup: any, idx: number) => (
                                            <tr key={idx} className={`border-t border-amber-100 transition-colors ${selectedItems.has(dup.itemCode) ? 'bg-amber-50' : 'hover:bg-amber-50/50'}`}>
                                                <td className="p-3 text-center">
                                                    <input type="checkbox" checked={selectedItems.has(dup.itemCode)} onChange={() => toggleSelection(dup.itemCode)} className="w-4 h-4 rounded border-slate-300 accent-primary" />
                                                </td>
                                                <td className="p-3 font-bold text-slate-600">{dup.sheet === 'Products' ? 'Sản phẩm' : 'Biến thể'}</td>
                                                <td className="p-3 text-slate-500">{dup.row}</td>
                                                <td className="p-3 font-medium text-slate-750">{dup.itemCode}</td>
                                                <td className="p-3">
                                                    <select 
                                                        value={dup.resolvingAction} 
                                                        onChange={(e) => handleActionChange(dup.itemCode, e.target.value)}
                                                        className="block w-full rounded-md border-slate-300 py-1.5 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm bg-white"
                                                    >
                                                        <option value="Skip">Bỏ qua (Giữ nguyên cũ)</option>
                                                        <option value="Update">Cập nhật đè dữ liệu mới</option>
                                                        <option value="CreateNew">Tạo mới (Làm mới mã tự động)</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>

                <footer className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-medium">
                        Sản phẩm hợp lệ sẽ import: <span className="text-secondary font-bold">{products.filter((p: any) => p.isValid).length}</span> | Biến thể hợp lệ: <span className="text-secondary font-bold">{variants.filter((v: any) => v.isValid).length}</span>
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2 rounded-full font-bold text-slate-600 hover:bg-slate-200 transition-colors">Hủy</button>
                        <button onClick={handleCommit} className="px-8 py-2 rounded-full font-bold bg-primary text-white shadow-md transition-transform hover:scale-105 flex items-center gap-2">
                            Xác nhận &amp; Import
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}