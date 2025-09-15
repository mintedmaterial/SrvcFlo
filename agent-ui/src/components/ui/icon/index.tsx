import React from 'react'
import { 
  Send, 
  Download, 
  Play, 
  Pause, 
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Plus,
  Minus,
  Settings,
  User,
  Bot,
  MessageCircle,
  FileText,
  Image as ImageIcon,
  Video,
  Mic,
  Copy,
  Edit,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wifi,
  WifiOff,
  ArrowDown
} from 'lucide-react'

export type IconType = 
  | 'send' 
  | 'download' 
  | 'play' 
  | 'pause' 
  | 'volume' 
  | 'volume-off'
  | 'loading' 
  | 'error' 
  | 'success' 
  | 'info' 
  | 'close' 
  | 'add' 
  | 'minus'
  | 'settings' 
  | 'user' 
  | 'bot' 
  | 'message' 
  | 'file' 
  | 'image' 
  | 'video' 
  | 'mic'
  | 'copy' 
  | 'edit' 
  | 'delete' 
  | 'more' 
  | 'chevron-down' 
  | 'chevron-up' 
  | 'chevron-left'
  | 'chevron-right' 
  | 'refresh' 
  | 'wifi' 
  | 'wifi-off'
  | 'arrow-down'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type IconColor = 'primary' | 'primaryAccent' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'inherit'

const iconMap = {
  send: Send,
  download: Download,
  play: Play,
  pause: Pause,
  volume: Volume2,
  'volume-off': VolumeX,
  loading: Loader2,
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
  close: X,
  add: Plus,
  minus: Minus,
  settings: Settings,
  user: User,
  bot: Bot,
  message: MessageCircle,
  file: FileText,
  image: ImageIcon,
  video: Video,
  mic: Mic,
  copy: Copy,
  edit: Edit,
  delete: Trash2,
  more: MoreVertical,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  refresh: RefreshCw,
  wifi: Wifi,
  'wifi-off': WifiOff,
  'arrow-down': ArrowDown,
}

const sizeMap: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
}

const colorMap: Record<IconColor, string> = {
  primary: 'text-primary',
  primaryAccent: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
  inherit: 'text-inherit',
}

interface IconProps {
  type: IconType
  size?: IconSize
  color?: IconColor
  className?: string
  onClick?: () => void
}

const Icon: React.FC<IconProps> = ({ 
  type, 
  size = 'md', 
  color = 'inherit',
  className = '',
  onClick 
}) => {
  const IconComponent = iconMap[type]
  
  if (!IconComponent) {
    console.warn(`Icon type "${type}" not found`)
    return null
  }

  return (
    <IconComponent 
      className={`${sizeMap[size]} ${colorMap[color]} ${className}`}
      onClick={onClick}
    />
  )
}

export default Icon