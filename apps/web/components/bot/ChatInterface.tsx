'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Send, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

export function ChatInterface({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: '안녕하세요! 빠르고 정확한 매물 접수 봇입니다. 어떤 매물을 내놓으시겠어요? (예: 아파트, 상가, 공장)',
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial TTS greeting if speaker is on
  useEffect(() => {
    if (isSpeakerOn && messages.length === 1) {
      speak(messages[0].content);
    }
  }, []);

  const speak = (text: string) => {
    if (!isSpeakerOn) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
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
      
    } catch (error) {
      console.error(error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'bot', content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
      setMessages((prev) => [...prev, errorMessage]);
      speak(errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      // Logic to stop recognition would go here
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('이 브라우저에서는 음성 인식을 지원하지 않습니다.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
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

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm z-10 shrink-0">
        <div>
          <h1 className="font-semibold text-gray-800">매물 접수 AI 비서</h1>
          <p className="text-xs text-muted-foreground">중개사님께 정보를 안전하게 전달합니다.</p>
        </div>
        <button
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title={isSpeakerOn ? "음성 안내 끄기" : "음성 안내 켜기"}
        >
          {isSpeakerOn ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
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
            className={`p-3 rounded-full flex-shrink-0 transition-colors ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <textarea
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
