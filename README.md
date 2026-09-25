# Meu Tempo — Fase 5

Bloco de notas inteligente para organização de tarefas, com controle real de tempo,
projetos, planejamento diário/semanal e agora **relatórios visuais e análise de
produtividade**.

## Abrir como um programa do Windows

1. Dê dois cliques em **`Meu Tempo.bat`**. Na primeira vez ele cria o ambiente e instala as dependências
   (precisa do Python instalado); depois abre o app em janela própria, sem barra de endereço.
2. Opcional: clique com o botão direito em **`criar_atalho.ps1`** > *Executar com o PowerShell* para criar
   o atalho "Meu Tempo" (com ícone) na Área de Trabalho, sem janela preta.
3. Fechou a janela, o programa encerra junto. Os dados ficam em `instance/meutempo.db`.

### Gerar um instalador .exe

Dê dois cliques em **`build_exe.bat`** (Windows). Na primeira vez ele prepara o ambiente e instala
o PyInstaller; depois empacota tudo em **`dist\MeuTempo.exe`**, cerca de 1-2 minutos. Copie esse
arquivo para onde quiser: ele cria a pasta `instance` (seu banco de dados) ao lado de onde estiver,
na primeira vez que for executado. Testado aqui empacotando com PyInstaller em modo `--onefile`;
o mesmo mecanismo é usado tanto no Linux (testei) quanto no Windows.

Também é um **PWA**: em Edge/Chrome, com o app aberto em `localhost:5000`, use *Instalar Meu Tempo*.
Gráficos e fontes agora são locais (`app/static/vendor`, `app/static/fonts`): funciona sem internet.

## Como executar (modo desenvolvedor)

```bash
cd meu-tempo
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Acesse **http://localhost:5000**. Um banco de uma fase anterior é migrado
automaticamente (nada é apagado). A Fase 4 não criou tabelas novas — os
relatórios são calculados a partir dos dados que o sistema já vem
acumulando (tarefas e sessões de cronômetro).

## Estrutura do projeto

```
meu-tempo/
├── run.py
├── requirements.txt
├── app/
│   ├── models/     # ... (inalterado desde a Fase 3)
│   ├── routes/     # ... + reports.py (expandido) com os novos endpoints
│   ├── services/
│   │   ├── report_service.py        # expandido: gráficos e análises da Fase 4
│   │   ├── estimate_service.py      # reaproveitado (accuracy_bias, estimation_precision)
│   │   └── achievements_service.py  # NOVO — conquistas calculadas on-the-fly
│   ├── templates/
│   │   └── history.html             # reescrita: gráficos Chart.js + conquistas + resumo semanal
│   └── static/js/reports.js         # NOVO — renderiza os gráficos
```

## Novidades da Fase 5

**Notas**
- **Cadernos** coloridos, notas fixadas e arquivadas, busca (Ctrl+K), autosave, mover nota entre cadernos
- **Editor em tela cheia** com Markdown e pré-visualização ao lado (títulos, negrito, listas, `- [ ]` checklist, código, citações)
- **Importar** arquivos `.md`/`.txt` (botão ou arrastando para a página) e **exportar** em `.md` (uma nota, um caderno ou tudo em `.zip`)

**Visual**
- Navegação em **dock flutuante** no lugar da barra lateral; cronômetro global vira uma pílula no topo
- Blocos coloridos no Início e no Histórico; **Meu dia** com blocos por prioridade e linha do "agora"
- Tema escuro redesenhado (segue o sistema até você escolher); gráficos se repintam ao trocar o tema
- Abertura animada, animações de entrada, números que contam, saudação por horário, datas em português
- **Apresentação na primeira execução** (nome, jornada, primeiro caderno)

**Tarefas**
- **Subtarefas**: checklist com barra de progresso dentro da tarefa (clique na tarefa para abrir); a lista mostra o contador `2/5`
- **Notas ligadas a tarefas**: vincular uma nota existente, criar uma nova já ligada, abrir direto no editor; a nota mostra a tarefa a que pertence
- **Aviso de ausência**: se você volta depois de N minutos (padrão 10; ajustável em Configurações, 0 desliga) sem atividade com um cronômetro rodando, o app pergunta se desconta o tempo ausente e continua, desconta e pausa, ou mantém. O que foi decidido fica registrado no histórico de atividades

**Dados**
- **Backup completo** em JSON e **restauração** (guarda uma cópia do banco antes, em `instance/backups`)
- Exportar **Excel** (`.xlsx`) e **CSV** (tarefas e sessões; separador `;` para abrir direto no Excel em português)
- **Imprimir / PDF** do Histórico (na janela de impressão, escolha "Salvar como PDF")

**Programa do Windows**
- `Meu Tempo.bat` / `iniciar.pyw` / `criar_atalho.ps1`; também é PWA instalável; gráficos e fontes locais (funciona offline)

**Código**
- `run.py` só escuta em 127.0.0.1 e sem debug (`MEUTEMPO_DEBUG=1` liga); `SECRET_KEY` gerada em `instance/secret.key`
- `CURRENT_USER_ID` centralizado em `app/utils/current_user.py`; consultas modernizadas (`db.session.get`)
- Testes: `python -m unittest discover -s tests`

## O que já existia (Fases 1 a 3)

Tarefas, categorias, notas, cronômetro real, projetos, jornada configurável,
compromissos fixos, "Meu Dia" com organização automática, "Minha Semana",
calendário, tema claro/escuro, ícones SVG profissionais.

## O que foi implementado na Fase 4

- **Gráficos reais** (Chart.js via CDN, cores extraídas das variáveis CSS do
  próprio tema) substituindo as barras em CSS: horas por dia (últimos 30 dias),
  horas por categoria (rosca), horas por projeto (barra horizontal), tarefas
  concluídas no prazo x com atraso por semana, estimado x real por categoria
- **Comparação estimado x real** por categoria e por projeto, com percentual de
  desvio (reaproveita `estimate_service.accuracy_bias`)
- **Tendência de precisão das estimativas** ao longo das últimas 8 semanas
  (gráfico de linha) com uma frase comparando o período mais recente a ~1 mês atrás
- **Produtividade por horário do dia**: gráfico de horas trabalhadas por hora
  do dia + mensagem sobre o horário mais produtivo e o de maior precisão nas
  estimativas — mostra uma mensagem neutra quando ainda não há sessões suficientes
- **Resumo executivo da semana**: criadas, concluídas, atrasadas, canceladas,
  planejado x realizado, precisão, maior projeto e categoria que mais consumiu tempo
- **Conquistas discretas** (`achievements_service.py`): tarefas concluídas, horas
  registradas e sequência de dias usando "Organizar meu dia" (marcos crescentes),
  além de "semana sem tarefas atrasadas" — exibidas como um card discreto no
  dashboard e em detalhe na página de Histórico, sem pop-ups
- Todos os números vêm acompanhados de uma frase explicativa; quando não há
  dados suficientes, o sistema diz isso em vez de inventar uma conclusão

## Simplificações conscientes desta fase

- Conquistas são calculadas a cada requisição a partir de `tasks`, `time_entries`
  e `activity_log` — nenhuma tabela nova foi criada, como sugerido no pedido
  quando é possível computar on-the-fly. A sequência de dias organizando o dia
  usa o evento `day_organized` já registrado no histórico de atividades desde a Fase 3.

## O que ainda falta

- Ligar notas a projetos (hoje só a tarefas)
- Detectar ausência fora do navegador (o app só vê a atividade dentro da própria janela)
- Autenticação de usuários
- Assinatura digital do `.exe` (sem ela, o Windows/antivírus pode avisar "editor desconhecido" — normal para um programa sem certificado pago)

## Próximo passo recomendado

Autenticação (se for usar em mais de um computador) e instalador `.exe`.

## API REST (Fases 1 a 4)

Endpoints das fases anteriores mantidos. Novos nesta fase:

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/reports/charts/hours-per-day?days=` | Horas trabalhadas por dia |
| GET | `/api/reports/charts/hours-per-category` | Horas por categoria |
| GET | `/api/reports/charts/hours-per-project` | Horas por projeto |
| GET | `/api/reports/charts/estimated-vs-real` | Estimado x real por categoria e projeto |
| GET | `/api/reports/charts/tasks-per-week?weeks=` | Concluídas no prazo x com atraso, por semana |
| GET | `/api/reports/productivity-by-hour` | Horas trabalhadas por hora do dia + mensagens |
| GET | `/api/reports/precision-trend?weeks=` | Evolução da precisão das estimativas |
| GET | `/api/reports/week-summary?date=` | Resumo executivo da semana |
| GET | `/api/achievements` | Conquistas alcançadas e próximas |

### Fase 5 (novos)

| Método | Rota | Descrição |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/notebooks` | Cadernos |
| GET | `/api/notes/<id>/export` | Nota em `.md` |
| GET | `/api/export?notebook=all\|<id>` | Notas em `.zip` de `.md` |
| GET | `/api/backup` | Backup completo (JSON) |
| POST | `/api/backup/restore` | Restaura um backup |
| GET | `/api/export/tasks.csv`, `/sessions.csv`, `/report.xlsx` | Planilhas |
| POST | `/api/onboarding` | Conclui a apresentação inicial |
| GET | `/api/tasks/<id>/extras` | Subtarefas e notas ligadas |
| POST/PUT/DELETE | `/api/tasks/<id>/subtasks`, `/api/subtasks/<id>` | Subtarefas |
| POST | `/api/timer/idle` | Resposta ao aviso de ausência |
| POST | `/api/settings/idle` | Limite de inatividade (minutos) |
