"use client";

import { motion } from "framer-motion";
import React from "react";

type Media = {
  src: string; // /assets/... (public 기준 절대경로 권장)
  alt?: string;
  objectFit?: "contain" | "cover" | "fill" | "scale-down" | "none"; // 개별 이미지에 object-fit 설정
};

type Props = {
  step: number;
  title: string;
  body: React.ReactNode;
  medias: Media[]; // ✅ 여러 장 이미지/GIF/MP4 지원
  reverse?: boolean; // PC에서 미디어를 왼쪽으로
  colsMd?: 1 | 2 | 3; // md 이상 미디어 그리드 열 수(기본 2)
};

const container = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// 간단한 확장자 판별: mp4/webm이면 <video>, 그 외는 <img>(gif 포함)
const isVideo = (src: string) => /\.(mp4|webm|ogg)$/i.test(src);

export default function TutorialStep({
  step,
  title,
  body,
  medias,
  reverse,
  colsMd = 2,
}: Props) {
  const mdColsClass =
    colsMd === 3
      ? "md:grid-cols-3"
      : colsMd === 1
      ? "md:grid-cols-1"
      : "md:grid-cols-2";

  return (
    <motion.section
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
      className="w-full"
    >
      <div
        className={[
          "flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16",
          reverse ? "md:flex-row-reverse" : "",
        ].join(" ")}
      >
        {/* 텍스트 */}
        <motion.div variants={item} className="md:w-1/2">
          {/* <div className="text-sm md:text-base text-point-500 mb-2 font-medium">PAGE {step}</div> */}
          <h3 className="text-3xl md:text-5xl lg:text-6xl font-ownglyph font-bold mb-4 md:mb-6 text-point-600">{title}</h3>
          <div className="text-base md:text-lg lg:text-xl leading-7 md:leading-8 text-foreground">{body}</div>
        </motion.div>

        {/* 미디어 (모바일 위 / PC 오른쪽) */}
        <motion.div variants={item} className="md:w-1/2 w-full">
          <div className="w-full">
            {" "}
            {/* 높이 제한 완전 제거 */}
            <div className={`grid grid-cols-1 ${mdColsClass} gap-3 md:gap-4`}>
              {medias.map((m, idx) => (
                <div
                  key={`${m.src}-${idx}`}
                  className={[
                    // 모바일: 두 장이 화면에 확실히 들어오도록 고정 높이
                    "w-full h-[35vh] overflow-hidden",
                    // PC(md+): 높이 제한 완전 제거, 이미지 자체 비율 유지
                    "md:h-auto rounded-lg border border-point-200 shadow-md",
                  ].join(" ")}
                >
                  {isVideo(m.src) ? (
                    <video
                      className={`w-full h-auto rounded-lg ${
                        // 개별 설정이 있으면 우선 적용, 없으면 기본 로직
                        m.objectFit 
                          ? `object-${m.objectFit}` 
                          : "object-contain"
                      }`}
                      src={m.src}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      className={`w-full h-auto rounded-lg ${
                        // 개별 설정이 있으면 우선 적용, 없으면 기본 로직
                        m.objectFit 
                          ? `object-${m.objectFit}` 
                          : "object-contain"
                      }`}
                      src={m.src}
                      alt={m.alt ?? `${title} 미리보기 ${idx + 1}`}
                      loading={step === 1 && idx === 0 ? "eager" : "lazy"}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
