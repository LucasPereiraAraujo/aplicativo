# Armazém — Controle e Registro de Ocorrências

Aplicativo móvel em **React Native + TypeScript + Expo (SDK 58)** para a segurança de um armazém:

- **registra ocorrências** (incêndios, falhas de equipamento, acessos indevidos, acidentes, manutenções) com detalhes, foto, gravidade e status, e as mantém salvas no aparelho;
- **controla por Bluetooth** um Arduino com semáforo, portão (servo) e sensor de chama. Quando o sensor detecta fogo, o app dispara o alerta e **cria a ocorrência sozinho**, pedindo depois que o usuário complete os detalhes.

O repositório também traz o firmware do Arduino (`arduino/armazem_bluetooth/`).

---

## Funcionalidades implementadas

### Cadastro e gerenciamento de ocorrências (CRUD)

| Operação | Onde |
| --- | --- |
| **Cadastrar** | Aba *Ocorrências* → botão **+ Nova**. Formulário com título, tipo, gravidade, local/setor, data e hora, descrição, responsável, status e foto. |
| **Validar** | Antes de salvar: título (mín. 3 caracteres), tipo, gravidade, local, descrição (mín. 10) e data/hora (formato `dd/mm/aaaa hh:mm`, data real e não futura). Cada campo inválido fica destacado com a mensagem do erro. |
| **Listar** | `FlatList` com indicadores (abertas, em andamento, resolvidas), **busca** por texto e **filtro** por status. Mostra mensagem própria para lista vazia e para busca sem resultado. |
| **Consultar** | Toque em um item → tela de detalhes com todas as informações e a foto. |
| **Alterar** | Na tela de detalhes: troca rápida de **status** (Aberta / Em andamento / Resolvida) ou **Editar**, que abre o formulário preenchido. |
| **Excluir** | Botão **Excluir** com confirmação. A foto associada também é apagada do aparelho. |
| **Compartilhar** | Envia um resumo da ocorrência por WhatsApp, e-mail etc. |

A interface é atualizada na hora após cada operação: o estado fica em `useState` dentro de um Context, e a aba mostra um contador de ocorrências não resolvidas.

### Registro automático pelo sensor de chama

Com o celular conectado ao Arduino, quando o sensor detecta fogo:

1. o app vibra, mostra o alerta em tela cheia e envia uma notificação;
2. cria uma ocorrência **Incêndio detectado pelo sensor** (gravidade *crítica*, marcada como *pendente de detalhes*);
3. quando o fogo acaba, grava o horário de fim da emergência e envia a notificação *"Toque para completar os detalhes"*. Tocar na notificação abre a ocorrência;
4. a lista e a tela de detalhes avisam que o registro está pendente até o usuário editá-lo.

Se o app reconectar no meio do mesmo incêndio, ele não cria uma ocorrência duplicada.

### Painel de controle (Bluetooth)

Aba *Painel*: lista os módulos HC-05/HC-06 pareados, conecta, alterna entre os modos automático e manual, comanda o semáforo e o portão e mostra o estado do Arduino em tempo real.

---

## Persistência de dados

**AsyncStorage** (`@react-native-async-storage/async-storage`), em `src/storage/ocorrenciasStorage.ts`.

- As ocorrências são gravadas como JSON na chave `@armazem/ocorrencias:v1`.
- **Ao abrir o app** a lista é carregada (com indicador de carregamento). A gravação só começa depois do carregamento, para nunca sobrescrever os dados salvos com a lista vazia inicial.
- **Cada cadastro, alteração, mudança de status e exclusão** grava a lista atualizada. Se a gravação falhar, aparece uma mensagem de erro na tela.
- Dados ilegíveis (JSON corrompido) são copiados para outra chave antes de reiniciar a lista, e o usuário é avisado.
- **Fotos:** a imagem da câmera ou da galeria fica em uma pasta temporária, que o sistema pode limpar. Ao salvar a ocorrência, o app copia a foto para a pasta de documentos (`expo-file-system`) e grava esse caminho permanente.

---

## Recursos nativos

| Recurso | Uso no app | Quando a permissão é negada ou o recurso falta |
| --- | --- | --- |
| **Câmera** (`expo-image-picker`) | Fotografar a ocorrência no formulário | Explica o motivo; se o Android não pergunta mais, oferece **Abrir configurações**. A ocorrência pode ser salva sem foto. Sem câmera (ex.: emulador), sugere usar a galeria. |
| **Galeria de imagens** (`expo-image-picker`) | Escolher uma foto já existente | Mesmo tratamento da câmera |
| **Notificações locais** (`expo-notifications`) | Alerta de fogo, aviso de fim da emergência e atalho para a ocorrência | Sem permissão, o alerta continua aparecendo na tela e com vibração |
| **Compartilhamento nativo** (`Share` do React Native) | Enviar o resumo da ocorrência | Mostra uma mensagem de erro se falhar |
| **Bluetooth Clássico** (`react-native-bluetooth-classic`) | Conexão com o Arduino (HC-05/HC-06) | Pede a permissão e pede para ligar o Bluetooth. Sem permissão, ou no Expo Go/iOS, o painel explica o motivo e o restante do app continua funcionando |
| **Vibração / tela ligada** (`Vibration`, `expo-keep-awake`) | Alerta de fogo e monitoramento | — |

---

## Navegação

**Expo Router** (rotas por arquivo em `src/app/`), combinando **Tabs** e **Stack**:

```
Stack (raiz)
├── (abas)  ── Tabs
│   ├── index        → Ocorrências: indicadores, busca, filtro e FlatList
│   └── painel       → Painel Bluetooth: semáforo, portão, alarme
├── ocorrencia/nova          → Cadastro
├── ocorrencia/[id]          → Detalhes: status, compartilhar, excluir
└── ocorrencia/[id]/editar   → Edição
```

---

## Estrutura do projeto

```
app/
├── app.json, package.json, tsconfig.json, eas.json
└── src/
    ├── app/                         # telas (Expo Router)
    │   ├── _layout.tsx              # Stack raiz, providers, tema, notificações
    │   ├── (abas)/_layout.tsx       # Tabs
    │   ├── (abas)/index.tsx         # lista de ocorrências
    │   ├── (abas)/painel.tsx        # painel Bluetooth
    │   └── ocorrencia/              # nova, [id]/index (detalhes), [id]/editar
    ├── components/                  # componentes reutilizáveis (.tsx, com props tipadas)
    │   ├── FormularioOcorrencia.tsx  CampoTexto.tsx  SeletorOpcoes.tsx  SeletorFoto.tsx
    │   ├── OcorrenciaItem.tsx  Etiqueta.tsx  EstadoVazio.tsx  Aviso.tsx
    │   └── Botao.tsx  Cartao.tsx  AlertaFogo.tsx  Lampada.tsx  ListaDispositivos.tsx  PainelControle.tsx
    ├── contexts/                    # OcorrenciasContext (CRUD + persistência), ArmazemContext (Bluetooth)
    ├── storage/ocorrenciasStorage.ts
    ├── services/                    # fotos (câmera/galeria), notificacoes, compartilhar
    ├── bluetooth/                   # protocolo e hook da conexão com o Arduino
    ├── types/ocorrencia.ts          # tipos TypeScript dos registros
    ├── utils/datas.ts
    └── theme.ts
```

---

## Instalação e execução

Requisitos: **Node.js 20+** e um celular **Android**.

```bash
cd app
npm install
```

### Opção A: Expo Go (mais rápida, sem Bluetooth)

Testa o cadastro, a persistência, a câmera, a galeria, as notificações e o compartilhamento.

```bash
npx expo start
```

Abra o **Expo Go** (versão do SDK 58) no celular e leia o QR code. A aba *Painel* avisa que o Bluetooth não está disponível nesse modo, porque o Expo Go não traz esse módulo nativo.

### Opção B: APK (todas as funções, incluindo o Bluetooth com o Arduino)

O APK é gerado na nuvem pelo EAS Build. É preciso uma conta gratuita em <https://expo.dev>.

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

No fim, o EAS mostra um link para baixar o `.apk`. Instale-o permitindo "instalar apps desconhecidos". Para desenvolver com recarregamento ao vivo, use o perfil `development` e rode `npx expo start --dev-client`.

### Verificar os tipos

```bash
npm run typecheck
```

---

## Bibliotecas adicionais

| Biblioteca | Para quê |
| --- | --- |
| `expo-router`, `react-native-screens`, `expo-linking`, `expo-constants` | Navegação (Stack + Tabs) |
| `@react-native-async-storage/async-storage` | Persistência das ocorrências |
| `expo-image-picker` | Câmera e galeria |
| `expo-file-system` | Cópia permanente das fotos |
| `expo-notifications` | Notificações locais |
| `expo-keep-awake` | Mantém a tela ligada durante o monitoramento |
| `react-native-safe-area-context` | Áreas seguras da tela |
| `react-native-bluetooth-classic` | Bluetooth Clássico com o HC-05/HC-06 |
| `expo-dev-client` | Build de desenvolvimento com módulos nativos |
| `react-dom` | Dependência opcional do expo-router, fixada na versão do React para o `npm ci` não falhar |

Nenhuma biblioteca externa de componentes visuais foi usada: a interface usa só componentes próprios.

---

## Roteiro de demonstração

1. **Navegação:** alternar entre as abas *Ocorrências* e *Painel*, abrir detalhes e voltar.
2. **Cadastro:** **+ Nova** → tocar em *Registrar* com o formulário vazio (aparecem os erros de validação) → preencher, tirar uma foto → *Registrar*.
3. **Listagem:** o item aparece na `FlatList`, os indicadores mudam; testar a busca e os filtros.
4. **Alteração:** abrir o item → mudar o status para *Em andamento* → *Editar*, alterar o responsável → salvar.
5. **Exclusão:** *Excluir* → confirmar → o item some da lista.
6. **Persistência:** fechar o app por completo (remover dos recentes) e abrir de novo: os registros e as alterações continuam lá.
7. **Recurso nativo:** câmera/galeria no formulário; negar a permissão uma vez para mostrar o tratamento; *Compartilhar*.
8. *(Com o Arduino)* conectar no *Painel*, aproximar uma chama do sensor → alerta, notificação e ocorrência criada automaticamente → completar os detalhes.

---

## Hardware e firmware (Arduino)

Pinos: sensor de chama 2, LEDs 3/4/5, relé (ventilador) 7, buzzer 8, servo (portão) 9.

| HC-05 / HC-06 | Arduino |
| --- | --- |
| VCC | 5V |
| GND | GND |
| TXD | pino 10 |
| RXD | pino 11, **passando por um divisor de tensão** (pino 11 → 1 kΩ → RXD; RXD → 2 kΩ → GND) |

Grave `arduino/armazem_bluetooth/armazem_bluetooth.ino` pela Arduino IDE (Uno/Nano).

- O ciclo do semáforo não usa `delay()`, então o sensor de chama é lido continuamente.
- Modo **automático** (3 s vermelho, 2 s amarelo, 4 s verde com o portão aberto) e modo **manual** (comandado pelo app).
- O fogo tem prioridade sobre tudo: vermelho, portão aberto, ventilador e buzzer ligados. A emergência dura até 3 s depois da última detecção.
- `NIVEL_FOGO`: se o alarme ficar invertido (muitos módulos enviam `LOW` quando detectam fogo), troque para `LOW`.
- `BT_NA_SERIAL_DE_HARDWARE`: se o servo tremer, mude para `1` e ligue o módulo nos pinos 0/1. Nesse caso, desconecte o módulo para gravar o código.

### Protocolo (9600 baud)

App → Arduino: `A` automático, `M` manual, `R`/`Y`/`G` cor do semáforo, `O`/`C` abre/fecha o portão, `S` pede o estado.

Arduino → App: `S:<modo>,<luz>,<portao>,<fogo>`, por exemplo `S:A,R,0,0`. É enviado a cada mudança e a cada 2 s (1 s durante um incêndio).

### Limites do Bluetooth

- Só Android: o iOS não aceita Bluetooth Clássico com HC-05/HC-06.
- O celular precisa estar a até cerca de 10 m do módulo e com o app aberto (a tela fica ligada enquanto conectado).
- O módulo aceita um celular por vez.
