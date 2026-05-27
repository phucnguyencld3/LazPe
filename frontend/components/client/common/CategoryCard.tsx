"use client";

import { Category } from "@/types";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface CategoryCardProps {
  category: Category;
  index?: number;
}

const bgColors = [
  "bg-blue-50 hover:bg-blue-100",
  "bg-rose-50 hover:bg-rose-100",
  "bg-emerald-50 hover:bg-emerald-100",
  "bg-amber-50 hover:bg-amber-100",
  "bg-purple-50 hover:bg-purple-100",
  "bg-cyan-50 hover:bg-cyan-100",
];

export default function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  const bgColor = bgColors[index % bgColors.length];

  return (
    <Link href={`/products?categoryId=${category.id}`}>
      <div
        className={`group rounded-2xl p-6 transition-all duration-300 cursor-pointer ${bgColor} shadow-sm hover:shadow-md`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-950 transition-colors">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
          <div className="text-2xl group-hover:scale-110 transition-transform">
            <Sparkles size={24} className="text-slate-600" />
          </div>
        </div>

        {/* Arrow Icon */}
        <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
          <span className="text-sm font-medium">Khám phá</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}
