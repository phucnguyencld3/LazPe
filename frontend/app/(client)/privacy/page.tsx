'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="bg-background text-on-background font-body-md">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg w-full">
        {/* Content */}
        <div className="w-full">
          {/* Header */}
          <header className="mb-xl text-center md:text-left">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container rounded-full mb-md text-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="font-headline-lg text-headline-lg md:text-display-lg font-bold text-on-background mb-4">
              Chính sách bảo mật
            </h1>
            <p className="text-on-surface-variant font-body-lg max-w-2xl leading-relaxed">
              Tại LazPe, chúng tôi hiểu rằng sự an toàn và riêng tư của bé là ưu tiên hàng đầu. Cam kết của chúng tôi là bảo vệ thông tin cá nhân của bạn một cách tuyệt đối và minh bạch nhất.
            </p>
            <div className="mt-md h-1 w-24 bg-primary-container rounded-full"></div>
          </header>

          <div className="space-y-xl">
            {/* Section 1 */}
            <section className="scroll-mt-32" id="collection">
              <div className="flex items-center gap-sm mb-md">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-secondary font-bold">
                  1
                </span>
                <h2 className="font-headline-md text-headline-md text-on-background">Thu thập thông tin</h2>
              </div>
              <div className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-surface-variant/50">
                <p className="mb-md font-body-md text-on-surface-variant leading-relaxed">
                  Để mang lại trải nghiệm mua sắm đồ chơi và thời trang trẻ em tốt nhất, chúng tôi thu thập các loại thông tin sau:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <li className="flex items-start gap-sm">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.2L4.8 12m-1.4 1.4L9 19 21 7" />
                    </svg>
                    <span className="text-on-surface-variant">
                      Thông tin liên hệ: Tên, email, số điện thoại, địa chỉ giao hàng.
                    </span>
                  </li>
                  <li className="flex items-start gap-sm">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.2L4.8 12m-1.4 1.4L9 19 21 7" />
                    </svg>
                    <span className="text-on-surface-variant">
                      Thông tin tài khoản: Tên đăng nhập và lịch sử mua hàng.
                    </span>
                  </li>
                  <li className="flex items-start gap-sm">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.2L4.8 12m-1.4 1.4L9 19 21 7" />
                    </svg>
                    <span className="text-on-surface-variant">
                      Thông tin trẻ (tùy chọn): Ngày sinh, giới tính để chúng tôi có thể đề xuất quà tặng phù hợp.
                    </span>
                  </li>
                  <li className="flex items-start gap-sm">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.2L4.8 12m-1.4 1.4L9 19 21 7" />
                    </svg>
                    <span className="text-on-surface-variant">
                      Dữ liệu kỹ thuật: Địa chỉ IP, loại trình duyệt để cải thiện tốc độ trang web.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section className="scroll-mt-32" id="usage">
              <div className="flex items-center gap-sm mb-md">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-secondary font-bold">
                  2
                </span>
                <h2 className="font-headline-md text-headline-md text-on-background">Sử dụng thông tin</h2>
              </div>
              <div className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-surface-variant/50">
                <p className="mb-md font-body-md text-on-surface-variant leading-relaxed">
                  Thông tin của bạn được sử dụng một cách có trách nhiệm nhằm:
                </p>
                <div className="space-y-md">
                  <div className="flex items-center gap-md p-md bg-background rounded-lg border border-primary-container/20">
                    <svg className="w-7 h-7 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <p className="text-on-surface-variant font-body-md">
                      Xử lý đơn hàng và giao những món quà tuyệt vời nhất đến tận tay bạn.
                    </p>
                  </div>
                  <div className="flex items-center gap-md p-md bg-background rounded-lg border border-primary-container/20">
                    <svg className="w-7 h-7 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-on-surface-variant font-body-md">
                      Gửi các chương trình ưu đãi độc quyền dành cho mẹ và bé.
                    </p>
                  </div>
                  <div className="flex items-center gap-md p-md bg-background rounded-lg border border-primary-container/20">
                    <svg className="w-7 h-7 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-on-surface-variant font-body-md">
                      Hỗ trợ khách hàng nhanh chóng khi có thắc mắc về sản phẩm hoặc dịch vụ.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="scroll-mt-32" id="security">
              <div className="flex items-center gap-sm mb-md">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-secondary font-bold">
                  3
                </span>
                <h2 className="font-headline-md text-headline-md text-on-background">Bảo mật dữ liệu</h2>
              </div>
              <div className="relative overflow-hidden bg-primary text-on-primary p-md md:p-xl rounded-xl shadow-[0_20px_40px_-15px_rgba(135,78,88,0.2)]">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row items-center gap-lg">
                    <div className="w-full md:w-2/3">
                      <h3 className="font-headline-md text-headline-md mb-md">Lá chắn an toàn cho gia đình bạn</h3>
                      <p className="font-body-md text-white/90 leading-relaxed mb-md">
                        Chúng tôi áp dụng công nghệ mã hóa SSL chuẩn quốc tế và các biện pháp tường lửa nhiều lớp để bảo vệ thông tin của bạn. Hệ thống thanh toán được xử lý qua các cổng thanh toán uy tín, đảm bảo không lưu giữ dữ liệu thẻ ngân hàng trực tiếp trên máy chủ của LazPe.
                      </p>
                      <div className="flex items-center gap-md">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-secondary border-2 border-primary flex items-center justify-center">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                            </svg>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-secondary border-2 border-primary flex items-center justify-center">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                            </svg>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-secondary border-2 border-primary flex items-center justify-center">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-sm font-label-sm">Đã được mã hóa 256-bit</span>
                      </div>
                    </div>
                    <div className="w-full md:w-1/3">
                      <div className="w-full aspect-square object-cover rounded-xl shadow-lg border-4 border-white/20 bg-white/5 flex items-center justify-center">
                        <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="scroll-mt-32" id="rights">
              <div className="flex items-center gap-sm mb-md">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-secondary font-bold">
                  4
                </span>
                <h2 className="font-headline-md text-headline-md text-on-background">Quyền của người dùng</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {[
                  {
                    icon: 'edit',
                    title: 'Cập nhật thông tin',
                    desc: 'Bạn có toàn quyền truy cập và chỉnh sửa thông tin cá nhân bất cứ lúc nào trong mục Hồ sơ.',
                  },
                  {
                    icon: 'bell-off',
                    title: 'Từ chối nhận tin',
                    desc: 'Dễ dàng hủy đăng ký nhận email quảng cáo chỉ với một cú nhấp chuột ở cuối mỗi email.',
                  },
                  {
                    icon: 'trash',
                    title: 'Yêu cầu xóa dữ liệu',
                    desc: 'Gửi yêu cầu qua hotline hoặc email nếu bạn mong muốn chúng tôi xóa hoàn toàn tài khoản của bạn.',
                  },
                  {
                    icon: 'eye',
                    title: 'Kiểm soát Cookie',
                    desc: 'Bạn có thể quản lý việc sử dụng cookie thông qua cài đặt trình duyệt của mình.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-md bg-surface-container-high rounded-xl hover:scale-[1.02] transition-transform duration-300">
                    <svg className="w-6 h-6 text-primary mb-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon === 'edit' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
                      {item.icon === 'bell-off' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />}
                      {item.icon === 'trash' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />}
                      {item.icon === 'eye' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                    </svg>
                    <h4 className="font-headline-md text-headline-md text-on-background mb-xs">{item.title}</h4>
                    <p className="text-on-surface-variant font-body-md">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5 */}
            <section className="scroll-mt-32" id="changes">
              <div className="flex items-center gap-sm mb-md">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-secondary font-bold">
                  5
                </span>
                <h2 className="font-headline-md text-headline-md text-on-background">Thay đổi chính sách</h2>
              </div>
              <div className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-surface-variant/50 border-l-4 border-l-primary">
                <p className="text-on-surface-variant font-body-md leading-relaxed">
                  LazPe có quyền cập nhật chính sách này để phù hợp với sự thay đổi của pháp luật hoặc dịch vụ của chúng tôi. Mọi thay đổi sẽ được thông báo trực tiếp trên trang web và cập nhật ngày "Sửa đổi lần cuối" ở phía dưới. Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn đồng ý với các quy định mới.
                </p>
                <p className="mt-md font-label-md text-primary italic">Sửa đổi lần cuối: Ngày {new Date().toLocaleDateString('vi-VN')}</p>
              </div>
            </section>

            {/* Contact CTA */}
            <div className="bg-secondary-container/30 p-lg rounded-xl text-center">
              <h3 className="font-headline-md text-headline-md text-secondary mb-sm">Bạn còn thắc mắc?</h3>
              <p className="text-on-surface-variant font-body-md mb-md">
                Đội ngũ LazPe luôn sẵn sàng lắng nghe và giải đáp mọi vấn đề về bảo mật của bạn.
              </p>
              <a
                href="mailto:privacy@lazpe.com"
                className="inline-flex items-center gap-sm bg-primary text-on-primary px-lg py-md rounded-full font-bold hover:scale-105 transition-transform"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Liên hệ với chúng tôi
              </a>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
