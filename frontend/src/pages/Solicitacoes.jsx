import { useState, useEffect, useRef } from 'react';
import { 
  Receipt, Plus, Search, Eye, CheckCircle2, XCircle,
  Clock, Mic, MicOff, Play, Pause, Trash2, Send,
  AlertTriangle, FileText
} from 'lucide-react';
import { solicitacaoAPI, meiAPI, clienteAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

function Solicitacoes() {
  const [loading, setLoading] = useState(true);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [meis, setMeis] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitacaoView, setSolicitacaoView] = useState(null);
  const { isAdmin, meiAtual, usuario } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, [meiAtual]);

  const fetchData = async () => {
    try {
      const params = {};
      if (meiAtual?.id) params.meiId = meiAtual.id;
      
      const [solRes, meisRes] = await Promise.all([
        solicitacaoAPI.listar(params),
        isAdmin() ? meiAPI.listar() : Promise.resolve({ data: [] })
      ]);
      
      setSolicitacoes(solRes.data.solicitacoes || solRes.data || []);
      setMeis(meisRes.data?.meis || meisRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const solicitacoesFiltradas = solicitacoes.filter(sol => {
    const matchBusca = 
      sol.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      sol.mei?.nomeFantasia?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = !filtroStatus || sol.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const handleCriar = async (formData) => {
    try {
      await solicitacaoAPI.criar(formData);
      toast.success('Solicitação enviada com sucesso');
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao criar solicitação');
    }
  };

  const handleAtualizar = async (id, status, motivo) => {
    try {
      await solicitacaoAPI.atualizar(id, { status, motivoRejeicao: motivo });
      toast.success('Solicitação atualizada com sucesso');
      setSolicitacaoView(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar solicitação');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      PENDENTE: { color: 'amber', icon: Clock, label: 'Pendente' },
      EM_ANDAMENTO: { color: 'blue', icon: Receipt, label: 'Em Andamento' },
      EMITIDA: { color: 'green', icon: CheckCircle2, label: 'Emitida' },
      REJEITADA: { color: 'red', icon: XCircle, label: 'Rejeitada' }
    };
    return configs[status] || configs.PENDENTE;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isAdmin() ? 'Solicitações de Nota' : 'Solicitar Nota'}
          </h1>
          <p className="text-slate-400 mt-1">
            {isAdmin() ? 'Gerencie as solicitações de notas fiscais' : 'Solicite a emissão de notas fiscais'}
          </p>
        </div>
        {!isAdmin() && (
          <button 
            onClick={() => setModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Nova Solicitação
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar solicitações..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="input w-full sm:w-44"
        >
          <option value="">Todos status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="EM_ANDAMENTO">Em Andamento</option>
          <option value="EMITIDA">Emitida</option>
          <option value="REJEITADA">Rejeitada</option>
        </select>
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {solicitacoesFiltradas.map((sol) => {
          const statusConfig = getStatusConfig(sol.status);
          const StatusIcon = statusConfig.icon;
          
          return (
            <div 
              key={sol.id} 
              className="card p-4 hover:border-slate-600 transition-colors cursor-pointer"
              onClick={() => setSolicitacaoView(sol)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${statusConfig.color}-500/20`}>
                  <StatusIcon className={`w-6 h-6 text-${statusConfig.color}-400`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{sol.mei?.nomeFantasia || 'MEI'}</p>
                      <p className="text-sm text-slate-400 truncate">{sol.descricao}</p>
                    </div>
                    <span className={`badge badge-${statusConfig.color === 'amber' ? 'warning' : statusConfig.color === 'blue' ? 'info' : statusConfig.color === 'green' ? 'success' : 'danger'}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span>{formatDate(sol.createdAt)}</span>
                    <span className="font-medium text-white">{formatCurrency(sol.valor)}</span>
                    {sol.audioUrl && (
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Mic className="w-3 h-3" />
                        Áudio anexado
                      </span>
                    )}
                  </div>
                </div>

                <Eye className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          );
        })}

        {solicitacoesFiltradas.length === 0 && (
          <div className="card p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">Nenhuma solicitação encontrada</p>
            {!isAdmin() && (
              <button 
                onClick={() => setModalOpen(true)}
                className="btn btn-primary mt-4"
              >
                Fazer primeira solicitação
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Nova Solicitação */}
      {modalOpen && (
        <SolicitacaoModal
          meis={usuario?.meis || meis}
          onClose={() => setModalOpen(false)}
          onSave={handleCriar}
        />
      )}

      {/* Modal de Visualização */}
      {solicitacaoView && (
        <SolicitacaoViewModal
          solicitacao={solicitacaoView}
          isAdmin={isAdmin()}
          onClose={() => setSolicitacaoView(null)}
          onAtualizar={handleAtualizar}
        />
      )}
    </div>
  );
}

// Modal de Nova Solicitação com Gravador de Áudio
function SolicitacaoModal({ meis, onClose, onSave }) {
  const [formData, setFormData] = useState({
    meiId: meis[0]?.id || '',
    valor: '',
    descricao: '',
    clienteNome: '',
    clienteCpfCnpj: ''
  });
  const [saving, setSaving] = useState(false);
  
  // Estados do gravador de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error('Não foi possível acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const data = new FormData();
    data.append('meiId', formData.meiId);
    data.append('valor', parseFloat(formData.valor.replace(/\D/g, '')) / 100);
    data.append('descricao', formData.descricao);
    data.append('clienteNome', formData.clienteNome);
    data.append('clienteCpfCnpj', formData.clienteCpfCnpj.replace(/\D/g, ''));
    
    if (audioBlob) {
      data.append('audio', audioBlob, 'descricao.webm');
    }
    
    await onSave(data);
    setSaving(false);
  };

  const formatCurrency = (value) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseInt(numbers || '0', 10) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const formatCpfCnpj = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg animate-fadeIn my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Nova Solicitação</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {meis.length > 1 && (
            <div>
              <label className="label">MEI *</label>
              <select
                value={formData.meiId}
                onChange={(e) => setFormData({ ...formData, meiId: e.target.value })}
                className="input w-full"
                required
              >
                {meis.map(mei => (
                  <option key={mei.id} value={mei.id}>
                    {mei.nomeFantasia || mei.razaoSocial}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome do Cliente *</label>
              <input
                type="text"
                value={formData.clienteNome}
                onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                className="input w-full"
                placeholder="Nome completo"
                required
              />
            </div>
            <div>
              <label className="label">CPF/CNPJ *</label>
              <input
                type="text"
                value={formatCpfCnpj(formData.clienteCpfCnpj)}
                onChange={(e) => setFormData({ ...formData, clienteCpfCnpj: e.target.value })}
                className="input w-full"
                placeholder="000.000.000-00"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Valor *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
              <input
                type="text"
                value={formatCurrency(formData.valor)}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                className="input w-full pl-10"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Descrição do Serviço *</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="input w-full h-24 resize-none"
              placeholder="Descreva o serviço prestado..."
              required
            />
          </div>

          {/* Gravador de Áudio */}
          <div>
            <label className="label flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Descrição em Áudio (opcional)
            </label>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              {!audioUrl ? (
                <div className="flex items-center justify-center gap-4">
                  {isRecording ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white font-mono">{formatTime(recordingTime)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="btn btn-danger"
                      >
                        <MicOff className="w-4 h-4" />
                        Parar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="btn btn-secondary"
                    >
                      <Mic className="w-4 h-4" />
                      Gravar Áudio
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-600 flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm text-white">Áudio gravado</p>
                    <p className="text-xs text-slate-400">{formatTime(recordingTime)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAudio}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Enviando...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Solicitação
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de Visualização
function SolicitacaoViewModal({ solicitacao, isAdmin, onClose, onAtualizar }) {
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [showRejeitar, setShowRejeitar] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getStatusConfig = (status) => {
    const configs = {
      PENDENTE: { color: 'amber', label: 'Pendente' },
      EM_ANDAMENTO: { color: 'blue', label: 'Em Andamento' },
      EMITIDA: { color: 'green', label: 'Emitida' },
      REJEITADA: { color: 'red', label: 'Rejeitada' }
    };
    return configs[status] || configs.PENDENTE;
  };

  const statusConfig = getStatusConfig(solicitacao.status);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg animate-fadeIn my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Detalhes da Solicitação</h2>
            <span className={`badge mt-1 badge-${statusConfig.color === 'amber' ? 'warning' : statusConfig.color === 'blue' ? 'info' : statusConfig.color === 'green' ? 'success' : 'danger'}`}>
              {statusConfig.label}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Data</p>
              <p className="font-medium text-white">
                {new Date(solicitacao.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Valor</p>
              <p className="font-medium text-white text-lg">{formatCurrency(solicitacao.valor)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-400">MEI</p>
            <p className="font-medium text-white">{solicitacao.mei?.nomeFantasia || solicitacao.mei?.razaoSocial}</p>
          </div>

          <div>
            <p className="text-sm text-slate-400">Cliente</p>
            <p className="font-medium text-white">{solicitacao.clienteNome}</p>
            <p className="text-sm text-slate-400">{solicitacao.clienteCpfCnpj}</p>
          </div>

          <div>
            <p className="text-sm text-slate-400">Descrição</p>
            <p className="text-white bg-slate-700/50 rounded-lg p-3 mt-1">
              {solicitacao.descricao}
            </p>
          </div>

          {solicitacao.audioUrl && (
            <div>
              <p className="text-sm text-slate-400 mb-2">Áudio Anexado</p>
              <div className="bg-slate-700/50 rounded-lg p-3 flex items-center gap-3">
                <audio 
                  ref={audioRef} 
                  src={solicitacao.audioUrl} 
                  onEnded={() => setAudioPlaying(false)} 
                />
                <button
                  onClick={toggleAudio}
                  className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-600 flex items-center justify-center transition-colors"
                >
                  {audioPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
                <span className="text-sm text-slate-300">Clique para ouvir</span>
              </div>
            </div>
          )}

          {solicitacao.status === 'REJEITADA' && solicitacao.motivoRejeicao && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">Motivo da Rejeição</p>
              <p className="text-white">{solicitacao.motivoRejeicao}</p>
            </div>
          )}

          {/* Ações do Admin */}
          {isAdmin && solicitacao.status === 'PENDENTE' && !showRejeitar && (
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => onAtualizar(solicitacao.id, 'EM_ANDAMENTO')}
                className="btn btn-secondary flex-1"
              >
                Iniciar Processamento
              </button>
              <button 
                onClick={() => setShowRejeitar(true)}
                className="btn btn-danger flex-1"
              >
                Rejeitar
              </button>
            </div>
          )}

          {isAdmin && solicitacao.status === 'EM_ANDAMENTO' && !showRejeitar && (
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => onAtualizar(solicitacao.id, 'EMITIDA')}
                className="btn btn-success flex-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Marcar como Emitida
              </button>
              <button 
                onClick={() => setShowRejeitar(true)}
                className="btn btn-danger flex-1"
              >
                Rejeitar
              </button>
            </div>
          )}

          {showRejeitar && (
            <div className="space-y-3 pt-2">
              <textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                className="input w-full h-20 resize-none"
                placeholder="Informe o motivo da rejeição..."
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRejeitar(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => onAtualizar(solicitacao.id, 'REJEITADA', motivoRejeicao)}
                  className="btn btn-danger flex-1"
                  disabled={!motivoRejeicao.trim()}
                >
                  Confirmar Rejeição
                </button>
              </div>
            </div>
          )}
        </div>

        {(!isAdmin || ['EMITIDA', 'REJEITADA'].includes(solicitacao.status)) && !showRejeitar && (
          <div className="p-6 border-t border-slate-700">
            <button onClick={onClose} className="btn btn-secondary w-full">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Solicitacoes;
