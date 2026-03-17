import { Quiz, Question } from "../types";
import { playPCMAsync, stopPCM } from "./tts";
import { playPop, playTick, playSuccess } from "./sfx";

export class QuizRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  quiz: Quiz;
  stream: MediaStream;
  recorder: MediaRecorder;
  audioCtx: AudioContext;
  masterGain: GainNode;
  dest: MediaStreamAudioDestinationNode;
  
  // State
  currentQuestionIndex = 0;
  phase = 'init';
  phaseStartTime = 0;
  isRecording = false;
  recordedChunks: Blob[] = [];
  isCancelled = false;
  extension = 'webm';
  silentOscillator: OscillatorNode | null = null;
  textCache: { index: number, lines: string[] } = { index: -1, lines: [] };
  
  // Assets
  bgImages: (HTMLImageElement | HTMLVideoElement | null)[] = [];
  qImages: (HTMLImageElement | HTMLVideoElement | null)[] = [];
  bgmAudio: HTMLAudioElement | null = null;
  bgmSource: MediaElementAudioSourceNode | null = null;
  
  // Constants
  OPTION_LABELS = ["A", "B", "C", "D"];
  OPTION_COLORS = [
    ['#3b82f6', '#2563eb'], // blue
    ['#a855f7', '#9333ea'], // purple
    ['#ec4899', '#db2777'], // pink
    ['#f97316', '#ea580c']  // orange
  ];

  onProgress?: (progress: number) => void;
  onComplete?: (url: string, extension: string) => void;
  onError?: (err: any) => void;

  constructor(quiz: Quiz) {
    this.quiz = quiz;
    this.canvas = document.createElement('canvas');
    this.canvas.width = quiz.aspectRatio === '16:9' ? 1920 : 1080;
    this.canvas.height = quiz.aspectRatio === '16:9' ? 1080 : 1920;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.dest = this.audioCtx.createMediaStreamDestination();
    
    // Connect master gain to both the recording destination and the speakers
    this.masterGain.connect(this.dest);
    this.masterGain.connect(this.audioCtx.destination);
    
    // @ts-ignore
    const canvasStream = this.canvas.captureStream(60); // 60 FPS for smoother, higher quality video
    const tracks = [...canvasStream.getVideoTracks(), ...this.dest.stream.getAudioTracks()];
    this.stream = new MediaStream(tracks);
    
    let mimeType = 'video/webm; codecs=vp9';
    this.extension = 'webm';
    
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
      this.extension = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm; codecs=h264')) {
      mimeType = 'video/webm; codecs=h264';
    }
    
    this.recorder = new MediaRecorder(this.stream, { 
      mimeType,
      videoBitsPerSecond: 15000000 // 15 Mbps for high quality
    });
    
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.recorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      if (this.onComplete) this.onComplete(url, this.extension);
    };
  }
  
  async loadImages() {
    const loadMedia = (url: string): Promise<HTMLImageElement | HTMLVideoElement> => {
      return new Promise((resolve, reject) => {
        if (url.match(/\.(mp4|webm|ogg)$/i)) {
          const vid = document.createElement('video');
          vid.crossOrigin = 'anonymous';
          vid.src = url;
          vid.muted = true;
          vid.loop = true;
          vid.onloadeddata = () => resolve(vid);
          vid.onerror = (e) => {
            console.error("Video load error:", e);
            reject(e);
          };
          vid.load();
        } else {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = (e) => {
            console.error("Image load error:", e);
            reject(e);
          };
          img.src = url;
        }
      });
    };

    for (const q of this.quiz.questions) {
      if (q.backgroundImage) {
        try {
          const media = await loadMedia(q.backgroundImage);
          this.bgImages.push(media);
        } catch (e) {
          this.bgImages.push(null);
        }
      } else {
        this.bgImages.push(null);
      }
      
      if (q.questionImage) {
        try {
          const media = await loadMedia(q.questionImage);
          this.qImages.push(media);
        } catch (e) {
          this.qImages.push(null);
        }
      } else {
        this.qImages.push(null);
      }
    }

    if (this.quiz.bgmUrl) {
      try {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = this.quiz.bgmUrl;
        audio.loop = true;
        audio.volume = 0.15; // Lower volume for background music
        await new Promise((resolve, reject) => {
          audio.oncanplaythrough = resolve;
          audio.onerror = reject;
          // Timeout in case it hangs
          setTimeout(resolve, 3000);
        });
        this.bgmAudio = audio;
        this.bgmSource = this.audioCtx.createMediaElementSource(audio);
        this.bgmSource.connect(this.masterGain);
      } catch (e) {
        console.error("Failed to load BGM:", e);
      }
    }
  }

  async start() {
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    await this.loadImages();
    
    if (this.bgmAudio) {
      this.bgmAudio.play().catch(console.error);
    }
    
    // Start silent oscillator to prevent MediaRecorder from dropping silent audio frames
    this.silentOscillator = this.audioCtx.createOscillator();
    this.silentOscillator.type = 'sine';
    this.silentOscillator.frequency.value = 0; // Inaudible
    this.silentOscillator.connect(this.dest);
    this.silentOscillator.start();
    
    this.isRecording = true;
    this.recorder.start();
    
    const renderLoop = () => {
      if (!this.isRecording) return;
      this.drawFrame();
      requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);
    
    for (let i = 0; i < this.quiz.questions.length; i++) {
      if (this.isCancelled) break;
      this.currentQuestionIndex = i;
      await this.runQuestionSequence(this.quiz.questions[i]);
    }
    
    this.stop();
  }

  drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        this.ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
  }

  drawFrame() {
    if (!this.isRecording) return;
    
    const w = this.canvas.width;
    const h = this.canvas.height;
    const isLandscape = w > h;
    
    // Background
    const bgImg = this.bgImages[this.currentQuestionIndex];
    if (bgImg) {
      if (bgImg instanceof HTMLVideoElement && bgImg.paused) {
        bgImg.play().catch(() => {});
      }
      const mediaW = bgImg instanceof HTMLVideoElement ? bgImg.videoWidth : bgImg.width;
      const mediaH = bgImg instanceof HTMLVideoElement ? bgImg.videoHeight : bgImg.height;
      
      if (mediaW > 0) {
        // Cover mode
        const scale = Math.max(w / mediaW, h / mediaH);
        const x = (w / 2) - (mediaW / 2) * scale;
        const y = (h / 2) - (mediaH / 2) * scale;
        this.ctx.drawImage(bgImg, x, y, mediaW * scale, mediaH * scale);
      } else {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, w, h);
      }
    } else {
      this.ctx.fillStyle = '#111';
      this.ctx.fillRect(0, 0, w, h);
    }
    
    // Dark overlay
    const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(0,0,0,0.4)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, w, h);

    const q = this.quiz.questions[this.currentQuestionIndex];
    if (!q) return;

    const now = this.audioCtx.currentTime * 1000;
    const phaseTime = now - this.phaseStartTime;
    
    const qImg = this.qImages[this.currentQuestionIndex];
    let contentCenterX = w / 2;
    let maxTextWidth = isLandscape ? 1500 : 900;
    
    // Question Text Box (Always at the top)
    if (this.phase !== 'init') {
      const boxY = isLandscape ? 180 : 300;
      let boxScale = 1;
      let boxOpacity = 1;
      
      if (this.phase === 'question' && phaseTime < 500) {
        boxScale = 0.95 + (phaseTime / 500) * 0.05;
        boxOpacity = phaseTime / 500;
      }
      
      this.ctx.save();
      this.ctx.translate(contentCenterX, boxY);
      this.ctx.scale(boxScale, boxScale);
      this.ctx.globalAlpha = boxOpacity;
      
      this.ctx.font = '900 60px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // Measure and wrap text (Cached)
      if (this.textCache.index !== this.currentQuestionIndex) {
        const words = q.text.split(' ');
        let lines = [];
        let line = '';
        for(let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          if (this.ctx.measureText(testLine).width > maxTextWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);
        this.textCache = { index: this.currentQuestionIndex, lines };
      }
      
      const lines = this.textCache.lines;
      const lineHeight = 80;
      const startY = -((lines.length - 1) * lineHeight) / 2;
      
      lines.forEach((l, i) => {
        const y = startY + i * lineHeight;
        this.ctx.lineWidth = 12;
        this.ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        this.ctx.strokeText(l, 0, y);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(l, 0, y);
      });
      
      this.ctx.restore();
    }

    // Draw Question Image
    if (qImg && this.phase !== 'init') {
      if (qImg instanceof HTMLVideoElement && qImg.paused) {
        qImg.play().catch(() => {});
      }
      const mediaW = qImg instanceof HTMLVideoElement ? qImg.videoWidth : qImg.width;
      const mediaH = qImg instanceof HTMLVideoElement ? qImg.videoHeight : qImg.height;

      if (mediaW > 0) {
        let imgScale = 1;
        let imgOpacity = 1;
        if (this.phase === 'question' && phaseTime < 500) {
          imgScale = 0.95 + (phaseTime / 500) * 0.05;
          imgOpacity = phaseTime / 500;
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = imgOpacity;
        
        const maxImgW = isLandscape ? w * 0.45 : w * 0.8;
        const maxImgH = isLandscape ? h * 0.6 : h * 0.3;
        const scale = Math.min(maxImgW / mediaW, maxImgH / mediaH);
        const drawW = mediaW * scale;
        const drawH = mediaH * scale;
        
        const imgCX = isLandscape ? w * 0.3 : w / 2;
        const imgCY = isLandscape ? h * 0.6 : h * 0.45;
        
        this.ctx.translate(imgCX, imgCY);
        this.ctx.scale(imgScale, imgScale);
        
        this.drawRoundedRect(-drawW/2, -drawH/2, drawW, drawH, 20);
        this.ctx.save();
        this.ctx.clip();
        this.ctx.drawImage(qImg, -drawW/2, -drawH/2, drawW, drawH);
        this.ctx.restore();
        
        this.drawRoundedRect(-drawW/2, -drawH/2, drawW, drawH, 20);
        this.ctx.lineWidth = 8;
        this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        this.ctx.stroke();
        
        this.ctx.restore();
      }
    }

    // Progress
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.drawRoundedRect(60, 60, 180, 60, 30);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
    this.ctx.font = 'bold 32px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${this.currentQuestionIndex + 1} / ${this.quiz.questions.length}`, 150, 90);

    // Options
    if (this.phase === 'options' || this.phase === 'timer' || this.phase === 'reveal') {
      const startY = isLandscape ? (qImg ? h * 0.4 : h * 0.45) : (qImg ? h * 0.65 : h * 0.5);
      const spacing = isLandscape ? 130 : 160;
      const optHeight = isLandscape ? 110 : 130;
      const optRadius = isLandscape ? 20 : 30;
      const optWidth = isLandscape ? (qImg ? 800 : 1200) : 840;
      const optCX = isLandscape ? (qImg ? w * 0.75 : w / 2) : w / 2;

      q.options.forEach((opt, idx) => {
        let optOpacity = 1;
        let optX = 0;
        let optScale = 1;
        
        if (this.phase === 'options') {
          const delay = idx * 200;
          if (phaseTime < delay) {
            optOpacity = 0;
          } else if (phaseTime < delay + 400) {
            const p = (phaseTime - delay) / 400;
            const easeOutBack = (x: number): number => {
              const c1 = 1.70158;
              const c3 = c1 + 1;
              return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
            };
            const eased = easeOutBack(p);
            optOpacity = Math.min(1, p * 2);
            optX = -100 * (1 - eased);
          }
        }
        
        if (optOpacity > 0) {
          this.ctx.save();
          this.ctx.globalAlpha = optOpacity;
          
          let colors = this.OPTION_COLORS[idx % this.OPTION_COLORS.length];
          let isHighlight = false;
          
          if (this.phase === 'reveal') {
            if (idx === q.correctOptionIndex) {
              colors = ['#10b981', '#059669']; // emerald
              isHighlight = true;
              optScale = 1.05;
            } else {
              colors = ['#262626', '#171717']; // neutral-800
              this.ctx.globalAlpha = 0.5;
              optScale = 0.95;
            }
          }
          
          this.ctx.translate(optCX + optX, startY + idx * spacing);
          this.ctx.scale(optScale, optScale);
          
          // Outer container (padding)
          this.ctx.fillStyle = 'rgba(0,0,0,0.2)'; // shadow
          this.drawRoundedRect(-optWidth/2, 10, optWidth, optHeight, optRadius);
          this.ctx.fill();
          
          // Gradient background
          const gradient = this.ctx.createLinearGradient(-optWidth/2, 0, optWidth/2, 0);
          gradient.addColorStop(0, colors[0]);
          gradient.addColorStop(1, colors[1]);
          this.ctx.fillStyle = gradient;
          this.drawRoundedRect(-optWidth/2, 0, optWidth, optHeight, optRadius);
          this.ctx.fill();
          
          if (isHighlight) {
            this.ctx.strokeStyle = '#6ee7b7'; // emerald-300
            this.ctx.lineWidth = 6;
            this.ctx.stroke();
          }
          
          // Label Circle (A, B, C)
          const circleX = -optWidth/2 + 80;
          const circleY = optHeight / 2;
          this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
          this.ctx.beginPath();
          this.ctx.arc(circleX, circleY, isLandscape ? 30 : 35, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = isLandscape ? '900 32px system-ui, -apple-system, sans-serif' : '900 40px system-ui, -apple-system, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(this.OPTION_LABELS[idx], circleX, circleY);
          
          // Option Text
          this.ctx.textAlign = 'left';
          this.ctx.font = isLandscape ? 'bold 36px system-ui, -apple-system, sans-serif' : 'bold 40px system-ui, -apple-system, sans-serif';
          this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
          this.ctx.shadowBlur = 4;
          this.ctx.shadowOffsetY = 2;
          this.ctx.fillText(opt, circleX + 70, circleY);
          
          this.ctx.restore();
        }
      });
    }

    // Timer
    if (this.phase === 'timer' || this.phase === 'reveal') {
      this.ctx.save();
      if (isLandscape) {
        this.ctx.translate(w - 150, 150);
      } else {
        this.ctx.translate(w/2, 1600);
      }
      
      if (this.phase === 'timer') {
        const duration = this.quiz.timerDuration || 5;
        const timeLeft = Math.ceil(duration - (phaseTime / 1000));
        
        // Outer circle
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 80, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = '#fbbf24'; // amber-400
        this.ctx.lineWidth = 8;
        this.ctx.stroke();
        
        // Glow
        this.ctx.shadowColor = 'rgba(251,191,36,0.5)';
        this.ctx.shadowBlur = 30;
        this.ctx.stroke();
        this.ctx.shadowColor = 'transparent';
        
        // Number
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = '900 80px system-ui, -apple-system, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(timeLeft.toString(), 0, 5);
      } else if (this.phase === 'reveal') {
        // Checkmark circle
        this.ctx.fillStyle = '#10b981'; // emerald-500
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 80, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 8;
        this.ctx.stroke();
        
        this.ctx.shadowColor = 'rgba(16,185,129,0.8)';
        this.ctx.shadowBlur = 30;
        this.ctx.stroke();
        this.ctx.shadowColor = 'transparent';
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '900 80px system-ui, -apple-system, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('✓', 0, 5);
      }
      
      this.ctx.restore();
    }
  }

  setPhase(p: string) {
    this.phase = p;
    this.phaseStartTime = this.audioCtx.currentTime * 1000;
  }

  async sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }

  async runQuestionSequence(q: Question) {
    if (this.isCancelled) return;
    
    this.setPhase('init');
    await this.sleep(500);
    if (this.isCancelled) return;

    this.setPhase('question');
    
    let audioPromise = Promise.resolve();
    if (q.audioBase64) {
      audioPromise = playPCMAsync(q.audioBase64, 24000, this.masterGain);
    }

    // Wait 2 seconds for the user to read the question while audio starts
    await this.sleep(2000);
    if (this.isCancelled) return;

    this.setPhase('options');
    for (let idx = 0; idx < q.options.length; idx++) {
      if (this.isCancelled) return;
      setTimeout(() => {
        if (!this.isCancelled) playPop(this.masterGain);
      }, idx * 200);
    }
    
    // Wait for options animation to finish
    await this.sleep(q.options.length * 200 + 500);
    if (this.isCancelled) return;

    // IMPORTANT: Wait for the audio to completely finish before starting the timer
    await audioPromise;
    if (this.isCancelled) return;

    // Small pause after audio finishes
    await this.sleep(500);
    if (this.isCancelled) return;

    this.setPhase('timer');
    const duration = this.quiz.timerDuration || 5;
    for (let i = 0; i < duration; i++) {
      if (this.isCancelled) return;
      playTick(this.masterGain);
      await this.sleep(1000);
    }
    if (this.isCancelled) return;

    this.setPhase('reveal');
    playSuccess(this.masterGain);
    await this.sleep(3000);
    if (this.isCancelled) return;

    this.setPhase('end');
    await this.sleep(500);
    
    if (this.onProgress) {
      this.onProgress((this.currentQuestionIndex + 1) / this.quiz.questions.length);
    }
  }

  stop() {
    this.isRecording = false;
    this.isCancelled = true;
    
    if (this.silentOscillator) {
      try { this.silentOscillator.stop(); } catch(e) {}
      this.silentOscillator.disconnect();
      this.silentOscillator = null;
    }
    
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.src = '';
      this.bgmAudio = null;
    }
    if (this.bgmSource) {
      this.bgmSource.disconnect();
      this.bgmSource = null;
    }
    
    stopPCM();
    if (this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    this.stream.getTracks().forEach(t => t.stop());
  }
}
