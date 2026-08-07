'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Send, Volume2, VolumeX, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

export function ChatInterface({ agentId }: { agentId: string }) {
  const [isBetaTester, setIsBetaTester] = useState<boolean | null>(null);
  const [checkingBeta, setCheckingBeta] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: '안녕하세요! 빠르고 정확한 매물 접수 봇입니다. 어떤 매물을 내놓으시겠어요?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check beta permission on mount
  useEffect(() => {
    async function checkBeta() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/public/agent/${agentId}`);
        if (!res.ok) {
          setIsBetaTester(false);
        } else {
          const data = await res.json();
          setIsBetaTester(!!data.data?.is_beta_tester);
        }

      } catch (error) {
        console.error('Failed to verify beta status:', error);
        setIsBetaTester(false);
      } finally {
        setCheckingBeta(false);
      }
    }
    checkBeta();
  }, [agentId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize and auto-scroll textarea on input change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [input]);

  // Initial TTS greeting if speaker is on and verified beta tester
  useEffect(() => {
    if (messages.length === 1 && isBetaTester === true) {
      speak(messages[0].content);
    }
  }, [isBetaTester]);

  const speak = (text: string) => {
    if (!isSpeakerOn) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      // Strip emojis, asterisks, and markdown formatting characters
      const cleanedText = text
        .replace(/\*+/g, '') // Remove asterisks
        .replace(/[-#`_\n]/g, ' ') // Remove markdown bullets/lines
        .replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}]/gu, '') // Remove emojis
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.55; // Snappy speed (increased from 1.25)
      utterance.pitch = 1.15; // Energetic, bright pitch
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || isLoading) return;

    // Stop listening if active
    if (recognitionRef.current && isListening) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      
      const botMessage: Message = { id: (Date.now() + 1).toString(), role: 'bot', content: data.reply };
      setMessages((prev) => [...prev, botMessage]);
      speak(data.reply);

      if (data.isComplete) {
        // Switch to the completion page after the bot finishes speaking
        setTimeout(() => {
          setIsComplete(true);
        }, 3500);
      }
      
    } catch (error) {
      console.error(error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'bot', content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
      setMessages((prev) => [...prev, errorMessage]);
      speak(errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (isListening) return;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
      finalTranscript = '';
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInput((finalTranscript + interimTranscript).trim());
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('이 브라우저에서는 음성 인식을 지원하지 않습니다.');
        return;
      }
      startListening();
    }
  };

  if (checkingBeta) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-slate-500 font-medium">서비스 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!isBetaTester) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white select-none min-h-screen">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 shadow-inner mb-6">
            <span className="text-xl">🤖</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary to-indigo-500 text-white shadow-md mb-4 uppercase tracking-wider">
            Stealth Beta
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent sm:text-3xl">
            AI 접수 봇 준비 중
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300 font-normal">
            해당 공인중개사의 대화형 AI 매물 접수 서비스는 현재 비공개 개발(스텔스 모드)로 진행되고 있습니다.
            <br />
            <br />
            정식 출시 이후 사용하실 수 있으며, 베타 테스터 권한이 있는 대표 계정만 접속할 수 있습니다.
          </p>
          <div className="mt-8 w-full border-t border-white/10 pt-6">
            <p className="text-xs text-slate-500 font-medium">© 2026 랜드노트. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white min-h-screen">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20 border border-green-500/30 shadow-inner mb-6 animate-bounce">
            <Check className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent sm:text-3xl">
            매물 접수 완료!
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300 font-normal">
            중개사님께 정보가 안전하게 전달되었습니다.<br />
            빠른 시일 내에 확인 후 연락드리겠습니다.
          </p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                if (window.opener) {
                  window.close();
                } else {
                  window.location.href = 'about:blank';
                }
              }
            }}
            className="mt-8 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-semibold shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all"
          >
            창 닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm z-10 shrink-0">
        <div>
          <h1 className="font-semibold text-gray-800">매물 접수 AI 비서</h1>
          <p className="text-xs text-muted-foreground">중개사님께 정보를 안전하게 전달합니다.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title={isSpeakerOn ? "음성 안내 끄기" : "음성 안내 켜기"}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                if (window.opener) {
                  window.close();
                } else {
                  window.location.href = 'about:blank';
                }
              }
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="창 닫기"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-white border text-gray-800 rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>

            {msg.id === '1' && messages.length === 1 && (
              <div className="mt-3 flex flex-wrap gap-2 max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  onClick={() => handleSend('아파트')}
                  className="px-4 py-2 text-[13px] font-bold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                >
                  🏠 아파트
                </button>
                <button
                  onClick={() => handleSend('상가')}
                  className="px-4 py-2 text-[13px] font-bold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                >
                  🏬 상가
                </button>
                <button
                  onClick={() => handleSend('공장')}
                  className="px-4 py-2 text-[13px] font-bold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                >
                  🏭 공장
                </button>
                <button
                  onClick={() => handleSend('토지')}
                  className="px-4 py-2 text-[13px] font-bold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                >
                  🌳 토지
                </button>
              </div>
            )}

            {msg.role === 'bot' && messages[messages.length - 1] === msg && (
              (() => {
                const content = msg.content;
                if (content.includes('요약') || content.includes('완료') || content.includes('성공')) return null;
                const isAskingTx = content.includes('거래 종류') || content.includes('거래 유형') || content.includes('거래 형태') || (content.includes('매매') && content.includes('전세') && content.includes('월세'));
                if (!isAskingTx) return null;
                return (
                  <div className="mt-3 flex flex-wrap gap-2 max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <button
                      onClick={() => handleSend('매매')}
                      className="px-4 py-2 text-[13px] font-bold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      💰 매매
                    </button>
                    <button
                      onClick={() => handleSend('전세')}
                      className="px-4 py-2 text-[13px] font-bold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      🔑 전세
                    </button>
                    <button
                      onClick={() => handleSend('월세')}
                      className="px-4 py-2 text-[13px] font-bold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      💸 월세
                    </button>
                  </div>
                );
              })()
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center shadow-sm">
              <Loader2 className="w-4 h-4 text-primary animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">생각하는 중...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-3xl border focus-within:ring-1 focus-within:ring-primary/50 transition-all">
          <button
            onClick={toggleListen}
            className={`p-3 rounded-full flex-shrink-0 transition-all ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/20' 
                : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="여기에 입력하거나 마이크를 누르세요"
            className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-3 px-2 min-h-[44px] max-h-[120px] text-[15px]"
            rows={1}
            style={{
              height: 'auto',
            }}
          />
          
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[44px] w-[44px] rounded-full flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
