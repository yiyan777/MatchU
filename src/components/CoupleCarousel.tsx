"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade"

type Props = {
    folder: string // 情侶圖片資料夾名稱
};

export default function CoupleCarousel({ folder }: Props) {
    const images = Array.from({ length: 8}, (_, i) => `/slides/${folder}/slide${i+1}.jpg`);
    
    return (
        <div className="w-full h-full max-w-full">
            <Swiper 
                modules={[Autoplay, EffectFade]}
                autoplay={{ delay: 1000, disableOnInteraction: false }}
                loop={true}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                allowTouchMove={false}
                speed={1500}
                className="w-full h-full rounded"
            >
                {images.map((src, index) => (
                    <SwiperSlide key={index}>
                        <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${src})` }}
                        />
                    </SwiperSlide> 
                ))}
            </Swiper>
        </div>
    );
}