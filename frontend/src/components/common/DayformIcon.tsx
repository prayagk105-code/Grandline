import React from 'react';
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  Copy,
  Download,
  Droplets,
  Flame,
  Heart,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Leaf,
  LineChart,
  MapPin,
  Moon,
  MoreHorizontal,
  Pause,
  PenLine,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  User,
  Wallet,
  Wifi,
  WifiOff,
  Wind,
  X,
  Zap
} from 'lucide-react';

export const PICKER_ICONS = ['sun', 'leaf', 'zap', 'wind', 'book', 'pen', 'moon', 'heart', 'drop', 'cup'] as const;

interface DayformIconProps {
  name?: string | null;
  size?: number;
  className?: string;
}

export const DayformIcon: React.FC<DayformIconProps> = ({ name, size = 19, className }) => {
  const props = { size, strokeWidth: 1.85, className, 'aria-hidden': true as const };

  switch ((name || 'star').toLowerCase()) {
    case 'home': return <Home {...props} />;
    case 'habit': return <CheckCircle2 {...props} />;
    case 'book': return <BookOpen {...props} />;
    case 'img': return <ImageIcon {...props} />;
    case 'chart': return <LineChart {...props} />;
    case 'cal': return <Calendar {...props} />;
    case 'plus': return <Plus {...props} />;
    case 'clock': return <Clock {...props} />;
    case 'flame': return <Flame {...props} />;
    case 'play': return <Play {...props} fill="currentColor" />;
    case 'pause': return <Pause {...props} fill="currentColor" />;
    case 'reset': return <RotateCcw {...props} />;
    case 'pen': return <PenLine {...props} />;
    case 'x': return <X {...props} />;
    case 'check': return <Check {...props} />;
    case 'trash': return <Trash2 {...props} />;
    case 'copy': return <Copy {...props} />;
    case 'left': return <ChevronLeft {...props} />;
    case 'right': return <ChevronRight {...props} />;
    case 'sun': return <Sun {...props} />;
    case 'leaf': return <Leaf {...props} />;
    case 'zap': return <Zap {...props} />;
    case 'wind': return <Wind {...props} />;
    case 'moon': return <Moon {...props} />;
    case 'heart': return <Heart {...props} />;
    case 'drop': return <Droplets {...props} />;
    case 'cup': return <Coffee {...props} />;
    case 'pin': return <MapPin {...props} />;
    case 'user': return <User {...props} />;
    case 'wallet': return <Wallet {...props} />;
    case 'bell': return <Bell {...props} />;
    case 'search': return <Search {...props} />;
    case 'settings': return <Settings {...props} />;
    case 'more': return <MoreHorizontal {...props} />;
    case 'grid': return <LayoutGrid {...props} />;
    case 'download': return <Download {...props} />;
    case 'install': return <Download {...props} />;
    case 'wifi': return <Wifi {...props} />;
    case 'wifioff':
    case 'wifi-off': return <WifiOff {...props} />;
    case 'shield': return <ShieldCheck {...props} />;
    case 'sparkles': return <Sparkles {...props} />;
    case 'target': return <Target {...props} />;
    case 'award': return <Award {...props} />;
    case 'activity': return <Activity {...props} />;
    case 'compass': return <Compass {...props} />;
    case 'star':
    default:
      return <Star {...props} />;
  }
};
