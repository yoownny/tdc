"use client";

import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import TutorialStep from "./TutorialStep";

export default function TutorialSection() {
  return (
    <section
      id="tutorial"
      className="py-16 md:py-24 bg-gradient-to-b from-primary to-secondary"
    >
      <div className="container mx-auto px-4 max-w-7xl xl:max-w-8xl 2xl:max-w-[1400px]">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-12 md:mb-16 text-center text-point-600 font-ownglyph">
          게임 방법
        </h2>

        <div className="space-y-16 md:space-y-24 lg:space-y-28">
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
                src: "src/assets/TDC_image.svg",
                alt: "거북탐정",
                objectFit: "cover",
              },
              {
                src: "src/assets/TDC_senior.png",
                alt: "시니어탐정",
              },
            ]}
            colsMd={2}
            reverse
          />

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
                src: "src/assets/tutorial/02_select.png",
                alt: "사건 선택",
                objectFit: "contain",
              },
              {
                src: "src/assets/tutorial/02_select_custom.png",
                alt: "사건 파일 생성",
                objectFit: "contain",
              },
            ]}
            colsMd={1}
          />

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
                src: "src/assets/tutorial/03_case_overview.png",
                alt: "사건 개요",
                objectFit: "contain",
              },
            ]}
            colsMd={1}
          />

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
                src: "src/assets/tutorial/04_question.png",
                alt: "질문하기",
                objectFit: "contain",
              },
            ]}
            colsMd={1}
          />

          <TutorialStep
            step={5}
            title="정답에 도전하기"
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
                src: "src/assets/tutorial/05_submit_answer.png",
                alt: "정답 제출",
                objectFit: "contain",
              },
            ]}
            colsMd={1}
          />

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
                src: "src/assets/tutorial/06_reveal_truth.png",
                alt: "정답공개",
                objectFit: "cover",
              },
            ]}
            colsMd={1}
          />

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
                src: "src/assets/tutorial/07_ranking.png",
                alt: "랭킹",
                objectFit: "cover",
              },
            ]}
            colsMd={1}
          />

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
                  className="font-semibold mt-4 mb-2 bg-point-500 hover:bg-point-600 text-white transition-colors"
                  variant="default"
                >
                  <Link to="/lobby">수사하러 가기</Link>
                </Button>
              </>
            }
            medias={[
              {
                src: "src/assets/TDC_image.svg",
                alt: "거북탐정",
                objectFit: "cover",
              },
              {
                src: "src/assets/TDC_senior.png",
                alt: "시니어탐정",
              },
            ]}
            colsMd={2}
            reverse
          />
        </div>
      </div>
    </section>
  );
}
