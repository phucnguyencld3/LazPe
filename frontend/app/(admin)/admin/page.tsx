const adminCards = [
  { label: "Doanh thu hôm nay", value: "12.8M" },
  { label: "Đơn hàng mới", value: "42" },
  { label: "Sản phẩm chờ duyệt", value: "8" },
  { label: "Người dùng hoạt động", value: "1,248" },
];

export default function AdminDashboardPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {adminCards.map((card) => (
          <article
            key={card.label}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20"
          >
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
              {card.value}
            </p>
          </article>
        ))}
      </div>
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
        Đây là khung admin riêng để phát triển dashboard, quản lý sản phẩm,
        đơn hàng và người dùng.
      </div>
    </section>
  );
}