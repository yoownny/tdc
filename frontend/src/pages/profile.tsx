import ProfileCard from "@/components/cards/ProfileCard";

const ProfilePage = () => {
  return (
    <div className="bg-primary pt-10">
      {/* 메인 컨텐츠 영역 */}
      <div className="max-w-[1440px] mx-auto px-4 pb-16">
        <div className="bg-white rounded-xl border border-white/10 p-8 h-[calc(100vh-200px)] overflow-hidden">
          <ProfileCard />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
