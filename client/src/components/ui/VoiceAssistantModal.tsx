import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Loader2, Check, AlertCircle, MessageSquare } from 'lucide-react';
import { speechService } from '../../services/SpeechService';
import { commandApi } from '../../api/command';
import { useCommandStore } from '../../store/useCommandStore';
import { useLocation, useNavigate } from 'react-router-dom';

type AssistantState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'CLARIFYING';

export default function VoiceAssistantModal() {
  const { isOpen, closeAssistant } = useCommandStore();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const [state, setState] = useState<AssistantState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [message, setMessage] = useState('Tap the microphone to speak');
  const [isTextInput, setIsTextInput] = useState(false);
  
  // History array to pass to the LLM
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  
  const stateRef = useRef(state);
  const transcriptRef = useRef(transcript);
  const isPendingRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
    transcriptRef.current = transcript;
  }, [state, transcript]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getContext = () => {
    const route = location.pathname;
    let activeId;
    if (route.startsWith('/trips/')) {
      activeId = route.split('/')[2];
    }
    return {
      currentRoute: route,
      activeId,
      localDate: new Date().toISOString().split('T')[0],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  };

  const processCommandMutation = useMutation({
    mutationFn: (text: string) => commandApi.processCommand(text, getContext(), chatHistory),
    onSuccess: (res, variables) => {
      if (res.status === 'needs_input' || res.status === 'needs_confirmation') {
        setState('CLARIFYING');
        setMessage(res.message);
        
        // Save the user's command and the AI's clarification question to history
        setChatHistory(prev => [
          ...prev, 
          { role: 'user', content: variables },
          { role: 'assistant', content: res.message }
        ]);
        
        setTranscript('');
        setIsTextInput(true);
        return;
      }

      if (res.status === 'success') {
        if (res.action === 'NAVIGATE' && res.data?.url) {
          navigate(res.data.url);
          closeAssistant();
          return;
        }

        setState('SUCCESS');
        setMessage(res.message);
        queryClient.invalidateQueries({ queryKey: ['habits'] });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
        queryClient.invalidateQueries({ queryKey: ['today-habits'] });
        queryClient.invalidateQueries({ queryKey: ['trips'] });
        queryClient.invalidateQueries({ queryKey: ['trip'] });
        
        setTimeout(() => {
          handleClose();
        }, 2500);
      } else {
        setState('ERROR');
        setMessage(res.message);
      }
    },
    onError: (err: any) => {
      setState('ERROR');
      setMessage(err.response?.data?.message || 'Failed to process command');
    }
  });

  useEffect(() => {
    isPendingRef.current = processCommandMutation.isPending;
  }, [processCommandMutation.isPending]);

  useEffect(() => {
    if (isOpen) {
      setState('IDLE');
      setTranscript('');
      setChatHistory([]);
      setMessage('Tap the microphone to speak');
      setIsTextInput(false);
    } else {
      speechService.stop();
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    }
  }, [isOpen]);

  const handleStartListening = () => {
    setState('LISTENING');
    setMessage('Listening... (Keep speaking or pause to submit)');
    setTranscript('');
    setIsTextInput(false);

    speechService.start(
      (finalText, interimText) => {
        // Show what they are saying in real time
        const currentText = (finalText + ' ' + interimText).trim();
        if (currentText) {
          setTranscript(currentText);
        }

        // Wait for 2.5 seconds of silence before auto-submitting
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        
        speechTimeoutRef.current = setTimeout(() => {
          if (currentText.trim()) {
            speechService.stop();
            setState('PROCESSING');
            setMessage('Understanding...');
            processCommandMutation.mutate(currentText.trim());
          }
        }, 2500);
      },
      (_err) => {
        setState('ERROR');
        setMessage('Could not understand speech. Please try again.');
      },
      () => {
        // If the speech ended automatically and we didn't process it yet
        if (stateRef.current === 'LISTENING' && !isPendingRef.current) {
          const finalTranscript = transcriptRef.current.trim();
          if (finalTranscript) {
            if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
            setState('PROCESSING');
            setMessage('Understanding...');
            processCommandMutation.mutate(finalTranscript);
          } else {
            setState('IDLE');
            setMessage('Tap the microphone to speak');
          }
        }
      }
    );
  };

  const handleStopListening = () => {
    speechService.stop();
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    
    if (transcript.trim()) {
      setState('PROCESSING');
      setMessage('Understanding...');
      processCommandMutation.mutate(transcript.trim());
    } else {
      setState('IDLE');
      setMessage('Tap the microphone to speak');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;
    setState('PROCESSING');
    setMessage('Understanding...');
    processCommandMutation.mutate(transcript.trim());
  };

  const handleClose = () => {
    speechService.stop();
    closeAssistant();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="bg-white dark:bg-surface-900 w-full sm:max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-8 relative"
        >
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 bg-surface-100 dark:bg-surface-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {/* Visual Indicator */}
          <div className="mb-8 mt-4 relative">
            {state === 'LISTENING' && (
              <>
                <motion.div 
                  animate={{ scale: [1, 1.5, 1] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-indigo-500/20 rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                  className="absolute inset-0 bg-indigo-500/40 rounded-full" 
                />
              </>
            )}
            
            <button
              onClick={state === 'LISTENING' ? handleStopListening : handleStartListening}
              disabled={state === 'PROCESSING'}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
                state === 'LISTENING' ? 'bg-indigo-500 shadow-indigo-500/50' :
                state === 'PROCESSING' ? 'bg-amber-500 shadow-amber-500/50' :
                state === 'SUCCESS' ? 'bg-emerald-500 shadow-emerald-500/50' :
                state === 'ERROR' ? 'bg-red-500 shadow-red-500/50' :
                'bg-surface-800 dark:bg-surface-800 shadow-surface-900/20 hover:scale-105'
              }`}
            >
              {state === 'PROCESSING' ? <Loader2 size={40} className="animate-spin" /> :
               state === 'SUCCESS' ? <Check size={40} /> :
               state === 'ERROR' ? <AlertCircle size={40} /> :
               <Mic size={40} />}
            </button>
          </div>

          {/* Text/Status */}
          <div className="text-center w-full max-w-[280px]">
            <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-2">
              {message}
            </h3>
            {transcript && state !== 'IDLE' && state !== 'ERROR' && (
              <p className="text-surface-500 italic text-sm">"{transcript}"</p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 w-full">
            {state === 'ERROR' ? (
              <div className="flex gap-3 w-full">
                <button onClick={() => { setIsTextInput(true); setState('IDLE'); }} className="btn-ghost flex-1">Type instead</button>
                <button onClick={handleStartListening} className="btn-primary flex-1">Try again</button>
              </div>
            ) : isTextInput || state === 'IDLE' || state === 'CLARIFYING' ? (
              <form onSubmit={handleTextSubmit} className="w-full relative">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Or type your command..."
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    if (!isTextInput) setIsTextInput(true);
                  }}
                  className="w-full bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50 rounded-full py-4 pl-12 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  type="submit"
                  disabled={!transcript.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-500 text-white p-2 rounded-full disabled:opacity-50"
                >
                  <Check size={16} />
                </button>
              </form>
            ) : null}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
