import { Button } from "@/components/ui/button";
import RoomCard from "@/components/cards/RoomCard";
import CreateRoomDialog from "@/components/dialogs/CreateRoomDialog";
import DifficultyFilter from "@/components/filters/DifficultyFilter";
import GenreFilter from "@/components/filters/GenreFilter";
import ProblemFilter from "@/components/filters/ProblemFilter";
import SearchFilter from "@/components/filters/SearchFilter";
import { useRoomFilter } from "@/hooks/useRoomFilter";
import { useNavigate } from "react-router-dom";
import { Info, RefreshCw, Search } from "lucide-react";
import useLobbyStore from "@/stores/lobbyStore";
import { sendGetRoomList, sendJoinRoom } from "@/websocket/sender";
import { useCallback, useEffect, useState } from "react";
import { joinLobby, leaveLobby } from "@/websocket/subscription";
import TDC_image from "@/assets/TDC_image.svg";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import HowToDialog from "@/components/dialogs/HowToDialog";
import GameStartInfoDialog from "@/components/dialogs/GameStartInfoDialog";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

// 취소 가능한 타임아웃
const createCancellableTimeout = (ms: number) => {
  const controller = new AbortController();
  const promise = new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        resolve();
      }
    }, ms);

    controller.signal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      reject(new Error("Timeout cancelled"));
    });
  });

  return { promise, cancel: () => controller.abort() };
};

const LobbyTemplate = () => {
  const {
    roomList,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasNextPage,
    currentPage,
    // lastUpdated,
    setLoading,
    setRefreshing,
    setLoadingMore,
    setLoadingTimeoutCancel,
    setRefreshTimeoutCancel,
    resetPagination,
  } = useLobbyStore();

  const displayRooms = roomList;

  const {
    filters,
    filteredData: filteredRooms,
    updateFilter,
    hasActiveFilters,
  } = useRoomFilter(displayRooms);

  // 방 입장 불가 다이얼로그 상태
  const [joinErrorDialog, setJoinErrorDialog] = useState({
    isOpen: false,
    message: "",
  });

  const navigate = useNavigate();

  // 다음 페이지 로드 함수
  const loadMoreRooms = useCallback(() => {
    console.log(`다음 페이지 로드: ${currentPage + 1}`);
    setLoadingMore(true);
    sendGetRoomList();
  }, [currentPage, setLoadingMore]);

  // 무한 스크롤 훅 사용
  const { lastElementRef, isFetching } = useInfiniteScroll({
    hasNextPage,
    isLoading: isLoadingMore,
    onLoadMore: loadMoreRooms,
    rootMargin: "200px",
    threshold: 0.1,
  });

  // 방 목록 새로고침
  const refreshRoomList = useCallback(async () => {
    console.log("방 목록 새로고침 요청");
    setRefreshing(true);
    resetPagination(); // 페이지네이션 리셋

    // 새로운 취소 가능한 타임아웃 생성
    const { promise, cancel } = createCancellableTimeout(5000);
    setRefreshTimeoutCancel(cancel);

    try {
      sendGetRoomList(); // 첫 페이지부터 다시 로드

      // 5초 후 타임아웃 또는 데이터 수신 시 로딩 해제 (store에서 자동 처리)
      await promise;

      // 타임아웃이 완료되면 강제로 로딩 해제
      setRefreshing(false);
      console.log("새로고침 타임아웃 완료");
    } catch {
      console.log("새로고침 타임아웃 취소됨");
    }
  }, [setRefreshing, setRefreshTimeoutCancel, resetPagination]);

  // 방 목록 요청
  useEffect(() => {
    // 방 목록 조회 추적
    track("room_list_viewed", {
      total_rooms_count: roomList.length,
      waiting_rooms_count: roomList.filter(r => r.gameState === "WAITING").length,
      playing_rooms_count: roomList.filter(r => r.gameState === "PLAYING").length,
      view_source: "direct_access",
      timestamp: getKoreanTimestamp(),
    });

    const initializeAsync = async () => {
      setLoading(true);

      // 취소 가능한 타임아웃 생성
      const { promise, cancel } = createCancellableTimeout(2000);
      setLoadingTimeoutCancel(cancel);

      try {
        joinLobby();
        sendGetRoomList();

        // 2초 후 타임아웃 또는 데이터 수신 시 로딩 해제 (store에서 자동 처리)
        await promise;

        setLoading(false);
        console.log("초기 로딩 타임아웃 완료");
      } catch {
        console.log("초기 로딩 타임아웃 취소됨");
      }
    };

    initializeAsync();

    return () => {
      leaveLobby();
    };
  }, [setLoading, setLoadingTimeoutCancel, roomList.length]);

  // 주기적 새로고침 (1분마다)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log("1분이 지나 새로고침 실행");
      refreshRoomList();
    }, 60000); // 1분마다 새로고침

    return () => {
      clearInterval(refreshInterval);
    };
  }, [refreshRoomList]);

  // 수동 새로고침 핸들러
  const handleManualRefresh = () => {
    // 수동 새로고침 추적
    track("room_list_refreshed", {
      refresh_method: "manual_button",
      current_rooms_count: roomList.length,
      has_active_filters: hasActiveFilters,
      timestamp: getKoreanTimestamp(),
    });

    console.log("새로고침 버튼 클릭");
    refreshRoomList();
  };

  const handleRoomClick = (roomId: number) => {
    const selectedRoom = roomList.find(r => r.roomId === roomId);

    if (!selectedRoom) return;

    // 입장 불가 조건 체크
    if (selectedRoom.gameState === "PLAYING") {
      setJoinErrorDialog({
        isOpen: true,
        message: "게임 중인 파일에는 입장할 수 없습니다.",
      });
      return;
    }

    if (selectedRoom.currentPlayers >= selectedRoom.maxPlayers) {
      setJoinErrorDialog({
        isOpen: true,
        message: "인원이 꽉 찬 파일에는 입장할 수 없습니다.",
      });
      return;
    }

    // 방 입장 가능한 경우에만 추적
    track("room_join_attempted", {
      room_status: selectedRoom?.gameState?.toLowerCase() || "unknown",
      current_players_count: selectedRoom?.currentPlayers || 0,
      max_players: selectedRoom?.maxPlayers || 0,
      join_method: "room_list_click",
      room_id: roomId,
      timestamp: getKoreanTimestamp(),
    });

    console.log(`방 ${roomId}번에 입장 시도`);
    sendJoinRoom(roomId);
    navigate(`/room/${roomId}`);
  };

  // 게임방법 i버튼 열기
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  return (
    <div className="bg-primary pt-10">
      {/* <div className="text-center py-1 px-4">
        <h1 className="text-gray text-pc-title-lg md:text-5xl font-bold mb-4 font-ownglyph">
          사건 파일 보관소
        </h1>
      </div> */}

      {/* 메인 컨텐츠 영역 */}
      <div className="max-w-[1440px] mx-auto px-4 pb-16">
        {/* 방 목록 카드 */}
        <div className="bg-white rounded-xl border border-white/10 p-8 h-[calc(100vh-200px)] overflow-hidden">
          <div className="w-full h-full flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/20 text-gray hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg flex items-center gap-2 font-ownglyph"
                >
                  <RefreshCw
                    size={16}
                    className={isRefreshing ? "animate-spin" : ""}
                  />
                  {isRefreshing ? "업데이트 중..." : "새로고침"}
                </button>
              </div>
              <div className="flex items-center gap-4">
                {/* 도움말 버튼 */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 p-2 hover:bg-point-200/20 rounded-lg flex items-center justify-start gap-2 font-ownglyph text-sm"
                  onClick={() => setIsHowToOpen(true)}
                >
                  <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 leading-none">게임 방법</span>
                </Button>
                <CreateRoomDialog />
              </div>

              {/* 방장용 게임방법 Dialog */}
              <HowToDialog
                isOpen={isHowToOpen}
                onOpenChange={setIsHowToOpen}
                type="lobby"
              />

              {/* 방 입장 불가 안내 Dialog */}
              <GameStartInfoDialog
                isOpen={joinErrorDialog.isOpen}
                onOpenChange={(open) =>
                  setJoinErrorDialog({ ...joinErrorDialog, isOpen: open })
                }
                title="입장 안내"
                message={joinErrorDialog.message}
              />
            </div>

            {/* 필터 섹션 - 오른쪽 정렬 */}
            <div className="flex justify-end flex-shrink-0">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 ">
                <div className="flex items-center gap-2">
                  {/* 필터 */}
                  <div className="w-28">
                    <DifficultyFilter
                      selectedDifficulties={filters.difficulties}
                      onDifficultyChange={(difficulties) =>
                        updateFilter("difficulties", difficulties)
                      }
                    />
                  </div>
                  <div className="w-28">
                    <ProblemFilter
                      selectedProblemTypes={filters.problemTypes}
                      onProblemTypeChange={(problemTypes) =>
                        updateFilter("problemTypes", problemTypes)
                      }
                    />
                  </div>
                  <div className="w-28">
                    <GenreFilter
                      selectedGenres={filters.genres}
                      onGenreChange={(genres) => updateFilter("genres", genres)}
                    />
                  </div>
                  <div className="w-48">
                    <SearchFilter
                      searchQuery={filters.searchQuery}
                      onSearchChange={(query) =>
                        updateFilter("searchQuery", query)
                      }
                      placeholder="사건명 검색"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 방 목록 컨텐츠 */}
            <div
              className={`flex-1 pr-2 ${
                filteredRooms.length > 0
                  ? "overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent hover:scrollbar-thumb-blue-300"
                  : "overflow-hidden"
              }`}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray">
                  <div className="relative mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-gray"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Search className="text-gray-500" size={20} />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    사건 파일을 불러오는 중...
                  </h3>
                  <p className="text-sm text-white/50 text-center">
                    보관소에서 사건 파일들을 정리하고 있습니다
                  </p>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray">
                  <div className="bg-white/5 p-8 rounded-full mb-6">
                    <img
                      src={TDC_image}
                      alt="TDC_image"
                      className="w-40 h-40"
                    />
                  </div>
                  <h3 className="text-2xl font-medium mb-3 font-ownglyph">
                    {hasActiveFilters
                      ? "조건에 맞는 사건이 없습니다"
                      : "현재 진행 중인 사건이 없습니다"}
                  </h3>
                  <p className="text-lg text-center text-gray mb-6 max-w-md font-ownglyph">
                    {hasActiveFilters
                      ? "다른 검색 조건으로 시도해보시거나, 새로운 사건을 만들어보세요."
                      : "첫 번째 탐정이 되어 새로운 사건을 시작해보세요!"}
                  </p>
                </div>
              ) : (
                <div className="p-7">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredRooms.map((room, index) => {
                      // 무한 스크롤 감지용 감지
                      if (index === filteredRooms.length - 1) {
                        return (
                          <div key={room.roomId} ref={lastElementRef}>
                            <RoomCard room={room} onClick={handleRoomClick} />
                          </div>
                        );
                      }
                      return (
                        <RoomCard
                          key={room.roomId}
                          room={room}
                          onClick={handleRoomClick}
                        />
                      );
                    })}
                  </div>

                  {/* 무한 스크롤 로딩 */}
                  {(isLoadingMore || isFetching) && (
                    <div className="flex justify-center items-center py-8">
                      <div className="flex items-center gap-2 text-gray">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray/20 border-t-gray"></div>
                        <span className="text-sm">
                          더 많은 사건을 불러오는 중...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyTemplate;
