import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Routee | 당신의 완벽한 데이트 코스",
  description: "지역만 입력하세요. 가장 힙하고 세련된 하루 데이트 코스를 추천해 드립니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 디버깅을 위해 Client ID를 직접 확인 (나중에 다시 env로 변경)
  const naverClientId = "iyw93cqji7";

  return (
    <html lang="ko">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-[#030303] text-white`}
      >
        <Script
          src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${naverClientId}&submodules=geocoder`}
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
