import { useEffect } from "react";
import SignupCard from "@/components/cards/SignupCard";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const SignupPage = () => {
  useEffect(() => {
    track("page_viewed", {
      page_name: "signup",
      previous_page: "login",
      view_source: "new_user_flow",
      timestamp: getKoreanTimestamp(),
    });
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <SignupCard />
    </div>
  );
};

export default SignupPage;
