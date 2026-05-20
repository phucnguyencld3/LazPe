"use client";

import Link from "next/link";
import {
  Heart,
  Target,
  Sparkles,
  Users,
  Zap,
  Shield,
  Award,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

export default function AboutUsPage() {
  const values = [
    {
      icon: Heart,
      title: "Chất Lượng",
      description:
        "Chúng tôi cam kết cung cấp những sản phẩm chất lượng cao nhất cho khách hàng",
    },
    {
      icon: Target,
      title: "Tâm Sự",
      description:
        "Lắng nghe và hiểu nhu cầu của từng khách hàng để phục vụ tốt hơn",
    },
    {
      icon: Sparkles,
      title: "Sáng Tạo",
      description:
        "Không ngừng đổi mới và cải tiến để mang lại trải nghiệm tốt nhất",
    },
    {
      icon: Users,
      title: "Cộng Đồng",
      description:
        "Xây dựng một cộng đồng khách hàng thân thiết và tin cậy lâu dài",
    },
  ];

  const stats = [
    {
      icon: Users,
      number: "50K+",
      label: "Khách Hàng",
    },
    {
      icon: TrendingUp,
      number: "10K+",
      label: "Sản Phẩm",
    },
    {
      icon: Award,
      number: "100%",
      label: "Hài Lòng",
    },
    {
      icon: Zap,
      number: "24/7",
      label: "Hỗ Trợ",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "An Toàn Thanh Toán",
      description: "Giao dịch được bảo mật tối đa, bảo vệ thông tin khách hàng",
    },
    {
      icon: TrendingUp,
      title: "Giá Cạnh Tranh",
      description: "Luôn cố gắng cung cấp giá tốt nhất trên thị trường",
    },
    {
      icon: Zap,
      title: "Giao Hàng Nhanh",
      description: "Vận chuyển nhanh chóng đến tay khách hàng trong thời gian sớm nhất",
    },
    {
      icon: Heart,
      title: "Dịch Vụ Chăm Sóc",
      description:
        "Đội ngũ hỗ trợ khách hàng nhiệt tình, luôn sẵn sàng giúp đỡ",
    },
  ];

  const milestones = [
    {
      year: "2023",
      title: "Thành Lập LazPe",
      description: "Khởi đầu với mục tiêu mang lại những sản phẩm tốt nhất",
    },
    {
      year: "2024",
      title: "Mở Rộng Kho Hàng",
      description: "Phát triển thêm 5000+ sản phẩm phục vụ nhu cầu đa dạng",
    },
    {
      year: "2025",
      title: "Đạt 50K Khách Hàng",
      description: "Vượt qua cột mốc 50,000 khách hàng tin tưởng",
    },
    {
      year: "2026",
      title: "Nâng Cấp Hệ Thống",
      description: "Ra mắt nền tảng mới với công nghệ hiện đại hơn",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 via-rose-50 to-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
              Về Chúng Tôi
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">
              Câu Chuyện của <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">LazPe</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Nơi nơi mọi sản phẩm được chọn lọc kỹ càng để mang lại hạnh phúc cho bạn
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-slate-900">
                Tại Sao Chọn <span className="text-rose-600">LazPe</span>?
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                LazPe được thành lập với một mục tiêu đơn giản: mang lại những
                sản phẩm chất lượng cao với giá cả hợp lý cho mọi người. Chúng
                tôi tin rằng mọi khách hàng đều xứng đáng nhận được dịch vụ
                tốt nhất.
              </p>
              <ul className="space-y-3">
                {[
                  "Hơn 10,000 sản phẩm được chọn lọc",
                  "Giá cạnh tranh nhất trên thị trường",
                  "Giao hàng nhanh chóng và an toàn",
                  "Hỗ trợ khách hàng 24/7",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <p className="text-slate-600">
                  Mỗi sản phẩm là một lựa chọn cẩn thận
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Những Con Số Nói Lên Mọi Điều
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <stat.icon className="w-8 h-8 text-rose-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-slate-900">
                    {stat.number}
                  </div>
                  <p className="text-slate-600 text-sm mt-2">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Các Giá Trị Cốt Lõi Của Chúng Tôi
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-6 hover:border-rose-300 hover:shadow-lg transition-all">
                <value.icon className="w-10 h-10 text-rose-600 mb-4" />
                <h3 className="font-bold text-lg text-slate-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Tại Sao Khách Hàng Yêu Thích Chúng Tôi
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-100"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-rose-100 rounded-lg p-3 flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Hành Trình Của LazPe
          </h2>
          <div className="relative">
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-rose-200 to-pink-200"></div>

            <div className="space-y-8">
              {milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className={`flex gap-8 ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className="flex-1 md:text-right">
                    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                      <p className="text-rose-600 font-bold text-sm">
                        {milestone.year}
                      </p>
                      <h3 className="text-xl font-bold text-slate-900 mt-2">
                        {milestone.title}
                      </h3>
                      <p className="text-slate-600 mt-2">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-4 h-4 bg-rose-600 rounded-full mt-8"></div>
                  </div>
                  <div className="flex-1 md:text-left"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-600 to-pink-600">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl font-bold text-white">
            Sẵn Sàng Trải Nghiệm LazPe?
          </h2>
          <p className="text-lg text-rose-100">
            Khám phá bộ sưu tập sản phẩm đa dạng và tìm những gì bạn yêu thích
            ngay hôm nay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-rose-600 font-semibold rounded-lg hover:bg-rose-50 transition-colors"
            >
              Khám Phá Sản Phẩm
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Liên Hệ Với Chúng Tôi
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-slate-100">
              <div className="bg-rose-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-rose-600 text-xl">📧</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Email</h3>
              <p className="text-slate-600">support@lazpe.com</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-slate-100">
              <div className="bg-rose-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-rose-600 text-xl">📱</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Điện Thoại</h3>
              <p className="text-slate-600">1800 5555</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-slate-100">
              <div className="bg-rose-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-rose-600 text-xl">📍</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Địa Chỉ</h3>
              <p className="text-slate-600">123 Đường ABC, Thành phố</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
