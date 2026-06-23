import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "띵동",
  description: "오늘 뭐 먹지? 띵동이 배달해드릴게요!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
