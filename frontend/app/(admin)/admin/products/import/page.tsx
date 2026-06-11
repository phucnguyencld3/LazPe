"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import ImportResolutionModal from "@/components/admin/products/ImportResolutionModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export default function ImportPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [previewData, setPreviewData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"products" | "variants">("products");
    const [showResolutionModal, setShowResolutionModal] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
            setFile(droppedFile);
        } else {
            toast.error("Vui lòng tải lên file Excel (.xlsx, .xls)");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const downloadTemplate = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/ProductImport/template`);
            if (!res.ok) {
                toast.error("Không thể tải file mẫu. Kiểm tra lại kết nối backend.");
                return;
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "ProductImportTemplate.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi kết nối khi tải file mẫu.");
        }
    };

    const handleValidate = async () => {
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/ProductImport/validate`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const text = await res.text();
                toast.error(text || "Lỗi khi validate file.");
                return;
            }

            const data = await res.json();
            setPreviewData(data);
            toast.success("Đọc file thành công, vui lòng kiểm tra dữ liệu Preview.");
        } catch (err) {
            console.error(err);
            toast.error("Đã xảy ra lỗi khi upload.");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusStyle = (isValid: boolean, hasDuplicate: boolean) => {
        if (hasDuplicate) return "bg-amber-100 text-amber-800";
        if (!isValid) return "bg-rose-600 text-white";
        return "bg-green-100 text-green-800";
    };

    const getStatusLabel = (isValid: boolean, hasDuplicate: boolean) => {
        if (hasDuplicate) return "Trùng lặp";
        if (!isValid) return "Lỗi";
        return "Hợp lệ";
    };

    const proceedToCommit = async () => {
        if (!previewData) return;
        if (previewData.errors?.length > 0 || previewData.duplicates?.length > 0) {
            setShowResolutionModal(true);
        } else {
            // Commit immediately
            commitData(previewData);
        }
    };

    const commitData = async (dataToCommit: any) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/ProductImport/commit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    products: dataToCommit.products,
                    variants: dataToCommit.variants,
                    actionableDuplicates: dataToCommit.duplicates
                })
            });

            if (res.ok) {
                toast.success("Import thành công!");
                router.push("/admin/products");
            } else {
                const text = await res.text();
                toast.error(text || "Lỗi khi commit.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Đã xảy ra lỗi khi lưu.");
        } finally {
            setIsLoading(false);
            setShowResolutionModal(false);
        }
    };

    return (
        <main className="w-full pb-20">
            <header className="mb-lg flex items-center justify-between">
                <div>
                    <button onClick={() => router.back()} className="text-primary flex items-center gap-xs font-bold text-sm mb-2 hover:underline">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Quay lại
                    </button>
                    <h1 className="font-headline-md text-headline-md text-primary font-bold">Import Sản Phẩm</h1>
                </div>
            </header>

            {!previewData && (
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center">
                    <p className="mb-4 text-center text-slate-600">
                        Tải file Excel mẫu để điền dữ liệu:
                        <button onClick={downloadTemplate} className="ml-2 text-primary font-bold hover:underline">Download Template</button>
                    </p>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`w-full max-w-2xl h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${isDragging ? "border-primary bg-primary-container/10" : "border-slate-300 bg-slate-50"} cursor-pointer`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">upload_file</span>
                        {file ? (
                            <div className="text-center">
                                <p className="font-bold text-primary text-xl">{file.name}</p>
                                <p className="text-sm text-slate-500 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="font-bold text-slate-600 text-xl">Kéo thả file vào đây hoặc nhấn để chọn</p>
                                <p className="text-sm text-slate-400 mt-2">Hỗ trợ Excel (.xlsx, .xls)</p>
                            </div>
                        )}
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx, .xls" />
                    </div>

                    <button
                        disabled={!file || isLoading}
                        onClick={handleValidate}
                        className="mt-8 bg-primary disabled:bg-slate-300 disabled:cursor-not-allowed text-on-primary px-xl py-3 rounded-full font-bold shadow-md hover:scale-105 transition-all text-lg flex items-center gap-2"
                    >
                        {isLoading && <span className="material-symbols-outlined animate-spin hidden">sync</span>}
                        Bắt đầu đọc file (Preview)
                    </button>
                </div>
            )}

            {previewData && (
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mt-6">
                    <div className="flex border-b border-slate-200">
                        <button
                            className={`flex-1 py-4 font-bold text-lg transition-colors ${activeTab === "products" ? "border-b-4 border-primary text-primary" : "text-slate-500 hover:bg-slate-50"}`}
                            onClick={() => setActiveTab("products")}
                        >
                            Sản phẩm ({previewData.products.length})
                        </button>
                        <button
                            className={`flex-1 py-4 font-bold text-lg transition-colors ${activeTab === "variants" ? "border-b-4 border-primary text-primary" : "text-slate-500 hover:bg-slate-50"}`}
                            onClick={() => setActiveTab("variants")}
                        >
                            Biến thể ({previewData.variants.length})
                        </button>
                    </div>

                    <div className="p-6 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-100 bg-slate-50 text-slate-500 text-sm">
                                    <th className="p-4">Dòng</th>
                                    {activeTab === "products" ? (
                                        <>
                                            <th className="p-4">Mã SP</th>
                                            <th className="p-4">Tên SP</th>
                                            <th className="p-4">Danh mục</th>
                                            <th className="p-4">Nhà cung cấp</th>
                                            <th className="p-4">Giá cơ bản</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-4">Mã SP</th>
                                            <th className="p-4">SKU</th>
                                            <th className="p-4">Phân loại 1</th>
                                            <th className="p-4">Phân loại 2</th>
                                            <th className="p-4">Giá</th>
                                            <th className="p-4">Tồn kho</th>
                                        </>
                                    )}
                                    <th className="p-4">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeTab === "products" ? previewData.products : previewData.variants).map((item: any, idx: number) => {
                                    const codeToCheck = activeTab === "products" ? item.productCode : item.sku;
                                    const hasDuplicate = previewData.duplicates.some((d: any) => d.sheet === (activeTab === "products" ? "Products" : "Variants") && d.itemCode === codeToCheck);
                                    
                                    return (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-bold text-slate-400">{item.excelRow}</td>
                                            {activeTab === "products" ? (
                                                <>
                                                    <td className="p-4 font-bold">{item.productCode}</td>
                                                    <td className="p-4">{item.productName}</td>
                                                    <td className="p-4">{item.categoryName}</td>
                                                    <td className="p-4">{item.supplierName}</td>
                                                    <td className="p-4">{item.basePrice}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="p-4 font-bold text-slate-500">{item.productCode}</td>
                                                    <td className="p-4 font-bold">{item.sku}</td>
                                                    <td className="p-4">{item.option1Value}</td>
                                                    <td className="p-4">{item.option2Value}</td>
                                                    <td className="p-4">{item.price}</td>
                                                    <td className="p-4">{item.stock}</td>
                                                </>
                                            )}
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(item.isValid, hasDuplicate)}`}>
                                                    {getStatusLabel(item.isValid, hasDuplicate)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                        <button
                            onClick={() => setPreviewData(null)}
                            className="px-6 py-2 rounded-full font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={proceedToCommit}
                            className={`px-8 py-2 rounded-full font-bold text-white shadow-md transition-transform hover:scale-105 ${
                                previewData.errors?.length > 0 || previewData.duplicates?.length > 0
                                    ? "bg-amber-500 hover:bg-amber-600"
                                    : "bg-primary hover:bg-primary/90"
                            }`}
                        >
                            {(previewData.errors?.length > 0 || previewData.duplicates?.length > 0) ? "⚠ Cần xử lý Lỗi/Trùng lặp" : "Tiến hành Import"}
                        </button>
                    </div>
                </div>
            )}

            {showResolutionModal && previewData && (
                <ImportResolutionModal 
                    previewData={previewData} 
                    onClose={() => setShowResolutionModal(false)}
                    onCommit={commitData}
                />
            )}
        </main>
    );
}