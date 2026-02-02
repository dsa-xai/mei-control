// ============================================
// Componente de Alerta de Teto Progressivo
// ============================================

import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, XCircle, CheckCircle, X, Bell } from 'lucide-react';

const TETO_MEI_ANUAL = 81000;

// Determinar nível de alerta baseado no percentual
export const getAlertLevel = (percentual) => {
  if (percentual >= 100) return 'critical';
  if (percentual >= 95) return 'danger';
  if (percentual >= 80) return 'warning';
  if (percentual >= 65) return 'attention';
  return 'safe';
};

// Configurações visuais por nível
export const alertConfig = {
  safe: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
    barBg: 'bg-emerald-900/30',
    icon: CheckCircle,
    label: 'Normal',
    pulse: false
  },
  attention: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    bar: 'bg-yellow-500',
    barBg: 'bg-yellow-900/30',
    icon: Bell,
    label: 'Atenção',
    pulse: false
  },
  warning: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    bar: 'bg-orange-500',
    barBg: 'bg-orange-900/30',
    icon: AlertTriangle,
    label: 'Alerta',
    pulse: true
  },
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    bar: 'bg-red-500',
    barBg: 'bg-red-900/30',
    icon: AlertCircle,
    label: 'Crítico',
    pulse: true
  },
  critical: {
    bg: 'bg-red-900/30',
    border: 'border-red-600',
    text: 'text-red-300',
    bar: 'bg-red-600',
    barBg: 'bg-red-950/50',
    icon: XCircle,
    label: 'EXCEDIDO',
    pulse: true
  }
};

// Barra de Progresso do Teto
export function TetoProgressBar({ 
  percentual, 
  valor, 
  teto = TETO_MEI_ANUAL, 
  showLabel = true, 
  showValue = true,
  size = 'md',
  animated = true 
}) {
  const level = getAlertLevel(percentual);
  const config = alertConfig[level];
  const Icon = config.icon;
  
  const heights = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6'
  };

  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setWidth(Math.min(percentual, 100));
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setWidth(Math.min(percentual, 100));
    }
  }, [percentual, animated]);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.text} ${config.pulse ? 'animate-pulse' : ''}`} />
            <span className={`text-sm font-medium ${config.text}`}>
              {config.label}
            </span>
          </div>
          <span className={`text-sm font-bold ${config.text}`}>
            {percentual.toFixed(1)}%
          </span>
        </div>
      )}
      
      <div className={`${heights[size]} ${config.barBg} rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${config.bar} rounded-full transition-all duration-1000 ease-out ${config.pulse ? 'animate-pulse-alert' : ''}`}
          style={{ width: `${width}%` }}
        />
      </div>

      {showValue && (
        <div className="flex justify-between items-center mt-2 text-xs">
          <span className="text-slate-400">
            R$ {valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-slate-500">
            / R$ {teto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

// Card de Alerta com mensagem
export function AlertaTetoCard({ percentual, valor, teto = TETO_MEI_ANUAL, onClose }) {
  const level = getAlertLevel(percentual);
  const config = alertConfig[level];
  const Icon = config.icon;
  const valorRestante = Math.max(0, teto - valor);

  if (level === 'safe') return null;

  const mensagens = {
    attention: `Você atingiu ${percentual.toFixed(1)}% do teto anual. Restam R$ ${valorRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
    warning: `Atenção! Você está com ${percentual.toFixed(1)}% do teto. Planeje suas emissões com cuidado.`,
    danger: `Cuidado! Apenas R$ ${valorRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} restantes até o teto!`,
    critical: `TETO EXCEDIDO! Você ultrapassou o limite de R$ ${teto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Providências são necessárias.`
  };

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-4 ${config.pulse ? 'animate-pulse-alert' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.text}`} />
          </div>
          <div>
            <h4 className={`font-semibold ${config.text}`}>
              {level === 'critical' ? '🚨 TETO EXCEDIDO!' : `⚠️ Alerta: ${config.label}`}
            </h4>
            <p className="text-sm text-slate-400 mt-1">
              {mensagens[level]}
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="mt-4">
        <TetoProgressBar 
          percentual={percentual} 
          valor={valor} 
          teto={teto}
          showLabel={false}
          size="sm"
        />
      </div>
    </div>
  );
}

// Mini badge de status do teto
export function TetoStatusBadge({ percentual }) {
  const level = getAlertLevel(percentual);
  const config = alertConfig[level];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.pulse ? 'animate-pulse' : ''}`}>
      <Icon className="w-3 h-3" />
      {percentual.toFixed(0)}%
    </span>
  );
}

export default TetoProgressBar;
