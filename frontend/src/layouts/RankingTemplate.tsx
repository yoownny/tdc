// src/layouts/RankingTemplate.tsx
import { useEffect, useState } from "react";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import RealTimeRanking from "@/components/ranking/RealTimeRanking";
import UserRanking from "@/components/ranking/UserRanking";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TabValue = "problem" | "user";
interface Props {
  initialTab?: TabValue;
}

export default function RankingTemplate({ initialTab = "problem" }: Props) {
  const [tab, setTab] = useState<TabValue>(initialTab);

  useEffect(() => {
    track("page_viewed", {
      page_name: tab === "user" ? "rankings_users" : "rankings_problems",
      view_source: "direct_access",
      timestamp: getKoreanTimestamp(),
    });
  }, [tab]);

  return (
    <div className="bg-primary pt-10">
      <div className="max-w-[1440px] mx-auto px-4 pb-16">
        <div className="bg-white rounded-xl border border-white/10 p-8 h-[calc(100vh-200px)] overflow-hidden">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as TabValue)}
            className="h-full flex flex-col"
          >
            <TabsList className="mb-6 self-start flex-shrink-0">
              <TabsTrigger value="user">유저 랭킹</TabsTrigger>
              <TabsTrigger value="problem">문제 랭킹</TabsTrigger>
            </TabsList>

            <TabsContent
              value="problem"
              className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent hover:scrollbar-thumb-blue-300 pr-2"
            >
              <RealTimeRanking
                limit={10}
                autoRefresh
                refreshInterval={60_000}
              />
            </TabsContent>

            <TabsContent
              value="user"
              className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent hover:scrollbar-thumb-blue-300 pr-2"
            >
              <UserRanking limit={10} autoRefresh refreshInterval={60_000} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
