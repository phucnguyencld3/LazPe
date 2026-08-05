"use client";

import React, { useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { createBrand, CreateBrandPayload } from "@/lib/features/brands/brandApi";

function CreateBrandForm() {
  const router = useRouter();

  // Loaders
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form Fields
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [status, setStatus] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedExtensions.includes(file.type)) {
      toast.warning("Chỉ hỗ trợ file ảnh JPG, PNG, GIF, WebP");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warning("Kích thước ảnh không được vượt quá 10MB");
      return;
    }

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "polystation/brands");

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const res = await fetch(`${API_URL}/Upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Lỗi khi tải ảnh lên máy chủ");
      }

      const data = await res.json();
      if (data.success && data.url) {
        setLogo(data.url);
        toast.success("Tải ảnh lên thành công");
      } else {
        throw new Error(data.message || "Tải ảnh thất bại");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Lỗi tải ảnh");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeLogo = () => {
    setLogo("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brandName.trim()) {
      toast.warning("Vui lòng nhập tên thương hiệu.");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setSaving(true);
      const payload: CreateBrandPayload = {
        supplierName: brandName.trim(),
        description: description.trim() || undefined,
        logo: logo || undefined,
        status: status
      };

      const res = await createBrand(token, payload);
      if (res.success) {
        toast.success("Thêm thương hiệu thành công!");
        router.push("/admin/brands");
      } else {
        toast.error(res.message || "Không thể thêm thương hiệu.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đã xảy ra lỗi khi thêm thương hiệu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full pb-32 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-slate-400 mb-6 font-bold text-xs">
        <span
          className="hover:text-primary transition-colors cursor-pointer"
          onClick={() => router.push("/admin/brands")}
        >
          Thương hiệu
        </span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary">Thêm mới</span>
      </nav>

      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/admin/brands")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95"
          title="Quay lại danh sách"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div>
          <h2 className="font-headline-md text-headline-md text-primary font-bold">Thêm thương hiệu mới</h2>
          <p className="text-slate-500 text-xs mt-1">Tạo một thương hiệu mới trong hệ thống.</p>
        </div>
      </header>

      {/* Form Container */}
      <div className="w-full bg-white rounded-[8px] p-8 border border-slate-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Tên thương hiệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="Nhập tên thương hiệu..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Mô tả thương hiệu
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt về thương hiệu..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[8px]">
                <div>
                  <p className="text-xs font-bold text-slate-800">Trạng thái hoạt động</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Cho phép hiển thị & lọc thương hiệu khi mua hàng</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status}
                    onChange={e => setStatus(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <div className="space-y-6">
              {/* Logo upload & preview */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Logo thương hiệu
                </label>

                {logo ? (
                  <div className="relative group rounded-[8px] overflow-hidden border border-slate-200 bg-slate-50 h-40 flex items-center justify-center">
                    <img
                      src={logo}
                      alt="Brand logo preview"
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-full bg-white text-slate-800 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md"
                        title="Thay đổi ảnh"
                      >
                        <span className="material-symbols-outlined text-base">cached</span>
                      </button>
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="p-2.5 rounded-full bg-rose-500 text-white hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md"
                        title="Xóa ảnh"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploadingLogo && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-slate-200 rounded-[8px] hover:border-primary/50 bg-slate-50/50 hover:bg-slate-50 transition-all p-6 flex flex-col items-center justify-center gap-2 cursor-pointer h-40 ${uploadingLogo ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                  >
                    {uploadingLogo ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                    ) : (
                      <span className="material-symbols-outlined text-slate-400 text-3xl">
                        upload_file
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-500">
                      {uploadingLogo ? "Đang tải lên..." : "Tải logo từ máy tính"}
                    </span>
                    <span className="text-[10px] text-slate-400 text-center">Chấp nhận JPG, PNG, GIF, WebP<br/>(tối đa 10MB)</span>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                  disabled={uploadingLogo}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6 border-t border-slate-50 mt-8">
            <button
              type="button"
              onClick={() => router.push("/admin/brands")}
              className="flex-1 py-3 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs cursor-pointer text-center"
              disabled={saving}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Tạo thương hiệu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateBrandPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <CreateBrandForm />
    </Suspense>
  );
}
