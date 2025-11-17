import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, LinearProgress, Paper, Stack, Chip } from '@mui/material';
import { Button } from '../atoms/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

/**
 * Jogo de Balanço (Balance Game)
 *
 * Objetivo: Equilibrar objetos usando níveis de atenção e relaxamento
 *
 * Mecânica:
 * - Atenção alta → plataforma inclina para direita
 * - Relaxamento alto → plataforma inclina para esquerda
 * - Equilíbrio perfeito (Atenção ≈ Relaxamento) → plataforma nivelada
 *
 * Pontuação:
 * - Pontos por manter a plataforma equilibrada
 * - Bônus por pegar objetos que caem
 * - Penalidade quando objetos caem da plataforma
 */
export function BalanceGame({ eegData, onGameEnd }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const gameStateRef = useRef({
    isRunning: false,
    isPaused: false,
    score: 0,
    lives: 3,
    platformAngle: 0, // -45 a +45 graus
    platformX: 400,
    platformY: 300,
    platformWidth: 300,
    balls: [],
    nextBallTime: 0,
    startTime: null,
    balanceTime: 0, // Tempo em segundos mantendo equilíbrio
  });

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [balanceTime, setBalanceTime] = useState(0);
  const [platformAngle, setPlatformAngle] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Atualizar ângulo da plataforma baseado em atenção e relaxamento
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const attention = eegData?.attention || 0;
    const relaxation = eegData?.relaxation || 0;
    const state = gameStateRef.current;

    // Calcular diferença entre atenção e relaxamento
    const diff = attention - relaxation;

    // Converter diferença para ângulo (-45 a +45 graus)
    // diff = -100 a +100
    const targetAngle = (diff / 100) * 45;

    state.platformAngle = targetAngle;

    // Verificar se está equilibrado (diferença < 15)
    if (Math.abs(diff) < 15) {
      state.balanceTime += 1 / 60; // Assumindo 60 FPS
    }
  }, [eegData, isRunning, isPaused]);

  // Game loop
  useEffect(() => {
    if (!isRunning) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;

    let lastTime = performance.now();

    function gameLoop(currentTime) {
      if (!state.isRunning || state.isPaused) return;

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Atualizar física
      updatePhysics(deltaTime, state);

      // Renderizar
      render(ctx, state);

      // Atualizar UI
      setScore(Math.floor(state.score));
      setLives(state.lives);
      setBalanceTime(Math.floor(state.balanceTime));
      setPlatformAngle(state.platformAngle.toFixed(1));

      // Game over
      if (state.lives <= 0) {
        state.isRunning = false;
        setIsRunning(false);
        if (onGameEnd) {
          onGameEnd({
            score: state.score,
            balanceTime: state.balanceTime,
            duration: (Date.now() - state.startTime) / 1000,
          });
        }
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    }

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, onGameEnd]);

  function updatePhysics(deltaTime, state) {
    // Spawnar novas bolas
    state.nextBallTime -= deltaTime;
    if (state.nextBallTime <= 0) {
      spawnBall(state);
      state.nextBallTime = 2 + Math.random() * 2; // 2-4 segundos
    }

    // Atualizar bolas
    const platformRadians = (state.platformAngle * Math.PI) / 180;
    const platformCenterY = state.platformY;

    state.balls = state.balls.filter((ball) => {
      // Gravidade
      ball.vy += 400 * deltaTime; // pixels/s²

      // Mover bola
      ball.y += ball.vy * deltaTime;
      ball.x += ball.vx * deltaTime;

      // Verificar colisão com plataforma
      const platformHalfWidth = state.platformWidth / 2;
      const platformLeft = state.platformX - platformHalfWidth;
      const platformRight = state.platformX + platformHalfWidth;

      if (ball.y + ball.radius >= platformCenterY - 5 && ball.y + ball.radius <= platformCenterY + 20) {
        if (ball.x >= platformLeft && ball.x <= platformRight) {
          // Colidiu com plataforma
          ball.y = platformCenterY - ball.radius;
          ball.vy = -ball.vy * 0.6; // Quique com perda de energia

          // Adicionar velocidade horizontal baseada no ângulo da plataforma
          const platformSlope = Math.tan(platformRadians);
          ball.vx += platformSlope * 100;

          // Pontos por pegar a bola
          if (!ball.caught) {
            state.score += 10;
            ball.caught = true;
          }
        }
      }

      // Bola rolando na plataforma
      if (
        ball.y + ball.radius >= platformCenterY - 5 &&
        ball.x >= platformLeft &&
        ball.x <= platformRight &&
        Math.abs(ball.vy) < 50
      ) {
        // Rolar baseado no ângulo
        const rollAcceleration = Math.sin(platformRadians) * 200;
        ball.vx += rollAcceleration * deltaTime;

        // Fricção
        ball.vx *= 0.98;
      }

      // Remover bola se sair da tela
      if (ball.y > 600) {
        if (ball.caught) {
          // Bola caiu da plataforma
          state.lives -= 1;
        }
        return false;
      }

      if (ball.x < -50 || ball.x > 850) {
        if (ball.caught) {
          state.lives -= 1;
        }
        return false;
      }

      return true;
    });

    // Pontos por manter equilíbrio (diferença < 15)
    if (Math.abs(state.platformAngle) < 15) {
      state.score += 5 * deltaTime; // 5 pontos/segundo
    }

    // Pontos extras por equilíbrio perfeito (diferença < 5)
    if (Math.abs(state.platformAngle) < 5) {
      state.score += 15 * deltaTime; // Bônus de 15 pontos/segundo
    }
  }

  function spawnBall(state) {
    const ball = {
      x: 100 + Math.random() * 600,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 15,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      caught: false,
    };
    state.balls.push(ball);
  }

  function render(ctx, state) {
    const canvas = ctx.canvas;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#E3F2FD');
    gradient.addColorStop(1, '#BBDEFB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Plataforma
    ctx.save();
    ctx.translate(state.platformX, state.platformY);
    ctx.rotate((state.platformAngle * Math.PI) / 180);

    // Sombra da plataforma
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(-state.platformWidth / 2 + 5, 10, state.platformWidth, 15);

    // Plataforma
    const platformGradient = ctx.createLinearGradient(0, -10, 0, 10);
    platformGradient.addColorStop(0, '#8B4513');
    platformGradient.addColorStop(1, '#654321');
    ctx.fillStyle = platformGradient;
    ctx.fillRect(-state.platformWidth / 2, -10, state.platformWidth, 20);

    // Bordas da plataforma
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 2;
    ctx.strokeRect(-state.platformWidth / 2, -10, state.platformWidth, 20);

    ctx.restore();

    // Bolas
    state.balls.forEach((ball) => {
      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(ball.x + 3, ball.y + ball.radius + 3, ball.radius, ball.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bola
      const ballGradient = ctx.createRadialGradient(
        ball.x - ball.radius / 3,
        ball.y - ball.radius / 3,
        0,
        ball.x,
        ball.y,
        ball.radius
      );
      ballGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      ballGradient.addColorStop(1, ball.color);

      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Borda
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Indicadores EEG
    const attention = eegData?.attention || 0;
    const relaxation = eegData?.relaxation || 0;

    // Barra de atenção (direita)
    ctx.fillStyle = '#F44336';
    ctx.fillRect(canvas.width - 40, 10, 30, (attention / 100) * 200);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(canvas.width - 40, 10, 30, 200);
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText('A', canvas.width - 30, 225);

    // Barra de relaxamento (esquerda)
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(10, 10, 30, (relaxation / 100) * 200);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, 30, 200);
    ctx.fillText('R', 18, 225);

    // Indicador de equilíbrio
    const diff = Math.abs(attention - relaxation);
    if (diff < 15) {
      ctx.fillStyle = diff < 5 ? '#4CAF50' : '#FFC107';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(diff < 5 ? 'EQUILÍBRIO PERFEITO!' : 'Equilibrado', canvas.width / 2, 30);
    }
  }

  function handleStart() {
    const state = gameStateRef.current;
    state.isRunning = true;
    state.isPaused = false;
    state.startTime = Date.now();
    state.lives = 3;
    state.score = 0;
    state.balanceTime = 0;
    state.balls = [];
    setIsRunning(true);
    setIsPaused(false);
  }

  function handlePause() {
    const state = gameStateRef.current;
    state.isPaused = !state.isPaused;
    setIsPaused(state.isPaused);
  }

  function handleRestart() {
    const state = gameStateRef.current;
    state.isRunning = false;
    state.isPaused = false;
    state.score = 0;
    state.lives = 3;
    state.balanceTime = 0;
    state.balls = [];

    setIsRunning(false);
    setIsPaused(false);
    setScore(0);
    setLives(3);
    setBalanceTime(0);
  }

  function handleEnd() {
    if (onGameEnd) {
      onGameEnd({
        score: gameStateRef.current.score,
        balanceTime: gameStateRef.current.balanceTime,
        duration: (Date.now() - gameStateRef.current.startTime) / 1000,
      });
    }
    handleRestart();
  }

  const attention = eegData?.attention || 0;
  const relaxation = eegData?.relaxation || 0;
  const balance = 100 - Math.abs(attention - relaxation);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
              Jogo de Balanço
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Balance atenção e relaxamento para manter a plataforma nivelada!
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {!isRunning ? (
              <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={handleStart}>
                Iniciar
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                  onClick={handlePause}
                >
                  {isPaused ? 'Continuar' : 'Pausar'}
                </Button>
                <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleRestart}>
                  Reiniciar
                </Button>
                <Button variant="contained" color="success" onClick={handleEnd}>
                  Finalizar
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Canvas do Jogo */}
      <Paper sx={{ mb: 2, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </Paper>

      {/* Estatísticas */}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={3} flexWrap="wrap">
          <Box sx={{ flex: 1, minWidth: 120 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Pontuação
            </Typography>
            <Typography variant="h4">{score}</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 120 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Vidas
            </Typography>
            <Typography variant="h4" sx={{ color: lives <= 1 ? 'error.main' : 'inherit' }}>
              ❤️ {lives}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 120 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Tempo Equilibrado
            </Typography>
            <Typography variant="h4">{balanceTime}s</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 120 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Ângulo
            </Typography>
            <Typography variant="h4">{platformAngle}°</Typography>
          </Box>
        </Stack>

        <Box sx={{ mt: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 100 }}>
                  Atenção:
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={attention}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': { backgroundColor: 'error.main' },
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'right' }}>
                  {attention}%
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 100 }}>
                  Relaxamento:
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={relaxation}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': { backgroundColor: 'primary.main' },
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'right' }}>
                  {relaxation}%
                </Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              <Chip
                label={`Equilíbrio: ${balance}%`}
                size="small"
                color={balance >= 85 ? 'success' : 'default'}
              />
              <Chip label="Meta: Manter diferença < 15%" size="small" variant="outlined" />
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
