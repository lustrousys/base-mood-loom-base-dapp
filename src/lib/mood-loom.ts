import type { Address } from "viem";

export const MAX_MOOD_LABEL_LENGTH = 20;
export const MAX_MOOD_NOTE_LENGTH = 160;

export const moodLoomAbi = [
  {
    type: "function",
    name: "weaveMood",
    stateMutability: "nonpayable",
    inputs: [
      { name: "moodLabel", type: "string" },
      { name: "note", type: "string" },
      { name: "colorHex", type: "string" },
    ],
    outputs: [{ name: "entryId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getMoodEntry",
    stateMutability: "view",
    inputs: [{ name: "entryId", type: "uint256" }],
    outputs: [
      { name: "author", type: "address" },
      { name: "moodLabel", type: "string" },
      { name: "note", type: "string" },
      { name: "colorHex", type: "string" },
      { name: "strandCount", type: "uint256" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextEntryId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export type MoodLoomEntry = {
  author: Address;
  moodLabel: string;
  note: string;
  colorHex: string;
  strandCount: bigint;
  createdAt: bigint;
};

export const moodLoomContractAddress = process.env
  .NEXT_PUBLIC_MOOD_LOOM_CONTRACT_ADDRESS as Address | undefined;
