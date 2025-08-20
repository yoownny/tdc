import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2, AlertCircle, User } from 'lucide-react';
import { useNavigate } from "react-router-dom";

interface NicknameCardProps {
  onRegister: (nickname: string) => Promise<void>;
  onCheckNickname: (nickname: string) => Promise<boolean>;
  onBackToLogin: () => void;
  isRegistering: boolean;
  error?: string | null;
}

interface CheckResult {
  checked: boolean;
  available: boolean;
  message: string;
}

const NicknameCard: React.FC<NicknameCardProps> = ({
  onRegister,
  onCheckNickname,
  onBackToLogin,
  isRegistering,
  error
}) => {
  const [nickname, setNickname] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult>({
    checked: false,
    available: false,
    message: ''
  });
  const [validationError, setValidationError] = useState('');

  const navigate = useNavigate();

  // 닉네임 변경 시 상태 초기화
  useEffect(() => {
    setCheckResult({ checked: false, available: false, message: '' });
    setValidationError('');
  }, [nickname]);

  // 닉네임 유효성 검사 (2-8자, 한글/영문/숫자/특수문자(_,-))
  const validateNickname = (value: string): { isValid: boolean; message: string } => {
    if (!value.trim()) {
      return { isValid: false, message: '닉네임을 입력해주세요.' };
    }

    if (value.length < 2 || value.length > 8) {
      return { isValid: false, message: '닉네임은 2-8자 사이여야 합니다.' };
    }

    const nicknameRegex = /^[가-힣a-zA-Z0-9_-]+$/;
    if (!nicknameRegex.test(value)) {
      return { isValid: false, message: '한글, 영문, 숫자, _(언더바), -(하이픈)만 사용할 수 있습니다.' };
    }

    return { isValid: true, message: '' };
  };

  // 닉네임 입력
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    
    // 유효성 검사
    if (value.length > 0) {
      const validation = validateNickname(value);
      setValidationError(validation.isValid ? '' : validation.message);
    } else {
      setValidationError('');
    }
  };

  // 닉네임 중복 확인
  // API 요청 필요. /api/auth/check-nickname (GET)
  const handleCheckNickname = async () => {
    const validation = validateNickname(nickname);
    if (!validation.isValid) {
      setValidationError(validation.message);
      return;
    }

    try {
      setIsChecking(true);
      const available = await onCheckNickname(nickname);
      
      setCheckResult({
        checked: true,
        available,
        message: available ? '사용 가능한 닉네임입니다.' : '이미 사용중인 닉네임입니다.'
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '닉네임 중복확인에 실패했습니다.';
      setCheckResult({
        checked: true,
        available: false,
        message: errorMessage
      });
    } finally {
      setIsChecking(false);
    }
  };

  // 회원가입 처리
  // API 요청 필요. /api/auth/nickname (POST)
  const handleRegister = async () => {
    if (!checkResult.checked || !checkResult.available) {
      setCheckResult({
        checked: true,
        available: false,
        message: '닉네임 중복확인을 완료해주세요.'
      });
      return;
    }

    try {
      await onRegister(nickname);
      navigate('/lobby');
    } catch (error) {
      console.error('회원가입 실패:', error);
    }
  };

  const isNicknameValid = validateNickname(nickname).isValid;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">\
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
          <User className="w-10 h-10 text-white" />
        </div>
        
        <CardTitle className="text-2xl">닉네임 설정</CardTitle>
        <CardDescription>
          게임에서 사용할 닉네임을 설정해주세요.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="nickname">닉네임</Label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                id="nickname"
                value={nickname}
                onChange={handleNicknameChange}
                placeholder="2-8글자 (한글, 영문, 숫자, _, -)"
                maxLength={8}
                disabled={isChecking || isRegistering}
                className={`
                  ${checkResult.checked && checkResult.available ? 'border-green-400 focus:border-green-400' : ''}
                  ${checkResult.checked && !checkResult.available ? 'border-red-400 focus:border-red-400' : ''}
                  ${validationError ? 'border-red-400' : ''}
                `}
              />
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckNickname}
              disabled={isChecking || !isNicknameValid || !nickname.trim() || isRegistering}
              className="whitespace-nowrap"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  확인중
                </>
              ) : (
                '중복확인'
              )}
            </Button>
          </div>

          {/* 유효성 검사 에러 */}
          {validationError && (
            <div className="flex items-center text-sm text-red-600">
              <XCircle className="w-4 h-4 mr-2" />
              {validationError}
            </div>
          )}

          {/* 중복확인 결과 */}
          {checkResult.checked && !validationError && (
            <div className={`flex items-center text-sm ${
              checkResult.available ? 'text-green-600' : 'text-red-600'
            }`}>
              {checkResult.available ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {checkResult.message}
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleRegister}
            disabled={!checkResult.available || isRegistering}
            className="w-full"
          >
            {isRegistering ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                가입 중...
              </>
            ) : (
              '가입 완료'
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={onBackToLogin}
            disabled={isRegistering}
            className="w-full"
          >
            다른 계정으로 로그인
          </Button>
        </div>

        {/* 안내 메시지 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <div className="space-y-1">
              <div>• 닉네임은 2-8글자로 설정해주세요</div>
              <div>• 한글, 영문, 숫자, _(언더바), -(하이픈) 사용 가능</div>
              <div>• 나중에 설정에서 변경할 수 있습니다</div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default NicknameCard;