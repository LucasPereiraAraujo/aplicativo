/*
 * ARMAZÉM INTELIGENTE - Semáforo + Portão + Alarme de incêndio + Bluetooth
 *
 * Módulo Bluetooth: HC-05 ou HC-06 (Bluetooth Clássico / SPP), 9600 baud.
 *
 * ---------------------------------------------------------------------------
 * PROTOCOLO (texto, 9600 baud)
 *
 * App -> Arduino (1 caractere por comando, quebras de linha são ignoradas):
 *   'A'  modo automático (ciclo do semáforo/portão)
 *   'M'  modo manual (mantém o estado atual)
 *   'R'  semáforo vermelho   (entra em modo manual)
 *   'Y'  semáforo amarelo    (entra em modo manual)
 *   'G'  semáforo verde      (entra em modo manual)
 *   'O'  abre o portão       (entra em modo manual)
 *   'C'  fecha o portão      (entra em modo manual)
 *   'S'  pede o estado atual
 *
 * Arduino -> App (uma linha por mensagem, terminada em '\n'):
 *   S:<modo>,<luz>,<portao>,<fogo>
 *     modo   = A (automático) | M (manual)
 *     luz    = R | Y | G
 *     portao = 0 (fechado) | 1 (aberto)
 *     fogo   = 0 (normal)  | 1 (FOGO DETECTADO)
 *   Exemplo: S:A,R,0,0
 *
 *   A linha é enviada sempre que algo muda e também periodicamente
 *   (a cada 2 s em operação normal, a cada 1 s durante o incêndio).
 *
 * Durante o incêndio os comandos de semáforo/portão são ignorados:
 * a emergência tem prioridade (vermelho, portão aberto, ventilador e buzzer).
 * ---------------------------------------------------------------------------
 */

#include <Servo.h>

// 0 = HC-05 nos pinos 10/11 via SoftwareSerial (padrão; o Monitor Serial USB fica livre para debug)
// 1 = HC-05 nos pinos 0/1 (Serial de hardware). Use se o servo tremer ao enviar dados.
//     Nesse modo é preciso DESCONECTAR o HC-05 para gravar o código na placa.
#define BT_NA_SERIAL_DE_HARDWARE 0

// --- MAPEAMENTO DE PINOS ---
const int pinoSensorDigital = 2; // Sensor de chama (DO)
const int pinoVermelho = 3;      // Semáforo - LED Vermelho
const int pinoAmarelo = 4;       // Semáforo - LED Amarelo
const int pinoVerde = 5;         // Semáforo - LED Verde
const int pinoRele = 7;          // Relé do ventilador (ativo em LOW)
const int pinoBuzzer = 8;        // Buzzer passivo
const int pinoServo = 9;         // Servo motor do portão
const int pinoBtRx = 10;         // Arduino RX  <- TXD do HC-05
const int pinoBtTx = 11;         // Arduino TX  -> RXD do HC-05 (usar divisor de tensão 5V -> 3,3V)

#if BT_NA_SERIAL_DE_HARDWARE
  #define BT Serial
  #define DEBUG(msg)
#else
  #include <SoftwareSerial.h>
  SoftwareSerial bt(pinoBtRx, pinoBtTx);
  #define BT bt
  #define DEBUG(msg) Serial.println(F(msg))
#endif

// --- AJUSTES ---
// Nível do pino DO que significa "fogo". Mantido como no código original (HIGH).
// Muitos módulos de chama enviam LOW ao detectar fogo: se o seu for assim, troque para LOW.
const int NIVEL_FOGO = HIGH;

const int ANGULO_FECHADO = 0;
const int ANGULO_ABERTO = 110;

const unsigned long TEMPO_VERMELHO = 3000;  // Etapa 1: parado / sem operação
const unsigned long TEMPO_AMARELO = 2000;   // Etapa 2: atenção / descarga
const unsigned long TEMPO_VERDE = 4000;     // Etapa 3: liberado / carga
const unsigned long TEMPO_MIN_EMERGENCIA = 3000; // Mantém a emergência após a última detecção
const unsigned long INTERVALO_STATUS = 2000;
const unsigned long INTERVALO_STATUS_FOGO = 1000;

// --- ESTADO ---
Servo meuServo;

bool modoAutomatico = true;
bool emEmergencia = false;

char luzAtual = 'R';        // o que está de fato nos LEDs
bool portaoAberto = false;  // posição real do portão

char luzManual = 'R';       // último estado pedido no modo manual
bool portaoManual = false;

int etapaAuto = 0;                  // 0 = vermelho, 1 = amarelo, 2 = verde
unsigned long inicioEtapa = 0;
unsigned long ultimaDeteccao = 0;
unsigned long ultimoStatus = 0;
bool statusPendente = true;

// ---------------------------------------------------------------------------

void definirLuz(char luz) {
  if (luz == luzAtual) return;
  luzAtual = luz;
  digitalWrite(pinoVermelho, luz == 'R' ? HIGH : LOW);
  digitalWrite(pinoAmarelo, luz == 'Y' ? HIGH : LOW);
  digitalWrite(pinoVerde, luz == 'G' ? HIGH : LOW);
  statusPendente = true;
}

void definirPortao(bool aberto) {
  if (aberto == portaoAberto) return;
  portaoAberto = aberto;
  meuServo.write(aberto ? ANGULO_ABERTO : ANGULO_FECHADO);
  statusPendente = true;
}

void aplicarEtapaAuto() {
  switch (etapaAuto) {
    case 0: definirLuz('R'); definirPortao(false); break; // Caminhão parado
    case 1: definirLuz('Y'); break;                       // Atenção (portão continua fechado)
    case 2: definirLuz('G'); definirPortao(true); break;  // Liberado
  }
}

void reiniciarCicloAuto() {
  etapaAuto = 0;
  inicioEtapa = millis();
  aplicarEtapaAuto();
}

void atualizarCicloAuto() {
  const unsigned long duracoes[3] = {TEMPO_VERMELHO, TEMPO_AMARELO, TEMPO_VERDE};
  if (millis() - inicioEtapa >= duracoes[etapaAuto]) {
    etapaAuto = (etapaAuto + 1) % 3;
    inicioEtapa = millis();
    aplicarEtapaAuto();
  }
}

void entrarModoManual() {
  if (!modoAutomatico) return;
  modoAutomatico = false;
  // Começa o manual a partir do que está acontecendo agora
  if (!emEmergencia) {
    luzManual = luzAtual;
    portaoManual = portaoAberto;
  }
  statusPendente = true;
}

void enviarStatus() {
  BT.print(F("S:"));
  BT.print(modoAutomatico ? 'A' : 'M');
  BT.print(',');
  BT.print(luzAtual);
  BT.print(',');
  BT.print(portaoAberto ? '1' : '0');
  BT.print(',');
  BT.print(emEmergencia ? '1' : '0');
  BT.print('\n');
  ultimoStatus = millis();
  statusPendente = false;
}

void processarComando(char c) {
  switch (c) {
    case 'A':
      if (!modoAutomatico) {
        modoAutomatico = true;
        if (!emEmergencia) reiniciarCicloAuto();
      }
      break;
    case 'M':
      entrarModoManual();
      break;
    case 'R':
    case 'Y':
    case 'G':
      entrarModoManual();
      luzManual = c;
      if (!emEmergencia) definirLuz(c);
      break;
    case 'O':
    case 'C':
      entrarModoManual();
      portaoManual = (c == 'O');
      if (!emEmergencia) definirPortao(portaoManual);
      break;
    case 'S':
      break; // só responde com o estado
    default:
      return; // '\r', '\n' e lixo: ignora sem responder
  }
  statusPendente = true;
}

void iniciarEmergencia() {
  emEmergencia = true;
  digitalWrite(pinoRele, LOW);   // Liga o ventilador
  tone(pinoBuzzer, 1000);        // Alarme
  definirLuz('R');
  definirPortao(true);           // Abre o portão para evacuação
  statusPendente = true;
  DEBUG("ALERTA: Fogo detectado! Modo de emergencia ativo.");
}

void encerrarEmergencia() {
  emEmergencia = false;
  digitalWrite(pinoRele, HIGH);  // Desliga o ventilador
  noTone(pinoBuzzer);
  if (modoAutomatico) {
    reiniciarCicloAuto();
  } else {
    definirLuz(luzManual);
    definirPortao(portaoManual);
  }
  statusPendente = true;
  DEBUG("Fogo extinto. Operacao normal retomada.");
}

// ---------------------------------------------------------------------------

void setup() {
  pinMode(pinoSensorDigital, INPUT);
  pinMode(pinoRele, OUTPUT);
  pinMode(pinoBuzzer, OUTPUT);
  pinMode(pinoVermelho, OUTPUT);
  pinMode(pinoAmarelo, OUTPUT);
  pinMode(pinoVerde, OUTPUT);

  // Estados iniciais seguros
  digitalWrite(pinoRele, HIGH); // Relé desligado
  noTone(pinoBuzzer);
  digitalWrite(pinoVermelho, HIGH);
  digitalWrite(pinoAmarelo, LOW);
  digitalWrite(pinoVerde, LOW);

  meuServo.attach(pinoServo);
  meuServo.write(ANGULO_FECHADO); // Portão fechado

  Serial.begin(9600);
#if !BT_NA_SERIAL_DE_HARDWARE
  bt.begin(9600);
#endif

  reiniciarCicloAuto();
}

void loop() {
  unsigned long agora = millis();

  // 1. Sensor de chama: lido a cada volta, sem delay(), então a reação é imediata
  if (digitalRead(pinoSensorDigital) == NIVEL_FOGO) {
    ultimaDeteccao = agora;
    if (!emEmergencia) iniciarEmergencia();
  } else if (emEmergencia && agora - ultimaDeteccao >= TEMPO_MIN_EMERGENCIA) {
    encerrarEmergencia();
  }

  // 2. Comandos vindos do aplicativo
  while (BT.available() > 0) {
    processarComando((char)BT.read());
  }

  // 3. Ciclo automático do semáforo/portão
  if (!emEmergencia && modoAutomatico) {
    atualizarCicloAuto();
  }

  // 4. Envia o estado para o aplicativo (ao mudar e periodicamente)
  unsigned long intervalo = emEmergencia ? INTERVALO_STATUS_FOGO : INTERVALO_STATUS;
  if (statusPendente || millis() - ultimoStatus >= intervalo) {
    enviarStatus();
  }
}
