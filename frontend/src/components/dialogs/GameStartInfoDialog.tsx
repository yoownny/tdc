import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface GameStartInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
}

const GameStartInfoDialog = ({
  isOpen,
  onOpenChange,
  title = "입장 안내",
  message = "게임을 시작할 수 없습니다.",
}: GameStartInfoDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            <DialogTitle className="text-gray-700">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 whitespace-pre-line">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-point-200/50 hover:bg-point-300 text-black"
          >
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameStartInfoDialog;
