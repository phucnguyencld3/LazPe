"use client";

import Link from "next/link";
import Image from "next/image";
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

const Github = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.35 6.5-1.5 6.5-7.07a4.6 4.6 0 0 0-1.3-3.2 4.6 4.6 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.6 4.6 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5.57 3.3 6.72 6.5 7.07a4.8 4.8 0 0 0-1 3.03V22"></path>
    <path d="M9 18c-4.51 2-5-2-7-2"></path>
  </svg>
);

const Twitter = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const Linkedin = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

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

  const projectInfo = {
    title: "Hệ Thống Bán Lẻ Trực Tuyến Sản Phẩm Dành Cho Trẻ Em",
    instructor: "Cô Võ Thị Hồng Đoan",
    group: "10",
    className: "SD20301"
  };

  const teamMembers = [
    {
      name: "Lê Tuấn Thanh",
      role: "Nhóm Trưởng",
      studentId: "PC09634",
      image: "/team/Thanh.jpg"
    },
    {
      name: "Nguyễn Huy Hoàng",
      role: "Thành Viên",
      studentId: "PC09851",
      image: "/team/Hoang.jpg"
    },
    {
      name: "Quách Trần Kim Bảo",
      role: "Thành Viên",
      studentId: "PC1010342",
      image: "/team/Bao.jpg"
    },
    {
      name: "Nguyễn Hoàng Phúc",
      role: "Thành Viên",
      studentId: "PC09637",
      image: "/team/Phuc.jpg"
    },
    {
      name: "Phạm Minh Đức",
      role: "Thành Viên",
      studentId: "PC08256",
      image: "/team/Duc.jpg"
    },
  ];

  return (
    <div className="bg-background text-on-background font-body-md">
      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg w-full space-y-xl">
        {/* Header Section */}
        <header className="mb-xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container rounded-full mb-md text-primary">
            <Sparkles className="w-8 h-8" />
          </div>
          <p className="font-label-md font-semibold uppercase tracking-widest text-primary mb-2">
            Về Chúng Tôi
          </p>
          <h1 className="font-headline-lg text-headline-lg md:text-display-lg font-bold text-on-background mb-4">
            Câu Chuyện của <span className="text-primary">LazPe</span>
          </h1>
          <p className="text-on-surface-variant font-body-lg max-w-2xl mx-auto leading-relaxed">
            Nơi mọi sản phẩm được chọn lọc kỹ càng để mang lại niềm vui cho bé và sự an tâm cho bạn.
          </p>
          <div className="mt-md mx-auto h-1 w-24 bg-primary-container rounded-full"></div>
        </header>

        {/* Mission Section */}
        <section className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-sm border border-surface-variant/50">
          <div className="grid md:grid-cols-2 gap-lg items-center">
            <div className="space-y-md">
              <h2 className="font-headline-md text-headline-md text-on-background">
                Tại Sao Chọn <span className="text-primary">LazPe</span>?
              </h2>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                LazPe được thành lập với một mục tiêu đơn giản: mang lại những sản phẩm chất lượng cao với giá cả hợp lý cho trẻ em. Chúng tôi tin rằng mọi bé yêu đều xứng đáng với những điều tốt nhất.
              </p>
              <ul className="space-y-sm">
                {[
                  "Hơn 10,000 sản phẩm được chọn lọc",
                  "Giá cạnh tranh nhất trên thị trường",
                  "Giao hàng nhanh chóng và an toàn",
                  "Hỗ trợ khách hàng 24/7",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-sm">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-on-surface-variant font-body-md">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-primary-container rounded-xl p-8 h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center text-on-primary">
                  <Heart className="w-10 h-10" />
                </div>
                <p className="text-on-primary-container font-headline-md">
                  Chăm chút từ những điều nhỏ nhất
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section>
          <div className="flex items-center gap-sm mb-md">
            <h2 className="font-headline-md text-headline-md text-on-background text-center w-full">Những Con Số Nói Lên Mọi Điều</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-surface-container-low rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                <div className="inline-flex bg-primary-container p-3 rounded-full mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="font-headline-md text-headline-md font-bold text-on-background">
                  {stat.number}
                </div>
                <p className="text-on-surface-variant font-label-md mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values Section */}
        <section>
          <div className="flex items-center gap-sm mb-md">
            <h2 className="font-headline-md text-headline-md text-on-background text-center w-full">Giá Trị Cốt Lõi</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-md">
            {values.map((value, idx) => (
              <div key={idx} className="bg-surface-container-lowest border border-surface-variant/50 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-headline-md font-bold text-on-background mb-2">
                  {value.title}
                </h3>
                <p className="text-on-surface-variant font-body-md leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section>
          <div className="flex items-center gap-sm mb-md">
            <h2 className="font-headline-md text-headline-md text-on-background text-center w-full">Vì Sao Khách Hàng Yêu Thích Chúng Tôi</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-md">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] border border-surface-variant/50 flex gap-4"
              >
                <div className="bg-primary-container rounded-lg p-3 flex-shrink-0 self-start">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-headline-md font-bold text-on-background mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-on-surface-variant font-body-md leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline Section */}
        <section className="bg-surface-container-low p-md md:p-xl rounded-xl">
          <div className="flex items-center gap-sm mb-lg">
            <h2 className="font-headline-md text-headline-md text-on-background text-center w-full">Hành Trình Của LazPe</h2>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-outline-variant/50"></div>
            <div className="space-y-md">
              {milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className={`flex gap-md ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className="flex-1 md:text-right">
                    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-variant/50">
                      <p className="text-primary font-label-md font-bold">
                        {milestone.year}
                      </p>
                      <h3 className="font-headline-md font-bold text-on-background mt-1">
                        {milestone.title}
                      </h3>
                      <p className="text-on-surface-variant font-body-md mt-2">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-4 h-4 bg-primary rounded-full mt-8 ring-4 ring-primary-container"></div>
                  </div>
                  <div className="flex-1 md:text-left"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section>
          <div className="text-center mb-lg">
            <h2 className="font-headline-md text-headline-md text-on-background mb-8">
              Đội Ngũ <span className="text-primary">Phát Triển</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-md">
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest rounded-xl p-6 text-center shadow-sm hover:-translate-y-1 transition-all border border-surface-variant/50 group"
              >
                <div className="relative mx-auto w-24 h-24 mb-4">
                  <div className="absolute inset-0 bg-primary-container rounded-full opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
                  <div className="relative flex items-center justify-center w-24 h-24 bg-surface-variant rounded-full text-on-surface-variant font-headline-lg shadow-md overflow-hidden">
                    <Image src={member.image} alt={member.name} fill className="object-cover" />
                  </div>
                </div>
                <h3 className="font-headline-md font-bold text-on-background mb-1">
                  {member.name} <span className="text-on-surface-variant font-normal">({member.studentId})</span>
                </h3>
                <p className="text-secondary font-label-md mb-4">{member.role}</p>
                <div className="flex items-center justify-center gap-3">
                  <a href="#" className="text-outline hover:text-primary transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-outline hover:text-primary transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-outline hover:text-primary transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <div className="bg-primary p-lg md:p-xl rounded-2xl text-center text-on-primary relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="font-headline-lg text-headline-lg font-bold mb-4">
              Sẵn Sàng Trải Nghiệm LazPe?
            </h2>
            <p className="font-body-lg text-white/90 max-w-2xl mx-auto mb-8">
              Khám phá bộ sưu tập sản phẩm đa dạng và tìm những gì bạn yêu thích ngay hôm nay.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-surface text-primary font-label-md rounded-full hover:scale-105 transition-transform shadow-md"
              >
                Khám Phá Sản Phẩm
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-surface-variant/30 text-white font-label-md rounded-full hover:bg-white/10 transition-colors"
              >
                Về Trang Chủ
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Info Section */}
        <section>
          <div className="flex items-center gap-sm mb-md">
            <h2 className="font-headline-md text-headline-md text-on-background text-center w-full">Liên Hệ Với Chúng Tôi</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-md">
            <div className="bg-surface-container-lowest rounded-xl p-6 text-center border border-surface-variant/50">
              <div className="bg-primary-container w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-headline-md font-bold text-on-background mb-1">Email</h3>
              <p className="text-on-surface-variant font-body-md">support@lazpe.com</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-6 text-center border border-surface-variant/50">
              <div className="bg-primary-container w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <h3 className="font-headline-md font-bold text-on-background mb-1">Điện Thoại</h3>
              <p className="text-on-surface-variant font-body-md">1800 5555</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-6 text-center border border-surface-variant/50">
              <div className="bg-primary-container w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="font-headline-md font-bold text-on-background mb-1">Địa Chỉ</h3>
              <p className="text-on-surface-variant font-body-md">123 Đường ABC, Thành phố</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
