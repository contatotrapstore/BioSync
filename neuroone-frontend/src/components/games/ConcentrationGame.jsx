import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, LinearProgress, Paper, Stack, Chip } from '@mui/material';
import { Button } from '../atoms/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

/**
 * Jogo de Concentração (Concentration Game)
 *
 * Objetivo: Controlar a velocidade de um objeto usando níveis de atenção
 *
 * Mecânica:
 * - Quanto maior a atenção (>70%), mais rápido o objeto se move
 * - Atenção média (40-70%), velocidade moderada
 * - Baixa atenção (<40%), objeto desacelera
 *
 * Pontuação:
 * - Pontos por segundo mantendo alta atenção
 * - Bônus por manter atenção consistente
 */
export function ConcentrationGame({ eegData, onGameEnd }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const gameStateRef = useRef({
    isRunning: false,
    isPaused: false,
    score: 0,
    distance: 0,
    carX: 50,
    carY: 250,
    speed: 0,
    targetSpeed: 0,
    highAttentionTime: 0, // Tempo em segundos com alta atenção
    startTime: null,
  });

  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [highAttentionTime, setHighAttentionTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Atualizar velocidade baseado na atenção
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const attention = eegData?.attention || 0;
    const state = gameStateRef.current;

    // Calcular velocidade alvo baseada na atenção
    // Atenção 0-40: velocidade 0-2
    // Atenção 40-70: velocidade 2-5
    // Atenção 70-100: velocidade 5-10
    let targetSpeed;
    if (attention < 40) {
      targetSpeed = (attention / 40) * 2;
    } else if (attention < 70) {
      targetSpeed = 2 + ((attention - 40) / 30) * 3;
    } else {
      targetSpeed = 5 + ((attention - 70) / 30) * 5;
    }

    state.targetSpeed = targetSpeed;

    // Adicionar tempo de alta atenção
    if (attention >= 70) {
      state.highAttentionTime += 1 / 60; // Assumindo 60 FPS
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

      const deltaTime = (currentTime - lastTime) / 1000; // Segundos
      lastTime = currentTime;

      // Atualizar física
      updatePhysics(deltaTime, state);

      // Renderizar
      render(ctx, state);

      // Atualizar UI
      setScore(Math.floor(state.score));
      setDistance(Math.floor(state.distance));
      setSpeed(state.speed.toFixed(1));
      setHighAttentionTime(Math.floor(state.highAttentionTime));

      animationRef.current = requestAnimationFrame(gameLoop);
    }

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning]);

  function updatePhysics(deltaTime, state) {
    // Suavizar mudança de velocidade (aceleração/desaceleração)
    const acceleration = 3; // Unidades por segundo
    if (state.speed < state.targetSpeed) {
      state.speed = Math.min(state.speed + acceleration * deltaTime, state.targetSpeed);
    } else {
      state.speed = Math.max(state.speed - acceleration * deltaTime, state.targetSpeed);
    }

    // Mover carro
    state.distance += state.speed * deltaTime * 10; // Multiplicador para visualização

    // Calcular pontuação
    // Pontos base por distância
    state.score += state.speed * deltaTime * 10;

    // Bônus por alta atenção (70+)
    if (state.targetSpeed >= 5) {
      state.score += 20 * deltaTime; // 20 pontos/segundo em alta atenção
    }

    // Bônus de consistência (manter velocidade alta)
    if (state.speed >= 8) {
      state.score += 50 * deltaTime; // Bônus extra
    }
  }

  function render(ctx, state) {
    const canvas = ctx.canvas;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo (céu)
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    // Chão
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    // Estrada
    const roadY = canvas.height * 0.6;
    const roadHeight = 100;
    ctx.fillStyle = '#444';
    ctx.fillRect(0, roadY, canvas.width, roadHeight);

    // Linhas da estrada (animadas)
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -state.distance % 40;
    ctx.beginPath();
    ctx.moveTo(0, roadY + roadHeight / 2);
    ctx.lineTo(canvas.width, roadY + roadHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Carro (retângulo simples)
    const carWidth = 60;
    const carHeight = 40;
    const carX = 100;
    const carY = roadY + roadHeight / 2 - carHeight / 2;

    // Sombra do carro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(carX + 5, carY + carHeight, carWidth, 5);

    // Corpo do carro
    ctx.fillStyle = state.speed >= 8 ? '#FF4444' : state.speed >= 5 ? '#FFA500' : '#4169E1';
    ctx.fillRect(carX, carY, carWidth, carHeight);

    // Janelas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(carX + 10, carY + 5, 15, 15);
    ctx.fillRect(carX + 35, carY + 5, 15, 15);

    // Rodas
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(carX + 15, carY + carHeight, 8, 0, Math.PI * 2);
    ctx.arc(carX + 45, carY + carHeight, 8, 0, Math.PI * 2);
    ctx.fill();

    // Efeito de velocidade (linhas de movimento)
    if (state.speed > 3) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      const numLines = Math.floor(state.speed / 2);
      for (let i = 0; i < numLines; i++) {
        const lineX = carX - 20 - i * 15;
        const lineY = carY + carHeight / 2 + (Math.random() - 0.5) * 20;
        ctx.beginPath();
        ctx.moveTo(lineX, lineY);
        ctx.lineTo(lineX - 10, lineY);
        ctx.stroke();
      }
    }

    // Indicador de atenção no canto
    const attention = eegData?.attention || 0;
    ctx.fillStyle = attention >= 70 ? '#4CAF50' : attention >= 40 ? '#FFA500' : '#F44336';
    ctx.fillRect(canvas.width - 120, 10, 110, 30);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Atenção: ${attention}%`, canvas.width - 115, 32);
  }

  function handleStart() {
    const state = gameStateRef.current;
    state.isRunning = true;
    state.isPaused = false;
    state.startTime = Date.now();
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
    state.distance = 0;
    state.speed = 0;
    state.targetSpeed = 0;
    state.highAttentionTime = 0;
    state.startTime = null;

    setIsRunning(false);
    setIsPaused(false);
    setScore(0);
    setDistance(0);
    setSpeed(0);
    setHighAttentionTime(0);
  }

  function handleEnd() {
    if (onGameEnd) {
      onGameEnd({
        score: gameStateRef.current.score,
        distance: gameStateRef.current.distance,
        highAttentionTime: gameStateRef.current.highAttentionTime,
        duration: (Date.now() - gameStateRef.current.startTime) / 1000,
      });
    }
    handleRestart();
  }

  const attention = eegData?.attention || 0;

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
              Jogo de Concentração
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Mantenha alta concentração para acelerar o carro!
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
          height={400}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            backgroundColor: '#87CEEB',
          }}
        />
      </Paper>

      {/* Estatísticas */}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={3} flexWrap="wrap">
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Pontuação
            </Typography>
            <Typography variant="h4">{score}</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Distância
            </Typography>
            <Typography variant="h4">{distance}m</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Velocidade
            </Typography>
            <Typography variant="h4">{speed} km/h</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Tempo Alta Atenção
            </Typography>
            <Typography variant="h4">{highAttentionTime}s</Typography>
          </Box>
        </Stack>

        <Box sx={{ mt: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 80 }}>
              Atenção:
            </Typography>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={attention}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor:
                      attention >= 70 ? 'success.main' : attention >= 40 ? 'warning.main' : 'error.main',
                  },
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'right', fontWeight: 600 }}>
              {attention}%
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip
              label="Alta Atenção (70+): 10 km/h"
              size="small"
              color={attention >= 70 ? 'success' : 'default'}
            />
            <Chip
              label="Média (40-70): 5 km/h"
              size="small"
              color={attention >= 40 && attention < 70 ? 'warning' : 'default'}
            />
            <Chip label="Baixa (<40): 2 km/h" size="small" color={attention < 40 ? 'error' : 'default'} />
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
