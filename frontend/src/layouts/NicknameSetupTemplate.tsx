import React, { useEffect } from 'react';
import NicknameCard from '@/components/cards/NicknameCard';
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

interface NicknameSetupTemplateProps {
  onRegister: (nickname: string) => Promise<void>;
  onCheckNickname: (nickname: string) => Promise<boolean>;
  onBackToLogin: () => void;
  isRegistering: boolean;
  error?: string | null;
}

const NicknameSetupTemplate: React.FC<NicknameSetupTemplateProps> = ({
  onRegister,
  onCheckNickname,
  onBackToLogin,
  isRegistering,
  error
}) => {
  // 🎯 닉네임 설정 페이지 조회 추적
  useEffect(() => {
    track("page_viewed", {
      page_name: "nickname_setup",
      previous_page: "login",
      view_source: "new_user_flow",
      timestamp: getKoreanTimestamp(),
    });
  }, []);

  const handleRegister = async (nickname: string) => {
    track("user_nickname_set", {
      is_first_time: true,
      nickname_length: nickname.length,
      change_reason: "initial_setup",
      timestamp: getKoreanTimestamp(),
    });

    await onRegister(nickname);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NicknameCard
        onRegister={handleRegister}
        onCheckNickname={onCheckNickname}
        onBackToLogin={onBackToLogin}
        isRegistering={isRegistering}
        error={error}
      />
    </div>
  );
};

export default NicknameSetupTemplate;