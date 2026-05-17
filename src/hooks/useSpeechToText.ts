"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;

  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function getSpeechErrorMessage(error: string) {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Bạn chưa cấp quyền micro.";
    case "audio-capture":
      return "Không truy cập được micro.";
    case "network":
      return "Speech recognition bị gián đoạn do mạng.";
    case "no-speech":
      return "Không nhận được giọng nói.";
    default:
      return "Không thể nhận diện giọng nói.";
  }
}

interface UseSpeechToTextOptions {
  lang?: string;
  onTranscriptChange: (transcript: string) => void;
}

export function useSpeechToText({
  lang = "vi-VN",
  onTranscriptChange,
}: UseSpeechToTextOptions) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const isSupported = useMemo(() => getSpeechRecognitionCtor() !== null, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    const RecognitionCtor = getSpeechRecognitionCtor();

    if (!RecognitionCtor) {
      setError("Trình duyệt này chưa hỗ trợ voice input.");
      return;
    }

    recognitionRef.current?.abort();
    onTranscriptChange("");
    setError(null);

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0]?.transcript ?? "";
      }

      onTranscriptChange(transcript.trim());
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      setError(getSpeechErrorMessage(event.error));
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, onTranscriptChange]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return {
    error,
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
