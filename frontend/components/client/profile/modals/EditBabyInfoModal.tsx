import React, { useState, useEffect } from "react";
import { UserProfile, BabyProfileDto, addBabyProfile, updateBabyProfile, deleteBabyProfile, updateUserProfile } from "@/lib/api";
import { toast } from "@/lib/toast";
import { validateBabyGrowth } from "@/lib/growthStandards";
import { Plus, Trash2, Edit3, Save, ArrowLeft, Calendar, User, Scale, Ruler, Heart, Palette, Baby } from "lucide-react";

interface EditBabyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

export function EditBabyInfoModal({
  isOpen,
  onClose,
  token,
  userProfile,
  onRefreshProfile
}: EditBabyInfoModalProps) {

  // CRUD mode: 'list' | 'add' | 'edit'
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingBaby, setEditingBaby] = useState<BabyProfileDto | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states for baby
  const [babyName, setBabyName] = useState("");
  const [babyGender, setBabyGender] = useState("Boy");
  const [babyDob, setBabyDob] = useState("");
  const [babyRelationship, setBabyRelationship] = useState("Con");
  const [babyWeight, setBabyWeight] = useState("");
  const [babyHeight, setBabyHeight] = useState("");
  const [babyColors, setBabyColors] = useState("");
  const [submittingBaby, setSubmittingBaby] = useState(false);

  useEffect(() => {

    setMode('list');
    setEditingBaby(null);
  }, [isOpen, userProfile]);

  if (!isOpen || !userProfile || !token) return null;


  const handleOpenAdd = () => {
    setBabyName("");
    setBabyGender("Boy");
    setBabyDob("");
    setBabyRelationship("Con");
    setBabyWeight("");
    setBabyHeight("");
    setBabyColors("");
    setMode('add');
  };

  const handleOpenEdit = (baby: BabyProfileDto) => {
    setEditingBaby(baby);
    setBabyName(baby.name);
    setBabyGender(baby.gender || "Boy");
    setBabyDob(baby.dateOfBirth ? baby.dateOfBirth.split("T")[0] : "");
    setBabyRelationship(baby.relationship || "Con");
    setBabyWeight(baby.weightKg ? baby.weightKg.toString() : "");
    setBabyHeight(baby.heightCm ? baby.heightCm.toString() : "");
    setBabyColors(baby.favoriteColors || "");
    setMode('edit');
  };

  const handleBabySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyName.trim()) {
      toast.error("Tên của bé không được để trống.");
      return;
    }
    if (!babyDob) {
      toast.error("Ngày sinh của bé là bắt buộc.");
      return;
    }

    const ageInMonths = Math.floor((new Date().getTime() - new Date(babyDob).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const parsedWeight = babyWeight ? parseFloat(babyWeight) : null;
    const parsedHeight = babyHeight ? parseFloat(babyHeight) : null;

    const validation = validateBabyGrowth(babyGender, ageInMonths, parsedWeight, parsedHeight);
    if (!validation.isValid) {
      toast.error(validation.message || "Thông tin nhập không hợp lệ.");
      return;
    }

    setSubmittingBaby(true);
    try {
      const payload = {
        name: babyName,
        relationship: babyRelationship || undefined,
        gender: babyGender || undefined,
        dateOfBirth: new Date(babyDob).toISOString(),
        weightKg: babyWeight ? parseFloat(babyWeight) : undefined,
        heightCm: babyHeight ? parseFloat(babyHeight) : undefined,
        favoriteColors: babyColors || undefined
      };

      if (mode === 'add') {
        const res = await addBabyProfile(token, payload);
        if (res.success) {
          toast.success("Thêm hồ sơ bé thành công!");
          setMode('list');
          onRefreshProfile();
        } else {
          toast.error(res.message || "Lỗi khi thêm bé.");
        }
      } else if (mode === 'edit' && editingBaby) {
        const res = await updateBabyProfile(token, editingBaby.babyProfileID, payload);
        if (res.success) {
          toast.success("Cập nhật thông tin bé thành công!");
          setMode('list');
          onRefreshProfile();
        } else {
          toast.error(res.message || "Lỗi khi cập nhật.");
        }
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi mạng.");
    } finally {
      setSubmittingBaby(false);
    }
  };

  const confirmDeleteBaby = (id: number) => {
    setDeleteConfirmId(id);
  };

  const executeDeleteBaby = async () => {
    if (deleteConfirmId === null) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      const res = await deleteBabyProfile(token, id);
      if (res.success) {
        toast.success("Đã xóa hồ sơ bé.");
        onRefreshProfile();
      } else {
        toast.error(res.message || "Lỗi khi xóa hồ sơ.");
      }
    } catch (e) {
      toast.error("Đã xảy ra lỗi mạng.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-[500px] flex flex-col bg-white rounded-[5px] shadow-2xl overflow-hidden border border-slate-100/80 max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-[16px] text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-[22px] font-bold">child_care</span>
            {mode === 'list' && "Thiết lập thông tin Bé & Sở thích"}
            {mode === 'add' && "Thêm hồ sơ Bé mới"}
            {mode === 'edit' && `Chỉnh sửa hồ sơ bé ${editingBaby?.name}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 p-1.5 rounded-full border border-slate-100 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 flex-1 space-y-6">
          {mode === 'list' ? (
            <>
              {/* Babies List Section */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Danh sách các bé</h4>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="text-[12px] text-primary font-bold hover:text-rose-600 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 py-1.5 px-3 rounded-[5px] border border-rose-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm bé
                  </button>
                </div>

                {!userProfile.babyProfiles || userProfile.babyProfiles.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-[5px] border border-dashed border-slate-200">
                    <Baby className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-[12px] text-slate-400 font-medium">Chưa có thông tin bé nào. Mẹ hãy thêm bé nhé!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {userProfile.babyProfiles.map((baby) => (
                      <div
                        key={baby.babyProfileID}
                        className="flex justify-between items-center p-3.5 bg-slate-50 rounded-[5px] border border-slate-100/60 hover:bg-slate-100/40 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-[13px] text-slate-800 flex items-center gap-2">
                            {baby.name}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              baby.gender === "Boy" || baby.gender === "Male" || baby.gender === "Nam"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-pink-100 text-pink-700"
                            }`}>
                              {baby.gender === "Boy" || baby.gender === "Male" || baby.gender === "Nam" ? "Bé trai" : "Bé gái"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-semibold mt-1">
                            {baby.relationship && `${baby.relationship} • `}
                            {baby.dateOfBirth ? new Date(baby.dateOfBirth).toLocaleDateString("vi-VN") : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(baby)}
                            className="p-2 text-slate-600 hover:text-primary hover:bg-white rounded-[5px] border border-transparent hover:border-slate-100 transition-all bg-transparent"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDeleteBaby(baby.babyProfileID)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[5px] transition-all"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Add or Edit Baby Form */
            <form onSubmit={handleBabySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-[12px] text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Tên của bé <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="Ví dụ: Bé Bin, Kem, Min..."
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-[12px] text-slate-700">Giới tính của bé</label>
                  <select
                    value={babyGender}
                    onChange={(e) => setBabyGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
                  >
                    <option value="Boy">Bé trai (Boy)</option>
                    <option value="Girl">Bé gái (Girl)</option>
                    <option value="Secret">Bí mật (Secret)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[12px] text-slate-700">Mối quan hệ</label>
                  <select
                    value={babyRelationship}
                    onChange={(e) => setBabyRelationship(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
                  >
                    <option value="Con">Mẹ (Con)</option>
                    <option value="Bố">Bố</option>
                    <option value="Cháu">Ông bà / Họ hàng (Cháu)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[12px] text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày sinh của bé <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={babyDob}
                  onChange={(e) => setBabyDob(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-[12px] text-slate-700 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-slate-400" /> Cân nặng (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={babyWeight}
                    onChange={(e) => setBabyWeight(e.target.value)}
                    placeholder="Ví dụ: 10.5"
                    className="w-full px-3.5 py-2.5 rounded-[5px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[12px] text-slate-700 flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5 text-slate-400" /> Chiều cao (cm)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="200"
                    value={babyHeight}
                    onChange={(e) => setBabyHeight(e.target.value)}
                    placeholder="Ví dụ: 80"
                    className="w-full px-3.5 py-2.5 rounded-[5px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[12px] text-slate-700 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-slate-400" /> Màu sắc bé thích
                </label>
                <input
                  type="text"
                  value={babyColors}
                  onChange={(e) => setBabyColors(e.target.value)}
                  placeholder="Màu yêu thích của bé (Đỏ, Xanh, Vàng...)"
                  className="w-full px-3.5 py-2.5 rounded-[5px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-5 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="flex-1 py-2.5 border border-slate-200 rounded-[5px] font-bold text-slate-600 hover:bg-slate-50 transition-colors text-[13px] flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
                <button
                  type="submit"
                  disabled={submittingBaby}
                  className="flex-1 py-2.5 bg-primary text-white rounded-[5px] font-bold hover:bg-primary/95 transition-all shadow-md shadow-rose-500/15 hover:shadow-rose-500/20 text-[13px] active:scale-95 disabled:opacity-50"
                >
                  {submittingBaby ? "Đang xử lý..." : mode === 'add' ? "Thêm bé" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer (for list mode only) */}
        {mode === 'list' && (
          <div className="px-6 py-4.5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 bg-slate-800 text-white rounded-[5px] font-bold hover:bg-slate-700 transition-colors text-[12px] shadow-sm active:scale-95"
            >
              Hoàn tất
            </button>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-[400px] flex flex-col bg-white rounded-[5px] shadow-2xl overflow-hidden border border-slate-100/80">
            <div className="p-6">
              <h3 className="font-bold text-[16px] text-slate-800 mb-2">LazPe xác nhận</h3>
              <p className="text-[14px] text-slate-600 mb-6">Mẹ có chắc chắn muốn xóa thông tin của bé này không?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-[5px] text-[14px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Huỷ
                </button>
                <button
                  onClick={executeDeleteBaby}
                  className="px-4 py-2 rounded-[5px] text-[14px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
