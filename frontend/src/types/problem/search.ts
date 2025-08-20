// src/types/problem/search.ts

export interface ProblemSearchParams {
  keyword?: string;
  difficulty?: "EASY" | "NORMAL" | "HARD";
  genre?: string;
  cursor?: number | null;
  size?: number;
  source?: "CUSTOM" | "ORIGINAL";
}
