'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsAndConditions() {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="font-headline-lg text-headline-lg md:text-display-lg font-bold text-on-background mb-4">
              Điều khoản chung
            </h1>
            <p className="text-on-surface-variant font-body-lg max-w-2xl leading-relaxed">
              Chào mừng bạn đến với LazPe. Khi bạn truy cập vào trang web của chúng tôi để xem thông tin hoặc mua sắm, đồng nghĩa với việc bạn đồng ý với các điều khoản dưới đây.
            </p>
            <div className="mt-md h-1 w-24 bg-primary-container rounded-full"></div>
          </header>

          <div className="space-y-xl">
            {/* Section 1 */}
            <section className="scroll-mt-32" id="general">
              <div className="flex items-center gap-sm mb-md">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-secondary font-bold">
                  1
                </span>
                <h2 className="font-headline-md text-headline-md text-on-background">Quy định sử dụng</h2>
              </div>
              <div className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-surface-variant/50">
                <p className="mb-md font-body-md text-on-surface-variant leading-relaxed">
                  Trang web này phục vụ cho mục đích cung cấp thông tin sản phẩm mẹ và bé, và giúp khách hàng thực hiện các giao dịch mua sắm trực tuyến. Bằng việc sử dụng trang web, bạn cam kết:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <li className="flex items-start gap-sm">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.2L4.8 12m-1.4 1.4L9 19 21 7" />
                    </svg>
                    <span className="text-on-surface-variant">
                      Cung cấp thông tin chính xác khi đăng ký tài khoản hoặc mua hàng.
                    </span>
                  </li>
                  <li className="flex items-start gap-sm">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.2L4.8 12m-1.4 1.4L9 19 21 7" />
                    </svg>
                    <span className="text-on-surface-variant">
                      Không sử dụng trang web cho các mục đích bất hợp pháp hoặc gây hại.
                    </span>
                  </li>
                  <li className="flex items-start gap-sm">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.2L4.8 12m-1.4 1.4L9 19 21 7" />
                    </svg>
                    <span className="text-on-surface-variant">
                      Tự bảo mật thông tin tài khoản và mật khẩu của mình.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section className="scroll-mt-32" id="payment">
              <div className="flex items-center gap-sm mb-md">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-secondary font-bold">
                  2
                </span>
                <h2 className="font-headline-md text-headline-md text-on-background">Thanh toán và Giao nhận</h2>
              </div>
              <div className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-surface-variant/50">
                <p className="mb-md font-body-md text-on-surface-variant leading-relaxed">
                  Chúng tôi cung cấp nhiều hình thức thanh toán an toàn và tiện lợi để đảm bảo trải nghiệm mua sắm tốt nhất.
                </p>
                <div className="space-y-md">
                  <div className="flex items-center gap-md p-md bg-background rounded-lg border border-primary-container/20">
                    <svg className="w-7 h-7 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-on-surface-variant font-body-md">
                      Thanh toán trực tuyến an toàn qua các cổng thanh toán nội địa và quốc tế (VNPAY, Napas, VISA, v.v.).
                    </p>
                  </div>
                  <div className="flex items-center gap-md p-md bg-background rounded-lg border border-primary-container/20">
                    <svg className="w-7 h-7 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <p className="text-on-surface-variant font-body-md">
                      Khách hàng có thể kiểm tra hàng trước khi thanh toán (với hình thức COD tùy khu vực).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="scroll-mt-32" id="returns">
              <div className="flex items-center gap-sm mb-md">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-secondary font-bold">
                  3
                </span>
                <h2 className="font-headline-md text-headline-md text-on-background">Bảo hành và Đổi trả</h2>
              </div>
              <div className="relative overflow-hidden bg-primary text-on-primary p-md md:p-xl rounded-xl shadow-[0_20px_40px_-15px_rgba(135,78,88,0.2)]">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row items-center gap-lg">
                    <div className="w-full md:w-2/3">
                      <h3 className="font-headline-md text-headline-md mb-md">Cam kết chất lượng từ LazPe</h3>
                      <p className="font-body-md text-white/90 leading-relaxed mb-md">
                        Mọi sản phẩm bán ra đều đi kèm chính sách đổi trả trong vòng 15 ngày nếu có lỗi từ nhà sản xuất. Đối với các sản phẩm điện tử, xe nôi, máy hút sữa, chúng tôi tuân thủ quy định bảo hành chính hãng.
                      </p>
                    </div>
                    <div className="w-full md:w-1/3">
                      <div className="w-full aspect-square object-cover rounded-xl shadow-lg border-4 border-white/20 bg-white/5 flex items-center justify-center">
                        <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Section 4 */}
            <section className="scroll-mt-32" id="dispute">
              <div className="flex items-center gap-sm mb-md">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-secondary font-bold">
                  4
                </span>
                <h2 className="font-headline-md text-headline-md text-on-background">Giải quyết khiếu nại và Tranh chấp</h2>
              </div>
              <div className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-surface-variant/50">
                <p className="mb-md font-body-md text-on-surface-variant leading-relaxed">
                  LazPe luôn đề cao quyền lợi hợp pháp của người tiêu dùng. Mọi khiếu nại, phản ánh liên quan đến sản phẩm, dịch vụ hoặc giao dịch trên nền tảng sẽ được tiếp nhận và xử lý theo quy trình sau:
                </p>
                <ul className="space-y-md">
                  <li className="flex items-start gap-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mt-0.5">1</span>
                    <span className="text-on-surface-variant font-body-md">
                      <strong>Tiếp nhận:</strong> Khách hàng có thể gửi khiếu nại qua Hotline (1900 1234) hoặc Email (lazpevn@gmail.com) trong vòng 14 ngày kể từ ngày nhận hàng.
                    </span>
                  </li>
                  <li className="flex items-start gap-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mt-0.5">2</span>
                    <span className="text-on-surface-variant font-body-md">
                      <strong>Xử lý:</strong> Bộ phận CSKH sẽ xác minh thông tin, liên hệ với các bên liên quan và đề xuất phương án giải quyết (đổi trả, hoàn tiền, hoặc bồi thường) trong thời hạn 3 - 5 ngày làm việc.
                    </span>
                  </li>
                  <li className="flex items-start gap-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mt-0.5">3</span>
                    <span className="text-on-surface-variant font-body-md">
                      <strong>Giải quyết tranh chấp:</strong> Nếu các bên không thể tự thỏa thuận, tranh chấp sẽ được chuyển đến cơ quan nhà nước có thẩm quyền để giải quyết theo quy định của pháp luật Việt Nam.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
