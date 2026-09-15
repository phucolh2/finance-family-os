import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, AlertCircle } from 'lucide-react';

interface LoveAudioPlayerProps {
  src: string;
  className?: string;
  variant?: 'compact' | 'card' | 'polaroid';
  onDelete?: () => void;
}

/**
 * Chuyển đổi Data URI sang Blob URL chuẩn.
 * Đặc biệt: Tự động nhận diện magic bytes 'ftyp' (MP4) bị gán nhãn nhầm thành webm trên iOS
 * và hiệu chỉnh lại MIME type chính xác để Safari có thể giải mã và phát mượt mà.
 */
function createSafeAudioBlobUrl(dataUri: string): { url: string; revoke: () => void } | null {
  if (!dataUri) return null;

  // Nếu là URL thông thường (http/https/blob)
  if (!dataUri.startsWith('data:')) {
    return { url: dataUri, revoke: () => {} };
  }

  try {
    const parts = dataUri.split(',');
    if (parts.length < 2) return null;

    const mimeMatch = parts[0].match(/:(.*?);/);
    let mime = mimeMatch ? mimeMatch[1] : 'audio/mp4';

    const byteCharacters = atob(parts[1]);

    // Kiểm tra magic bytes xem có phải MP4 thực chất không
    if (mime.includes('webm') && byteCharacters.length > 8) {
      const header = byteCharacters.substring(0, 24);
      if (header.includes('ftyp')) {
        mime = 'audio/mp4';
      }
    }

    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([byteNumbers.buffer], { type: mime });
    const objectUrl = URL.createObjectURL(blob);

    return {
      url: objectUrl,
      revoke: () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
      }
    };
  } catch (err) {
    console.warn('Lỗi khi phân tích audio data URI:', err);
    // Dự phòng dùng trực tiếp
    return { url: dataUri, revoke: () => {} };
  }
}

export const LoveAudioPlayer: React.FC<LoveAudioPlayerProps> = ({
  src,
  className = '',
  variant = 'card',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Khởi tạo Blob URL an toàn cho iOS Safari
  useEffect(() => {
    const safeData = createSafeAudioBlobUrl(src);
    if (safeData) {
      setBlobUrl(safeData.url);
      setHasError(false);
    }
    return () => {
      if (safeData) safeData.revoke();
    };
  }, [src]);

  const togglePlay = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.warn('Lỗi phát âm thanh:', err);
        setHasError(true);
      });
    }
  };

  const handleRestart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => setHasError(true));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec) || timeInSec < 0) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (hasError) {
    return (
      <div 
        className={`no-drag flex items-center gap-2 py-1.5 px-3 rounded-xl bg-rose-50/80 border border-rose-200/60 text-rose-500 text-xs ${className}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span className="truncate">Không thể phát âm thanh này</span>
      </div>
    );
  }

  // Giao diện Compact (dùng trong Preview của khung soạn thảo Composer)
  if (variant === 'compact') {
    return (
      <div
        className={`no-drag flex items-center gap-2.5 w-full py-1 ${className}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {blobUrl && (
          <audio
            ref={audioRef}
            src={blobUrl}
            preload="metadata"
            onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
            onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            onError={() => setHasError(true)}
          />
        )}

        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center shadow-sm shrink-0 transition-transform"
          title={isPlaying ? 'Tạm dừng' : 'Nghe thử'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>

        {/* Thanh tiến trình mini */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="w-full bg-rose-100/80 rounded-full h-2 overflow-hidden relative">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-rose-500/80 font-bold mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || 10)}</span>
          </div>
        </div>

        {currentTime > 0 && (
          <button
            type="button"
            onClick={handleRestart}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-100/50 transition-colors"
            title="Nghe lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Giao diện Polaroid (nằm đè lên chân bức ảnh vẽ)
  if (variant === 'polaroid') {
    return (
      <div
        className={`no-drag flex items-center gap-2 p-1.5 px-2.5 rounded-2xl bg-slate-900/75 backdrop-blur-md text-white shadow-lg border border-white/20 transition-all ${className}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {blobUrl && (
          <audio
            ref={audioRef}
            src={blobUrl}
            preload="metadata"
            onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
            onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            onError={() => setHasError(true)}
          />
        )}

        <button
          type="button"
          onClick={togglePlay}
          className="w-7 h-7 rounded-full bg-pink-500 hover:bg-pink-400 active:scale-90 text-white flex items-center justify-center shadow-sm shrink-0 transition-transform"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
        </button>

        {/* Visualizer sóng âm */}
        <div className="flex items-center gap-1 h-4 px-1">
          {[40, 75, 55, 90, 60, 80].map((h, i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full bg-pink-400 transition-all ${isPlaying ? 'animate-pulse' : 'opacity-60'}`}
              style={{
                height: isPlaying ? `${h}%` : '35%',
                animationDelay: `${i * 120}ms`
              }}
            />
          ))}
        </div>

        <span className="text-[11px] font-mono font-medium text-pink-200 tracking-wider">
          {isPlaying ? formatTime(currentTime) : formatTime(duration || 10)}
        </span>
      </div>
    );
  }

  // Giao diện Card chuẩn (nằm trong thẻ Sticky Note text)
  return (
    <div
      className={`no-drag flex items-center gap-3 p-2.5 px-3.5 rounded-2xl bg-white/75 backdrop-blur-sm border border-white/60 shadow-sm transition-all hover:bg-white/90 hover:shadow-md ${className}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {blobUrl && (
        <audio
          ref={audioRef}
          src={blobUrl}
          preload="metadata"
          onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
          onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onError={() => setHasError(true)}
        />
      )}

      {/* Nút Play/Pause cỡ lớn thân thiện với cảm ứng ngón tay */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white flex items-center justify-center shadow-md shrink-0 transition-transform"
        title={isPlaying ? 'Tạm dừng' : 'Nghe lời nhắn thoại'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-white" />
        ) : (
          <Play className="w-4 h-4 fill-white ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Volume2 className="w-3.5 h-3.5 text-pink-500" />
            <span className="text-[11px] font-sans">Tin nhắn thoại</span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-500">
            {formatTime(currentTime)} / {formatTime(duration || 10)}
          </span>
        </div>

        {/* Thanh scrubber tùy chỉnh */}
        <div className="relative w-full h-2 bg-pink-100/80 rounded-full flex items-center">
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-100 pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 10}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>
      </div>

      {currentTime > 0 && (
        <button
          type="button"
          onClick={handleRestart}
          className="p-1.5 rounded-xl text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors shrink-0"
          title="Nghe lại từ đầu"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
