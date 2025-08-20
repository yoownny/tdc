// import MainCardToLobby from "@/components/cards/MainCardToLobby";
// import MainCardToToday from "@/components/cards/MainCardToToday";
// import MainCardToRanking from "@/components/cards/MainCardToRanking";
// // import MainCardToAI from "@/components/cards/MainCardToAI";

// const MainTemplate = () => {
//   return (
//     <div className="max-w-[1440px] mx-auto flex flex-wrap items-center gap-2 md:flex-row bg-secondary">
//       <MainCardToRanking/>
//       <MainCardToLobby/>
//       <MainCardToToday/>

//       {/* AI 문제는 나중에 추가할 예정 */}
//       {/* <MainCardToAI/> */}
//     </div>
//   );
// };

// export default MainTemplate;
import MainCardToLobby from "@/components/cards/MainCardToLobby";
import MainCardToToday from "@/components/cards/MainCardToToday";
import MainCardToRanking from "@/components/cards/MainCardToRanking";

const MainTemplate = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
      <MainCardToRanking />
      <MainCardToLobby />
      <MainCardToToday />
    </div>
  );
};

export default MainTemplate;
