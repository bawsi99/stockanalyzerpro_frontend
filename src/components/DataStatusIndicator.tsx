import React from 'react';
import { Badge } from './ui/badge';
import { AlertCircle, Wifi, WifiOff, Clock, Zap } from 'lucide-react';

interface DataStatusIndicatorProps {
  isConnected: boolean;
  isLive: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string | null;
}

export const DataStatusIndicator: React.FC<DataStatusIndicatorProps> = ({
  isConnected,
  isLive,
  connectionStatus,
  error
}) => {
  const getStatusInfo = () => {
    if (isConnected && isLive) {
      return {
        icon: <Zap className="w-3 h-3" />,
        text: 'Live Data',
        variant: 'default' as const,
        color: 'text-green-600'
      };
    } else if (isConnected && !isLive) {
      return {
        icon: <Wifi className="w-3 h-3" />,
        text: 'Connected',
        variant: 'secondary' as const,
        color: 'text-blue-600'
      };
    } else if (connectionStatus === 'connecting') {
      return {
        icon: <Clock className="w-3 h-3" />,
        text: 'Connecting...',
        variant: 'outline' as const,
        color: 'text-yellow-600'
      };
    } else if (connectionStatus === 'error') {
      return {
        icon: <AlertCircle className="w-3 h-3" />,
        text: 'Historical Only',
        variant: 'destructive' as const,
        color: 'text-orange-600'
      };
    } else {
      return {
        icon: <WifiOff className="w-3 h-3" />,
        text: 'Disconnected',
        variant: 'outline' as const,
        color: 'text-gray-600'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center gap-2">
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <span className={statusInfo.color}>{statusInfo.icon}</span>
        {statusInfo.text}
      </Badge>
      
      {error && (
        <div className="text-xs text-muted-foreground max-w-xs">
          {error}
        </div>
      )}
      
      {!isLive && isConnected && (
        <div className="text-xs text-muted-foreground">
          Live data requires Zerodha credentials
        </div>
      )}
    </div>
  );
}; 