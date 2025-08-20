import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface AnswerAttemptsExhaustedDialogProps {
  open: boolean;
  onClose: () => void;
}

const AnswerAttemptsExhaustedDialog = ({
  open,
  onClose,
}: AnswerAttemptsExhaustedDialogProps) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!open) {
      setCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-white/20"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-pc-body-lg font-ownglyph font-semibold text-gray">
            게임 종료 안내
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 p-6">
          <div className="text-center space-y-3">
            <p className="text-pc-body-lg text-gray">
              모든 참가자가 정답횟수를 소진했습니다.
            </p>
            <p className="text-pc-body-md text-gray/80">
              더이상 정답을 제출할 수 없으므로
              <br />곧 게임이 종료됩니다...
            </p>
          </div>

          <div className="text-center">
            <div className="text-pc-title-lg font-ownglyph font-bold text-point-400">
              {countdown}
            </div>
            <p className="text-pc-body-md text-gray/60">
              초 후 대기방으로 이동합니다
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnswerAttemptsExhaustedDialog;
