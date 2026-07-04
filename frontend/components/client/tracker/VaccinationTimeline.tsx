"use client";

import React, { useMemo } from "react";

interface VaccinationRecord {
  vaccineName: string;
  administeredDate?: string;
  nextDueDate?: string;
  status: string;
  notes?: string;
}

interface Props {
  records: VaccinationRecord[];
  profile?: any;
}

export default function VaccinationTimeline({ records, profile }: Props) {
  const MANDATORY_VACCINES = useMemo(() => [
    { name: "Viêm gan B", time: "Trong 24 giờ đầu sau sinh", dueMonths: 0 },
    { name: "Lao (BCG)", time: "Trong 1 tháng đầu sau sinh", dueMonths: 1 },
    { name: "Bạch hầu, Ho gà, Uốn ván, Viêm gan B, Hib (5in1/6in1)", time: "2, 3, 4 tháng tuổi", dueMonths: 2 },
    { name: "Bại liệt (Uống / Tiêm)", time: "2, 3, 4 tháng tuổi", dueMonths: 2 },
    { name: "Sởi (Mũi 1)", time: "9 tháng tuổi", dueMonths: 9 },
    { name: "Viêm não Nhật Bản", time: "1 tuổi (12 tháng tuổi)", dueMonths: 12 },
    { name: "Sởi - Rubella (MR) & Bạch hầu, Ho gà, Uốn ván (DPT)", time: "18 tháng tuổi", dueMonths: 18 },
  ], []);

  const ageMonths = useMemo(() => {
    let age = 0;
    if (profile?.dateOfBirth) {
      const dob = new Date(profile.dateOfBirth);
      const now = new Date();
      age = (now.getFullYear() - dob.getFullYear()) * 12 + now.getMonth() - dob.getMonth();
      if (now.getDate() < dob.getDate()) age--;
      if (age < 0) age = 0;
    }
    return age;
  }, [profile]);

  const upcomingVaccines = useMemo(() => {
    const upcoming = MANDATORY_VACCINES.filter(v => v.dueMonths >= ageMonths);
    if (upcoming.length > 0) {
      const nextDue = upcoming[0].dueMonths;
      return upcoming.filter(v => v.dueMonths === nextDue);
    }
    return [];
  }, [ageMonths, MANDATORY_VACCINES]);

  return (
    <div className="p-5 md:p-6 h-full flex flex-col">
      <h3 className="text-[15px] font-bold mb-4 text-slate-800 flex items-center gap-2 shrink-0">
        <span className="material-symbols-outlined text-indigo-500 text-lg">vaccines</span>
        Lịch Tiêm Chủng
      </h3>

      {/* Reminder Banner */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-5 flex items-start gap-3 shrink-0">
        <span className="material-symbols-outlined text-indigo-500 shrink-0 mt-0.5">campaign</span>
        <div>
          <h4 className="text-[13px] font-bold text-indigo-900 mb-1">Nhắc nhở tiêm chủng (Bé {ageMonths} tháng tuổi)</h4>
          {upcomingVaccines.length > 0 ? (
            <>
              <p className="text-[12px] text-indigo-700/90 leading-relaxed mb-1">
                Giai đoạn sắp tới <b>({upcomingVaccines[0].time})</b>, bé cần lưu ý các mốc bắt buộc sau:
              </p>
              <ul className="list-disc pl-4 text-[12px] text-indigo-700/90 font-medium space-y-0.5">
                {upcomingVaccines.map((v, idx) => (
                  <li key={idx}>{v.name}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-[12px] text-indigo-700/90 leading-relaxed">
              Bé đã qua các mốc tiêm chủng cơ bản (18 tháng). Vui lòng tham khảo ý kiến bác sĩ cho các mũi nhắc lại!
            </p>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {records.length === 0 ? (
          <>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3 flex items-start gap-3">
              <span className="material-symbols-outlined text-slate-400 shrink-0">info</span>
              <div>
                <h4 className="text-[13px] font-bold text-slate-600 mb-1">Chưa có dữ liệu tiêm chủng</h4>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Bấm <b>"Thêm lịch tiêm"</b> để cập nhật. Danh sách Vắc-xin bắt buộc theo <a href="https://thuvienphapluat.vn/chinh-sach-phap-luat-moi/vn/ho-tro-phap-luat/chinh-sach-moi/65530/cac-loai-vaccine-bat-buoc-va-lich-tiem-cho-tre-em-tu-ngay-01-8-2024" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-slate-700">Thông tư 10/2024/TT-BYT</a>:
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {MANDATORY_VACCINES.map((v, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-slate-200 rounded-[10px] gap-2">
                  <span className="text-[13px] font-bold text-slate-700">{v.name}</span>
                  <span className="text-[11px] font-medium px-2 py-1 bg-slate-100 text-slate-500 rounded-md sm:shrink-0 text-center">{v.time}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {records.map((record, index) => (
              <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${record.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                  {record.status === 'Completed' ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-[12px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-[13px] text-slate-800">{record.vaccineName}</div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${record.status === 'Completed' ? 'bg-emerald-100/60 text-emerald-700' : 'bg-amber-100/60 text-amber-700'}`}>
                      {record.status === 'Completed' ? 'Đã tiêm' : 'Chờ tiêm'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {record.status === 'Completed' && record.administeredDate && (
                      <p>Ngày tiêm: {new Date(record.administeredDate).toLocaleDateString()}</p>
                    )}
                    {record.status === 'Pending' && record.nextDueDate && (
                      <p>Dự kiến: {new Date(record.nextDueDate).toLocaleDateString()}</p>
                    )}
                    {record.notes && <p className="mt-2 text-slate-400 italic">"{record.notes}"</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
