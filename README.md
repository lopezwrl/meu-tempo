# Meu Tempo

Meu Tempo é uma aplicação web para organizar tarefas, cronômetro de foco, blocos de notas, planejamento diário e relatórios de produtividade em um único ambiente.

A interface foi pensada para funcionar como um dashboard pessoal leve, com visual premium em tons rosados, suporte a tema claro/escuro, e foco em produtividade sem perder clareza visual.

## Visão geral

- Gestão de tarefas e subtarefas
- Cronômetro de trabalho com aviso de inatividade
- Notas e cadernos com Markdown e exportação
- Planejamento semanal e diário
- Relatórios e métricas por categoria, projeto e tempo
- Backup/restore e exportação de dados
- PWA e execução local em Windows/Linux/macOS

## Funcionalidades principais

### Tarefas
- criação de tarefas com data, categoria, projeto e estimativa
- subtarefas com progresso dentro da tarefa
- associação de notas a tarefas
- listas por categorias, projetos e calendário

### Notas
- cadernos por contexto ou área
- notas fixadas, arquivadas e buscáveis
- editor Markdown com visualização ao lado
- importação e exportação em `.md` e `.zip`

### Tempo e produtividade
- cronômetro real para acompanhar foco
- lembrete de inatividade com ação configurável
- dashboard com resumo de tarefas, horas e progresso
- relatórios por dia, categoria, projeto e horário

### Dados e segurança
- banco SQLite em `instance/meutempo.db`
- backup completo em JSON
- restauração de backups
- exportação em CSV/Excel
- geração de chave secreta local em `instance/secret.key`

## Requisitos

- Python 3.10+
- pip
- ambiente virtual recomendado

## Como rodar localmente

### 1) Clonar e entrar no projeto

```bash
git clone https://github.com/lopezwrl/meu-tempo.git
cd meu-tempo
```

### 2) Criar ambiente virtual

Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows (PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3) Instalar dependências

```bash
pip install -r requirements.txt
```

### 4) Iniciar o app

```bash
python run.py
```

Acesse:

```text
http://127.0.0.1:5000
```

## Executar como aplicativo Windows

Há atalhos e scripts prontos para uso no Windows:

- `Meu Tempo.bat` — abre o app em janela própria
- `criar_atalho.ps1` — cria atalho na área de trabalho
- `build_exe.bat` — empacota uma versão executável com PyInstaller

Esses scripts criam/usarão a pasta `instance` ao lado do executável ou do projeto, mantendo o banco local e a chave secreta.

## Estrutura do projeto

```text
meu-tempo/
├── app/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── static/
│   ├── templates/
│   └── utils/
├── instance/
│   ├── meutempo.db
│   └── secret.key
├── tests/
├── .gitignore
├── Meu Tempo.bat
├── build_exe.bat
├── criar_atalho.ps1
├── iniciar.pyw
├── README.md
├── requirements.txt
├── run.py
└── .venv/   # gerada localmente
```

## Dados locais

O banco de dados da aplicação fica em:

```text
instance/meutempo.db
```

A chave secreta da aplicação fica em:

```text
instance/secret.key
```

Esses arquivos são gerados automaticamente na primeira execução.

## Validação

Para verificar que o projeto inicia corretamente:

```bash
python -m unittest discover -s tests
```

A suíte de smoke tests cobre renderização das páginas e fluxos principais de notas, tarefas, backup, exportação e inatividade.

## Observações

- O app foi pensado para rodar localmente em um ambiente pessoal, sem autenticação multiusuário.
- O comportamento de produtividade e relatórios depende dos dados acumulados ao longo do uso.
- O tema visual e os estilos podem ser ajustados em `app/static/css/style.css`.

## Licença

Este projeto não possui licença configurada no repositório neste momento; confira o repositório remoto para detalhes de uso ou distribuição.
