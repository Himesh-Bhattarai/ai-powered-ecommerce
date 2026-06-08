"use client";

import { FormEvent, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type ChatbotButtonProps = {
  onQuery?: (query: string) => void;
};

const suggestions = [
  "Gift for a gamer",
  "Upgrade my desk",
  "Pet owner essentials",
];

export default function ChatbotButton({ onQuery }: ChatbotButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "What are you shopping for?",
    },
  ]);
  const nextId = useRef(2);

  const sendQuery = (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: nextId.current++,
        role: "user",
        text: trimmedQuery,
      },
      {
        id: nextId.current++,
        role: "assistant",
        text: "I found a direction for you. The product grid is updating now.",
      },
    ]);
    setMessage("");
    onQuery?.(trimmedQuery);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendQuery(message);
  };

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      {isOpen && (
        <section
          aria-label="Shopping assistant"
          className="w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-950 px-5 py-4 text-white">
            <div>
              <p className="text-base font-bold">Bazar assistant</p>
              <p className="text-sm text-slate-300">Ask for products naturally</p>
            </div>
            <button
              type="button"
              aria-label="Close chatbot"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="max-h-96 min-h-64 space-y-3 overflow-y-auto bg-slate-50 p-5">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[82%] rounded-lg px-4 py-2.5 text-sm leading-6 ${
                    item.role === "user"
                      ? "bg-teal-600 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 bg-white p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendQuery(suggestion)}
                className="shrink-0 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <label className="sr-only" htmlFor="chatbot-query">
                Shopping query
              </label>
              <input
                id="chatbot-query"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Try: home office setup"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
      >
        <svg
          aria-hidden="true"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M7 18.5 4.5 21v-4.5A8 8 0 1 1 7 18.5Z"
            />
          )}
        </svg>
      </button>
    </div>
  );
}
