// 닉네임 유효성 검사
export const validateNickname = (value: string): { isValid: boolean; message: string } => {
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
