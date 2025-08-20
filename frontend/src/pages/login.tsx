import LoginCard from "@/components/cards/LoginCard";
import { useEffect } from "react";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const LoginPage = () => {
  useEffect(() => {
    track("page_viewed", {
      page_name: "login",
      previous_page: "unknown",
      view_source: "direct_access",
      timestamp: getKoreanTimestamp(),
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <LoginCard />
    </div>
  );
};

export default LoginPage;
