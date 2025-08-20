import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { signup } from "@/services/api/auth/signupApi";
import { migrateGuestToMember } from "@/services/api/auth/migrationApi";
import { checkNicknameDuplicate } from "@/services/api/auth/nicknameApi";
import { useAuthStore } from "@/stores/authStore";
import useUserStore from "@/stores/userStore";
import { validateNickname } from "@/utils";
import { clearGuestData } from "@/utils/guestUtils";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { track } from "@amplitude/analytics-browser";
import { getDeviceType } from "@/utils/deviceType";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const SignupCard = () => {
  const [nickname, setNickname] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMigration = searchParams.get("migration") === "true";
  const { user, setUser, setAccessToken } = useAuthStore();
  const { setUser: setUserStore } = useUserStore();

  const handleCheckDuplicate = async () => {
    track("nickname_check_attempted", {
      nickname_length: nickname.length,
      timestamp: getKoreanTimestamp(),
    });

    const validation = validateNickname(nickname);

    if (!validation.isValid) {
      track("nickname_validation_failed", {
        nickname_length: nickname.length,
        validation_error: validation.message,
        timestamp: getKoreanTimestamp(),
      });

      setError(validation.message);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const available = await checkNicknameDuplicate(nickname);
      setIsAvailable(available);

      if (!available) {
        track("nickname_check_success", {
          nickname_length: nickname.length,
          is_available: false,
          timestamp: getKoreanTimestamp(),
        });

        setError("이미 사용 중인 닉네임입니다.");
      }
      else {
        track("nickname_check_success", {
          nickname_length: nickname.length,
          is_available: true,
          timestamp: getKoreanTimestamp(),
        });
      }
    } catch (error) {
      track("nickname_check_failed", {
        nickname_length: nickname.length,
        error_reason: error instanceof Error ? error.message : 'unknown',
        timestamp: getKoreanTimestamp(),
      });
      console.error("닉네임 중복 확인 중 오류:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "닉네임 중복 확인 중 오류가 발생했습니다.";
      setError(errorMessage);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignup = async () => {
    const eventPrefix = isMigration ? "guest_migration" : "user_signup";
    
    track(`${eventPrefix}_attempted`, {
      login_method: "google",
      nickname_length: nickname.length,
      timestamp: getKoreanTimestamp(),
    });

    const validation = validateNickname(nickname);

    if (!validation.isValid) {
      track(`${eventPrefix}_failed`, {
        login_method: "google",
        error_reason: "nickname_validation_failed",
        timestamp: getKoreanTimestamp(),
      });
      setError(validation.message);
      return;
    }

    if (isAvailable === null) {
      track(`${eventPrefix}_failed`, {
        login_method: "google",
        error_reason: "nickname_not_checked",
        timestamp: getKoreanTimestamp(),
      });
      setError("닉네임 중복 확인을 먼저 해주세요.");
      return;
    }

    if (!isAvailable) {
      track(`${eventPrefix}_failed`, {
        login_method: "google",
        error_reason: "nickname_unavailable",
        timestamp: getKoreanTimestamp(),
      });
      setError("사용할 수 없는 닉네임입니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // sessionStorage에서 Google ID 가져오기
      const socialId = sessionStorage.getItem("tempGoogleId");

      if (!socialId) {
        track(`${eventPrefix}_failed`, {
          login_method: "google",
          error_reason: "missing_social_id",
          timestamp: getKoreanTimestamp(),
        });
        setError("소셜 로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        return;
      }

      let response;

      if (isMigration) {
        // 마이그레이션 모드
        if (!user) {
          setError("게스트 사용자 정보를 찾을 수 없습니다.");
          return;
        }

        console.log("마이그레이션 시작:", { guestUserId: user.userId, socialId, nickname });
        
        response = await migrateGuestToMember({
          guestUserId: user.userId,
          socialId,
          newNickname: nickname,
        });

        track("guest_migration_completed", {
          migration_method: "google",
          timestamp: getKoreanTimestamp(),
        });

        console.log("마이그레이션 성공:", response);
      } else {
        // 일반 회원가입 모드
        console.log("회원가입 시작:", { socialId, nickname });

        response = await signup({ socialId, nickname });

        // 회원가입 완료 추적
        track("user_registered", {
          login_method: "google",
          registration_source: "main_page",
          timestamp: getKoreanTimestamp(),
        });

        // 신규 사용자 첫 로그인
        track("user_signed_in", {
          login_method: "google",
          is_new_user: true,
          device_type: getDeviceType(),
          timestamp: getKoreanTimestamp(),
        });

        console.log("회원가입 성공:", response);
      }

      // 닉네임 설정 완료 추적
      track("user_nickname_set", {
        is_first_time: !isMigration,
        nickname_length: nickname.length,
        change_reason: isMigration ? "migration" : "initial_setup",
        timestamp: getKoreanTimestamp(),
      });

      // 사용자 정보 저장
      setUser(response.user);

      // accessToken 저장
      setAccessToken(response.accessToken);

      // userStore도 동기화
      setUserStore(response.user.userId, response.user.nickname);

      // 임시 Google ID 제거
      sessionStorage.removeItem("tempGoogleId");

      // 마이그레이션인 경우 게스트 데이터도 정리
      if (isMigration) {
        clearGuestData();
        console.log("게스트 데이터 정리 완료");
      }

      // 이동 경로 결정
      if (isMigration) {
        console.log("메인으로 이동");
        navigate("/");
      } else {
        console.log("튜토리얼로 이동");
        navigate("/tutorial");
      }
    } catch (error) {
      track(`${eventPrefix}_failed`, {
        login_method: "google",
        error_reason: error instanceof Error ? error.message : 'api_error',
        timestamp: getKoreanTimestamp(),
      });
      console.error(`${isMigration ? '마이그레이션' : '회원가입'} 중 오류:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : `${isMigration ? '마이그레이션' : '회원가입'} 중 오류가 발생했습니다.`;
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 닉네임 설정
    track("user_nickname_set", {
      is_first_time: true, // 신규 가입 시에는 true
      nickname_length: nickname.length,
      change_reason: "initial_setup",
    });
    setNickname(e.target.value);
    setIsAvailable(null); // 닉네임이 변경되면 중복확인 결과 초기화
    setError(null); // 에러 메시지 초기화
  };

  // const handleBackToLogin = () => {
  //   // 임시 Google ID 제거
  //   sessionStorage.removeItem('tempGoogleId');
  //   navigate('/login');
  // };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border-2 border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl md:text-4xl font-bold text-point-500 mb-2 font-ownglyph">
          {isMigration ? "정회원 되기" : "회원가입"}
        </CardTitle>
        {isMigration && (
          <p className="text-sm text-gray-600 mt-2">
            게스트로 플레이한 데이터를 그대로 활용해서 정회원이 되어보세요!
          </p>
        )}
      </CardHeader>

      <div className="space-y-6">
        <div>
          <label
            htmlFor="nickname"
            className="block text-sm font-medium text-point-500 mb-2"
          >
            닉네임
          </label>
          <div className="flex gap-2">
            <Input
              id="nickname"
              type="text"
              placeholder="2-8글자 (한글, 영문, 숫자, _, -)"
              value={nickname}
              onChange={handleNicknameChange}
              className={`flex-1 transition-all ${
                isAvailable === true
                  ? "border-point-300 focus:border-point-400"
                  : ""
              } ${
                isAvailable === false || error
                  ? "border-danger-400 focus:border-danger-400"
                  : ""
              }`}
              disabled={isChecking || isSubmitting}
              maxLength={8}
            />
            <Button
              onClick={handleCheckDuplicate}
              disabled={isChecking || !nickname.trim() || isSubmitting}
              variant="outline"
              className="whitespace-nowrap px-4 py-2 font-semibold hover:bg-point-200/50"
              style={{ minWidth: 96 }}
            >
              {isChecking ? "확인중..." : "중복확인"}
            </Button>
          </div>
          {isAvailable === true && !error && (
            <p className="text-sm text-point-400 mt-1">
              ✓ 사용 가능한 닉네임입니다
            </p>
          )}
          {isAvailable === false && (
            <p className="text-sm text-danger-400 mt-1">
              ✗ 이미 사용 중인 닉네임입니다
            </p>
          )}
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="bg-danger-300/10 border-danger-400 text-danger-400"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSignup}
          disabled={isSubmitting || isAvailable !== true}
          className="w-full text-lg font-bold py-6 bg-point-200/30 hover:bg-point-200 text-point-700 transition-colors"
        >
          {isSubmitting 
            ? (isMigration ? "정회원 전환 중..." : "가입중...") 
            : (isMigration ? "정회원 되기" : "회원가입 완료")
          }
        </Button>

        <div className="text-center space-y-4">
          <div className="text-xs text-gray-400 space-y-1">
            <div>• 닉네임은 2-8글자로 설정해주세요</div>
            <div>• 한글, 영문, 숫자, _(언더바), -(하이픈) 사용 가능</div>
            <div>• 나중에 설정에서 변경할 수 있습니다</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupCard;
