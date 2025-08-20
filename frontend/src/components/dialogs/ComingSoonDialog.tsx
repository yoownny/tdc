import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ComingSoonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

const ComingSoonDialog = ({
  isOpen,
  onOpenChange,
  title = "🚧 준비 중",
  description = "이 기능은 현재 준비 중입니다. 곧 만나보실 수 있어요! 🔧",
}: ComingSoonDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-slate-700 hover:bg-slate-800"
          >
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComingSoonDialog;
