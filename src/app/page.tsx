// 首頁
"use client";

import Image from "next/image";
import CoupleCarousel from "@/components/CoupleCarousel";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useHasMatch } from "@/hooks/useHasMatch";
import Link from "next/link";


export default function Home() {
  const hasMatch = useHasMatch();
  
  return (
    <div>
      <Navbar />

      {/* 首頁大圖 */}
      <div className="
        relative
        bg-[url('/Ian_raj/Ian_raj_2.jpg')] h-[630px] w-full 
        bg-cover bg-no-repeat mt-[80px] shadow-md 
        bg-[position:42%_center] sm:bg-[position:38%_center] md:bg-[position:30%_center]
        2xl:bg-top"
      >
        <div className="
          absolute inset-x-0 bottom-0 bg-black/20 h-1/2 2xl:h-full flex flex-col justify-end items-center 
          text-white text-center px-2"
          >
          <div className="text-[34px] md:text-5xl leading-tight mb-2 mt-[50px] font-sans">
            <span className="blcok sm:hidden">
              在人海之中<br />
              尋覓心靈契合的真愛
            </span>
            <span className="hidden sm:block">
              在人海之中 尋覓心靈契合的真愛
            </span>
          </div>
          <p className="text-lg md:text-2xl mb-3 font-sans">
            MatchU — 為認真的你打造的誠意交友平台
          </p>
          <Link href="/explore" prefetch>
            <button className="
              text-white font-sans cursor-pointer
              py-2 px-6 rounded-full text-lg shadow-md mb-[80px] 2xl:mb-[30px]
              bg-gradient-to-l from-purple-500 to-pink-300
              transition duration-300 ease-in-out hover:brightness-110"
            >
                開始探索
              </button>
          </Link>
        </div>
      </div>
      
      <main className="w-[90%] md:w-[1200px] m-auto mt-5 max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 m-auto">
          <div className="couple-card flex flex-col items-start px-7 py-3 shadow-lg">
            <div className="couple-name text-purple-600">Yiyan & Rajena</div>
            <hr className="card-hr border-gray-300"/>
            <div className="couple-text">
              人海之中，與你相遇，是多麼幸運。你的笑容，悄悄闖進我內心，把平凡的日子點綴亮起；
              遇見你的那一刻，我曉得，幸福已經悄悄來臨，我願意成為你一輩子的伴侶。
            </div>
            <CoupleCarousel folder="Ian_raj" />  
          </div>

          <div className="couple-card flex flex-col items-start px-7 py-3 shadow-lg">
          <div className="couple-name text-purple-600">Daniel & Sophia</div>
            <hr className="card-hr border-gray-300"/>
            <div className="couple-text">
              在無數擦肩而過的瞬間，唯有你讓我駐足，那一眼，便是永恆的開始。
              你的一瞥能讓時光緩緩停住，而我知道，命運已在那時悄悄寫下開場白。
            </div>
            <CoupleCarousel folder="Andrew_Jessica" />  
          </div>

          <div className="couple-card flex flex-col items-start px-7 py-3 shadow-lg">
            <div className="couple-name text-purple-600">Andrew & Jessica</div>
            <hr className="card-hr border-gray-300"/>
            <div className="couple-text">
              原來，幸運女神早已寫好劇本，而你，是我此生最溫柔的橋段。遇見你之後，我才明白，愛不是偶然相遇，是命中注定的那個位置，非你不可。
            </div>
            <CoupleCarousel folder="Daniel_Sophia" />  
          </div>
        </div>
      </main>
      {/* <div className="animate-bounce">動畫測試1</div>
      <div className="text-3xl font-bold text-red-500 animate-bounce">
        動畫測試2
      </div>
      <div className="text-red-500 text-3xl font-bold">Hello Tailwind</div> */}
      <Footer />
    </div>
  );
}
