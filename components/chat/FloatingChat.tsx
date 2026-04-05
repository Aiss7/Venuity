'use client';

import React, { useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isTextUIPart } from 'ai';
import { Sparkles, X, Send, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

// ---------------------------------------------------------------------------
// FloatingChat — AI-powered venue discovery assistant.
// Anchored bottom-left of its relative parent (the map region in page.tsx).
// Uses @ai-sdk/react v6 useChat with DefaultChatTransport → /api/chat.
//
// v6 API differences from v3:
//   - transport: new DefaultChatTransport({ api }) replaces { api: '...' }
//   - sendMessage({ role, parts }) replaces handleSubmit
//   - status: 'submitted' | 'streaming' | 'ready' | 'error' replaces isLoading
//   - messages[n].parts (UIMessagePart[]) replaces messages[n].content string
// ---------------------------------------------------------------------------

export function FloatingChat() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-scroll to newest message.
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;

    // role is auto-set to 'user' by sendMessage — do NOT pass it explicitly
    // (CreateUIMessage = Omit<UIMessage, 'id' | 'role'>)
    sendMessage({ parts: [{ type: 'text', text }] });

    setInputValue('');
  }

  // Extract non-empty text from a UIMessage's parts array.
  // v6 emits step-start parts with empty text — filter those out.
  function getMessageText(msg: (typeof messages)[number]): string {
    return (msg.parts ?? [])
      .filter(isTextUIPart)
      .map((p) => p.text)
      .filter(Boolean)
      .join('');
  }

  return (
    <div className="absolute bottom-6 left-6 z-50 flex flex-col items-start justify-end">

      {/* ── Chat window ─────────────────────────────────────────────────── */}
      {isOpen && (
        <Card className="w-[350px] h-[500px] mb-4 flex flex-col shadow-2xl border-sidebar-border bg-sidebar overflow-hidden animate-in slide-in-from-bottom-5 duration-300 p-0">

          {/* Header */}
          <div className="p-3 border-b border-sidebar-border flex items-center justify-between bg-sidebar-accent/30 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/15">
                <MapPin size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">
                  Venuity AI
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ask me about event venues
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={15} />
            </Button>
          </div>

          {/* Messages area */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-3">

              {/* Welcome message (empty state) */}
              {messages.length === 0 && (
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                    <Sparkles size={12} className="text-primary" />
                  </div>
                  <div className="bg-muted text-foreground rounded-lg rounded-tl-none p-3 max-w-[90%] text-sm leading-relaxed">
                    Hi! I&apos;m your Venuity AI assistant. Tell me about your event — capacity, type, or budget — and I&apos;ll find the perfect space in Butuan City. 🗺️
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const text = getMessageText(msg);
                if (!text) return null;

                return (
                  <div
                    key={msg.id}
                    className={[
                      'flex',
                      msg.role === 'user'
                        ? 'justify-end'
                        : 'justify-start items-start gap-2.5',
                    ].join(' ')}
                  >
                    {/* AI avatar */}
                    {msg.role === 'assistant' && (
                      <div className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                        <Sparkles size={12} className="text-primary" />
                      </div>
                    )}

                    <div
                      className={[
                        'rounded-lg p-3 text-sm leading-relaxed break-words',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none max-w-[85%]'
                          : 'bg-muted text-foreground rounded-tl-none max-w-[90%]',
                      ].join(' ')}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="text-sm space-y-3">
                          <ReactMarkdown
                            components={{
                              p: ({node, ...props}) => <p className="leading-relaxed" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-2 mb-1" {...props} />,
                            }}
                          >
                            {text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        text
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming typing indicator */}
              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                    <Sparkles size={12} className="text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg rounded-tl-none px-4 py-3">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-sidebar-border flex gap-2 bg-background/50 shrink-0"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. Wedding for 200 guests…"
              className="flex-1 h-9 text-sm bg-muted/50 border-border/60 focus-visible:bg-background"
              disabled={isLoading}
              aria-label="Chat message"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              <Send size={15} />
            </Button>
          </form>
        </Card>
      )}

      {/* ── Floating trigger button ──────────────────────────────────────── */}
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        size="icon"
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {isOpen ? <X size={22} /> : <Sparkles size={22} />}
      </Button>
    </div>
  );
}
