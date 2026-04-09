import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Mic, MicOff, Send, Loader2, Trash2 } from "lucide-react";
import type { Language, ChatMessage } from "@/types/agent";
import { vectorStore } from "@/lib/vectorStore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";

interface IWebSpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface IWebSpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface IWebSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: IWebSpeechRecognition, ev: IWebSpeechRecognitionEvent) => void) | null;
  onerror: ((this: IWebSpeechRecognition, ev: IWebSpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: IWebSpeechRecognition, ev: Event) => void) | null;
}



interface QueryChatProps {
  language: Language;
}

export function QueryChat({ language }: QueryChatProps) {
  const { user, role } = useAuth();
  const isTE = language === "te";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<IWebSpeechRecognition | null>(null);

  useEffect(() => {
    // Load chat history from localStorage
    const saved = localStorage.getItem(`agrisense_chat_${role}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: Omit<ChatMessage, 'timestamp'> & { timestamp: string | Date }) => ({ 
          ...m, 
          timestamp: new Date(m.timestamp) 
        })));
      } catch (e) {
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: isTE
            ? "నమస్కారం! శిక్షణ డేటా ఆధారంగా మీ ప్రశ్నలకు సమాధానం ఇస్తాను. అడగండి!"
            : "Hello! I can answer your questions based on the trained data. Ask me anything!",
          timestamp: new Date(),
        }]);
      }
    } else {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: isTE
          ? "నమస్కారం! శిక్షణ డేటా ఆధారంగా మీ ప్రశ్నలకు సమాధానం ఇస్తాను. అడగండి!"
          : "Hello! I can answer your questions based on the trained data. Ask me anything!",
        timestamp: new Date(),
      }]);
    }
  }, [role, isTE]);

  const saveChat = (newMessages: ChatMessage[]) => {
    localStorage.setItem(`agrisense_chat_${role}`, JSON.stringify(newMessages));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakText = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    
    // Clean text by removing markdown symbols (e.g. **, *, #)
    const cleanText = text.replace(/[*#`]/g, '');
    
    // Strictly bind to the current selected language, disable auto-detection
    const targetLang = isTE ? "te-IN" : "en-US";
    const targetLangMatch = isTE ? "te" : "en";
    
    // Split long text into paragraphs instead of sentences. This allows the native voice engine to naturally handle commas and periods, preventing a robotic, choppy sound.
    const chunks = cleanText.split(/\n+/).filter(c => c.trim().length > 0);
    
    const voices = window.speechSynthesis.getVoices();
    console.log("Total voices available:", voices.length);

    const availableVoices = voices.filter(v => v.lang.startsWith(targetLangMatch));

    // STRICT INCLUSION: Only allow positively identified female voices. No references to male keywords natively.
    const femaleVoices = availableVoices.filter(v => {
      const name = v.name.toLowerCase();
      return name.includes("female") || 
             name.includes("swara") || 
             name.includes("shruti") || 
             name.includes("neerja") || 
             name.includes("zira") || 
             name.includes("samantha") || 
             name.includes("hazel") || 
             name.includes("victoria") ||
             (name.includes("google") && !name.includes("uk english")); // Often uk english is male if not strictly defined
    });

    // Prioritize known high-quality female voices, or pick the first available voice for that language (to prevent English voices from reading Telugu) 
    let selectedVoice = femaleVoices[0] || availableVoices[0];

    // Extreme strict fallback: If absolutely no voice exists in the target lang, force grab ANY female voice globally
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.name.toLowerCase().includes("female") || 
                                       v.name.toLowerCase().includes("swara") || 
                                       v.name.toLowerCase().includes("shruti") || 
                                       v.name.toLowerCase().includes("zira") || 
                                       v.name.toLowerCase().includes("samantha"));
    }

    if (selectedVoice) {
      console.log("Voice selected:", selectedVoice.name);
    }

    // Queue up the chunks to be spoken sequentially
    chunks.forEach((chunk) => {
      const utterance = new SpeechSynthesisUtterance(chunk.trim());
      utterance.lang = targetLang;
      // Precise 0.9 rate for Telugu for a highly professional, deliberate reading pace. 1.0 for English.
      utterance.rate = isTE ? 0.9 : 1.0; 
      // Strictly 1.0 pitch. Altering pitch causes robotic distortion on many high-end native Indian voices.
      utterance.pitch = 1.0; 
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    });
  }, [isTE]);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const clearChat = () => {
    localStorage.removeItem(`agrisense_chat_${role}`);
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: isTE
        ? "నమస్కారం! శిక్షణ డేటా ఆధారంగా మీ ప్రశ్నలకు సమాధానం ఇస్తాను. అడగండి!"
        : "Hello! I can answer your questions based on the trained data. Ask me anything!",
      timestamp: new Date(),
    }]);
    toast({ title: isTE ? "చాట్ క్లియర్ చేయబడింది" : "Chat cleared" });
  };

  useEffect(() => {
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    handleVoicesChanged();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isLoading || !user || !role) return;

    // Strict Input Validation
    const hasTelugu = /[\u0c00-\u0c7f]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);

    if (isTE && hasEnglish) {
      toast({ 
        title: "తెలుగు మాత్రమే", 
        description: "దయచేసి తెలుగులో మాత్రమే అడగండి (English characters are not allowed).", 
        variant: "destructive" 
      });
      return;
    }

    if (!isTE && hasTelugu) {
      toast({ 
        title: "English Only", 
        description: "Please use English characters only. Telugu is not allowed in this mode.", 
        variant: "destructive" 
      });
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveChat(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const askViaEdgeFunction = async (): Promise<string> => {
        const { data, error } = await supabase.functions.invoke("query-trained-data", {
          body: { question: text, language, role },
        });
        if (error) throw new Error(error.message || "Edge function invocation failed.");
        const answerFromEdge = data?.answer;
        if (!answerFromEdge || typeof answerFromEdge !== "string") {
          throw new Error("Edge function returned empty answer.");
        }
        return answerFromEdge;
      };

      const askViaClientGemini = async (): Promise<string> => {
        const matches = await vectorStore.search(text, role);
        const context = matches.length > 0
          ? matches.map((m) => m.text).join("\n\n")
          : "No training data available for this role yet.";

        const key = import.meta.env.VITE_GEMINI_API_KEY || "";
        if (!key) {
          throw new Error("VITE_GEMINI_API_KEY is missing in deployed environment.");
        }

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
          You are the AgriSense Assistant for the role: ${role}.
          CRITICAL INSTRUCTIONS: 
          ${isTE
            ? '- You MUST respond ENTIRELY in Telugu. Do not use English characters.\n- CRITICAL: Write in a highly natural, conversational, and native Telugu tone (వాడుక భాష). Do NOT use formal or textbook (Granthikam) Telugu. Speak exactly like a local native speaker would in everyday conversation with a farmer.\n- VERY IMPORTANT FOR VOICE ASSISTANT: Do NOT use any bullet points, hyphens, or symbols. Write in flowing, natural paragraphs. If you use numbers, spell them out in Telugu words (e.g., వంద, రెండు) instead of digits (100, 2) so the voice engine pronounces them perfectly in Telugu.'
            : '- You MUST respond ENTIRELY in English. Do not use any Telugu words or characters. Use a helpful, conversational, and natural tone. Avoid symbols and bullet points, use flowing paragraphs.'}
          - Do NOT use any markdown formatting (no asterisks, hashes, etc). Keep the response as clean, plain text so it can be easily spoken by a text-to-speech engine.
          - Knowledge Base Context: ${context}
          - User's Question: ${text}
        `;
        const result = await model.generateContent(prompt);
        return result.response.text();
      };

      let answer = "";
      try {
        // Prefer server-side route in production to avoid client-key/runtime issues.
        answer = await askViaEdgeFunction();
      } catch (edgeErr) {
        console.warn("query-trained-data edge function failed, falling back to client Gemini:", edgeErr);
        answer = await askViaClientGemini();
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: answer,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      saveChat(finalMessages);
      speakText(answer);
    } catch (err) {
      console.error("Chat error:", err);
      const message = err instanceof Error ? err.message : "";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: isTE
            ? "సమాధానం ఇవ్వడంలో సమస్య వచ్చింది. దయచేసి మళ్లీ ప్రయత్నించండి లేదా అడ్మిన్‌ని సంప్రదించండి."
            : "Unable to generate an answer right now. Please try again or contact admin.",
          timestamp: new Date(),
        },
      ]);
      toast({
        title: isTE ? "సేవా లోపం" : "Service Error",
        description: message || (isTE ? "కాన్ఫిగరేషన్ లేదా శిక్షణ డేటా సమస్య ఉండొచ్చు" : "It may be an environment or training data configuration issue"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const win = window as unknown as { 
      SpeechRecognition?: { new (): IWebSpeechRecognition };
      webkitSpeechRecognition?: { new (): IWebSpeechRecognition };
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = isTE ? "te-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e: IWebSpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) {
        setInput(transcript);
        handleSend(transcript);
      }
      setIsListening(false);
    };
    
    recognition.onerror = (event: IWebSpeechRecognitionErrorEvent) => {
      toast({ 
        title: isTE ? "వాయిస్ ఎర్రర్" : "Voice Error", 
        description: isTE ? "మళ్ళీ ప్రయత్నించండి" : "Please try again", 
        variant: "destructive" 
      });
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-secondary/20">
      <div className="px-4 py-2 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {role} Assistant
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearChat}
          className="text-muted-foreground hover:text-destructive h-7 text-[11px] gap-1"
        >
          <Trash2 className="h-3 w-3" />
          {isTE ? "క్లియర్" : "Clear"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all hover:shadow-md ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-card text-foreground rounded-bl-none border border-border/50 backdrop-blur-sm"
              }`}
            >
              <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
              <div className={`flex items-center gap-1.5 mt-2 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                <span className="text-[10px]">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {msg.role === "assistant" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/50 border border-border/30">
                    AI
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-card border border-border/50 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-4 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="flex items-center gap-2.5 max-w-4xl mx-auto bg-card rounded-full p-1.5 shadow-lg border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Button 
            variant={isListening ? "agent" : "ghost"} 
            size="icon" 
            onClick={toggleVoice} 
            className={`shrink-0 rounded-full transition-all ${isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "text-muted-foreground"}`}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isTE ? "మీ ప్రశ్నను ఇక్కడ అడగండి..." : "Ask your question here..."}
            className="flex-1 bg-transparent border-none px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          <Button 
            variant="agent" 
            size="icon" 
            onClick={() => handleSend()} 
            disabled={!input.trim() || isLoading} 
            className="shrink-0 rounded-full shadow-md"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        {isListening && (
          <div className="flex justify-center items-center gap-2 mt-3 overflow-hidden h-4">
             {[...Array(5)].map((_, i) => (
               <div 
                 key={i} 
                 className="w-1 bg-primary rounded-full animate-pulse" 
                 style={{ 
                   height: `${Math.random() * 100}%`,
                   animationDelay: `${i * 100}ms`
                 }} 
               />
             ))}
             <span className="text-[10px] font-medium text-primary uppercase tracking-widest leading-none">
               {isTE ? "రికార్డ్ అవుతోంది" : "Recording"}
             </span>
          </div>
        )}
      </div>
    </div>
  );
}
