import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/lib/hooks/use-speech-recognition';

interface DictationButtonProps {
  onSelect: (text: string) => void;
  className?: string;
  buttonText?: string;
}

export function DictationButton({ onSelect, className, buttonText = "음성 입력" }: DictationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isListening, isSupported, toggleListening, transcript, interimTranscript, resetTranscript, updateTranscript } = useSpeechRecognition();

  if (!isSupported) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        if (isListening) toggleListening();
        resetTranscript();
      }
    }}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`text-xs flex items-center gap-1 transition-colors px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 font-bold ${className || ''}`}
        >
          <Mic className="w-3.5 h-3.5" /> {buttonText}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>음성 메모 입력</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={toggleListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-100 text-red-600 animate-pulse ring-4 ring-red-100'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>
          <div className="text-center text-sm font-medium text-gray-500 min-h-[1.25rem]">
            {isListening ? '말씀을 듣고 있습니다...' : '마이크를 눌러 입력을 시작하세요'}
          </div>
          <div className="relative">
            <textarea
              className="w-full h-32 p-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50"
              placeholder="여기에 인식된 텍스트가 나타납니다. 직접 수정할 수도 있습니다."
              value={transcript + (interimTranscript ? (transcript ? ' ' : '') + interimTranscript : '')}
              onChange={(e) => updateTranscript(e.target.value)}
            />
          </div>
          <Button 
            className="w-full"
            onClick={() => {
              if (transcript.trim() || interimTranscript.trim()) {
                onSelect((transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim());
              }
              setIsOpen(false);
              if (isListening) toggleListening();
              resetTranscript();
            }}
          >
            메모에 추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
