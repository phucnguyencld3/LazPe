"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { downloadCategoryTemplate, validateCategoryImport, commitCategoryImport } from "@/lib/features/categories/categoryApi";
import CategoryImportResolutionModal from "@/components/admin/categories/CategoryImportResolutionModal";

export default function CategoryImportPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [previewData, setPreviewData] = useState<any>(null);
    const [showResolutionModal, setShowResolutionModal] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Đọc draft từ localStorage
    useEffect(() => {
        const saved = localStorage.getItem("lazpe_category_import_draft");
        if (saved) {
            try {
                setPreviewData(JSON.parse(saved));
            } catch (e) {
                console.error("Lỗi khi đọc bản nháp import:", e);
            }
        }
    }, []);

    // Lưu draft vào localStorage
    useEffect(() => {
        if (previewData) {
            localStorage.setItem("lazpe_category_import_draft", JSON.stringify(previewData));
        } else {
            localStorage.removeItem("lazpe_category_import_draft");
        }
    }, [previewData]);

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

    const handleDownloadTemplate = async () => {
        try {
            const blob = await downloadCategoryTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "CategoryImportTemplate.xlsx";
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
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
            const data = await validateCategoryImport(token, file);
            setPreviewData(data);
            toast.success("Đọc file thành công, vui lòng kiểm tra dữ liệu Preview.");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Đã xảy ra lỗi khi upload.");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusStyle = (isValid: boolean, hasDuplicate: boolean, hasWarning: boolean) => {
        if (hasDuplicate) return "bg-amber-100 text-amber-800";
        if (!isValid) return "bg-rose-600 text-white";
        if (hasWarning) return "bg-yellow-100 text-yellow-800";
        return "bg-green-100 text-green-800";
    };

    const getStatusLabel = (isValid: boolean, hasDuplicate: boolean, hasWarning: boolean) => {
        if (hasDuplicate) return "Trùng lặp";
        if (!isValid) return "Lỗi";
        if (hasWarning) return "Cảnh báo";
        return "Hợp lệ";
    };

    const proceedToCommit = async () => {
        if (!previewData) return;
        
        const realErrors = previewData.errors?.filter((e: any) => !e.isWarning) || [];
        if (realErrors.length > 0 || previewData.duplicates?.length > 0) {
            setShowResolutionModal(true);
        } else {
            commitData(previewData);
        }
    };

    const commitData = async (dataToCommit: any) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
            await commitCategoryImport(token, {
                categories: dataToCommit.categories,
                actionableDuplicates: dataToCommit.duplicates
            });
            toast.success("Import danh mục thành công!");
            localStorage.removeItem("lazpe_category_import_draft");
            router.push("/admin/categories");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Đã xảy ra lỗi khi lưu.");
        } finally {
            setIsLoading(false);
            setShowResolutionModal(false);
        }
    };

    return (
        <main className="w-full pb-20">
            <header className="mb-lg flex items-center justify-between">
                <div>
                    <h1 className="font-headline-md text-headline-md text-primary font-bold">Import Danh Mục</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant/70">Tải lên file Excel để thêm nhiều danh mục sản phẩm cùng lúc</p>
                </div>
                <div className="flex items-center gap-sm shrink-0">
                    <button
                        onClick={() => router.back()}
                        className="border border-secondary text-secondary px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer bg-white"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Quay lại
                    </button>
                    <button
                        onClick={handleDownloadTemplate}
                        className="bg-primary text-on-primary px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Tải File Excel Mẫu
                    </button>
                </div>
            </header>

            {!previewData && (
                <div className="bg-white p-8 rounded-[8px] shadow-sm border border-slate-100 flex flex-col items-center">
                    <p className="mb-4 text-center text-slate-600">
                        Tải file Excel mẫu để điền dữ liệu danh mục:
                        <button onClick={handleDownloadTemplate} className="ml-2 text-primary font-bold hover:underline">Download Template</button>
                    </p>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`w-full max-w-2xl h-64 border-2 border-dashed rounded-[8px] flex flex-col items-center justify-center transition-all ${isDragging ? "border-primary bg-primary-container/10" : "border-slate-300 bg-slate-50"} cursor-pointer`}
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
                <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden mt-6">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h2 className="font-bold text-slate-700 text-lg">Xem trước dữ liệu danh mục ({previewData.categories.length})</h2>
                    </div>

                    <div className="p-6 overflow-x-auto">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-100 bg-slate-50 text-slate-500 text-sm">
                                        <th className="p-4">Dòng</th>
                                        <th className="p-4">Tên danh mục</th>
                                        <th className="p-4">Danh mục cha</th>
                                        <th className="p-4">Thứ tự sắp xếp</th>
                                        <th className="p-4">Mô tả</th>
                                        <th className="p-4">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.categories.map((item: any, idx: number) => {
                                        const hasDuplicate = previewData.duplicates.some((d: any) => d.itemCode.toLowerCase() === item.categoryName.toLowerCase());
                                        const hasWarning = previewData.errors?.some((e: any) => e.row === item.excelRow && e.isWarning);
                                        
                                        return (
                                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-bold text-slate-400">{item.excelRow}</td>
                                                <td className="p-4 font-bold">{item.categoryName}</td>
                                                <td className="p-4">{item.parentCategoryName || <span className="text-slate-400 italic">Không có (Cấp gốc)</span>}</td>
                                                <td className="p-4">{item.sortOrder}</td>
                                                <td className="p-4 text-xs text-slate-500 max-w-[300px] truncate" title={item.description}>{item.description}</td>
                                                <td className="p-4">
                                                    <span className={`whitespace-nowrap px-3 py-1 rounded-[8px] text-xs font-bold ${getStatusStyle(item.isValid, hasDuplicate, hasWarning)}`}>
                                                        {getStatusLabel(item.isValid, hasDuplicate, hasWarning)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                        <button
                            onClick={() => setPreviewData(null)}
                            className="px-6 py-2 rounded-[8px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={proceedToCommit}
                            className={`px-8 py-2 rounded-[8px] font-bold text-white shadow-md transition-transform hover:scale-105 ${
                                (previewData.errors?.filter((e: any) => !e.isWarning).length > 0 || previewData.duplicates?.length > 0)
                                    ? "bg-amber-500 hover:bg-amber-600"
                                    : "bg-primary hover:bg-primary/90"
                            }`}
                        >
                            {(previewData.errors?.filter((e: any) => !e.isWarning).length > 0 || previewData.duplicates?.length > 0) ? "⚠ Cần xử lý Lỗi/Trùng lặp" : "Tiến hành Import"}
                        </button>
                    </div>
                </div>
            )}

            {showResolutionModal && previewData && (
                <CategoryImportResolutionModal 
                    previewData={previewData} 
                    onClose={() => setShowResolutionModal(false)}
                    onCommit={commitData}
                    onUpdatePreviewData={(updatedData) => setPreviewData(updatedData)}
                />
            )}
        </main>
    );
}
