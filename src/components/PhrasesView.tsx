import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  Copy,
  Languages,
  Loader2,
  Sparkles,
  Volume2,
} from "lucide-react";
import { PHRASE_CATEGORIES, PHRASES } from "../data/phrases";
import type { Phrase } from "../types";
import { useChatContext } from "../hooks/useChatContext";
import { useAiEnabled } from "../hooks/useAiEnabled";
import { translateText, type TranslateLang } from "../services/translate";
import {
  getSpanishVoiceLabel,
  initSpeechVoices,
  speakSpanish,
  speakTranslated,
} from "../utils/speech";

type ViewMode = "cards" | "translate";

export function PhrasesView() {
  const [mode, setMode] = useState<ViewMode>("cards");
  const [category, setCategory] = useState<Phrase["category"] | "all">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const deckRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [from, setFrom] = useState<TranslateLang>("en");
  const [to, setTo] = useState<TranslateLang>("es");
  const [output, setOutput] = useState("");
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translateSource, setTranslateSource] = useState<"instant" | "ai" | null>(null);
  const [useNaturalAi, setUseNaturalAi] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);
  const [voiceLabel, setVoiceLabel] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const { budget } = useChatContext();
  const { enabled: aiEnabled } = useAiEnabled();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initSpeechVoices();
    const refresh = () => setVoiceLabel(getSpanishVoiceLabel());
    refresh();
    window.speechSynthesis?.addEventListener("voiceschanged", refresh);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", refresh);
  }, []);

  const filtered =
    category === "all" ? PHRASES : PHRASES.filter((p) => p.category === category);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const onScroll = () => {
    const el = deckRef.current;
    if (!el) return;
    const card = el.querySelector(".phrase-card");
    if (!card) return;
    const w = (card as HTMLElement).offsetWidth + 12;
    setActiveIndex(Math.round(el.scrollLeft / w));
  };

  const swapDirection = () => {
    setFrom(to);
    setTo(from);
    setInput(output || input);
    setOutput("");
    setTranslateError(null);
    setTranslateSource(null);
  };

  const runTranslate = useCallback(
    async (text: string, sourceLang: TranslateLang, targetLang: TranslateLang) => {
      const trimmed = text.trim();
      if (trimmed.length < 2) {
        setOutput("");
        setTranslateSource(null);
        setTranslateError(null);
        return;
      }

      setTranslating(true);
      setTranslateError(null);

      try {
        const wantAi = useNaturalAi && aiEnabled && budget.canUse;
        const result = await translateText(trimmed, sourceLang, targetLang, wantAi);
        setOutput(result.text);
        setTranslateSource(result.source);
        if (result.usage && result.costUsd) {
          budget.recordUsage(result.usage, result.costUsd);
        } else if (result.costUsd != null) {
          budget.recordUsage({ input_tokens: 0, output_tokens: 0 }, result.costUsd);
        }
      } catch (e) {
        setOutput("");
        setTranslateSource(null);
        setTranslateError(e instanceof Error ? e.message : "Translation failed");
      } finally {
        setTranslating(false);
      }
    },
    [aiEnabled, budget, useNaturalAi],
  );

  useEffect(() => {
    if (mode !== "translate") return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runTranslate(input, from, to);
    }, 650);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, from, to, mode, runTranslate]);

  const copyTranslation = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopiedTranslation(true);
    setTimeout(() => setCopiedTranslation(false), 2000);
  };

  const hearSpanish = async (text: string) => {
    setSpeaking(true);
    try {
      await speakSpanish(text);
      setVoiceLabel(getSpanishVoiceLabel());
    } finally {
      setSpeaking(false);
    }
  };

  const hearTranslated = async (text: string) => {
    setSpeaking(true);
    try {
      await speakTranslated(text, to);
      if (to === "es") setVoiceLabel(getSpanishVoiceLabel());
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <div className="phrases-view">
      <div className="phrase-mode-tabs">
        <button
          type="button"
          className={`phrase-mode-tab ${mode === "cards" ? "active" : ""}`}
          onClick={() => setMode("cards")}
        >
          Phrase cards
        </button>
        <button
          type="button"
          className={`phrase-mode-tab ${mode === "translate" ? "active" : ""}`}
          onClick={() => setMode("translate")}
        >
          <Languages size={14} /> Auto translate
        </button>
      </div>

      {mode === "cards" ? (
        <>
          <p className="phrases-intro">
            Swipe cards · tap to copy · Hear it uses a Spanish accent (online)
            {voiceLabel ? ` · ${voiceLabel}` : ""}
          </p>

          <div className="phrase-tabs">
            <button
              type="button"
              className={`phrase-tab ${category === "all" ? "active" : ""}`}
              onClick={() => {
                setCategory("all");
                setActiveIndex(0);
              }}
            >
              All
            </button>
            {PHRASE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`phrase-tab ${category === c.id ? "active" : ""}`}
                onClick={() => {
                  setCategory(c.id);
                  setActiveIndex(0);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="phrase-deck" ref={deckRef} onScroll={onScroll}>
            {filtered.map((phrase) => (
              <article key={phrase.id} className="phrase-card">
                <span className="phrase-category">
                  {PHRASE_CATEGORIES.find((c) => c.id === phrase.category)?.label}
                </span>
                <p className="phrase-es">{phrase.spanish}</p>
                <p className="phrase-en">{phrase.english}</p>
                <div className="phrase-actions">
                  <button
                    type="button"
                    className="phrase-action-btn"
                    onClick={() => copy(phrase.spanish, phrase.id)}
                  >
                    {copiedId === phrase.id ? (
                      <>
                        <Check size={16} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copy
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="phrase-action-btn phrase-action-btn--primary"
                    disabled={speaking}
                    onClick={() => hearSpanish(phrase.spanish)}
                  >
                    {speaking ? (
                      <>
                        <Loader2 size={16} className="spin" /> Playing…
                      </>
                    ) : (
                      <>
                        <Volume2 size={16} /> Hear it
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="phrase-dots">
            {filtered.map((_, i) => (
              <span key={i} className={`phrase-dot ${i === activeIndex ? "active" : ""}`} />
            ))}
          </div>
        </>
      ) : (
        <div className="translator-panel">
          <p className="phrases-intro">
            Type in English or Spanish. Translation updates automatically.
          </p>

          <div className="translator-direction">
            <span className="translator-lang">{from === "en" ? "English" : "Español"}</span>
            <button
              type="button"
              className="translator-swap"
              onClick={swapDirection}
              aria-label="Swap languages"
            >
              <ArrowLeftRight size={18} />
            </button>
            <span className="translator-lang">{to === "es" ? "Español" : "English"}</span>
          </div>

          <label className="translator-label" htmlFor="translator-input">
            {from === "en" ? "What do you want to say?" : "¿Qué quieres decir?"}
          </label>
          <textarea
            id="translator-input"
            className="translator-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              from === "en"
                ? "e.g. Where is the bathroom?"
                : "ej. ¿Dónde está el baño?"
            }
            rows={3}
          />

          {aiEnabled && (
            <label className="translator-ai-toggle">
              <input
                type="checkbox"
                checked={useNaturalAi}
                onChange={(e) => setUseNaturalAi(e.target.checked)}
                disabled={!budget.canUse}
              />
              <Sparkles size={14} />
              Natural Guatemalan Spanish (enhanced)
              {!budget.canUse && " (budget used)"}
            </label>
          )}

          <div className="translator-output">
            <div className="translator-output-head">
              <span className="translator-output-label">
                {to === "es" ? "En español" : "In English"}
              </span>
              {translating && (
                <span className="translator-status">
                  <Loader2 size={14} className="spin" /> Translating…
                </span>
              )}
              {!translating && translateSource && (
                <span className="translator-status">
                  {translateSource === "ai" ? "Web · enhanced" : "Instant"}
                </span>
              )}
            </div>

            {translateError ? (
              <p className="translator-error">{translateError}</p>
            ) : (
              <p className={`translator-result ${output ? "" : "translator-result--empty"}`}>
                {output || (input.trim().length >= 2 ? "…" : "Translation appears here")}
              </p>
            )}

            {output && (
              <div className="phrase-actions">
                <button type="button" className="phrase-action-btn" onClick={copyTranslation}>
                  {copiedTranslation ? (
                    <>
                      <Check size={16} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="phrase-action-btn phrase-action-btn--primary"
                  disabled={speaking}
                  onClick={() => hearTranslated(output)}
                >
                  {speaking ? (
                    <>
                      <Loader2 size={16} className="spin" /> Playing…
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} /> Hear it
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
