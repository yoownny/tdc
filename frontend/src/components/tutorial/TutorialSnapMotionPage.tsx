"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import TutorialStep from "@/components/tutorial/TutorialStep";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

import TDCImage from "@/assets/TDC_image_square.png";
import TDCSenior from "@/assets/TDC_senior.png";
import SelectImage from "@/assets/tutorial/02_select.png";
import SelectCustomImage from "@/assets/tutorial/02_select_custom.png";
import CaseOverviewImage from "@/assets/tutorial/03_case_overview.png";
import QuestionImage from "@/assets/tutorial/04_question.png";
import SubmitAnswerImage from "@/assets/tutorial/05_submit_answer.png";
import RevealTruthImage from "@/assets/tutorial/06_reveal_truth.png";
import RankingImage from "@/assets/tutorial/07_ranking.png";

// 섹션 컨테이너(한 화면씩 스냅)
export default function TutorialSnapMotionPage() {
  // 컴포넌트 마운트 시 body 스크롤 막기
  useEffect(() => {
    document.body.classList.add("no-scroll");

    // 컴포넌트 언마운트 시 클래스 제거
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []);

  return (
    <div
      className="h-screen overflow-y-scroll snap-y snap-mandatory hide-scrollbar bg-gradient-to-b from-primary to-secondary"
      style={{ scrollBehavior: "smooth" }}
    >
      <motion.section
        className="snap-start h-[calc(100vh-80px)] flex items-center justify-center px-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-7xl xl:max-w-8xl 2xl:max-w-[1400px]">
          <TutorialStep
            step={1}
            title="거북 탐정과 사건파일"
            body={
              <>
                <p className="mt-2">질문을 통해 사건의 진실을 밝혀내는</p>
                <p className="mt-2">
                  <strong>질문형 스무고개 게임</strong>입니다.
                </p>
                <p className="mt-2">
                  <b>출제자(시니어 탐정) 1명</b>과{" "}
                  <b>참가자(거북 탐정) 1~5명</b>이 함께 플레이합니다.
                </p>
              </>
            }
            medias={[
              {
                src: TDCImage,
                alt: "거북탐정",
                objectFit: "cover",
              },
              {
                src: TDCSenior,
                alt: "시니어탐정",
              },
            ]}
            colsMd={2}
            reverse
          />
        </div>
      </motion.section>

      <motion.section
        className="snap-start h-[calc(100vh-80px)] flex items-center justify-center px-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-7xl xl:max-w-8xl 2xl:max-w-[1400px]">
          <TutorialStep
            step={2}
            title="사건파일 만들기"
            body={
              <>
                <p className="mt-2">출제자는 시니어 탐정이 되어</p>
                <p className="mt-2">
                  <b>기존 사건 / 창작 사건 / AI 생성 사건</b> 중 하나를
                  선택합니다.
                </p>
                <p className="mt-2">
                  사건을 고르면 <b>사건파일(게임 방)</b>이 생성되고 로비에
                  제목이 표시됩니다.
                </p>
                <p className="mt-2">
                  다른 참가자들은 거북 탐정이 되어 사건을 풀 준비를 합니다.
                </p>
              </>
            }
            medias={[
              {
                src: SelectImage,
                alt: "사건 선택",
                objectFit: "contain",
              },
              {
                src: SelectCustomImage,
                alt: "사건 파일 생성",
                objectFit: "contain",
              },
            ]}
            colsMd={1}
          />
        </div>
      </motion.section>

      <motion.section
        className="snap-start h-[calc(100vh-80px)] flex items-center justify-center px-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-7xl xl:max-w-8xl 2xl:max-w-[1400px]">
          <TutorialStep
            step={3}
            title="사건 내용 공개"
            body={
              <>
                <p>사건파일에 입장하면 사건의 내용이 전원에게 공개됩니다.</p>
                <p className="mt-2">
                  단, <b>정답(사건의 전말)</b>은 시니어 탐정만 볼 수 있습니다.
                </p>
                <p className="mt-2">
                  다른 탐정들은 공개된 내용을 바탕으로 질문을 준비합니다.
                </p>
              </>
            }
            medias={[
              {
                src: CaseOverviewImage,
                alt: "사건 개요",
                objectFit: "contain",
              },
            ]}
            colsMd={1}
          />
        </div>
      </motion.section>

      <motion.section
        className="snap-start h-[calc(100vh-80px)] flex items-center justify-center px-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-7xl xl:max-w-8xl 2xl:max-w-[1400px]">
          <TutorialStep
            step={4}
            title="질문하기"
            body={
              <>
                <p className="mb-3">
                  <b>❓ 예 / 아니오 / 상관없음</b>
                </p>

                <p>탐정들은 차례대로 질문을 합니다.</p>
                <p className="mb-4">
                  시니어 탐정은 반드시 <b>예/아니오/상관없음</b> 중 하나로
                  대답합니다.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <b>전체 질문 가능 횟수: 30회</b>
                  </li>
                  <li>
                    <b>질문 제한 시간: 60초</b>
                  </li>
                </ul>
                <p className="mt-4">단서를 모아 사건의 진실에 다가가세요.</p>
                <p className="mb-4">
                  힌트가 필요하다면 왼쪽 채팅창에 힌트를 요청하세요.
                </p>
              </>
            }
            medias={[
              {
                src: QuestionImage,
                alt: "질문하기",
                objectFit: "contain",
              },
            ]}
            colsMd={1}
          />
        </div>
      </motion.section>

      <motion.section
        className="snap-start h-[calc(100vh-80px)] flex items-center justify-center px-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-7xl xl:max-w-8xl 2xl:max-w-[1400px]">
          <TutorialStep
            step={5}
            title="진실에 도전하기"
            body={
              <>
                <p className="mb-3">
                  <b>기회는 3번</b>
                </p>
                <p>거북 탐정은 언제든지 정답을 제출할 수 있습니다.</p>
                <p className="mt-2">
                  단, <b>탐정 1명당 정답 제출 기회는 3번</b>뿐입니다.
                </p>
                <p className="mt-2">확신이 서면 과감하게 도전하세요.</p>
              </>
            }
            medias={[
              {
                src: SubmitAnswerImage,
                alt: "정답 제출",
                objectFit: "contain",
              },
            ]}
            colsMd={1}
          />
        </div>
      </motion.section>

      <motion.section
        className="snap-start h-[calc(100vh-80px)] flex items-center justify-center px-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-7xl xl:max-w-8xl 2xl:max-w-[1400px]">
          <TutorialStep
            step={6}
            title="진실 공개 & 사건 평가"
            body={
              <>
                <p className="mb-3 mt-6">
                  <b>사건의 전말</b>
                </p>
                <p>누군가 정답을 맞히면 사건의 전말이 공개됩니다.</p>
                <p className="mt-2">그 순간, 모든 탐정이 진실을 확인합니다.</p>
                <p className="mt-2">
                  다음 라운드에서는 새로운 사건을 수사하게 됩니다.
                </p>
                <p className="mb-3 mt-6">
                  <b>사건 평가</b>
                </p>
                <p>모든 사건은 게임 종료 후 좋아요👍를 누를 수 있습니다.</p>
                <p className="mt-2">
                  새로운 사건은 과반수 이상의 좋아요를 받으면 기존 사건 목록에
                  등재됩니다.
                </p>
                <p className="mt-2">
                  기존 사건은 좋아요를 받으면 랭킹에 반영됩니다.
                </p>
                <p className="mt-2">
                  좋은 사건을 만들수록 더 많은 탐정들이 도전하게 됩니다.
                </p>
                <div className="mt-4"></div>
              </>
            }
            medias={[
              {
                src: RevealTruthImage,
                alt: "정답공개",
                objectFit: "cover",
              },
            ]}
            colsMd={1}
          />
        </div>
      </motion.section>

      <motion.section
        className="snap-start h-[calc(100vh-80px)] flex items-center justify-center px-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-7xl xl:max-w-8xl 2xl:max-w-[1400px]">
          <TutorialStep
            step={7}
            title="인기 사건 랭킹"
            body={
              <>
                <p className="mt-2">
                  그동안 플레이된 사건들의 인기 순위를 볼 수 있습니다.
                </p>
                <p className="mt-2">
                  여러분만의 사건을 생성하여 랭킹에 올려보세요!
                </p>
              </>
            }
            medias={[
              {
                src: RankingImage,
                alt: "랭킹",
                objectFit: "cover",
              },
            ]}
            colsMd={1}
          />
        </div>
      </motion.section>

      <motion.section
        className="snap-end h-screen flex items-center justify-center px-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-7xl xl:max-w-8xl 2xl:max-w-[1400px] mt-[-80px]">
          <TutorialStep
            step={8}
            title="핵심 요약"
            body={
              <>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <b>시니어 탐정</b>: 사건 선택 + 질문 답변 + 정답 판정
                  </li>
                  <li>
                    <b>거북 탐정</b>: 예/아니오 질문 + 단서 수집 + 정답 도전
                  </li>
                  <li>
                    질문 제한: <b>30회</b>, 시간 <b>60초</b>
                  </li>
                  <li>
                    정답 제출: <b>탐정 1명당 3번</b>
                  </li>
                  <li>
                    목표: <b>사건의 진실을 가장 먼저 밝히기</b>
                  </li>
                </ul>
                <Button
                  className="font-semibold mt-4 mb-2 bg-point-500 hover:bg-point-600 text-white transition-colors justify-items-center"
                  variant="default"
                  size="lg"
                >
                  <Link to="/lobby">수사하러 가기</Link>
                </Button>
              </>
            }
            medias={[
              {
                src: TDCImage,
                alt: "거북탐정",
                objectFit: "cover",
              },
              {
                src: TDCSenior,
                alt: "시니어탐정",
              },
            ]}
            colsMd={2}
            reverse
          />
        </div>
      </motion.section>
    </div>
  );
}
