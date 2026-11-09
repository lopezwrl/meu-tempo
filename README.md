# Meu Tempo

**Meu Tempo** é uma plataforma web e desktop local para organização de rotina, gestão de tarefas, foco profundo, blocos de notas em Markdown e inteligência de bem-estar produtivo.

Projetado com uma estética refinada em tons de **Rosa Framboesa (`#D63B6A`)**, **Rosa Pastel (`#F9C6D0`)** e **Vinho Profundo (`#15080e`)**, o sistema substitui qualquer uso de emojis por **iconografia 100% em SVG vetorial profissional**, combinando alta performance, animações físicas fluidas e recursos exclusivos de saúde mental e ritmo biológico.

---

## Status do Projeto: O que já foi feito e o que falta

### O que já foi implementado (Concluído)

#### 1. Identidade Visual, UI/UX & Arquitetura Moderna
- [x] **Novo Favicon Oficial & Paleta Sincronizada:** Ícone vetorial oficial integrado em todas as resoluções (`16x16` até `512x512`, `.svg`, `.ico`, Apple Touch e PWA Manifest) com bust de cache imediato (`meu-tempo-v5` + Data URI inline) e cores do tema (`tokens.css` e partículas) 100% harmonizadas ao novo ícone.
- [x] **Padronização Profissional 100% SVG (Zero Emojis):** Mapeador vetorial completo (`CategoryIcon`, `AchievementIcon`, `EnergyBadge`) que renderiza ícones SVG nítidos para todas as categorias, conquistas, estados vazios e botões.
- [x] **Animação Cinematográfica de Entrada (`SplashScreen`):** Card 3D interativo com inclinação por perspectiva de mouse, desenho sequencial dos checks em SVG acompanhado de acordes harmônicos sintetizados via Web Audio API.
- [x] **Navegação Responsiva & Dock Móvel sem Cortes:** Barra lateral retrátil no desktop e barra flutuante inferior (`Dock`) no mobile sincronizada em tempo real com `ResizeObserver` e física de mola (*spring*).
- [x] **Paleta de Comandos Rápida (`Ctrl + K`):** Busca instantânea global entre tarefas e notas.

#### 2. Diferenciais Exclusivos do Meu Tempo (Bem-Estar & Produtividade Humana)
- [x] **Ritmo de Energia Circadiana ("Bateria Humana"):** Classificação de tarefas por nível de exigência mental (*Foco Profundo*, *Fluxo Normal*, *Modo Leve*) e recomendação automática conforme o horário biológico do dia (*Pico Cognitivo Matinal*, *Vale Pós-Almoço*, *Segundo Fôlego Colaborativo* e *Desaceleração Noturna*).
- [x] **Santuário de Foco com Paisagens Sonoras Offline (Web Audio API):** Gerador acústico procedural 100% offline (sem depender de arquivos MP3 ou internet) com *Chuva Suave na Janela*, *Ruído Rosa Profundo (1/f)*, *Harmônicos Serenos* e *Sino Zen*, acessível pelo topo e pela pílula do cronômetro.
- [x] **Respiração Guiada Anti-Ansiedade (Box Breathing 4-4-4-4):** Mandala geométrica em SVG que expande e contrai em ciclos de 4 segundos (*Inspire, Segure, Expire, Pausa Serena*) com guia sonoro opcional para pausas regenerativas.
- [x] **Medidor Anti-Burnout (Equilíbrio de Carga):** Barra inteligente que compara as horas planejadas para hoje com a capacidade saudável da jornada e oferece o botão **Reequilibrar Dia (1-Clique)** para adiar excessos automaticamente.
- [x] **Ritual de Fechamento do Dia ("Daily Wind-Down"):** Modal de encerramento de expediente que celebra as entregas concluídas no dia, exibe precisão e foco acumulados, e transfere pendências restantes para amanhã com 1 clique.

#### 3. Gestão de Tarefas, Notas, Cronômetro & Relatórios
- [x] **Tarefas & Subtarefas:** CRUD completo, sugestão automática de tempo estimado baseada em histórico, subtarefas em acordeão, gestos de *swipe* para concluir e confete integrado.
- [x] **Cronômetro Persistente (`TimerPill`):** Pílula flutuante ativa em todas as abas, detecção de inatividade configurável e modal de conclusão com registro de sentimento e motivo de atraso.
- [x] **Cadernos & Notas Rich-Text / Markdown:** Editor TipTap com salvamento automático, fixação no topo (*pin*), vínculo direto com tarefas e exportação em `.zip`.
- [x] **Histórico, Gráficos & Conquistas:** Gráficos Recharts (horas por dia, tarefas por semana, estimado vs. real, produtividade por hora), sistema de conquistas desbloqueáveis e exportação em Excel (`.xlsx`) e `.csv`.
- [x] **Qualidade de Código & Estabilidade:** Zero erros ou avisos no `oxlint`, `pyflakes` e `pyright`, e suíte de testes de estresse e regressão validada.

---

### O que ainda falta / Próximos Passos (Roadmap Futuro)

- [ ] **Visão de Calendário Mensal & Semanal Drag-and-Drop no React SPA:** Permitir arrastar e soltar tarefas diretamente entre os dias da semana ou em blocos de horário (*Timeblocking* visual).
- [ ] **Modo Pomodoro Automatizado no Cronômetro:** Ciclos automáticos configuráveis (ex.: 25 min foco + 5 min pausa com abertura automática da Respiração Guiada 4-4-4-4).
- [ ] **Sincronização Opcional em Nuvem / Multi-Dispositivo:** Suporte opcional a backup criptografado em nuvem mantendo a filosofia *local-first*.
- [ ] **Anexos e Imagens Locais nas Notas:** Suporte a colar capturas de tela e anexar arquivos diretamente dentro do editor de notas.
- [ ] **Atalhos de Teclado Globais Customizáveis:** Permitir configurar atalhos personalizados para iniciar/pausar o cronômetro ou abrir o Santuário Sonoro.
- [ ] **Temas de Cores Adicionais Desbloqueáveis:** Paletas extras desbloqueadas conforme o usuário atinge novos marcos nas Conquistas.

---

## Arquitetura & Stack Técnica

- **Backend:** Flask 3.0 REST API (SQLite + SQLAlchemy, Flask-CORS)
- **Frontend:** React 18 + Vite 5
- **Estilização:** Tailwind CSS v3 + CSS Custom Properties (`tokens.css` com tema claro rosa pastel e tema escuro vinho)
- **Animações:** Framer Motion (transições direcionais, física de mola, mandalas SVG)
- **Áudio Procedural:** Web Audio API nativa (`audio.js` — efeitos sonoros + gerador de ruído rosa, chuva e acordes zen)
- **Estado Global:** Zustand (`timerStore`, `themeStore`, `userStore`, `energyStore`)
- **Dados & Cache:** TanStack Query v5 com persistência offline em LocalStorage
- **Gráficos:** Recharts integrados dinamicamente ao tema
- **Editor de Notas:** TipTap com suporte Markdown e autosave
- **Ícones:** Lucide React + SVGs vetoriais customizados (zero emojis)

---

## Como rodar localmente

As portas padrão foram configuradas para evitar conflitos com outros serviços locais:
- **Backend (Flask API):** `http://127.0.0.1:5001`
- **Frontend (React + Vite):** `http://localhost:3000`

### 1. Iniciar o Backend (Flask)

```bash
pip install -r requirements.txt
python run.py
```
O servidor Flask ficará ativo em `http://127.0.0.1:5001`.

### 2. Iniciar o Frontend (React + Vite)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```
O frontend abrirá em `http://localhost:3000` e fará proxy automático das chamadas `/api/*` para o Flask na porta `5001`.

---

## Executar como Aplicativo Windows

Há atalhos e scripts prontos para uso no Windows:

- `iniciar.pyw` / `Meu Tempo.bat` — sobe o servidor e abre o Meu Tempo em janela própria estilo aplicativo
- `criar_atalho.ps1` — cria o atalho oficial na área de trabalho com o ícone do Meu Tempo
- `build_exe.bat` — empacota uma versão executável com PyInstaller

---

## Estrutura do Projeto

```text
meu-tempo/
├── app/                        # Backend Flask principal (Modelos, Rotas API, Serviços)
├── backend/                    # Espelho modular do backend
├── favicons/                   # Pacote oficial de ícones e favicons em todas as dimensões
├── frontend/                   # Aplicação React 18 + Vite + Tailwind CSS
│   ├── public/                 # Favicons, PWA Manifest e Service Worker (sw.js)
│   └── src/
│       ├── components/
│       │   ├── features/       # TaskCard, WellbeingHub, FocusSanctuaryModal, WindDownModal, etc.
│       │   ├── layout/         # SplashScreen, Sidebar, Dock, TopBar, TimerPill
│       │   └── ui/             # CategoryIcon (100% SVG), Modal, Sheet, Button, Toast
│       ├── hooks/              # useTasks, useTimer, useNotes
│       ├── pages/              # Home, Tasks, Notes, History, Settings
│       ├── services/           # Cliente Axios + chaves TanStack Query
│       ├── stores/             # Zustand stores (theme, timer, user, energy)
│       ├── styles/             # tokens.css & global.css
│       └── utils/              # Sintetizador Web Audio API (audio.js)
├── instance/                   # Banco SQLite local (meutempo.db) e secret.key
├── tests/                      # Testes automatizados do backend
├── iniciar.pyw                 # Inicializador em modo App para Windows
├── requirements.txt            # Dependências Python
└── run.py                      # Ponto de entrada do servidor Flask (porta 5001)
```

---

## Validação & Testes

Para rodar os testes do backend e o linter do frontend:

```bash
# Testes unitários e de integração do backend
python -m unittest discover -s tests

# Verificação de lint e código limpo no frontend
cd frontend
npx oxlint src
```
