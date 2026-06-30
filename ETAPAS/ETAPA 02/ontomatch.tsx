import React, { useState, useEffect } from 'react';
import { GraduationCap, Activity, Building2, RefreshCw, Zap } from 'lucide-react';

// --- GAME CONFIG & ONTOLOGY ENTITIES ---
type EntityId = 
  | 'pesquisador' | 'universidade' | 'centro' 
  | 'empreendedor' | 'startup' | 'unicornio' 
  | 'projeto' | 'agencia' | 'parque' 
  | 'silo' | 'resolucao';

interface EntityDef {
  id: EntityId;
  icon: string;
  label: string;
  level: number;
  next: EntityId | null;
  style: string;
}

const ENTITIES: Record<EntityId, EntityDef> = {
  // Hélice: ACADEMIA [P]
  pesquisador:  { id: 'pesquisador', icon: '👨‍🔬', label: 'Pesquisador', level: 1, next: 'universidade', style: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  universidade: { id: 'universidade', icon: '🎓', label: 'Universidade', level: 2, next: 'centro', style: 'bg-blue-600/30 border-blue-400/50 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
  centro:       { id: 'centro', icon: '🔬', label: 'Centro de P&D', level: 3, next: null, style: 'bg-blue-500 border-blue-300 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]' },

  // Hélice: MERCADO [P]
  empreendedor: { id: 'empreendedor', icon: '👨‍💻', label: 'Empreendedor', level: 1, next: 'startup', style: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
  startup:      { id: 'startup', icon: '🚀', label: 'Startup', level: 2, next: 'unicornio', style: 'bg-rose-600/30 border-rose-400/50 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]' },
  unicornio:    { id: 'unicornio', icon: '🦄', label: 'Unicórnio', level: 3, next: null, style: 'bg-rose-500 border-rose-300 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)]' },

  // Hélice: ESTADO / INFRA [M/E]
  projeto:      { id: 'projeto', icon: '📄', label: 'Edital de Fomento', level: 1, next: 'agencia', style: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  agencia:      { id: 'agencia', icon: '🏛️', label: 'Agência (FAPERJ)', level: 2, next: 'parque', style: 'bg-amber-600/30 border-amber-400/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]' },
  parque:       { id: 'parque', icon: '🏢', label: 'Parque Tecnológico', level: 3, next: null, style: 'bg-amber-500 border-amber-300 text-white shadow-[0_0_20px_rgba(245,158,11,0.6)]' },

  // Obstáculos & Ferramentas
  silo:         { id: 'silo', icon: '⬛', label: 'Silo de Dados', level: 0, next: null, style: 'bg-[#1a1a24] border-[#333] text-gray-500 opacity-80' },
  resolucao:    { id: 'resolucao', icon: '⚡', label: 'Axioma de Limpeza', level: 0, next: null, style: 'bg-purple-500/20 border-purple-400 text-purple-300 animate-pulse' },
};

const BOARD_COLS = 5;
const BOARD_ROWS = 5;
const WIN_INDEX = 100;

function getRandomTile(): EntityId {
  const r = Math.random();
  if (r < 0.30) return 'pesquisador';
  if (r < 0.60) return 'empreendedor';
  if (r < 0.85) return 'projeto';
  if (r < 0.95) return 'silo';
  return 'resolucao';
}

function getNeighbors(index: number) {
  const neighbors = [];
  const r = Math.floor(index / BOARD_COLS);
  const c = index % BOARD_COLS;
  if (r > 0) neighbors.push(index - BOARD_COLS); // cima
  if (r < BOARD_ROWS - 1) neighbors.push(index + BOARD_COLS); // baixo
  if (c > 0) neighbors.push(index - 1); // esquerda
  if (c < BOARD_COLS - 1) neighbors.push(index + 1); // direita
  return neighbors;
}

export default function App() {
  const [grid, setGrid] = useState<(EntityId | null)[]>(Array(25).fill(null));
  const [nextTile, setNextTile] = useState<EntityId>('pesquisador');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  
  // Stats idênticos ao print
  const [stats, setStats] = useState({
    universidades: 5,
    startups: 87,
    parques: 1,
    index: 85
  });

  const handleCellClick = (index: number) => {
    if (gameState !== 'playing') return;
    
    // Ferramenta de Limpeza (Remove qualquer coisa, inclusive Silos)
    if (nextTile === 'resolucao') {
      if (grid[index] === null) return; // Tem que clicar em algo para limpar
      const newGrid = [...grid];
      newGrid[index] = null;
      setGrid(newGrid);
      advanceTurn(newGrid);
      return;
    }

    // Só pode colocar em espaço vazio
    if (grid[index] !== null) return;

    let newGrid = [...grid];
    let newStats = { ...stats };
    newGrid[index] = nextTile;

    // --- LÓGICA DE FUSÃO (MATCH-3) BFS ---
    let currentPos = index;
    let currentType = nextTile;

    while (true) {
      const visited = new Set<number>();
      const queue = [currentPos];
      const cluster: number[] = [];

      while(queue.length > 0) {
        const curr = queue.shift()!;
        if(visited.has(curr)) continue;
        visited.add(curr);
        cluster.push(curr);

        for(const n of getNeighbors(curr)) {
          if(newGrid[n] === currentType && !visited.has(n)) {
            queue.push(n);
          }
        }
      }

      const entityDef = ENTITIES[currentType];
      
      // Se formou 3 ou mais e tem evolução
      if (cluster.length >= 3 && entityDef.next) {
        const upgradeType = entityDef.next;
        
        // Limpa as peças agrupadas
        cluster.forEach(idx => { newGrid[idx] = null; });
        
        // Posiciona a nova peça evoluída no local do clique original
        newGrid[currentPos] = upgradeType;

        // Atualiza os status baseados na nova peça formada
        if (upgradeType === 'universidade') { newStats.universidades += 1; newStats.index += 1; }
        if (upgradeType === 'startup')      { newStats.startups += 1; newStats.index += 1; }
        if (upgradeType === 'parque')       { newStats.parques += 1; newStats.index += 3; }
        if (upgradeType === 'centro' || upgradeType === 'unicornio') { newStats.index += 2; }

        // Continua o loop para ver se a peça evoluída gera um novo combo!
        currentType = upgradeType;
      } else {
        break; // Sem mais fusões
      }
    }

    setGrid(newGrid);
    setStats(newStats);
    advanceTurn(newGrid, newStats);
  };

  const advanceTurn = (currentGrid: (EntityId | null)[], currentStats = stats) => {
    if (currentStats.index >= WIN_INDEX) {
      setGameState('won');
      return;
    }

    const upcoming = getRandomTile();
    setNextTile(upcoming);

    // Condição de Derrota: Tabuleiro cheio e a próxima peça não é uma ferramenta de limpeza
    if (currentGrid.every(c => c !== null) && upcoming !== 'resolucao') {
      setGameState('lost');
    }
  };

  const restartGame = () => {
    setGrid(Array(25).fill(null));
    setNextTile('pesquisador');
    setStats({ universidades: 5, startups: 87, parques: 1, index: 85 });
    setGameState('playing');
  };

  return (
    <div className="min-h-screen bg-[#181920] text-slate-200 flex flex-col items-center justify-center font-sans p-6 selection:bg-indigo-500/30">
      
      {/* Header Introdutório */}
      <div className="max-w-5xl w-full mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mb-2">
            <Zap className="text-indigo-400" /> OntoMatch: Tríplice Hélice
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Clique no grid para alocar atores. Combine 3 elementos adjacentes idênticos para forjar estruturas superiores de inovação. Evite Silos de Dados e chegue a 100 no Índice de Inovação!
          </p>
        </div>
        
        {/* Next Tile Preview */}
        <div className="bg-[#23242c] border border-[#30313a] rounded-xl p-3 flex items-center gap-4 shadow-lg">
           <div className="text-right">
             <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Próxima Instância</div>
             <div className="font-bold text-sm text-slate-200">{ENTITIES[nextTile].label}</div>
           </div>
           <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2 ${ENTITIES[nextTile].style}`}>
             {ENTITIES[nextTile].icon}
           </div>
        </div>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-[1.2fr_400px] gap-8">
        
        {/* LADO ESQUERDO: TABULEIRO 5x5 (Substituindo o Mapa SVG) */}
        <div className="bg-[#21202e] border-2 border-[#413c6b] rounded-[2rem] p-8 relative shadow-[0_0_50px_-15px_rgba(99,102,241,0.3)] flex flex-col items-center justify-center min-h-[500px]">
          
          {/* Overlay de Fim de Jogo */}
          {gameState !== 'playing' && (
            <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <h2 className={`text-4xl font-black mb-4 ${gameState === 'won' ? 'text-emerald-400' : 'text-rose-500'}`}>
                {gameState === 'won' ? 'Ecossistema Consolidado!' : 'Fragmentação Informacional!'}
              </h2>
              <p className="text-lg opacity-80 mb-8 max-w-md">
                {gameState === 'won' 
                  ? 'Você organizou os fluxos de conhecimento com maestria. Niterói atingiu a governança informacional máxima.'
                  : 'O tabuleiro lotou de Silos e Atores não-conectados. A assimetria venceu desta vez.'}
              </p>
              <button onClick={restartGame} className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> Iniciar Nova Análise
              </button>
            </div>
          )}

          {/* Grid do Tabuleiro */}
          <div className="grid grid-cols-5 gap-2 w-full max-w-[450px] aspect-square">
            {grid.map((cell, i) => (
              <div 
                key={i} 
                onClick={() => handleCellClick(i)}
                className={`
                  rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 
                  ${cell ? ENTITIES[cell].style : 'bg-[#1a1b24] hover:bg-[#2a2b38] border border-white/5'}
                  ${nextTile === 'resolucao' && cell ? 'hover:bg-red-500/20 hover:border-red-500/50' : ''}
                  border-2 active:scale-95 shadow-inner
                `}
              >
                {cell && (
                  <>
                    <span className="text-4xl filter drop-shadow-md">{ENTITIES[cell].icon}</span>
                    <span className="text-[9px] font-bold mt-1 opacity-80 truncate w-full text-center px-1">
                      {ENTITIES[cell].label}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* LADO DIREITO: DASHBOARD IDÊNTICO AO DA REFERÊNCIA */}
        <div className="bg-[#22232a] border border-[#30313a] rounded-[1.5rem] p-8 flex flex-col shadow-2xl h-full">
          <div className="mb-8">
            <div className="text-xs font-black text-[#7d84d1] uppercase tracking-widest mb-2">Polo Tecnológico</div>
            <h2 className="text-4xl font-black text-white tracking-tight">Niterói</h2>
          </div>

          <div className="space-y-4 flex-1">
            {/* Row: Universidades */}
            <div className="bg-[#2a2b34] border border-[#353641] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#2b354d] text-[#6b8cff] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-[15px] font-semibold text-gray-300">Universidades</span>
              </div>
              <span className="text-2xl font-black text-white">{stats.universidades}</span>
            </div>

            {/* Row: Startups */}
            <div className="bg-[#2a2b34] border border-[#353641] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#402934] text-[#ff6b8c] flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[15px] font-semibold text-gray-300">Startups</span>
              </div>
              <span className="text-2xl font-black text-white">{stats.startups}</span>
            </div>

            {/* Row: Parques Tecnológicos */}
            <div className="bg-[#2a2b34] border border-[#353641] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#403625] text-[#ffb84d] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[15px] font-semibold text-gray-300">Parques Tecnológicos</span>
              </div>
              <span className="text-2xl font-black text-white">{stats.parques}</span>
            </div>
          </div>

          {/* Área Inferior: Barra de Progresso */}
          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Índice de Inovação</span>
              <span className="text-[1.35rem] font-black text-[#8b5cf6]">
                {Math.min(stats.index, 100)}<span className="text-sm text-[#7d84d1] font-bold">/100</span>
              </span>
            </div>
            
            <div className="w-full h-3 bg-[#1a1b23] rounded-full overflow-hidden shadow-inner relative">
              <div 
                className="h-full bg-gradient-to-r from-[#5b45a0] to-[#b357d6] transition-all duration-700 ease-out relative"
                style={{ width: `${Math.min(stats.index, 100)}%` }}
              >
                {/* Efeito de brilho na ponta da barra */}
                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-sm"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}