import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { Baloo_2, Nunito, Caveat} from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400","700"],
  variable: "--font-caveat",
})


export const metadata: Metadata = {
  title: "MatchU-遇見妳(你)的另一伴",
  description: "這是一個交往網站。人海之中遇見你，一生的幸福，由此開始",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${baloo.variable} ${nunito.variable} ${caveat.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
