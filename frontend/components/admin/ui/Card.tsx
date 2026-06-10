import React, { ReactNode } from "react";

interface CardProps {
  children?: ReactNode;
  title?: string;
  headerAction?: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  headerAction,
  className = "",
}) => {
  return (
    <div className={`overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] shadow-theme-xs ${className}`}>
      {(title || headerAction) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-white/[0.05]">
          {title && (
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              {title}
            </h3>
          )}
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor?: string;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconBgColor = "bg-primary-container/20 text-primary",
  trend,
  trendType = "neutral",
  className = "",
}) => {
  const trendBadgeColor = {
    up: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
    down: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
    neutral: "bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400",
  };

  return (
    <div className={`bg-white p-6 rounded-[2rem] shadow-theme-xs border border-gray-100 dark:border-white/[0.05] dark:bg-white/[0.03] flex flex-col gap-4 hover:shadow-theme-md transition-shadow duration-300 ${className}`}>
      <div className="flex justify-between items-start">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBgColor}`}>
          {icon}
        </div>
        {trend && (
          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${trendBadgeColor[trendType]}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800 dark:text-white/90 mt-1">{value}</h3>
      </div>
    </div>
  );
};
