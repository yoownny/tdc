import { useCallback, useRef, useState } from "react";

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
  threshold?: number;
}

export const useInfiniteScroll = ({
  hasNextPage,
  isLoading,
  onLoadMore,
  rootMargin = "100px",
  threshold = 0.1,
}: UseInfiniteScrollOptions) => {
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetching) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            hasNextPage &&
            !isLoading &&
            !isFetching
          ) {
            setIsFetching(true);
            onLoadMore();
            // 로딩이 완료되면 isFetching을 false로 설정
            setTimeout(() => setIsFetching(false), 1000);
          }
        },
        {
          rootMargin,
          threshold,
        }
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [hasNextPage, isLoading, isFetching, onLoadMore, rootMargin, threshold]
  );

  return { lastElementRef, isFetching };
};
