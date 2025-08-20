import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sendRespondHostTransfer } from "@/websocket/sender";
import useRoomStore from "@/stores/roomStore";

// 외부에서 호출할 수 있는 함수 저장용 변수
let openDialogExternal: (() => void) | null = null;

// 외부에서 호출할 함수
export function openHostAcceptDialog() {
  if (openDialogExternal) {
    openDialogExternal();
  }
}

const HostAcceptDialog = () => {
  const roomId = useRoomStore((s) => s.roomId);
  const [open, setOpen] = useState(false);

  // 외부 호출 함수에 setOpen 연결
  useEffect(() => {
    // 외부 호출 함수 연결
    openDialogExternal = () => {
      setOpen(true);
    };

    return () => {
      openDialogExternal = null;
    };
  }, []);

  // 수락/거절 버튼 핸들러
  const handleAccept = () => {
    sendRespondHostTransfer(roomId, true);
    setOpen(false);
  };

  const handleReject = () => {
    sendRespondHostTransfer(roomId, false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-ownglyph text-pc-title-sm" >방장 권한을 수락하시겠습니까?</DialogTitle>
          <DialogDescription>
            수락하면 방장 권한이 즉시 부여됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleReject}>
            거절
          </Button>
          <Button className="bg-gray" onClick={handleAccept}>수락</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HostAcceptDialog;
