"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { BabyTrackerData } from "@/lib/api";
import { whoWeightStandards } from "@/lib/whoStandards";

interface Props {
  profile: BabyTrackerData;
}

export default function GrowthChart({ profile }: Props) {
  const chartInfo = useMemo(() => {
    const isBoy = profile.gender?.toLowerCase() === "boy" || profile.gender?.toLowerCase() === "nam" || profile.gender?.toLowerCase() === "male";
    const standards = isBoy ? whoWeightStandards.boys : whoWeightStandards.girls;
    
    const dob = new Date(profile.dateOfBirth);
    const now = new Date();
    
    // Calculate current age in months
    let ageMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) ageMonths--;
    if (ageMonths < 0) ageMonths = 0;

    // We cap the chart at 60 months max. If baby is younger, we show up to their current age + 3 months.
    const maxMonths = Math.min(60, ageMonths + 3);

    // Map actual records to their respective months
    const actualWeights: Record<number, number> = {};
    
    // Map each growth record
    if (profile.growthRecords && profile.growthRecords.length > 0) {
      profile.growthRecords.forEach(record => {
        const recordDate = new Date(record.recordedDate);
        // Calculate exact month difference
        const diffTime = Math.abs(recordDate.getTime() - dob.getTime());
        const diffMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30.4375));
        
        if (diffMonths >= 0 && diffMonths <= 60) {
          // If there are multiple records in the same month, we just take the latest one
          actualWeights[diffMonths] = record.weightKg;
        }
      });
    } else if (profile.weightKg) {
      // If no historical records, the root weight is assumed to be at current age
      const currentMonth = Math.min(60, ageMonths);
      actualWeights[currentMonth] = profile.weightKg;
    }

    let latestActualWeight: number | null = null;
    let latestWhoWeight: number | null = null;
    let latestMonthIndex: number = -1;
    for (let i = maxMonths; i >= 0; i--) {
      if (actualWeights[i] !== undefined) {
        latestActualWeight = actualWeights[i];
        latestWhoWeight = standards[i];
        latestMonthIndex = i;
        break;
      }
    }

    // Generate final array for recharts
    const data = [];
    for (let i = 0; i <= maxMonths; i++) {
      let predictedWeight: number | null = null;
      let actual = actualWeights[i] !== undefined ? actualWeights[i] : null;

      // Predict for missing months using the latest known ratio
      if (actual === null && latestActualWeight !== null && latestWhoWeight !== null && latestWhoWeight > 0) {
          if (i > latestMonthIndex) {
              const ratio = latestActualWeight / latestWhoWeight;
              predictedWeight = Number((standards[i] * ratio).toFixed(2));
          }
      }

      data.push({
        monthLabel: `Tháng ${i}`,
        whoWeight: standards[i],
        actualWeight: actual,
        predictedWeight: predictedWeight
      });
    }

    // Connect the predicted line smoothly to the last actual point
    if (latestMonthIndex !== -1) {
      data[latestMonthIndex].predictedWeight = latestActualWeight;
    }

    return { data, latestActualWeight, latestWhoWeight };
  }, [profile]);

  const { data: chartData, latestActualWeight, latestWhoWeight } = chartInfo;

  const assessment = useMemo(() => {
    if (latestActualWeight === null || latestWhoWeight === null) return null;
    
    const ratio = latestActualWeight / latestWhoWeight;
    let title = "";
    let message = "";
    let colorClass = "";
    let icon = "";

    if (ratio > 1.2) {
      title = "Bé mũm mĩm quá đà rồi nè! 🧸";
      message = "Trộm vía bé hấp thu rất tốt, nhưng ba mẹ nên cân nhắc giảm một chút xíu khẩu phần ăn hoặc tham khảo ý kiến bác sĩ để bé phát triển cân đối hơn nha.";
      colorClass = "text-orange-600";
      icon = "warning";
    } else if (ratio > 1.1) {
      title = "Bé đang hơi mũm mĩm đáng yêu! 🐷";
      message = "Bé trộm vía ăn ngoan! Ba mẹ hãy duy trì chế độ dinh dưỡng đa dạng và khuyến khích bé vận động nhẹ nhàng nhé.";
      colorClass = "text-sky-600";
      icon = "sentiment_satisfied";
    } else if (ratio < 0.8) {
      title = "Bé đang hơi nhẹ cân rồi ba mẹ ơi! 🥺";
      message = "Bé cần được bồi bổ thêm. Ba mẹ nên tăng cường cữ bú, đồ ăn dặm hoặc đưa bé đến gặp chuyên gia dinh dưỡng để được tư vấn nhé!";
      colorClass = "text-rose-600";
      icon = "medical_information";
    } else if (ratio < 0.9) {
      title = "Bé nhà mình hơi mi nhon một xíu! 🐥";
      message = "Ba mẹ có thể cân nhắc tăng thêm chút đỉnh khẩu phần ăn, đổi sữa hoặc bổ sung dưỡng chất để bé bắt kịp đà tăng trưởng chuẩn nha.";
      colorClass = "text-indigo-600";
      icon = "info";
    } else {
      title = "Tuyệt vời! Bé phát triển rất chuẩn! 🎉";
      message = "Cân nặng của bé đang bám sát chuẩn y tế WHO. Ba mẹ đang chăm bé rất khéo, hãy tiếp tục phát huy nhé!";
      colorClass = "text-emerald-600";
      icon = "celebration";
    }

    return { title, message, colorClass, icon };
  }, [latestActualWeight, latestWhoWeight]);

  return (
    <div className="bg-slate-50/50 p-5 rounded-[14px] shadow-sm border border-slate-100/80 h-full flex flex-col">
      <h3 className="text-[15px] font-bold mb-4 text-slate-800 flex items-center gap-2">
        <span className="material-symbols-outlined text-indigo-500 text-lg">monitoring</span> 
        Biểu đồ Cân nặng (kg)
      </h3>
      <div className="h-72 w-full shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} interval="preserveStartEnd" minTickGap={30} />
            <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            <Line 
              type="monotone" 
              name="Cân nặng thực tế (kg)"
              dataKey="actualWeight" 
              stroke="#6366f1" 
              strokeWidth={3}
              connectNulls={true}
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              name="Dự đoán tiếp theo (kg)" 
              dataKey="predictedWeight" 
              stroke="#f59e0b" // amber-500
              strokeDasharray="4 4" 
              strokeWidth={2}
              connectNulls={true}
              dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} 
            />
            <Line 
              type="monotone" 
              name="Chuẩn WHO" 
              dataKey="whoWeight" 
              stroke="#94a3b8" 
              strokeDasharray="5 5" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>


      {assessment && (
        <div className="mt-auto p-4 rounded-[12px] border bg-white border-slate-200 flex gap-3 items-start">
          <span className={`material-symbols-outlined text-[24px] shrink-0 mt-0.5 ${assessment.colorClass}`}>{assessment.icon}</span>
          <div>
            <h4 className={`font-bold text-[14px] mb-1 ${assessment.colorClass}`}>{assessment.title}</h4>
            <p className="text-[13px] text-slate-600 leading-relaxed opacity-90">{assessment.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
