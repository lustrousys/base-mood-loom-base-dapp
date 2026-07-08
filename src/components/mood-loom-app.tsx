"use client";

import {
  Blend,
  Loader2,
  Scissors,
  ScanSearch,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_MOOD_LABEL_LENGTH,
  MAX_MOOD_NOTE_LENGTH,
  moodLoomAbi,
  moodLoomContractAddress,
} from "@/lib/mood-loom";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const MOOD_OPTIONS = [
  { label: "Calm", color: "#7CC6A4", accent: "#D8F1E4" },
  { label: "Sharp", color: "#F06C54", accent: "#FFE2D9" },
  { label: "Bright", color: "#F4C44E", accent: "#FFF1C7" },
  { label: "Dreamy", color: "#B586F8", accent: "#F0E3FF" },
  { label: "Steady", color: "#4E88E8", accent: "#DCE8FF" },
  { label: "Wild", color: "#EC6FBC", accent: "#FFDDF2" },
] as const;

function shortAddress(address?: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(createdAt?: bigint) {
  if (!createdAt) return "--";
  return new Date(Number(createdAt) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function createRibbonColors(seed: string, fallback: string) {
  const colors = [fallback];
  for (const option of MOOD_OPTIONS) {
    if (option.label.toLowerCase() !== seed.toLowerCase()) {
      colors.push(option.color);
    }
  }
  return colors.slice(0, 6);
}

export function MoodLoomApp() {
  const [entryIdInput, setEntryIdInput] = useState("1");
  const [moodLabel, setMoodLabel] = useState("Calm");
  const [note, setNote] = useState(
    "Reset the day with a quiet hour and wanted that tone to stay visible.",
  );
  const [colorHex, setColorHex] = useState("#7CC6A4");
  const [status, setStatus] = useState(
    "Pick a mood, weave one line of context, and store the strand on Base.",
  );
  const [walletStatus, setWalletStatus] = useState("");

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync, isPending: disconnecting } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContract,
    isPending: writing,
    error: writeError,
  } = useWriteContract();

  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash });

  const availableConnectors = useMemo(
    () =>
      connectors
        .filter((item) => item.type !== "mock")
        .sort((a, b) => {
          const score = (item: (typeof connectors)[number]) => {
            if (item.id === "baseAccount" || item.name === "Base Account") {
              return 0;
            }
            if (item.type === "injected") return 1;
            return 2;
          };

          return score(a) - score(b);
        }),
    [connectors],
  );

  async function connectWallet() {
    const errors: string[] = [];
    setWalletStatus("Opening wallet...");

    for (const item of availableConnectors) {
      try {
        await connectAsync({ connector: item, chainId: base.id });
        setWalletStatus("");
        return;
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `${item.name}: ${error.message}`
            : `${item.name}: connection failed`,
        );
      }
    }

    setWalletStatus(
      errors[0] ??
        "No wallet connector is available. Open this app inside Base App or install a wallet.",
    );
  }

  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
      setWalletStatus("Wallet disconnected. Tap Connect to reconnect.");
    } catch (error) {
      setWalletStatus(
        error instanceof Error ? error.message : "Could not disconnect wallet.",
      );
    }
  }
  const parsedEntryId = BigInt(Math.max(1, Number(entryIdInput || "1")));

  const entryQuery = useReadContract({
    abi: moodLoomAbi,
    address: moodLoomContractAddress,
    functionName: "getMoodEntry",
    args: [parsedEntryId],
    query: {
      enabled: Boolean(moodLoomContractAddress),
      refetchInterval: 12000,
    },
  });

  const totalQuery = useReadContract({
    abi: moodLoomAbi,
    address: moodLoomContractAddress,
    functionName: "nextEntryId",
    query: {
      enabled: Boolean(moodLoomContractAddress),
      refetchInterval: 12000,
    },
  });

  const latestTuple = entryQuery.data as
    | readonly [Address, string, string, string, bigint, bigint]
    | undefined;

  const entry = useMemo(
    () =>
      latestTuple
        ? {
            author: latestTuple[0],
            moodLabel: latestTuple[1],
            note: latestTuple[2],
            colorHex: latestTuple[3],
            strandCount: latestTuple[4],
            createdAt: latestTuple[5],
          }
        : undefined,
    [latestTuple],
  );

  const totalEntries = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const activePalette = createRibbonColors(entry?.moodLabel ?? moodLabel, entry?.colorHex ?? colorHex);

  const canWeave =
    Boolean(moodLoomContractAddress) &&
    isConnected &&
    chainId === base.id &&
    moodLabel.trim().length > 0 &&
    moodLabel.trim().length <= MAX_MOOD_LABEL_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_MOOD_NOTE_LENGTH;

  const statusText = confirmed
    ? "Mood strand confirmed on Base."
    : writeError
      ? writeError.message
      : status;

  function applyMood(label: string, color: string) {
    setMoodLabel(label);
    setColorHex(color);
  }

  function weaveMood() {
    if (!moodLoomContractAddress) return;
    setStatus("Confirm the mood strand in your wallet.");
    writeContract({
      address: moodLoomContractAddress,
      abi: moodLoomAbi,
      functionName: "weaveMood",
      args: [moodLabel.trim(), note.trim(), colorHex],
      chainId: base.id,
    });
  }

  return (
    <main className="min-h-screen bg-[#F6F0E8] text-[#2F2032]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 rounded-[32px] border border-[#C9B8A6] bg-[#FFF9F2] px-5 py-4 shadow-[0_20px_60px_rgba(95,63,48,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#2F2032] text-[#FFF4E7]">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B4654A]">
                Base Mood Loom
              </p>
              <h1 className="text-2xl font-black text-[#2F2032]">
                Weave today&apos;s mood onchain.
              </h1>
            </div>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#F2E7DB] px-3 py-2 text-sm font-semibold text-[#5A413A]">
                {shortAddress(address)}
              </span>
              <button
                className="rounded-full bg-[#2F2032] px-4 py-2 text-sm font-semibold text-white"
                onClick={disconnectWallet}
              >{disconnecting ? "Disconnecting" : "Disconnect"}</button>
            </div>
          ) : (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2F2032] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={availableConnectors.length === 0 || connecting}
              onClick={connectWallet}
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Connect
            </button>
          )}
        {walletStatus ? (
            <p className="w-full text-right text-xs font-semibold opacity-75">
              {walletStatus}
            </p>
          ) : null}
        </header>

        <div className="mt-4 grid flex-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4">
            <section className="rounded-[34px] bg-[#FFF9F2] p-5 shadow-[0_24px_60px_rgba(95,63,48,0.1)]">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-[16px] bg-[#EFDCC7] text-[#9B5C43]">
                  <Blend className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-[#2F2032]">New strand</h2>
                  <p className="text-sm text-[#7C665F]">
                    Capture the tone of the day in one woven line.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A06350]">
                    Mood label
                  </span>
                  <input
                    value={moodLabel}
                    onChange={(event) => setMoodLabel(event.target.value)}
                    maxLength={MAX_MOOD_LABEL_LENGTH}
                    className="mt-2 w-full rounded-[20px] border border-[#D7C8B6] bg-[#FFFDFC] px-4 py-3 text-base font-semibold text-[#2F2032] outline-none placeholder:text-[#AA938B]"
                    placeholder="Calm"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MOOD_OPTIONS.map((option) => {
                    const active = moodLabel === option.label;
                    return (
                      <button
                        key={option.label}
                        className="rounded-[18px] border px-3 py-3 text-left"
                        style={{
                          borderColor: active ? option.color : "#D7C8B6",
                          background: active ? option.accent : "#FFFDFC",
                        }}
                        onClick={() => applyMood(option.label, option.color)}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                          <span className="text-sm font-semibold text-[#2F2032]">
                            {option.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <label className="block">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A06350]">
                    Why this mood
                  </span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={MAX_MOOD_NOTE_LENGTH}
                    rows={5}
                    className="mt-2 w-full rounded-[20px] border border-[#D7C8B6] bg-[#FFFDFC] px-4 py-3 text-base leading-7 text-[#2F2032] outline-none placeholder:text-[#AA938B]"
                    placeholder="Describe the feeling or what shaped it."
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A06350]">
                    Strand color
                  </span>
                  <div className="mt-2 flex items-center gap-3 rounded-[20px] border border-[#D7C8B6] bg-[#FFFDFC] px-4 py-3">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(event) => setColorHex(event.target.value)}
                      className="h-10 w-12 rounded-md border-0 bg-transparent"
                    />
                    <span className="text-sm font-semibold text-[#5A413A]">{colorHex}</span>
                  </div>
                </label>

                {!isConnected ? (
                  <button
                    className="w-full rounded-[22px] bg-[#2F2032] px-4 py-3 text-base font-semibold text-white"
                    onClick={connectWallet}
                  >
                    Connect wallet
                  </button>
                ) : chainId !== base.id ? (
                  <button
                    className="w-full rounded-[22px] bg-[#F4C44E] px-4 py-3 text-base font-semibold text-[#2F2032] disabled:opacity-60"
                    disabled={switching}
                    onClick={() => switchChain({ chainId: base.id })}
                  >
                    {switching ? "Switching..." : "Switch to Base"}
                  </button>
                ) : (
                  <button
                    className="w-full rounded-[22px] bg-[#2F2032] px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
                    disabled={!canWeave || writing || confirming}
                    onClick={weaveMood}
                  >
                    {writing || confirming ? "Weaving..." : "Weave mood on Base"}
                  </button>
                )}

                <p className="text-sm leading-6 text-[#7C665F]">{statusText}</p>
              </div>
            </section>

            <section className="rounded-[34px] bg-[#F3E7D8] p-5 shadow-[0_24px_60px_rgba(95,63,48,0.08)]">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-[16px] bg-[#E5D0BC] text-[#9B5C43]">
                  <ScanSearch className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-[#2F2032]">Lookup strand</h2>
                  <p className="text-sm text-[#7C665F]">
                    Load a past mood entry by strand ID.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A06350]">
                    Strand ID
                  </span>
                  <input
                    value={entryIdInput}
                    onChange={(event) => setEntryIdInput(event.target.value)}
                    inputMode="numeric"
                    className="mt-2 w-full rounded-[20px] border border-[#D7C8B6] bg-[#FFFDFC] px-4 py-3 text-base font-semibold text-[#2F2032] outline-none"
                  />
                </label>

                <div className="rounded-[24px] bg-[#FFF9F2] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A06350]">
                    Current lookup
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#2F2032]">
                    {entry?.moodLabel || "Waiting for first strand"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#7C665F]">
                    {entry?.note ||
                      "Once a mood entry exists, this panel shows the mood, note, color, and date."}
                  </p>
                </div>
              </div>
            </section>
          </aside>

          <section className="rounded-[40px] bg-[#FFF9F2] p-5 shadow-[0_30px_70px_rgba(95,63,48,0.1)]">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-[#F4E2D4] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#A06350]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Personal mood tapestry
                </p>
                <h2 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-[#2F2032] sm:text-5xl">
                  Turn daily emotion into a woven, color-first ledger that feels personal
                  instead of transactional.
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[#7C665F] sm:text-lg">
                  Choose a mood label, write one honest line, and let Base hold the strand.
                  Over time the board becomes a visual memory of how your days actually felt.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[28px] bg-[#F3E7D8] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A06350]">
                    Total strands
                  </p>
                  <p className="mt-2 text-5xl font-black text-[#2F2032]">
                    {totalEntries || "00"}
                  </p>
                  <p className="mt-2 text-sm text-[#7C665F]">Mood entries on Base</p>
                </div>
                <div className="rounded-[28px] p-5 text-white" style={{ backgroundColor: colorHex }}>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/80">
                    Today&apos;s tone
                  </p>
                  <p className="mt-2 text-3xl font-black">{moodLabel}</p>
                  <p className="mt-2 text-sm text-white/80">Custom strand color ready</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[34px] bg-[#F6EDE3] p-5">
                <div className="grid gap-3">
                  {activePalette.map((shade, index) => (
                    <div
                      key={`${shade}-${index}`}
                      className="flex items-center gap-4 rounded-[24px] px-5 py-4"
                      style={{
                        backgroundColor: shade,
                        marginLeft: `${index % 2 === 0 ? 0 : 18}px`,
                        marginRight: `${index % 2 === 0 ? 18 : 0}px`,
                      }}
                    >
                      <span className="text-sm font-black uppercase tracking-[0.18em] text-[#2F2032]/70">
                        {index === 0 ? "Lead strand" : `Weft ${index}`}
                      </span>
                      <span className="ml-auto text-sm font-semibold text-[#2F2032]">
                        {index === 0
                          ? entry?.moodLabel || moodLabel
                          : MOOD_OPTIONS[index % MOOD_OPTIONS.length]?.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[28px] bg-[#2F2032] p-5 text-white">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F7D38D]">
                    Latest strand
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className="h-5 w-5 rounded-full border border-white/30"
                      style={{ backgroundColor: entry?.colorHex ?? colorHex }}
                    />
                    <p className="text-3xl font-black">{entry?.moodLabel || moodLabel}</p>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/80">
                    {entry?.note || note}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-[#F3E7D8] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A06350]">
                      Strand count
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#2F2032]">
                      {entry?.strandCount ? entry.strandCount.toString() : "--"}
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-[#F3E7D8] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A06350]">
                      Date
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#2F2032]">
                      {formatDate(entry?.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] bg-[#F3E7D8] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A06350]">
                    Author
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#2F2032]">
                    {entry?.author && entry.author !== ZERO_ADDRESS
                      ? shortAddress(entry.author)
                      : "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ["01", "Pick a mood", "Choose a label and strand color"],
                ["02", "Write one line", "Keep the emotional context human"],
                ["03", "Weave on Base", "Build a visual, onchain mood archive"],
              ].map(([step, label, sub]) => (
                <div key={step} className="rounded-[24px] bg-[#F6EDE3] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A06350]">
                    Step {step}
                  </p>
                  <p className="mt-2 text-xl font-black text-[#2F2032]">{label}</p>
                  <p className="mt-1 text-sm text-[#7C665F]">{sub}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
