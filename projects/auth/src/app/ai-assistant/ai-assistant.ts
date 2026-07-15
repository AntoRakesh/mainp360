import { Component, ElementRef, OnDestroy, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiAssistantService } from './ai-assistant.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.scss',
})
export class AiAssistant implements OnDestroy, AfterViewChecked {
  open = false;
  inputText = '';
  listening = false;
  busy = false;
  micSupported = !!(window as any).webkitSpeechRecognition || !!(window as any).SpeechRecognition;

  messages: ChatMessage[] = [
    { role: 'assistant', text: 'Hi! Ask me to find a device, employee, visitor, contractor or user, or say a page name to open it.' },
  ];

  @ViewChild('messagesEnd') private messagesEnd?: ElementRef<HTMLDivElement>;
  private shouldScroll = false;
  private recognition: any = null;

  constructor(private assistant: AiAssistantService, private router: Router) {}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    this.stopListening();
  }

  toggle() {
    this.open = !this.open;
    if (!this.open) this.stopListening();
  }

  close() {
    this.open = false;
    this.stopListening();
  }

  send() {
    const text = this.inputText.trim();
    if (!text || this.busy) return;

    this.messages.push({ role: 'user', text });
    this.inputText = '';
    this.busy = true;
    this.shouldScroll = true;

    this.assistant.process(text).subscribe(reply => {
      this.busy = false;
      this.messages.push({ role: 'assistant', text: reply.text });
      this.shouldScroll = true;
      this.speak(reply.text);

      if (reply.navigate) {
        this.router.navigate([reply.navigate.route], {
          queryParams: reply.navigate.queryParams ?? {},
        });
      }
    });
  }

  toggleMic() {
    if (!this.micSupported) return;
    if (this.listening) {
      this.stopListening();
      return;
    }

    const SpeechRecognitionCtor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognitionCtor();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => { this.listening = true; };
    this.recognition.onerror = () => { this.listening = false; };
    this.recognition.onend = () => { this.listening = false; };
    this.recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      if (transcript) {
        this.inputText = transcript;
        this.send();
      }
    };

    this.recognition.start();
  }

  private stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.listening = false;
  }

  private speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      // speech synthesis not available/allowed — ignore silently
    }
  }
}
