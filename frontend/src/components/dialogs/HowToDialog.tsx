import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HowToDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "lobby" | "host" | "player";
}

const HowToDialog = ({
  isOpen,
  onOpenChange,
  type = "lobby",
}: HowToDialogProps) => {
  const getContent = () => {
    switch (type) {
      case "lobby":
        return {
          title: "게임 방법",
          content: (
            <div className="space-y-5">
              <div className="text-center">
                <h3 className="text-pc-body-lg font-semibold text-gray-800 mb-2 font-ownglyph">
                  거북 탐정과 사건파일
                </h3>
                <p className="text-gray-600 leading-relaxed text-pc-body-sm">
                  질문을 통해 사건의 진실을 밝혀내는
                  <br />
                  <strong>질문형 스무고개 게임</strong>입니다.
                </p>
              </div>

              <div className="bg-point-50 p-4 rounded-lg border-point-200">
                <h4 className="font-medium text-gray-800 mb-2 text-pc-body-md">
                  🎯 게임 목표
                </h4>
                <p className="text-pc-body-sm text-gray-600">
                  시니어 거북탐정이 사건의 전말을 알고 있고,
                  <br />
                  다른 거북탐정들이 질문을 통해 사건을 추리하여 맞히는 것
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-800 text-pc-body-md">
                  📋 진행 순서
                </h4>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-point-200 text-white rounded text-pc-caption flex items-center justify-center font-medium">
                    1
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium text-pc-body-sm">
                      질문하기
                    </p>
                    <p className="text-pc-caption text-gray-600">
                      예/아니오 로 답할 수 있는 질문 입력
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-point-300 text-white rounded text-pc-caption flex items-center justify-center font-medium">
                    2
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium text-pc-body-sm">
                      단서 모으기
                    </p>
                    <p className="text-pc-caption text-gray-600">
                      답변을 통해 얻은 정보들을 바탕으로 단서 수집
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-point-400 text-white rounded text-pc-caption flex items-center justify-center font-medium">
                    3
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium text-pc-body-sm">
                      추리하기
                    </p>
                    <p className="text-pc-caption text-gray-600">
                      충분한 단서가 모이면 사건의 진실을 추리하여 정답 시도
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-warning-50 p-3 rounded-lg border border-warning-200">
                <div className="flex items-center gap-2">
                  <span className="text-warning-600 text-lg">💡</span>
                  <div>
                    <p className="text-pc-body-sm text-gray-700 font-medium">
                      질문 예시
                    </p>
                    <p className="text-pc-caption text-gray-600 mt-1">
                      "피해자는 남성인가요?", "사건이 실내에서 일어났나요?"
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-point-50 p-3 rounded-lg border-point-200">
                <div className="flex items-center gap-2">
                  <span className="text-point-600 text-lg">👥</span>
                  <div>
                    <p className="text-pc-body-sm text-gray-700 font-medium">
                      실시간 멀티플레이
                    </p>
                    <p className="text-pc-caption text-gray-600 mt-1">
                      친구들과 함께 실시간으로 채팅하며 사건을 해결해보세요!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
        };

      case "host":
        return {
          title: "출제자 가이드",
          content: (
            <div className="space-y-6">
              <p className="text-gray-600 text-center leading-relaxed text-pc-body-sm">
                당신은 사건의 전말을 알고 있는 <strong>시니어 거북탐정</strong>입니다.
                <br />
                다른 탐정들의 질문에 정확하게 답변하여 게임을 진행해주세요.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-point-200 text-white rounded text-pc-caption flex items-center justify-center font-medium">
                    1
                  </div>
                  <p className="text-gray-700 text-pc-body-sm">
                    사건의 전말을 미리 숙지하기
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-point-300 text-white rounded text-pc-caption flex items-center justify-center font-medium">
                    2
                  </div>
                  <p className="text-gray-700 text-pc-body-sm">
                    다른 탐정들의 질문에 예/아니오/상관없음 으로 답변하기
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-point-400 text-white rounded text-pc-caption flex items-center justify-center font-medium">
                    3
                  </div>
                  <p className="text-gray-700 text-pc-body-sm">
                    정답 시도 시 맞습니다/아닙니다 판단하기
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-start gap-2">
                  <p className="text-pc-caption text-gray-600 font-bold">
                   👑 출제자 권한 넘기기
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <p className="text-pc-caption text-gray-600">
                    다른 탐정의 닉네임을 <strong>마우스로 우클릭</strong>하면 권한을 넘길 수 있습니다.
                  </p>
                </div>
              </div>

            </div>
            
          ),
        };

      case "player":
        return {
          title: "참가자 가이드",
          content: (
            <div className="space-y-6">
              <p className="text-gray-600 text-center leading-relaxed text-pc-body-sm">
                당신은 사건을 추리하는 <strong>거북탐정</strong>입니다.
                <br />
                효과적인 질문을 통해 단서를 모아 사건의 전말을 밝혀내세요.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-point-200 text-white rounded text-pc-caption flex items-center justify-center font-medium">
                    1
                  </div>
                  <div>
                    <div>
                      <p className="text-gray-700 font-medium text-pc-body-sm">
                        예/아니오 로 답할 수 있는 질문 입력
                      </p>
                      <p className="text-pc-caption text-gray-600">
                        자신의 차례가 되면 오른쪽 창의 아래쪽에 질문을 입력하세요.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-point-300 text-white rounded text-pc-caption flex items-center justify-center font-medium">
                    2
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium text-pc-body-sm">
                      답변을 통해 얻은 단서들을 정리하기
                    </p>
                    <p className="text-pc-caption text-gray-600">
                      오른쪽 창의 위쪽에서 단서를 모아 볼 수 있어요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-point-400 text-white rounded text-pc-caption flex items-center justify-center font-medium">
                    3
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium text-pc-body-sm">
                      충분한 단서가 모이면 추리하여 정답 시도하기
                    </p>
                    <p className="text-pc-caption text-gray-600">
                      기회는 1명당 3번뿐! 확실할 때 도전하세요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-start gap-2">
                  <p className="text-pc-caption text-gray-600">
                    <strong>💬 좋은 질문 예시:</strong> "피해자는 남성인가요?",
                    "사건이 실내에서 일어났나요?"
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <p className="text-pc-caption text-gray-600">
                    <strong>⚠️ 피해야 할 질문:</strong> "누가 범인인가요?",
                    "어떻게 죽었나요?" (예/아니오로 답변 불가)
                  </p>
                </div>
              </div>
            </div>
          ),
        };

      default:
        return { title: "", content: null };
    }
  };

  const { title, content } = getContent();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg mx-auto bg-white border-border rounded-lg shadow-lg font-ownglyph">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-center text-pc-title-sm font-semibold text-gray-700 font-ownglyph">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-2">{content}</div>

        <div className="flex justify-center pt-4 border-t border-border">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-point-200 hover:bg-point-300 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 text-pc-body-md font-ownglyph"
          >
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowToDialog;
