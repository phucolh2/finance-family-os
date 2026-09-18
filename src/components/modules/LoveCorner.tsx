import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Heart, X, Send, Trash2, Pen, Type, Eraser, RotateCcw, Pin, Search, Sparkles, ImagePlus, Filter, LayoutGrid, Move, Plus, Calendar, CalendarPlus, Mic, Square } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LoveAudioPlayer } from './LoveAudioPlayer';

interface LoveNote {
  id: string;
  createdAt: number;
  message: string;
  author: 'husband' | 'wife' | 'both';
  color: string;
  image?: string;
  audio?: string;
  pinned?: boolean;
  reactions?: Record<string, string[]>; // emoji -> array of user uids
  position?: { x: number; y: number };
}

interface SpecialDate {
  id: string;
  label: string;
  emoji: string;
  month: number;
  day: number;
  year?: number;
  isCustom?: boolean;
  pinnedToBoard?: boolean;
  position?: { x: number; y: number };
}

const COLORS = [
  { id: 'rose', class: 'bg-rose-100/80 border-rose-200/50 text-rose-900' },
  { id: 'amber', class: 'bg-amber-100/80 border-amber-200/50 text-amber-900' },
  { id: 'blue', class: 'bg-sky-100/80 border-sky-200/50 text-sky-900' },
  { id: 'emerald', class: 'bg-emerald-100/80 border-emerald-200/50 text-emerald-900' },
  { id: 'purple', class: 'bg-fuchsia-100/80 border-fuchsia-200/50 text-fuchsia-900' },
];

const BRUSH_COLORS = ['#0f172a', '#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea'];
const STICKERS = ['❤️', '🫂', '💋', '🌹', '☕', '🎁', '🎂', '🎉', '✨', '🥺'];
const REACTION_EMOJIS = ['❤️', '😍', '🥺', '😂', '👏', '💋'];
const EVENT_EMOJIS = ['✈️', '🏥', '🎂', '💍', '🏖️', '🚗', '🎟️', '💖', '🏠', '🎁', '🎓', '🎈', '🎉', '🌸', '💐'];
const HUSBAND_EMAILS = ['lhoaiphuoc@gmail.com', 'phuocbaulam@gmail.com'];
const WIFE_EMAILS = ['que7tam@gmail.com', 'dieuhong1013@gmail.com'];

const LOVE_QUOTES = [
  'Cảm ơn em vì đã luôn ở bên anh, ngay cả khi anh không hoàn hảo...',
  'Anh yêu em không phải vì em là ai, mà vì anh là ai khi ở bên em.',
  'Mỗi ngày bên em đều là một ngày tuyệt vời nhất cuộc đời anh.',
  'Em là lý do anh mỉm cười mỗi sáng thức dậy.',
  'Nếu được chọn lại, anh vẫn sẽ chọn em — hàng triệu lần.',
  'Hôm nay anh muốn nói: Anh yêu em nhiều hơn hôm qua, nhưng ít hơn ngày mai.',
  'Em có biết không, chỉ cần nhìn thấy em cười là anh quên hết mọi mệt mỏi.',
  'Cảm ơn em đã là người bạn đời tuyệt vời nhất thế giới này.',
  'Anh không cần cả thế giới, anh chỉ cần em thôi.',
  'Em là điều tuyệt vời nhất từng xảy ra trong cuộc đời anh.',
  'Cảm ơn anh vì luôn che chở cho gia đình mình.',
  'Anh ơi, em rất hạnh phúc khi được là vợ của anh.',
  'Hôm nay em nấu món anh thích nhé! Yêu anh! ❤️',
  'Dù có bận cỡ nào, mình vẫn luôn có thời gian cho nhau nhé.',
  'Mình cùng cố gắng vì gia đình nhỏ của chúng ta nha!',
];

const DEFAULT_SPECIAL_DATES: SpecialDate[] = [
  { id: 'wife_bday', label: 'Sinh nhật Vợ 🎂', emoji: '👧', month: 10, day: 13 },
  { id: 'husband_bday', label: 'Sinh nhật Chồng 🎂', emoji: '👦', month: 12, day: 16 },
  { id: 'wedding_bride', label: 'Kỷ niệm Cưới (Nhà gái)', emoji: '💒', month: 10, day: 17 },
  { id: 'wedding_groom', label: 'Kỷ niệm Cưới (Nhà trai)', emoji: '💍', month: 10, day: 20 },
  { id: 'valentine', label: 'Valentine', emoji: '💝', month: 2, day: 14 },
  { id: 'womens_day', label: 'Ngày Phụ nữ VN', emoji: '🌸', month: 10, day: 20 },
  { id: 'intl_womens', label: 'Quốc tế Phụ nữ', emoji: '💐', month: 3, day: 8 },
  { id: 'mens_day', label: 'Ngày Đàn ông VN', emoji: '🤵', month: 11, day: 19 },
];

export const LoveCorner: React.FC = () => {
  const { state, updateToolConfig, pushSystemLog } = useAppContext();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'text' | 'draw'>('text');
  const [viewMode, setViewMode] = useState<'free' | 'grid'>('free'); // 'free' = Free drag & drop board
  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState<'husband' | 'wife' | 'both'>('both');
  const [colorId, setColorId] = useState('rose');
  const [mobileTab, setMobileTab] = useState<'create' | 'wall'>('wall');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAuthor, setFilterAuthor] = useState<'all' | 'husband' | 'wife' | 'both'>('all');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'image'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Event Add Modal State
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDateStr, setEventDateStr] = useState('');
  const [eventEmoji, setEventEmoji] = useState('✈️');
  const [eventPinDirect, setEventPinDirect] = useState(true);
  
  // Drag & Drop States
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; origX: number; origY: number } | null>(null);
  const [tempPositions, setTempPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [topZIndexId, setTopZIndexId] = useState<string | null>(null);

  // Canvas States
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState(BRUSH_COLORS[1]);
  const [isEraser, setIsEraser] = useState(false);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const config = state.toolConfigs?.loveCorner || { notes: [], accountMapping: {}, lastViewed: {}, specialDates: DEFAULT_SPECIAL_DATES };
  const notes: LoveNote[] = config.notes || [];
  const accountMapping = config.accountMapping || {};
  const lastViewed = config.lastViewed || {};
  const specialDates: SpecialDate[] = config.specialDates || DEFAULT_SPECIAL_DATES;

  // Lấy thời điểm đọc tin gần nhất từ cả LocalStorage thiết bị và Firestore server
  const localLastViewed = Number(localStorage.getItem('love_corner_last_viewed') || 0);
  const serverLastViewed = (user?.uid && lastViewed[user.uid]) || 0;
  const initialEffectiveLastViewed = Math.max(localLastViewed, serverLastViewed);

  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>(initialEffectiveLastViewed);
  const [justOpenedViewTimestamp, setJustOpenedViewTimestamp] = useState<number>(initialEffectiveLastViewed);
  const [hasReadCurrentSession, setHasReadCurrentSession] = useState(false);

  // Đồng bộ lại khi serverLastViewed hoặc localLastViewed thay đổi
  useEffect(() => {
    const updated = Math.max(
      Number(localStorage.getItem('love_corner_last_viewed') || 0),
      (user?.uid && lastViewed[user.uid]) || 0
    );
    if (updated > lastViewedTimestamp) {
      setLastViewedTimestamp(updated);
    }
  }, [user?.uid, lastViewed]);

  // Nếu có tin mới phát sinh sau mốc đã đọc, kích hoạt lại trạng thái tin mới
  const latestCreatedAt = notes[0]?.createdAt || 0;
  useEffect(() => {
    if (latestCreatedAt > lastViewedTimestamp) {
      setHasReadCurrentSession(false);
    }
  }, [latestCreatedAt, lastViewedTimestamp]);

  // Kiểm tra có tin nhắn mới hay không:
  // 1. Phải có tin nhắn tạo sau thời điểm đã xem gần nhất
  // 2. Tin nhắn đó KHÔNG PHẢI do chính người dùng hiện tại tạo
  // 3. Chưa đọc trong phiên hiện tại
  const hasNewMessage = useMemo(() => {
    if (hasReadCurrentSession || notes.length === 0) return false;
    const latestNote = notes[0];
    if (latestNote.createdAt <= lastViewedTimestamp) return false;
    if (author !== 'both' && latestNote.author === author) return false;
    return true;
  }, [notes, lastViewedTimestamp, author, hasReadCurrentSession]);

  // Hàm mở LoveCorner: Đánh dấu đã đọc ngay lập tức, tắt hoàn toàn nhấp nháy/bouncing
  const handleOpenLoveCorner = () => {
    setIsOpen(true);
    setJustOpenedViewTimestamp(lastViewedTimestamp); // Giữ mốc để nhận diện thiệp "MỚI"
    const now = Date.now();
    setLastViewedTimestamp(now);
    setHasReadCurrentSession(true);
    localStorage.setItem('love_corner_last_viewed', now.toString());
    if (user?.uid) {
      updateToolConfig('loveCorner', {
        ...config,
        lastViewed: {
          ...lastViewed,
          [user.uid]: now
        }
      });
    }
  };

  // Xác định một thiệp có phải là tin mới nhận hay không
  const isNoteNew = (note: LoveNote, index: number) => {
    if (author !== 'both' && note.author === author) return false;
    if (justOpenedViewTimestamp > 0) {
      return note.createdAt > justOpenedViewTimestamp;
    }
    return index === 0 && (Date.now() - note.createdAt < 24 * 60 * 60 * 1000);
  };

  const newNotesCount = useMemo(() => {
    return notes.filter((n, idx) => isNoteNew(n, idx)).length;
  }, [notes, justOpenedViewTimestamp, author]);

  // Helper for computing days left for any SpecialDate
  const getDaysLeft = (sd: SpecialDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (sd.year) {
      const target = new Date(sd.year, sd.month - 1, sd.day);
      target.setHours(0, 0, 0, 0);
      return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      const thisYear = new Date(now.getFullYear(), sd.month - 1, sd.day);
      const nextYear = new Date(now.getFullYear() + 1, sd.month - 1, sd.day);
      const target = thisYear >= now ? thisYear : nextYear;
      return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
  };

  // Countdown computation for left panel list
  const upcomingDates = useMemo(() => {
    const results: { date: SpecialDate; daysLeft: number }[] = [];
    const seen = new Set<string>();
    for (const sd of specialDates) {
      const diff = getDaysLeft(sd);
      if (diff >= 0 && diff <= 90) {
        const key = `${sd.month}-${sd.day}-${sd.year || ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({ date: sd, daysLeft: diff });
      }
    }
    results.sort((a, b) => a.daysLeft - b.daysLeft);
    return results;
  }, [specialDates, isOpen]);

  // Pinned Special Dates to render on Whiteboard
  const pinnedDatesOnBoard = useMemo(() => {
    return specialDates.filter(sd => sd.pinnedToBoard);
  }, [specialDates]);

  // Filter and search notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];
    if (viewMode === 'grid') {
      result.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
      });
    }
    if (filterAuthor !== 'all') {
      result = result.filter(n => n.author === filterAuthor);
    }
    if (filterType === 'text') {
      result = result.filter(n => !n.image);
    } else if (filterType === 'image') {
      result = result.filter(n => !!n.image);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n.message?.toLowerCase().includes(q));
    }
    return result;
  }, [notes, filterAuthor, filterType, searchQuery, viewMode]);



  useEffect(() => {
    if (user?.email) {
      if (HUSBAND_EMAILS.includes(user.email)) { setAuthor('husband'); return; }
      if (WIFE_EMAILS.includes(user.email)) { setAuthor('wife'); return; }
    }
    if (user?.uid && accountMapping[user.uid]) {
      setAuthor(accountMapping[user.uid]);
    }
  }, [user?.email, user?.uid, isOpen]);

  const handleSetAuthor = (newAuthor: 'husband' | 'wife' | 'both') => {
    setAuthor(newAuthor);
    if (user?.uid) {
      updateToolConfig('loveCorner', { ...config, accountMapping: { ...accountMapping, [user.uid]: newAuthor } });
    }
  };

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [mode]);

  // Canvas Drawing
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    ctx.lineTo(x, y);
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 30;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = 6;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.globalCompositeOperation = 'source-over';
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Helper for note & widget position on Board
  const getItemPos = (id: string, index: number, defaultPos?: { x: number; y: number }) => {
    if (tempPositions[id]) return tempPositions[id];
    if (defaultPos) return defaultPos;
    const col = index % 3;
    const row = Math.floor(index / 3);
    return { x: col * 320 + 20, y: row * 380 + 20 };
  };

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent, id: string, index: number, currentPos?: { x: number; y: number }) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('audio') || target.closest('.no-drag')) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const pos = getItemPos(id, index, currentPos);
    setDraggingId(id);
    setTopZIndexId(id);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent, id: string) => {
    if (draggingId !== id || !dragStart) return;
    const dx = e.clientX - dragStart.mouseX;
    const dy = e.clientY - dragStart.mouseY;
    const newX = Math.max(0, dragStart.origX + dx);
    const newY = Math.max(0, dragStart.origY + dy);
    
    setTempPositions(prev => ({ ...prev, [id]: { x: newX, y: newY } }));
  };

  const handlePointerUp = (e: React.PointerEvent, id: string, isEventWidget?: boolean) => {
    if (draggingId !== id) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setDraggingId(null);
    setDragStart(null);
    
    const finalPos = tempPositions[id];
    if (finalPos) {
      if (isEventWidget) {
        const newDates = specialDates.map(sd => sd.id === id ? { ...sd, position: finalPos } : sd);
        updateToolConfig('loveCorner', { ...config, specialDates: newDates });
      } else {
        const newNotes = notes.map(n => n.id === id ? { ...n, position: finalPos } : n);
        updateToolConfig('loveCorner', { ...config, notes: newNotes });
      }
    }
  };

  const handleSaveNote = () => {
    if (mode === 'text' && !message.trim() && !audioBase64) return;
    let imgBase64 = undefined;
    if (mode === 'draw' && canvasRef.current) {
      imgBase64 = canvasRef.current.toDataURL('image/webp', 0.8);
    }
    const initialPos = { x: 20 + Math.random() * 40, y: 20 + Math.random() * 40 };
    const newNote: LoveNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
      message: message.trim(),
      author,
      color: COLORS.find(c => c.id === colorId)?.class || COLORS[0].class,
      image: imgBase64,
      audio: audioBase64 || undefined,
      position: initialPos,
    };
    const newNotes = [newNote, ...notes];
    updateToolConfig('loveCorner', { ...config, notes: newNotes });
    if (pushSystemLog) {
      pushSystemLog('GẮN KẾT', 'Yêu thương', `Đã dán một lời nhắn mới lên bảng (${author})`);
    }
    setMessage('');
    clearAudio();
    if (mode === 'draw') clearCanvas();
    setMobileTab('wall');
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 600;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/webp', 0.75);
        const initialPos = { x: 20 + Math.random() * 40, y: 20 + Math.random() * 40 };
        const newNote: LoveNote = {
          id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          createdAt: Date.now(),
          message: '',
          author,
          color: COLORS[0].class,
          image: compressed,
          position: initialPos,
        };
        const newNotes = [newNote, ...notes];
        updateToolConfig('loveCorner', { ...config, notes: newNotes });
        setMobileTab('wall');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Helper phát hiện định dạng audio tốt nhất cho trình duyệt (iOS Safari: mp4/aac, Chrome/Android: webm)
  const getSupportedAudioMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return '';
    }
    const candidates = [
      'audio/mp4', // Tối ưu nhất cho Safari iOS (AAC trong MP4 container)
      'audio/aac',
      'audio/webm;codecs=opus', // Tối ưu nhất cho Chrome / Firefox / Android
      'audio/webm',
      'audio/ogg;codecs=opus',
    ];
    for (const t of candidates) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  };

  // Audio Recording Logic
  const startRecording = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      alert('Trình duyệt hiện tại chưa hỗ trợ ghi âm hoặc trang web chưa được cấp quyền micro. Bạn hãy kiểm tra quyền truy cập hoặc mở bằng Safari/Chrome (HTTPS) nhé!');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      alert('Trình duyệt này không hỗ trợ MediaRecorder để ghi âm.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = getSupportedAudioMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        try {
          if (audioChunksRef.current.length > 0) {
            const actualMime = mediaRecorder.mimeType || mimeType || 'audio/mp4';
            const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
            const reader = new FileReader();
            reader.onloadend = () => {
              setAudioBase64(reader.result as string);
            };
            reader.readAsDataURL(audioBlob);
          }
        } catch (e) {
          console.error('Lỗi khi xử lý audio blob:', e);
        } finally {
          // Giải phóng micro để tắt chỉ báo chấm cam trên iPhone
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
          }
          setIsRecording(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const startTime = Date.now();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.min(10, Math.floor((Date.now() - startTime) / 1000));
        setRecordingTime(elapsed);
        if (elapsed >= 10) {
          stopRecording();
        }
      }, 200);
    } catch (err) {
      console.error('Lỗi truy cập microphone:', err);
      alert('Không thể truy cập microphone. Vui lòng cấp quyền ghi âm trong cài đặt trình duyệt của thiết bị nhé!');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      try {
        if (typeof mr.requestData === 'function') {
          mr.requestData();
        }
      } catch {
        // ignore
      }
      mr.stop();
    }
    setIsRecording(false);
  };

  const clearAudio = () => {
    stopRecording();
    setAudioBase64(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Dọn dẹp micro và timer khi unmount hoặc đóng modal
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      clearAudio();
    }
  }, [isOpen]);

  // Add Custom Event
  const handleAddCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDateStr) {
      alert('Vui lòng nhập tên sự kiện và chọn ngày!');
      return;
    }
    const [y, m, d] = eventDateStr.split('-').map(Number);
    const newEvent: SpecialDate = {
      id: `sd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label: eventTitle.trim(),
      emoji: eventEmoji || '✈️',
      day: d,
      month: m,
      year: y,
      isCustom: true,
      pinnedToBoard: eventPinDirect,
      position: { x: 50 + Math.random() * 60, y: 50 + Math.random() * 60 },
    };
    const newDates = [newEvent, ...specialDates];
    updateToolConfig('loveCorner', { ...config, specialDates: newDates });
    setEventTitle('');
    setEventDateStr('');
    setShowAddEvent(false);
    if (eventPinDirect) setMobileTab('wall');
  };

  const handleTogglePinDateToBoard = (dateId: string) => {
    const newDates = specialDates.map(sd => {
      if (sd.id === dateId) {
        const newPinned = !sd.pinnedToBoard;
        return {
          ...sd,
          pinnedToBoard: newPinned,
          position: sd.position || { x: 40 + Math.random() * 50, y: 40 + Math.random() * 50 }
        };
      }
      return sd;
    });
    updateToolConfig('loveCorner', { ...config, specialDates: newDates });
  };

  const handleDeleteCustomEvent = (dateId: string) => {
    if (!window.confirm('Xóa mốc sự kiện đếm ngược này?')) return;
    const newDates = specialDates.filter(sd => sd.id !== dateId);
    updateToolConfig('loveCorner', { ...config, specialDates: newDates });
  };

  const handleDeleteNote = (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kỷ niệm này?')) return;
    const newNotes = notes.filter(n => n.id !== id);
    updateToolConfig('loveCorner', { ...config, notes: newNotes });
  };

  const handleTogglePin = (id: string) => {
    const newNotes = notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
    updateToolConfig('loveCorner', { ...config, notes: newNotes });
  };

  const handleReaction = (noteId: string, emoji: string) => {
    if (!user?.uid) return;
    const newNotes = notes.map(n => {
      if (n.id !== noteId) return n;
      const reactions = { ...(n.reactions || {}) };
      const users = reactions[emoji] || [];
      if (users.includes(user.uid)) {
        reactions[emoji] = users.filter(u => u !== user.uid);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...users, user.uid];
      }
      return { ...n, reactions };
    });
    updateToolConfig('loveCorner', { ...config, notes: newNotes });
    setActiveReaction(null);
  };

  const handleInsertQuote = () => {
    const quote = LOVE_QUOTES[Math.floor(Math.random() * LOVE_QUOTES.length)];
    setMessage(quote);
  };

  const getRotationClass = (index: number) => {
    const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', 'rotate-0'];
    return rotations[index % rotations.length];
  };

  const getAuthorDisplay = (auth: string) => {
    if (auth === 'husband') return { icon: '👦', name: state.profile?.husbandName || 'Chồng' };
    if (auth === 'wife') return { icon: '👧', name: state.profile?.wifeName || 'Vợ' };
    return { icon: '💕', name: 'Gia đình' };
  };

  return (
    <>
      <button
        onClick={handleOpenLoveCorner}
        className={`fixed bottom-6 right-6 z-[60] p-4 sm:p-5 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white shadow-[0_8px_30px_rgba(244,63,94,0.4)] hover:shadow-[0_8px_40px_rgba(244,63,94,0.6)] transition-all duration-300 transform hover:scale-110 active:scale-95 group print:hidden ${hasNewMessage ? 'animate-bounce ring-4 ring-yellow-400/80 shadow-[0_8px_35px_rgba(244,63,94,0.7)]' : ''}`}
        title={hasNewMessage ? 'Có lời nhắn mới từ bạn đời!' : 'Góc Tình Yêu (Love Corner)'}
      >
        <Heart className={`w-7 h-7 sm:w-8 sm:h-8 fill-white/20 group-hover:fill-white/40 ${hasNewMessage ? 'animate-pulse' : ''} group-hover:scale-110 transition-transform`} />
        {hasNewMessage && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-white items-center justify-center text-[10px] font-black text-rose-700 shadow-md">
              !
            </span>
          </span>
        )}
      </button>

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadPhoto}
      />

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-6 lg:p-8 bg-slate-900/40 backdrop-blur-sm print:hidden animate-in fade-in duration-300">
          <div 
            className="bg-[#fcfaf9] w-full h-[100dvh] md:h-full md:rounded-[2rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Header with Tabs */}
            <div className="lg:hidden flex flex-col bg-white/95 backdrop-blur-md border-b border-pink-100/60 sticky top-0 z-30 shadow-sm shrink-0">
               <div className="flex items-center justify-between p-4 pb-2">
                 <div>
                   <h2 className="text-xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-400">Góc Yêu Thương</h2>
                   <p className="text-xs font-medium text-pink-400/80">Không gian lãng mạn của hai ta ✨</p>
                 </div>
                 <button 
                   onClick={() => setIsOpen(false)}
                   className="p-2 rounded-full hover:bg-pink-50 text-pink-600 transition-colors"
                 >
                   <X className="w-6 h-6" />
                 </button>
               </div>
               
               {/* Mobile Tab Switcher */}
               <div className="flex p-1 mx-4 mb-3 bg-slate-100/80 rounded-2xl border border-pink-100/60">
                 <button
                   onClick={() => setMobileTab('wall')}
                   className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${mobileTab === 'wall' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}
                 >
                   <Heart className="w-4 h-4 text-pink-500 fill-pink-500" /> Bảng vẽ & Nhật ký ({notes.length})
                   {hasNewMessage && (
                     <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping absolute top-1.5 right-2" />
                   )}
                 </button>
                 <button
                   onClick={() => setMobileTab('create')}
                   className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'create' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}
                 >
                   <Pen className="w-4 h-4" /> Soạn thư / Vẽ
                 </button>
               </div>
            </div>

            {/* LEFT PANEL: COMPOSER & EVENTS */}
            <div className={`w-full lg:w-[420px] xl:w-[480px] shrink-0 bg-white/60 block border-r border-pink-100/50 z-10 min-h-0 ${mobileTab === 'create' ? 'flex-1 flex' : 'hidden lg:flex'}`}>
              <div className="p-5 pb-24 lg:pb-8 lg:p-8 flex-1 overflow-y-auto hide-scrollbar min-h-0 relative block">
                
                <div className="hidden lg:flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-400">Góc Yêu Thương</h2>
                    <p className="text-sm font-medium text-pink-400/80 mt-1">Không gian lãng mạn của hai ta ✨</p>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-pink-50 text-pink-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Countdown Header & Add Custom Event Button */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-pink-500" />
                    Đếm ngược ngày đặc biệt
                  </span>
                  <button
                    onClick={() => setShowAddEvent(!showAddEvent)}
                    className="flex items-center gap-1 text-xs font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 px-2.5 py-1 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm mốc
                  </button>
                </div>

                {/* Add Custom Event Form */}
                {showAddEvent && (
                  <form onSubmit={handleAddCustomEvent} className="mb-5 p-4 bg-white rounded-2xl border border-pink-200 shadow-md space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-pink-700 flex items-center gap-1.5">
                        <CalendarPlus className="w-4 h-4" /> Thêm sự kiện đếm ngược
                      </span>
                      <button type="button" onClick={() => setShowAddEvent(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Tên sự kiện (VD: Đi du lịch...)"
                      className="w-full px-3 py-2 bg-pink-50/40 border border-pink-100 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-pink-300"
                      required
                    />

                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={eventDateStr}
                        onChange={(e) => setEventDateStr(e.target.value)}
                        className="flex-1 px-3 py-2 bg-pink-50/40 border border-pink-100 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-700"
                        required
                      />
                    </div>

                    {/* Emoji Selector */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Chọn Biểu Tượng</span>
                      <div className="flex flex-wrap gap-1">
                        {EVENT_EMOJIS.map(em => (
                          <button
                            type="button"
                            key={em}
                            onClick={() => setEventEmoji(em)}
                            className={`w-7 h-7 rounded-lg text-lg flex items-center justify-center transition-all ${eventEmoji === em ? 'bg-pink-100 border border-pink-300 scale-110' : 'hover:bg-slate-100'}`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={eventPinDirect}
                        onChange={(e) => setEventPinDirect(e.target.checked)}
                        className="rounded text-pink-500 focus:ring-pink-400"
                      />
                      <span>Ghim thẻ đếm ngược này lên Bảng vẽ (Whiteboard)</span>
                    </label>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-xs shadow-sm hover:from-pink-600 hover:to-rose-600 transition-all"
                    >
                      Lưu Mốc Sự Kiện
                    </button>
                  </form>
                )}

                {/* Countdown Banners List */}
                {upcomingDates.length > 0 && (
                  <div className="mb-5 space-y-2">
                    {upcomingDates.slice(0, 4).map(item => (
                      <div key={item.date.id} className="p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-100/60 flex items-center gap-3 relative group">
                        <span className="text-2xl shrink-0">{item.date.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-pink-700 truncate">{item.date.label}</p>
                          <p className="text-xs text-pink-500">
                            {item.daysLeft === 0
                              ? '🎉 Hôm nay là ngày đặc biệt!'
                              : `Còn ${item.daysLeft} ngày nữa`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Pin to Board Toggle Button */}
                          <button
                            onClick={() => handleTogglePinDateToBoard(item.date.id)}
                            className={`p-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${item.date.pinnedToBoard ? 'bg-amber-400 text-white shadow-sm' : 'bg-white/80 text-slate-400 hover:text-amber-500 hover:bg-white'}`}
                            title={item.date.pinnedToBoard ? 'Bỏ ghim khỏi Bảng vẽ' : 'Ghim lên Bảng vẽ Whiteboard'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete event button */}
                          <button
                            onClick={() => handleDeleteCustomEvent(item.date.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                            title="Xóa sự kiện này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="text-lg font-black text-pink-600 bg-white/90 rounded-xl px-2.5 py-0.5 shadow-sm min-w-[32px] text-center">
                            {item.daysLeft === 0 ? '🎊' : item.daysLeft}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Segmented Control */}
                <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-5 shadow-inner">
                   <button
                     onClick={() => setMode('text')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'text' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     <Type className="w-4 h-4" /> Viết thư
                   </button>
                   <button
                     onClick={() => setMode('draw')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'draw' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     <Pen className="w-4 h-4" /> Vẽ tranh
                   </button>
                </div>

                {/* Composer Area */}
                <div className="flex flex-col mb-5 lg:h-[400px] min-h-[300px] shrink-0">
                  {mode === 'text' ? (
                    <div className="flex-1 relative flex flex-col h-full">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Hôm nay anh/em muốn nói gì..."
                        className="flex-1 w-full min-h-[200px] p-5 pb-16 bg-pink-50/30 border border-pink-100/50 rounded-3xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-300/50 focus:bg-white resize-none text-lg leading-relaxed text-slate-700 transition-all placeholder:text-pink-300"
                      />
                      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-1 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-pink-100 shadow-sm">
                         {STICKERS.map(sticker => (
                            <button
                              key={sticker}
                              onClick={() => setMessage(prev => prev + sticker)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-pink-50 active:bg-pink-100 rounded-xl transition-colors text-lg"
                            >
                              {sticker}
                            </button>
                         ))}
                         {/* Quote suggestion button */}
                         <button
                           onClick={handleInsertQuote}
                           className="ml-auto px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-pink-500 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors"
                           title="Gợi ý lời yêu thương"
                         >
                           <Sparkles className="w-3.5 h-3.5" />
                           Gợi ý
                         </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 relative flex flex-col">
                      <div 
                        className="w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] bg-white rounded-3xl shadow-[inset_0_2px_15px_rgba(0,0,0,0.03)] border-2 border-pink-100/50 overflow-hidden relative cursor-crosshair"
                        style={{ backgroundImage: 'radial-gradient(#fbcfe8 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
                      >
                        <canvas
                          ref={canvasRef}
                          width={800}
                          height={1000}
                          className="w-full h-full object-fill touch-none"
                          onPointerDown={startDrawing}
                          onPointerMove={draw}
                          onPointerUp={stopDrawing}
                          onPointerCancel={stopDrawing}
                          onPointerLeave={stopDrawing}
                        />
                        {/* Floating Toolbar */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60 z-10">
                           <button
                              onClick={() => setIsEraser(false)}
                              className={`p-2.5 rounded-xl transition-all ${!isEraser ? 'bg-pink-100 text-pink-600 scale-105' : 'text-slate-400 hover:bg-slate-50'}`}
                              title="Cọ vẽ"
                           >
                              <Pen className="w-5 h-5" />
                           </button>
                           <div className="w-px h-8 bg-slate-200 mx-1" />
                           {BRUSH_COLORS.map(c => (
                             <button
                               key={c}
                               onClick={() => { setBrushColor(c); setIsEraser(false); }}
                               className={`w-7 h-7 rounded-full border-4 transition-all ${brushColor === c && !isEraser ? 'border-pink-200 scale-110 shadow-sm' : 'border-transparent hover:scale-110'}`}
                               style={{ backgroundColor: c }}
                             />
                           ))}
                           <div className="w-px h-8 bg-slate-200 mx-1" />
                           <button
                              onClick={() => setIsEraser(true)}
                              className={`p-2.5 rounded-xl transition-all ${isEraser ? 'bg-slate-200 text-slate-700 scale-105' : 'text-slate-400 hover:bg-slate-50'}`}
                              title="Cục tẩy"
                           >
                              <Eraser className="w-5 h-5" />
                           </button>
                           <div className="w-px h-8 bg-slate-200 mx-1" />
                           <button
                              onClick={clearCanvas}
                              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              title="Xóa sạch bảng"
                           >
                              <RotateCcw className="w-5 h-5" />
                           </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata & Submit */}
                <div className="space-y-4 shrink-0 mb-8">
                  <div className="flex flex-col gap-3">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Người gửi</span>
                     <div className="flex items-center gap-3">
                        {['husband', 'wife', 'both'].map((authOpt) => {
                           const info = getAuthorDisplay(authOpt);
                           const isActive = author === authOpt;
                           return (
                             <button
                               key={authOpt}
                               onClick={() => handleSetAuthor(authOpt as any)}
                               className={`flex flex-col items-center gap-1.5 flex-1 p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white shadow-md ring-2 ring-pink-100 scale-105' : 'hover:bg-slate-100/50 opacity-70 hover:opacity-100'}`}
                             >
                               <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner ${isActive ? 'bg-pink-50' : 'bg-slate-100'}`}>
                                 {info.icon}
                               </div>
                               <span className={`text-xs font-bold ${isActive ? 'text-pink-600' : 'text-slate-500'}`}>{info.name}</span>
                             </button>
                           )
                        })}
                     </div>
                  </div>

                  {mode === 'text' && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2 shrink-0">Màu giấy</span>
                      <div className="flex-1 flex items-center justify-end gap-2 overflow-x-auto hide-scrollbar">
                        {COLORS.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setColorId(c.id)}
                            className={`w-8 h-8 rounded-full border-4 ${c.class.split(' ')[0]} ${colorId === c.id ? 'border-white ring-2 ring-pink-300 scale-110 shadow-sm' : 'border-transparent hover:scale-110'} transition-all shrink-0`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audio Preview in Composer */}
                  {audioBase64 && (
                    <div className="p-3 bg-rose-50/80 border border-rose-200/80 rounded-2xl animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-rose-500" /> Bản ghi âm sẵn sàng
                        </span>
                        <button
                          type="button"
                          onClick={clearAudio}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 py-0.5 px-2 rounded-lg hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Hủy bỏ
                        </button>
                      </div>
                      <LoveAudioPlayer src={audioBase64} variant="compact" />
                    </div>
                  )}

                  <div className="flex gap-2 sm:gap-3">
                    {/* Audio Record Button */}
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center justify-center gap-1.5 border-2 ${
                        isRecording
                          ? 'border-rose-500 bg-rose-50 text-rose-600 animate-pulse'
                          : audioBase64
                          ? 'border-rose-300 bg-rose-50/60 text-rose-600 hover:bg-rose-100/50'
                          : 'border-dashed border-pink-200 hover:border-pink-300 hover:bg-pink-50/50 text-pink-500'
                      } py-3 px-3 sm:px-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] shrink-0`}
                      title={isRecording ? 'Dừng ghi âm' : audioBase64 ? 'Ghi âm lại' : 'Ghi âm lời nói (10s)'}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-4 h-4 fill-rose-500" />
                          <span className="text-xs font-mono font-bold text-rose-600">{`0:0${recordingTime}`}</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span className="text-xs">{audioBase64 ? 'Ghi lại' : 'Ghi âm'}</span>
                        </>
                      )}
                    </button>

                    {/* Upload Photo Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 bg-white border-2 border-dashed border-pink-200 hover:border-pink-300 hover:bg-pink-50/50 text-pink-500 py-3 px-3 sm:px-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] shrink-0"
                      title="Tải ảnh lên"
                    >
                      <ImagePlus className="w-4 h-4" />
                      <span className="text-xs">Tải ảnh</span>
                    </button>

                    {/* Save Button */}
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      disabled={mode === 'text' && !message.trim() && !audioBase64}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-3 sm:py-3.5 rounded-2xl font-bold text-base sm:text-lg transition-all shadow-[0_8px_20px_rgba(244,63,94,0.3)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Lưu</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: WALL / PINBOARD OF LOVE */}
            <div className={`flex-1 overflow-auto p-4 sm:p-6 lg:p-10 relative bg-[#fcfaf9] ${mobileTab === 'wall' ? 'flex-1 flex flex-col' : 'hidden lg:flex lg:flex-col'}`}>
               {/* Corkboard / Pinboard subtle background pattern */}
               <div 
                 className="absolute inset-0 pointer-events-none opacity-40"
                 style={{ 
                   backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', 
                   backgroundSize: '28px 28px' 
                 }} 
               />
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

               <div className="relative z-10 h-full flex flex-col">
                 {/* Search, Filter & Board View Switcher */}
                 <div className="mb-6 flex flex-col gap-3 shrink-0">
                   <div className="flex items-center gap-3 flex-wrap">
                     <div className="flex-1 min-w-[200px] relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input
                         type="text"
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         placeholder="Tìm kiếm kỷ niệm..."
                         className="w-full pl-10 pr-4 py-2.5 bg-white/90 backdrop-blur-sm border border-pink-100/60 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-200 placeholder:text-slate-400 shadow-sm"
                       />
                     </div>

                     {/* Board View Mode Toggle: Free Drag vs Grid */}
                     <div className="flex p-1 bg-slate-200/70 rounded-2xl shadow-inner shrink-0">
                       <button
                         onClick={() => setViewMode('free')}
                         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'free' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                         title="Chế độ dán tự do (Kéo thả)"
                       >
                         <Move className="w-3.5 h-3.5" /> Dán tự do
                       </button>
                       <button
                         onClick={() => setViewMode('grid')}
                         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                         title="Chế độ xếp lưới"
                       >
                         <LayoutGrid className="w-3.5 h-3.5" /> Lưới
                       </button>
                     </div>

                     <button
                       onClick={() => setShowFilters(!showFilters)}
                       className={`p-2.5 rounded-2xl border transition-all shrink-0 ${showFilters ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white/90 border-pink-100/60 text-slate-400 hover:text-pink-500 shadow-sm'}`}
                     >
                       <Filter className="w-5 h-5" />
                     </button>
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
                       <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                       {filteredNotes.length}
                     </h3>
                   </div>

                   {/* Filter Tags */}
                   {showFilters && (
                     <div className="flex flex-wrap gap-2 p-3 bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100/60 shadow-sm">
                       <span className="text-xs font-bold text-slate-400 uppercase w-full mb-1">Người gửi</span>
                       {[
                         { value: 'all' as const, label: 'Tất cả' },
                         { value: 'husband' as const, label: `👦 ${state.profile?.husbandName || 'Chồng'}` },
                         { value: 'wife' as const, label: `👧 ${state.profile?.wifeName || 'Vợ'}` },
                         { value: 'both' as const, label: '💕 Gia đình' },
                       ].map(opt => (
                         <button
                           key={opt.value}
                           onClick={() => setFilterAuthor(opt.value)}
                           className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterAuthor === opt.value ? 'bg-pink-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-pink-50'}`}
                         >
                           {opt.label}
                         </button>
                       ))}
                       <div className="w-full border-t border-slate-100 my-1" />
                       <span className="text-xs font-bold text-slate-400 uppercase w-full mb-1">Loại</span>
                       {[
                         { value: 'all' as const, label: 'Tất cả' },
                         { value: 'text' as const, label: '✍️ Lời nhắn' },
                         { value: 'image' as const, label: '🎨 Hình/Tranh' },
                       ].map(opt => (
                         <button
                           key={opt.value}
                           onClick={() => setFilterType(opt.value)}
                           className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterType === opt.value ? 'bg-pink-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-pink-50'}`}
                         >
                           {opt.label}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>

                  {/* Status & New Message Banner */}
                  {newNotesCount > 0 && (
                    <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-amber-500/10 border border-pink-200/80 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-300">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="flex h-3 w-3 relative shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-rose-700">
                          💌 Bạn có <span className="underline decoration-rose-400 font-black">{newNotesCount} lời nhắn mới</span> từ bạn đời được đánh dấu <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-xs font-black inline-flex items-center gap-1 shadow-sm">✨ MỚI</span> bên dưới!
                        </p>
                      </div>
                      {(filterAuthor !== 'all' || filterType !== 'all' || searchQuery) && (
                        <button
                          onClick={() => { setFilterAuthor('all'); setFilterType('all'); setSearchQuery(''); }}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 underline ml-2 shrink-0"
                        >
                          Xem tất cả
                        </button>
                      )}
                    </div>
                  )}

                  {!user && (
                    <div className="mb-4 p-3 bg-amber-50/90 border border-amber-200/70 rounded-2xl flex items-center justify-between text-xs text-amber-800 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-base shrink-0">☁️</span>
                        <span>Đang lưu cục bộ trên máy này. Hãy đăng nhập tài khoản Google ở góc phải để tự động đồng bộ sang điện thoại của bạn đời.</span>
                      </div>
                    </div>
                  )}

                 {filteredNotes.length === 0 && pinnedDatesOnBoard.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 lg:py-32 flex-1">
                     <div className="w-32 h-32 bg-gradient-to-tr from-pink-100 to-rose-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                       <Heart className="w-12 h-12 text-pink-400 animate-pulse" />
                     </div>
                     <h4 className="text-2xl font-serif font-bold text-slate-700 mb-2">
                       {notes.length === 0 ? 'Chưa có kỷ niệm nào' : 'Không tìm thấy kết quả'}
                     </h4>
                     <p className="text-slate-500 font-medium text-center max-w-sm">
                       {notes.length === 0
                         ? 'Hãy là người đầu tiên viết một lời nhắn ngọt ngào hoặc vẽ một bức tranh tặng đối phương nhé! ✨'
                         : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác nhé.'}
                     </p>
                   </div>
                 ) : viewMode === 'free' ? (
                   /* FREE DRAG & DROP PINBOARD MODE */
                   <div className="flex-1 relative min-h-[900px] min-w-[1000px] overflow-auto border-2 border-dashed border-pink-100/80 rounded-3xl p-4 bg-white/40">
                     {/* Pinned Countdown Event Widgets on Free Board */}
                     {pinnedDatesOnBoard.map((sd, idx) => {
                       const daysLeft = getDaysLeft(sd);
                       const isDragging = draggingId === sd.id;
                       const isTopZ = topZIndexId === sd.id;
                       const pos = getItemPos(sd.id, idx, sd.position || { x: 30 + idx * 40, y: 30 });

                       return (
                         <div
                           key={sd.id}
                           style={{
                             position: 'absolute',
                             left: `${pos.x}px`,
                             top: `${pos.y}px`,
                             zIndex: isDragging ? 100 : isTopZ ? 40 : 30,
                           }}
                           onPointerDown={(e) => handlePointerDown(e, sd.id as any, idx, pos)}
                           onPointerMove={(e) => handlePointerMove(e, sd.id)}
                           onPointerUp={(e) => handlePointerUp(e, sd.id, true)}
                           onPointerCancel={(e) => handlePointerUp(e, sd.id, true)}
                           className={`w-[280px] sm:w-[300px] p-5 rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 text-white shadow-xl transition-shadow select-none touch-none ${isDragging ? 'cursor-grabbing scale-105 shadow-2xl z-50' : 'cursor-grab hover:shadow-2xl'}`}
                         >
                           {/* Pin & Drag Handle */}
                           <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-amber-400 text-amber-950 rounded-full shadow-md border-2 border-white flex items-center gap-1 cursor-grab active:cursor-grabbing text-[11px] font-bold uppercase tracking-wider touch-none">
                             <Pin className="w-3.5 h-3.5 fill-amber-950" /> Kéo di chuyển
                           </div>

                           <div className="flex items-center justify-between mb-3">
                             <span className="text-3xl">{sd.emoji}</span>
                             <button
                               onClick={() => handleTogglePinDateToBoard(sd.id)}
                               className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors"
                               title="Bỏ ghim khỏi Bảng vẽ"
                             >
                               <X className="w-4 h-4" />
                             </button>
                           </div>

                           <h4 className="text-lg font-bold font-serif leading-tight mb-1 text-white drop-shadow-sm">{sd.label}</h4>
                           <p className="text-xs text-pink-100 font-medium mb-3">
                             {sd.year ? `${sd.day}/${sd.month}/${sd.year}` : `${sd.day}/${sd.month}`}
                           </p>

                           <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between border border-white/20">
                             <span className="text-xs font-bold uppercase tracking-wide text-pink-100">Đếm ngược</span>
                             <span className="text-2xl font-black bg-white text-pink-600 rounded-xl px-3 py-0.5 shadow-sm">
                               {daysLeft === 0 ? '🎉 Hôm nay!' : `${daysLeft} ngày`}
                             </span>
                           </div>
                         </div>
                       );
                     })}

                     {/* Regular Notes on Free Board */}
                     {filteredNotes.map((note, index) => {
                       const authorInfo = getAuthorDisplay(note.author);
                       const dateStr = new Date(note.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
                       const reactions = note.reactions || {};
                       const reactionEntries = Object.entries(reactions).filter(([, users]) => users.length > 0);
                       const pos = getItemPos(note.id, index);
                       const isDragging = draggingId === note.id;
                       const isTopZ = topZIndexId === note.id;
                       const isNew = isNoteNew(note, index);

                       return (
                         <div
                           key={note.id}
                           style={{
                             position: 'absolute',
                             left: `${pos.x}px`,
                             top: `${pos.y}px`,
                             zIndex: isDragging ? 100 : isTopZ ? 50 : isNew ? 35 : 10 + (index % 20),
                           }}
                           onPointerDown={(e) => handlePointerDown(e, note.id as any, index)}
                           onPointerMove={(e) => handlePointerMove(e, note.id)}
                           onPointerUp={(e) => handlePointerUp(e, note.id)}
                           onPointerCancel={(e) => handlePointerUp(e, note.id)}
                           className={`w-[280px] sm:w-[320px] transition-shadow duration-200 select-none touch-none ${isDragging ? 'cursor-grabbing scale-105 shadow-2xl z-50' : 'cursor-grab hover:shadow-xl'}`}
                         >
                           {/* Pin icon & Drag Handle Header */}
                           <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md border-2 border-white flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-xs font-bold shrink-0 touch-none">
                             <Pin className="w-3.5 h-3.5" />
                             <span className="text-[10px] tracking-wider uppercase font-sans">Kéo di chuyển</span>
                           </div>

                           {note.image ? (
                             /* Polaroid Free Style */
                             <div className={`bg-white p-3 sm:p-4 pb-14 sm:pb-16 rounded-sm shadow-md border border-slate-200/80 transition-transform ${getRotationClass(index)} relative ${isNew ? 'ring-4 ring-rose-400/90 shadow-[0_0_30px_rgba(244,63,94,0.5)]' : ''}`}>
                                {isNew && (
                                  <div className="absolute -top-3 left-4 z-40 px-2.5 py-0.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[11px] font-black rounded-full shadow-lg border-2 border-white flex items-center gap-1 animate-bounce">
                                    ✨ MỚI
                                  </div>
                                )}
                               <div className="w-full aspect-[4/5] bg-[#fbfbfb] border border-slate-100 rounded-sm overflow-hidden relative shadow-inner group-hover/img:shadow-md transition-shadow">
                                 <img src={note.image} alt="Drawing" className="w-full h-full object-contain mix-blend-multiply opacity-90 pointer-events-none" />
                                 {note.audio && (
                                    <div className="absolute bottom-2 left-2 right-2 z-20">
                                      <LoveAudioPlayer src={note.audio} variant="polaroid" />
                                   </div>
                                 )}
                               </div>
                               <div className="absolute bottom-3 sm:bottom-4 left-4 right-4 flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                   <span className="text-lg">{authorInfo.icon}</span>
                                   <span className="font-signature text-xl font-bold text-slate-800 tracking-wide">{authorInfo.name}</span>
                                 </div>
                                 <span className="text-[10px] sm:text-xs font-mono text-slate-400">{dateStr.split(' ')[1]}</span>
                               </div>
                               {/* Action buttons */}
                               <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all z-30">
                                 <button onClick={() => handleDeleteNote(note.id)} className="w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50">
                                   <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                               </div>
                               {/* Reactions row */}
                               <div className="absolute bottom-[-2px] left-3 right-3 flex items-center gap-1 flex-wrap">
                                 {reactionEntries.map(([emoji, users]) => (
                                   <button key={emoji} onClick={() => handleReaction(note.id, emoji)} className={`px-1.5 py-0.5 rounded-full text-xs border transition-all ${users.includes(user?.uid || '') ? 'bg-pink-50 border-pink-200' : 'bg-white border-slate-200 hover:border-pink-200'}`}>
                                     {emoji} {users.length}
                                   </button>
                                 ))}
                                 <button
                                   onClick={() => setActiveReaction(activeReaction === note.id ? null : note.id)}
                                   className="w-6 h-6 rounded-full bg-white border border-slate-200 hover:border-pink-300 flex items-center justify-center text-[10px] transition-colors"
                                 >
                                   +
                                 </button>
                                 {activeReaction === note.id && (
                                   <div className="absolute bottom-8 left-0 flex gap-1 p-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 z-40">
                                     {REACTION_EMOJIS.map(e => (
                                       <button key={e} onClick={() => handleReaction(note.id, e)} className="w-8 h-8 flex items-center justify-center hover:bg-pink-50 rounded-lg text-lg transition-colors hover:scale-125">
                                         {e}
                                       </button>
                                     ))}
                                   </div>
                                 )}
                               </div>
                             </div>
                           ) : (
                             /* Text Sticky Note Style */
                             <div className={`p-6 sm:p-7 rounded-[2rem] ${note.color} shadow-md border transition-transform ${getRotationClass(index)} relative ${isNew ? 'ring-4 ring-rose-400/90 shadow-[0_0_30px_rgba(244,63,94,0.5)]' : ''}`}>
                                {isNew && (
                                  <div className="absolute -top-3 left-6 z-40 px-2.5 py-0.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[11px] font-black rounded-full shadow-lg border-2 border-white flex items-center gap-1 animate-bounce">
                                    ✨ MỚI
                                  </div>
                                )}
                               <p className="text-base sm:text-lg font-medium leading-relaxed mb-4 text-slate-800 whitespace-pre-wrap">
                                 {note.message}
                               </p>
                                {note.audio && (
                                  <LoveAudioPlayer src={note.audio} variant="card" className="mb-4" />
                                )}
                               <div className="flex items-center justify-between mb-3">
                                 <div className="flex items-center gap-2">
                                   <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center shadow-sm text-lg">
                                     {authorInfo.icon}
                                   </div>
                                   <div className="flex flex-col">
                                     <span className="text-sm font-bold opacity-80 leading-tight text-slate-800">{authorInfo.name}</span>
                                     <span className="text-xs font-medium opacity-60 text-slate-700">{dateStr}</span>
                                   </div>
                                 </div>
                               </div>
                               {/* Reactions */}
                               <div className="flex items-center gap-1 flex-wrap">
                                 {reactionEntries.map(([emoji, users]) => (
                                   <button key={emoji} onClick={() => handleReaction(note.id, emoji)} className={`px-2 py-1 rounded-full text-xs border transition-all ${users.includes(user?.uid || '') ? 'bg-white/80 border-pink-300' : 'bg-white/40 border-white/60 hover:border-pink-200'}`}>
                                     {emoji} {users.length}
                                   </button>
                                 ))}
                                 <button
                                   onClick={() => setActiveReaction(activeReaction === note.id ? null : note.id)}
                                   className="w-7 h-7 rounded-full bg-white/50 border border-white/60 hover:border-pink-300 flex items-center justify-center text-xs transition-colors"
                                 >
                                   +
                                 </button>
                                 {activeReaction === note.id && (
                                   <div className="absolute bottom-4 left-4 flex gap-1 p-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 z-40">
                                     {REACTION_EMOJIS.map(e => (
                                       <button key={e} onClick={() => handleReaction(note.id, e)} className="w-8 h-8 flex items-center justify-center hover:bg-pink-50 rounded-lg text-lg transition-colors hover:scale-125">
                                         {e}
                                       </button>
                                     ))}
                                   </div>
                                 )}
                               </div>
                               {/* Delete button */}
                               <button onClick={() => handleDeleteNote(note.id)} className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-white/50 transition-colors">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 ) : (
                   /* MASONRY GRID MODE */
                   <div className="columns-1 md:columns-2 2xl:columns-3 gap-6 lg:gap-8 flex-1">
                     {/* Pinned Countdown Event Widgets in Grid Mode */}
                     {pinnedDatesOnBoard.map(sd => {
                       const daysLeft = getDaysLeft(sd);
                       return (
                         <div key={sd.id} className="break-inside-avoid mb-6 p-5 rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg relative">
                           <div className="flex items-center justify-between mb-3">
                             <span className="text-3xl">{sd.emoji}</span>
                             <button
                               onClick={() => handleTogglePinDateToBoard(sd.id)}
                               className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors"
                               title="Bỏ ghim khỏi Bảng vẽ"
                             >
                               <X className="w-4 h-4" />
                             </button>
                           </div>
                           <h4 className="text-lg font-bold font-serif leading-tight mb-1 text-white drop-shadow-sm">{sd.label}</h4>
                           <p className="text-xs text-pink-100 font-medium mb-3">
                             {sd.year ? `${sd.day}/${sd.month}/${sd.year}` : `${sd.day}/${sd.month}`}
                           </p>
                           <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between border border-white/20">
                             <span className="text-xs font-bold uppercase tracking-wide text-pink-100">Đếm ngược</span>
                             <span className="text-2xl font-black bg-white text-pink-600 rounded-xl px-3 py-0.5 shadow-sm">
                               {daysLeft === 0 ? '🎉 Hôm nay!' : `${daysLeft} ngày`}
                             </span>
                           </div>
                         </div>
                       );
                     })}

                     {/* Regular Notes in Grid Mode */}
                     {filteredNotes.map((note, index) => {
                        const authorInfo = getAuthorDisplay(note.author);
                        const isNew = isNoteNew(note, index);
                        const dateStr = new Date(note.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
                        const reactions = note.reactions || {};
                        const reactionEntries = Object.entries(reactions).filter(([, users]) => users.length > 0);
                        
                        return (
                          <div 
                            key={note.id} 
                            className={`break-inside-avoid mb-6 lg:mb-8 group relative ${note.image ? getRotationClass(index) : ''}`}
                          >
                            {/* Pinned indicator */}
                            {note.pinned && (
                              <div className="absolute -top-2 left-4 z-30 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                <Pin className="w-3 h-3" /> Ghim
                              </div>
                            )}

                            {note.image ? (
                              /* Polaroid Style */
                              <div className={`bg-white p-3 sm:p-4 pb-14 sm:pb-16 rounded-sm shadow-md hover:shadow-2xl border border-slate-100 transition-all duration-500 hover:rotate-0 hover:scale-[1.02] hover:z-20 relative ${isNew ? 'ring-4 ring-rose-400/90 shadow-xl shadow-rose-300/60' : ''}`}>
                                {isNew && (
                                  <div className="absolute -top-3 left-4 z-30 px-2.5 py-0.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[11px] font-black rounded-full shadow-lg border-2 border-white flex items-center gap-1 animate-pulse">
                                    ✨ MỚI
                                  </div>
                                )}
                                <div className="w-full aspect-[4/5] bg-[#fbfbfb] border border-slate-100 rounded-sm overflow-hidden relative shadow-inner">
                                  <img src={note.image} alt="Drawing" className="w-full h-full object-contain mix-blend-multiply opacity-90" />
                                  {note.audio && (
                                    <div className="absolute bottom-2 left-2 right-2 z-20">
                                      <LoveAudioPlayer src={note.audio} variant="polaroid" />
                                    </div>
                                  )}
                                </div>
                                <div className="absolute bottom-3 sm:bottom-4 left-4 right-4 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{authorInfo.icon}</span>
                                    <span className="font-signature text-xl font-bold text-slate-800 tracking-wide">{authorInfo.name}</span>
                                  </div>
                                  <span className="text-[10px] sm:text-xs font-mono text-slate-400">{dateStr.split(' ')[1]}</span>
                                </div>
                                {/* Action buttons */}
                                <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-30">
                                  <button onClick={() => handleTogglePin(note.id)} className={`w-7 h-7 rounded-full shadow-md flex items-center justify-center transition-colors ${note.pinned ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}>
                                    <Pin className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteNote(note.id)} className="w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {/* Reactions row */}
                                <div className="absolute bottom-[-2px] left-3 right-3 flex items-center gap-1 flex-wrap">
                                  {reactionEntries.map(([emoji, users]) => (
                                    <button key={emoji} onClick={() => handleReaction(note.id, emoji)} className={`px-1.5 py-0.5 rounded-full text-xs border transition-all ${users.includes(user?.uid || '') ? 'bg-pink-50 border-pink-200' : 'bg-white border-slate-200 hover:border-pink-200'}`}>
                                      {emoji} {users.length}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => setActiveReaction(activeReaction === note.id ? null : note.id)}
                                    className="w-6 h-6 rounded-full bg-white border border-slate-200 hover:border-pink-300 flex items-center justify-center text-[10px] transition-colors"
                                  >
                                    +
                                  </button>
                                  {activeReaction === note.id && (
                                    <div className="absolute bottom-8 left-0 flex gap-1 p-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 z-40">
                                      {REACTION_EMOJIS.map(e => (
                                        <button key={e} onClick={() => handleReaction(note.id, e)} className="w-8 h-8 flex items-center justify-center hover:bg-pink-50 rounded-lg text-lg transition-colors hover:scale-125">
                                          {e}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Text Card Style */
                              <div className={`p-6 sm:p-8 rounded-[2rem] ${note.color} shadow-sm hover:shadow-xl border transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01] hover:z-20 relative ${isNew ? 'ring-4 ring-rose-400/90 shadow-xl shadow-rose-300/60' : ''}`}>
                                {isNew && (
                                  <div className="absolute -top-3 left-6 z-40 px-2.5 py-0.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[11px] font-black rounded-full shadow-lg border-2 border-white flex items-center gap-1 animate-pulse">
                                    ✨ MỚI
                                  </div>
                                )}
                                <p className="text-lg sm:text-xl font-medium leading-relaxed mb-4 text-slate-800 whitespace-pre-wrap">
                                  {note.message}
                                </p>
                                {note.audio && (
                                  <LoveAudioPlayer src={note.audio} variant="card" className="mb-4" />
                                )}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center shadow-sm text-lg">
                                      {authorInfo.icon}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold opacity-80 leading-tight text-slate-800">{authorInfo.name}</span>
                                      <span className="text-xs font-medium opacity-60 text-slate-700">{dateStr}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Reactions */}
                                <div className="flex items-center gap-1 flex-wrap">
                                  {reactionEntries.map(([emoji, users]) => (
                                    <button key={emoji} onClick={() => handleReaction(note.id, emoji)} className={`px-2 py-1 rounded-full text-xs border transition-all ${users.includes(user?.uid || '') ? 'bg-white/80 border-pink-300' : 'bg-white/40 border-white/60 hover:border-pink-200'}`}>
                                      {emoji} {users.length}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => setActiveReaction(activeReaction === note.id ? null : note.id)}
                                    className="w-7 h-7 rounded-full bg-white/50 border border-white/60 hover:border-pink-300 flex items-center justify-center text-xs transition-colors"
                                  >
                                    +
                                  </button>
                                  {activeReaction === note.id && (
                                    <div className="absolute bottom-4 left-4 flex gap-1 p-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 z-40">
                                      {REACTION_EMOJIS.map(e => (
                                        <button key={e} onClick={() => handleReaction(note.id, e)} className="w-8 h-8 flex items-center justify-center hover:bg-pink-50 rounded-lg text-lg transition-colors hover:scale-125">
                                          {e}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {/* Action buttons */}
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 md:group-hover:opacity-100 sm:opacity-100 transition-all">
                                  <button onClick={() => handleTogglePin(note.id)} className={`p-1.5 rounded-full transition-colors ${note.pinned ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-white/50'}`}>
                                    <Pin className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteNote(note.id)} className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-white/50 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                     })}
                   </div>
                 )}
               </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
