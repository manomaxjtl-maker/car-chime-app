## Plano de implementação

Vou adicionar 5 funcionalidades distintas ao app sem alterar componentes não relacionados.

### 1. Negociação de preço (ecrã de confirmação)
- Novo componente `PriceNegotiation.tsx` no `SelectSheet` do `passageiro.home.tsx`, logo abaixo do `SurgePanel`.
- Slider 0–20% com barra colorida (verde <10%, amarelo 10–18%, vermelho 18–20%).
- Caixa em tempo real com `oferta = preco * (1 - desconto/100)`.
- Botão CTA muda dinamicamente: "Solicitar corrida" → "Enviar oferta" quando `desconto > 0`.
- Ao enviar oferta: simula resposta do motorista (70% aceita, 30% recusa) com delay 1.5s.
  - Aceita → toast sucesso + segue para `matching`.
  - Recusa → toast erro "Motorista recusou a oferta", mantém na confirmação para nova tentativa ou aceitar preço original.

### 2. Áudio no chat
- Em `ChatOverlay`, botão microfone ao lado do input.
- `MediaRecorder` ao segurar (pointerdown/pointerup), waveform animado com barras pretas pulsando.
- Limite 60s com auto-stop.
- Bolha de áudio: botão play preto, barra de progresso fina, contador, `HTMLAudioElement` para reproduzir.

### 3. Sheet de avaliação no fim da corrida
- Novo componente `RatingSheet.tsx` que sobe automaticamente ao terminar viagem.
- Foto + nome do motorista, "Como foi a sua corrida?" 18px.
- 5 estrelas 36px, animação cascata scale 1→1.3→1 (200ms, delay 50ms).
- Comentário opcional + botão preto "Confirmar avaliação".
- SlideDown 300ms + toast "Obrigado pela avaliação" 2s.

### 4. Notificação fullscreen "Motorista chegou"
- Novo componente `DriverArrivedNotice.tsx`, overlay preto sobre o mapa.
- Scale 0.8→1 com `cubic-bezier(0.34, 1.56, 0.64, 1)` em 400ms.
- `navigator.vibrate([200,100,200])` + bip 880Hz/200ms via Web Audio API.
- Auto-fecha em 4s ou ao toque, fadeOut 300ms.
- Acionado durante o estágio `trip` quando o motorista "chega" (timer simulado).

### 5. Perfil Herói Escuro
- Substitui o layout de `passageiro.perfil.tsx`:
  - Topo preto 45% altura, padding 28px.
  - Avatar 72px branco, borda 3px #333, inicial preta 26px bold.
  - Nome (16px bold branco), telefone (#888 11px), 5 estrelas brancas 14px.
  - Faixa de 3 stats (#111, radius 10px): corridas, avaliação, km.
  - Lista de menu branca com ícones em caixa #f5f5f5 (34px, radius 10px):
    Pagamento, Histórico, Segurança (badge "Novo"), Endereços, Promoções, Definições.
  - Botão "Terminar sessão" com borda 1.5px #f0f0f0.
  - Animações fadeUp/slideUp em cascata (400ms / 300ms, delay 50–100ms).

### Ficheiros a criar
- `src/components/PriceNegotiation.tsx`
- `src/components/VoiceRecorder.tsx` (ou inline no ChatOverlay)
- `src/components/AudioMessage.tsx`
- `src/components/RatingSheet.tsx`
- `src/components/DriverArrivedNotice.tsx`

### Ficheiros a editar
- `src/routes/passageiro.home.tsx` — integrar negociação, rating sheet e driver-arrived notice.
- `src/components/ChatOverlay.tsx` — adicionar microfone + bolhas de áudio.
- `src/routes/passageiro.perfil.tsx` — substituir layout pelo Herói Escuro.

Nenhum outro estilo global ou componente partilhado é alterado.
