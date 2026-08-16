export class SpeechService {
  private recognition: any;
  private isListening: boolean = false;
  private onResultCallback?: (finalText: string, interimText: string) => void;
  private onErrorCallback?: (error: string) => void;
  private onEndCallback?: () => void;

  constructor() {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (this.onResultCallback) {
          this.onResultCallback(finalTranscript, interimTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };
    } else {
      console.warn('SpeechRecognition API not supported in this browser.');
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public start(
    onResult: (finalText: string, interimText: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ) {
    if (!this.isSupported()) {
      onError('not_supported');
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e: any) {
      console.error('Failed to start speech recognition', e);
      onError(e.message);
    }
  }

  public stop() {
    if (this.isListening && this.recognition) {
      this.recognition.stop();
    }
  }
}

export const speechService = new SpeechService();
