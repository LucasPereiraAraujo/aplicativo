# Armazém — semáforo, portão e alarme de incêndio por Bluetooth

Projeto em duas partes:

| Pasta | O que é |
| --- | --- |
| `arduino/armazem_bluetooth/` | Firmware do Arduino (semáforo, portão com servo, sensor de chama, relé, buzzer e HC-05/HC-06) |
| `app/` | Aplicativo Android em React Native + Expo que controla o semáforo/portão e recebe os alertas de fogo |

## 1. Hardware

Pinos já usados no projeto original (inalterados): sensor de chama 2, LEDs 3/4/5, relé 7, buzzer 8, servo 9.

Ligação do módulo Bluetooth (HC-05 ou HC-06):

| HC-05 / HC-06 | Arduino |
| --- | --- |
| VCC | 5V |
| GND | GND |
| TXD | pino 10 |
| RXD | pino 11, **passando por um divisor de tensão** |

O RXD do módulo trabalha em 3,3 V. Divisor: pino 11 → resistor de 1 kΩ → RXD, e do RXD → resistor de 2 kΩ → GND.

## 2. Firmware

1. Abra `arduino/armazem_bluetooth/armazem_bluetooth.ino` na Arduino IDE.
2. Selecione a placa (Uno/Nano) e a porta e grave.

O que mudou em relação ao código original:

- O ciclo do semáforo não usa mais `delay()`. Antes o sensor de chama só era lido a cada 9 s (no fim do ciclo); agora é lido continuamente e a emergência dispara na hora.
- Modo **automático** (o ciclo original: 3 s vermelho, 2 s amarelo, 4 s verde com portão aberto) e modo **manual** (comandado pelo app).
- Fogo tem prioridade sobre tudo: vermelho, portão aberto, ventilador e buzzer ligados, comandos de semáforo/portão ignorados. A emergência dura até 3 s depois da última detecção, e então o modo anterior é retomado.

Ajustes no topo do arquivo:

- `NIVEL_FOGO`: ficou `HIGH`, como no seu código. Muitos módulos de chama enviam `LOW` quando detectam fogo; se o alarme ficar invertido, troque para `LOW`.
- `BT_NA_SERIAL_DE_HARDWARE`: se o servo tremer quando o Arduino envia dados (efeito conhecido de `SoftwareSerial` + `Servo`), mude para `1` e ligue o módulo nos pinos 0 (RX) e 1 (TX). Nesse caso desconecte o módulo sempre que for gravar o código.

### Protocolo (9600 baud)

App → Arduino, um caractere por comando:

| Comando | Ação |
| --- | --- |
| `A` | modo automático |
| `M` | modo manual |
| `R` / `Y` / `G` | semáforo vermelho / amarelo / verde (entra em manual) |
| `O` / `C` | abre / fecha o portão (entra em manual) |
| `S` | pede o estado |

Arduino → App, uma linha: `S:<modo>,<luz>,<portao>,<fogo>` — por exemplo `S:A,R,0,0` (automático, vermelho, portão fechado, sem fogo). Enviada a cada mudança e a cada 2 s (1 s durante o incêndio).

Dá para testar sem o app com qualquer "Serial Bluetooth Terminal" do Android.

## 3. Aplicativo

Requisitos: Node.js 20+ e uma conta gratuita em <https://expo.dev>.

```bash
cd app
npm install
```

### Gerar o APK (EAS Build, na nuvem)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Na primeira vez o EAS pergunta se pode criar o projeto na sua conta e a chave de assinatura: aceite. No fim ele mostra um link/QR code para baixar o `.apk`. Instale no celular (permitindo "instalar apps desconhecidos").

O app usa Bluetooth nativo, então **não funciona no Expo Go**. Para desenvolver com recarregamento ao vivo, gere um build de desenvolvimento e rode o servidor:

```bash
eas build --platform android --profile development
npx expo start --dev-client
```

### Usar

1. Nas configurações de Bluetooth do Android, pareie o módulo (`HC-05` ou `HC-06`, senha `1234` ou `0000`).
2. Abra o app, aceite as permissões de Bluetooth e de notificações.
3. Toque no módulo na lista de dispositivos pareados.
4. Escolha Automático ou Manual; em manual, toque nas cores do semáforo e em Abrir/Fechar.

Quando o sensor detecta fogo, o app mostra um aviso em tela cheia, vibra e dispara uma notificação.

### Limites

- Os alertas chegam pela conexão Bluetooth: o celular precisa estar conectado e ao alcance do módulo (cerca de 10 m). Com o app em segundo plano o Android pode encerrar a conexão depois de um tempo; para monitorar, deixe o app aberto (a tela fica ligada enquanto conectado).
- Só Android: o iOS não permite Bluetooth Clássico com HC-05/HC-06.
- O HC-05/HC-06 aceita um celular por vez.

### Estrutura do app

| Arquivo | Função |
| --- | --- |
| `App.tsx` | Telas: lista de dispositivos e painel de controle |
| `src/useArmazem.ts` | Conexão Bluetooth, envio de comandos, leitura do estado |
| `src/protocol.ts` | Comandos e interpretação das linhas de estado |
| `src/notificacoes.ts` | Notificação e vibração do alerta de fogo |
