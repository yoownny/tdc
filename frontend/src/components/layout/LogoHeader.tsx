import logo from "@/assets/logo_white.png";

const LogoHeader = () => {
  return (
    <div className="bg-foreground text-background p-3 h-10 w-full flex justify-center items-center">
      <img src={logo} style={{ width: "48px", height: "48px", padding: "12px" }}></img>
      <span>거북 탐정과 사건파일 - 바다거북스프 온라인</span>
    </div>
  );
};

export default LogoHeader;
