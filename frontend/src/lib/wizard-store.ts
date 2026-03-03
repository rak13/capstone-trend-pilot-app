import { create } from "zustand";
import type { TrendingTopic, PostTitle, PostVariant, EngagementPrediction } from "./api";

interface WizardState {
  step: number;
  profileText: string;
  followers: number;
  selectedModel: string;
  trendingTopics: TrendingTopic[];
  chosenTopic: string | null;
  postTitles: PostTitle[];
  chosenTitle: string | null;
  postVariants: PostVariant[];
  predictions: EngagementPrediction[];
  finalPost: string | null;
  isLoading: boolean;
  visualImageData: string | null;

  setStep: (step: number) => void;
  setProfileText: (text: string) => void;
  setFollowers: (n: number) => void;
  setSelectedModel: (model: string) => void;
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  setChosenTopic: (topic: string | null) => void;
  setPostTitles: (titles: PostTitle[]) => void;
  setChosenTitle: (title: string | null) => void;
  setPostVariants: (variants: PostVariant[]) => void;
  setPredictions: (preds: EngagementPrediction[]) => void;
  setFinalPost: (post: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setVisualImageData: (data: string | null) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  profileText: "",
  followers: 1000,
  selectedModel: "gpt-5",
  trendingTopics: [],
  chosenTopic: null,
  postTitles: [],
  chosenTitle: null,
  postVariants: [],
  predictions: [],
  finalPost: null,
  isLoading: false,
  visualImageData: null,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setProfileText: (profileText) => set({ profileText }),
  setFollowers: (followers) => set({ followers }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setTrendingTopics: (trendingTopics) => set({ trendingTopics }),
  setChosenTopic: (chosenTopic) => set({ chosenTopic }),
  setPostTitles: (postTitles) => set({ postTitles }),
  setChosenTitle: (chosenTitle) => set({ chosenTitle }),
  setPostVariants: (postVariants) => set({ postVariants }),
  setPredictions: (predictions) => set({ predictions }),
  setFinalPost: (finalPost) => set({ finalPost }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setVisualImageData: (visualImageData) => set({ visualImageData }),
  reset: () => set(initialState),
}));
