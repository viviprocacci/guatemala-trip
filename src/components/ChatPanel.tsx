import { useRef, useState } from "react";
import { Send } from "lucide-react";
import type { ChatMessage } from "../types";
import { useChatContext } from "../hooks/useChatContext";
import { sendChatMessage } from "../services/ai";
import { localFallback, QUICK_PROMPTS } from "../services/chat";

export function ChatPanel({ aiEnabled }: { aiEnabled: boolean }) {
  const { context, budget } = useChatContext();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey — I'm Scout. I know your day, weather, and what's booked. Ask me anything about the trip.",
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

    if (aiEnabled && !budget.canUse) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Scout fuel's empty on this device (~$5 cap). Clear site data to reset, or raise your limit in the Anthropic console.",
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
          content: `Scout hit a snag — ${e instanceof Error ? e.message : "try again in a moment"}.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-body">
        {!context.tripStartDate && (
          <p className="context-hint">Set your trip start on Today — Scout gets sharper with dates.</p>
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
              <span className="scan-dots">Scouting</span>
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
            placeholder="Ask Scout anything…"
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
