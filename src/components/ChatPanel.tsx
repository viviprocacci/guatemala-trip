import { useRef, useState, useEffect } from "react";
import { Send } from "lucide-react";
import type { ChatMessage } from "../types";
import { useChatContext } from "../hooks/useChatContext";
import { useNavigation } from "../contexts/NavigationContext";
import { sendChatMessage } from "../services/ai";
import { localFallback, QUICK_PROMPTS } from "../services/chat";

const TRANSLATE_PATTERN = /translate|how do i say|cómo se dice|in spanish|what's spanish for|say in spanish/i;

export function ChatPanel({ aiEnabled }: { aiEnabled: boolean }) {
  const { context, budget } = useChatContext();
  const { consumePedroSeed } = useNavigation();
  const seededRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "¡Bienvenidos! I'm Pedro, your Guatemala travel companion. Ask me for advice, ideas, timing, whatever you need. (For Spanish, the Español tab has you covered.)",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
  };

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (TRANSLATE_PATTERN.test(trimmed)) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: new Date().toISOString() },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "That's what **Español** is for: phrase cards, instant translate, and speak-back. Ask me about the trip instead!",
          timestamp: new Date().toISOString(),
        },
      ]);
      setInput("");
      scrollToBottom();
      return;
    }

    if (aiEnabled && !budget.canUse) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Pedro's taking a breather on this device (~$5 cap). Clear site data to reset.",
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      if (!aiEnabled) {
        const reply = localFallback(trimmed);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: reply,
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      const apiHistory = history
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await sendChatMessage(apiHistory, context);
      if (result.costUsd != null || result.usage) {
        budget.recordUsage(
          result.usage ?? { input_tokens: 0, output_tokens: 0 },
          result.costUsd,
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.text,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Pedro hit a snag. ${e instanceof Error ? e.message : "Try again."}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (seededRef.current) return;
    const seed = consumePedroSeed();
    if (seed) {
      seededRef.current = true;
      void submit(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for map → Pedro handoff
  }, []);

  return (
    <div className="chat-panel">
      <div className="chat-body">
        {!context.tripStartDate && (
          <p className="context-hint">Set your trip start on Today. I'll give better advice when I know your day.</p>
        )}
        <div className="quick-prompts">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q.label}
              type="button"
              className="quick-btn"
              onClick={() => submit(q.prompt)}
              disabled={loading}
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className="chat-messages">
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.role}`}>
              {formatMarkdownLite(m.content)}
            </div>
          ))}
          {loading && (
            <div className="msg assistant thinking">
              <span className="scan-dots">Pedro's on it</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="chat-footer">
        <form
          className="chat-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Pedro anything about your trip…"
            disabled={loading}
          />
          <button type="submit" className="btn-primary btn-send" disabled={loading || !input.trim()}>
            <Send size={16} strokeWidth={1.5} />
          </button>
        </form>
      </div>
    </div>
  );
}

function formatMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
