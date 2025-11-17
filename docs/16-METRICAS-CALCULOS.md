# 16 - MÉTRICAS E CÁLCULOS

## Visão Geral

Este documento detalha as fórmulas matemáticas, algoritmos e procedimentos para cálculo de métricas de neurofeedback no NeuroOne. Todos os cálculos são baseados nos dados brutos do dispositivo TGAM e processados para gerar insights acionáveis.

---

## 1. Dados Brutos do Dispositivo TGAM

### 1.1 Formato dos Dados

O dispositivo TGAM fornece os seguintes valores via protocolo ThinkGear:

```
Signal Quality: 0-200 (0 = melhor, 200 = pior)
Attention: 0-100 (porcentagem)
Meditation/Relaxation: 0-100 (porcentagem)

EEG Power Bands (valores brutos de 3 bytes cada):
- Delta (0.5-2.75 Hz): 0 - 16777215
- Theta (3.5-6.75 Hz): 0 - 16777215
- Low Alpha (7.5-9.25 Hz): 0 - 16777215
- High Alpha (10-11.75 Hz): 0 - 16777215
- Low Beta (13-16.75 Hz): 0 - 16777215
- High Beta (18-29.75 Hz): 0 - 16777215
- Low Gamma (31-39.75 Hz): 0 - 16777215
- Mid Gamma (41-49.75 Hz): 0 - 16777215
```

### 1.2 Normalização de EEG Power Bands

As ondas cerebrais são normalizadas para valores entre 0 e 1:

```javascript
const MAX_POWER = 16777215; // 2^24 - 1

function normalizeEEGPower(rawValue) {
  return rawValue / MAX_POWER;
}

// Exemplo:
// rawDelta = 5000000
// normalizedDelta = 5000000 / 16777215 = 0.298
```

### 1.3 Agregação de Alpha, Beta e Gamma

Para simplificar visualizações, combinamos bandas relacionadas:

```javascript
function aggregateAlpha(lowAlpha, highAlpha) {
  return (lowAlpha + highAlpha) / 2;
}

function aggregateBeta(lowBeta, highBeta) {
  return (lowBeta + highBeta) / 2;
}

function aggregateGamma(lowGamma, midGamma) {
  return (lowGamma + midGamma) / 2;
}
```

---

## 2. Métricas Principais

### 2.1 Atenção (Attention)

**Fonte**: Valor direto do TGAM (0-100)

**Interpretação**:
- 0-39: Baixa atenção (Vermelho)
- 40-69: Atenção moderada (Amarelo)
- 70-100: Alta atenção (Verde)

**Cálculo de Média de Atenção em Sessão**:

```javascript
function calculateAverageAttention(dataPoints) {
  if (dataPoints.length === 0) return 0;

  const sum = dataPoints.reduce((acc, point) => acc + point.attention, 0);
  return sum / dataPoints.length;
}

// Exemplo:
// dataPoints = [65, 72, 68, 75, 70]
// avg = (65 + 72 + 68 + 75 + 70) / 5 = 70
```

**Cálculo de Mediana de Atenção**:

```javascript
function calculateMedianAttention(dataPoints) {
  if (dataPoints.length === 0) return 0;

  const sorted = dataPoints.map(p => p.attention).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}
```

**Desvio Padrão de Atenção** (mede consistência):

```javascript
function calculateAttentionStdDev(dataPoints) {
  if (dataPoints.length === 0) return 0;

  const mean = calculateAverageAttention(dataPoints);
  const squaredDiffs = dataPoints.map(p => Math.pow(p.attention - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / dataPoints.length;

  return Math.sqrt(variance);
}

// Exemplo:
// dataPoints = [70, 72, 68, 75, 70]
// mean = 71
// variance = ((70-71)^2 + (72-71)^2 + (68-71)^2 + (75-71)^2 + (70-71)^2) / 5
// variance = (1 + 1 + 9 + 16 + 1) / 5 = 5.6
// stdDev = sqrt(5.6) = 2.37
// Interpretação: Baixo desvio = atenção consistente
```

### 2.2 Relaxamento (Meditation/Relaxation)

**Fonte**: Valor direto do TGAM (0-100)

**Interpretação**:
- 0-39: Baixo relaxamento (estresse/ansiedade)
- 40-69: Relaxamento moderado
- 70-100: Alto relaxamento (calmo)

**Cálculos**: Mesmas fórmulas da atenção (média, mediana, desvio padrão)

### 2.3 Qualidade do Sinal (Signal Quality)

**Fonte**: Valor direto do TGAM (0-200)

**Interpretação**:
- 0: Sinal perfeito
- 1-50: Sinal bom
- 51-100: Sinal aceitável
- 101-200: Sinal ruim (dados não confiáveis)

**Conversão para Porcentagem de Qualidade**:

```javascript
function signalQualityPercentage(rawQuality) {
  // Inverter escala: 0 (ruim) a 200 (bom) → 100% (bom) a 0% (ruim)
  return ((200 - rawQuality) / 200) * 100;
}

// Exemplo:
// rawQuality = 30
// percentage = ((200 - 30) / 200) * 100 = 85%
```

**Filtrar Dados por Qualidade**:

```javascript
function filterBySignalQuality(dataPoints, maxAcceptableQuality = 50) {
  return dataPoints.filter(p => p.signalQuality <= maxAcceptableQuality);
}
```

---

## 3. Métricas Agregadas por Sessão

### 3.1 Métricas Básicas da Sessão

```javascript
function calculateSessionMetrics(sessionData) {
  // Filtrar apenas dados com boa qualidade
  const validData = filterBySignalQuality(sessionData, 50);

  if (validData.length === 0) {
    return {
      avgAttention: 0,
      avgRelaxation: 0,
      medianAttention: 0,
      stdDevAttention: 0,
      totalDataPoints: 0,
      validDataPoints: 0,
      dataQuality: 0
    };
  }

  return {
    avgAttention: calculateAverageAttention(validData),
    avgRelaxation: calculateAverage(validData, 'relaxation'),
    medianAttention: calculateMedianAttention(validData),
    stdDevAttention: calculateAttentionStdDev(validData),
    totalDataPoints: sessionData.length,
    validDataPoints: validData.length,
    dataQuality: (validData.length / sessionData.length) * 100
  };
}
```

### 3.2 Duração da Sessão

```javascript
function calculateSessionDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();

  const diffMs = end - start;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  return {
    totalMinutes: diffMinutes,
    hours: diffHours,
    minutes: remainingMinutes,
    formatted: diffHours > 0
      ? `${diffHours}h ${remainingMinutes}m`
      : `${remainingMinutes}m`
  };
}
```

### 3.3 Taxa de Dados (Data Rate)

```javascript
function calculateDataRate(totalDataPoints, durationMinutes) {
  if (durationMinutes === 0) return 0;

  // Dados por minuto
  return totalDataPoints / durationMinutes;
}

// Valor esperado: ~60 pontos/minuto (1 por segundo)
// Se muito abaixo, pode indicar problemas de conexão
```

---

## 4. Métricas de Ondas Cerebrais (EEG)

### 4.1 Potência Total (Total Power)

```javascript
function calculateTotalPower(eegData) {
  return eegData.delta +
         eegData.theta +
         eegData.alpha +
         eegData.beta +
         eegData.gamma;
}
```

### 4.2 Potência Relativa (Relative Power)

Porcentagem de cada banda em relação ao total:

```javascript
function calculateRelativePower(eegData) {
  const total = calculateTotalPower(eegData);

  if (total === 0) return { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 };

  return {
    delta: (eegData.delta / total) * 100,
    theta: (eegData.theta / total) * 100,
    alpha: (eegData.alpha / total) * 100,
    beta: (eegData.beta / total) * 100,
    gamma: (eegData.gamma / total) * 100
  };
}

// Exemplo:
// total = 1.0
// delta = 0.15, theta = 0.22, alpha = 0.35, beta = 0.20, gamma = 0.08
// Relative: delta = 15%, theta = 22%, alpha = 35%, beta = 20%, gamma = 8%
```

### 4.3 Índice de Engajamento (Engagement Index)

Fórmula baseada em literatura científica:

```javascript
function calculateEngagementIndex(eegData) {
  // EI = Beta / (Alpha + Theta)
  const denominator = eegData.alpha + eegData.theta;

  if (denominator === 0) return 0;

  return eegData.beta / denominator;
}

// Interpretação:
// EI > 1: Alto engajamento cognitivo
// EI ≈ 1: Engajamento moderado
// EI < 1: Baixo engajamento (relaxamento ou sonolência)
```

### 4.4 Índice de Relaxamento (Relaxation Index)

```javascript
function calculateRelaxationIndex(eegData) {
  // RI = Alpha / Beta
  if (eegData.beta === 0) return 0;

  return eegData.alpha / eegData.beta;
}

// Interpretação:
// RI > 1: Estado relaxado
// RI ≈ 1: Estado neutro
// RI < 1: Estado ativo/alerta
```

### 4.5 Índice de Sonolência (Drowsiness Index)

```javascript
function calculateDrowsinessIndex(eegData) {
  // DI = (Theta + Alpha) / Beta
  const numerator = eegData.theta + eegData.alpha;

  if (eegData.beta === 0) return 0;

  return numerator / eegData.beta;
}

// Interpretação:
// DI > 2: Possível sonolência
// DI < 1: Alerta
```

---

## 5. Métricas Comparativas

### 5.1 Comparação com Média da Turma

```javascript
function compareWithClassAverage(studentMetric, classMetrics) {
  const classAvg = classMetrics.reduce((sum, m) => sum + m.avgAttention, 0) / classMetrics.length;
  const difference = studentMetric.avgAttention - classAvg;
  const percentageDiff = (difference / classAvg) * 100;

  return {
    classAverage: classAvg,
    studentValue: studentMetric.avgAttention,
    difference: difference,
    percentageDiff: percentageDiff,
    performance: difference > 0 ? 'above' : difference < 0 ? 'below' : 'equal'
  };
}

// Exemplo:
// classAvg = 65, studentValue = 72
// difference = 7, percentageDiff = 10.77%
// performance = 'above' (acima da média)
```

### 5.2 Evolução Temporal

```javascript
function calculateTrend(metrics, attribute = 'avgAttention') {
  if (metrics.length < 2) return 'insufficient_data';

  // Regressão linear simples
  const n = metrics.length;
  const x = metrics.map((_, i) => i); // índices como tempo
  const y = metrics.map(m => m[attribute]);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Slope > 0: melhorando, < 0: piorando, ≈ 0: estável
  if (slope > 1) return 'improving';
  if (slope < -1) return 'declining';
  return 'stable';
}
```

### 5.3 Percentil

```javascript
function calculatePercentile(value, allValues) {
  const sorted = [...allValues].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);

  if (index === -1) return 100;

  return (index / sorted.length) * 100;
}

// Exemplo:
// Student attention = 75
// Class values = [45, 52, 60, 65, 68, 72, 75, 78, 82, 88]
// Percentile = 70% (melhor que 70% da turma)
```

---

## 6. Thresholds e Classificações

### 6.1 Thresholds Padrão

```javascript
const THRESHOLDS = {
  attention: {
    low: 40,
    high: 70
  },
  relaxation: {
    low: 40,
    high: 70
  },
  signalQuality: {
    excellent: 10,
    good: 50,
    acceptable: 100
  }
};
```

### 6.2 Classificação de Atenção

```javascript
function classifyAttention(attention, thresholds = THRESHOLDS.attention) {
  if (attention < thresholds.low) {
    return { level: 'low', label: 'Baixa', color: '#EF4444', recommendation: 'Tente se concentrar mais' };
  }
  if (attention < thresholds.high) {
    return { level: 'medium', label: 'Média', color: '#F59E0B', recommendation: 'Continue assim!' };
  }
  return { level: 'high', label: 'Alta', color: '#10B981', recommendation: 'Excelente foco!' };
}
```

### 6.3 Thresholds Adaptativos (Por Aluno)

```javascript
function calculatePersonalizedThresholds(historicalData) {
  if (historicalData.length < 5) return THRESHOLDS.attention;

  const attentionValues = historicalData.map(d => d.avgAttention);
  const mean = attentionValues.reduce((a, b) => a + b, 0) / attentionValues.length;
  const stdDev = calculateStdDev(attentionValues);

  // Thresholds baseados em desvio padrão individual
  return {
    low: Math.max(0, mean - stdDev),
    high: Math.min(100, mean + stdDev)
  };
}
```

---

## 7. Detecção de Anomalias

### 7.1 Quedas Bruscas de Atenção

```javascript
function detectAttentionDrops(dataPoints, threshold = 20, windowSize = 5) {
  const drops = [];

  for (let i = windowSize; i < dataPoints.length; i++) {
    const recentAvg = dataPoints.slice(i - windowSize, i)
      .reduce((sum, p) => sum + p.attention, 0) / windowSize;

    const currentValue = dataPoints[i].attention;
    const drop = recentAvg - currentValue;

    if (drop >= threshold) {
      drops.push({
        timestamp: dataPoints[i].timestamp,
        previousAvg: recentAvg,
        currentValue: currentValue,
        drop: drop
      });
    }
  }

  return drops;
}

// Uso: Detectar quando atenção cai 20+ pontos em relação aos últimos 5 segundos
```

### 7.2 Períodos de Baixa Qualidade

```javascript
function detectPoorQualityPeriods(dataPoints, maxQuality = 100, minDuration = 10) {
  const periods = [];
  let currentPeriod = null;

  dataPoints.forEach((point, i) => {
    if (point.signalQuality > maxQuality) {
      if (!currentPeriod) {
        currentPeriod = { start: i, end: i };
      } else {
        currentPeriod.end = i;
      }
    } else {
      if (currentPeriod && (currentPeriod.end - currentPeriod.start + 1) >= minDuration) {
        periods.push(currentPeriod);
      }
      currentPeriod = null;
    }
  });

  return periods;
}
```

---

## 8. Exportação de Métricas

### 8.1 Formato de Dados para Backend

```javascript
function formatMetricsForStorage(sessionId, studentId, dataPoints) {
  const validData = filterBySignalQuality(dataPoints, 50);
  const metrics = calculateSessionMetrics(dataPoints);

  return {
    session_id: sessionId,
    student_id: studentId,
    avg_attention: parseFloat(metrics.avgAttention.toFixed(2)),
    avg_relaxation: parseFloat(metrics.avgRelaxation.toFixed(2)),
    median_attention: parseFloat(metrics.medianAttention.toFixed(2)),
    std_dev_attention: parseFloat(metrics.stdDevAttention.toFixed(2)),
    data_points: validData.length,
    duration_minutes: calculateDuration(dataPoints),
    engagement_index: calculateAverageEngagement(validData),
    data_quality: parseFloat(metrics.dataQuality.toFixed(2))
  };
}
```

### 8.2 CSV Export Format

```javascript
function generateCSVData(sessionMetrics) {
  const header = 'Session ID,Student,Attention Avg,Relaxation Avg,Duration,Data Points\n';

  const rows = sessionMetrics.map(m =>
    `${m.session_id},${m.student_name},${m.avg_attention},${m.avg_relaxation},${m.duration_minutes},${m.data_points}`
  ).join('\n');

  return header + rows;
}
```

---

## 9. Exemplo Completo de Processamento

```javascript
/**
 * Pipeline completo de processamento de dados de uma sessão
 */
async function processSessionData(sessionId, rawDataPoints) {
  // 1. Filtrar dados ruins
  const validData = filterBySignalQuality(rawDataPoints, 50);

  console.log(`Dados válidos: ${validData.length}/${rawDataPoints.length} (${(validData.length/rawDataPoints.length*100).toFixed(1)}%)`);

  // 2. Calcular métricas básicas
  const basicMetrics = {
    avgAttention: calculateAverageAttention(validData),
    avgRelaxation: calculateAverage(validData, 'relaxation'),
    medianAttention: calculateMedianAttention(validData),
    stdDevAttention: calculateAttentionStdDev(validData)
  };

  console.log('Métricas básicas:', basicMetrics);

  // 3. Calcular métricas de EEG
  const eegMetrics = validData.map(point => ({
    timestamp: point.timestamp,
    engagementIndex: calculateEngagementIndex(point),
    relaxationIndex: calculateRelaxationIndex(point),
    drowsinessIndex: calculateDrowsinessIndex(point)
  }));

  const avgEngagement = eegMetrics.reduce((sum, m) => sum + m.engagementIndex, 0) / eegMetrics.length;
  console.log('Engajamento médio:', avgEngagement.toFixed(2));

  // 4. Detectar anomalias
  const attentionDrops = detectAttentionDrops(validData);
  console.log(`Quedas de atenção detectadas: ${attentionDrops.length}`);

  // 5. Salvar no banco
  const metricsToSave = {
    session_id: sessionId,
    ...basicMetrics,
    engagement_index: avgEngagement,
    attention_drops: attentionDrops.length,
    created_at: new Date().toISOString()
  };

  await saveMetrics(metricsToSave);

  return metricsToSave;
}
```

---

## 10. Referências Científicas

- **ThinkGear Protocol**: NeuroSky documentation
- **EEG Frequency Bands**: International 10-20 system
- **Engagement Index**: Pope et al. (1995) - "Biocybernetic system evaluates indices of operator engagement"
- **Attention Algorithms**: Proprietary NeuroSky eSense™ algorithms

---

## 11. Notas de Implementação

1. **Precisão**: Usar `toFixed(2)` para armazenamento, manter precisão total durante cálculos
2. **Performance**: Calcular métricas apenas ao finalizar sessão, não em tempo real
3. **Cache**: Cachear cálculos pesados (ex: desvio padrão) se dados não mudarem
4. **Validação**: Sempre validar divisão por zero antes de cálculos
5. **Logging**: Registrar anomalias e outliers para análise posterior

---

## Checklist de Implementação

- [ ] Normalização de dados TGAM
- [ ] Cálculo de métricas básicas (média, mediana, desvio)
- [ ] Métricas de ondas cerebrais (índices)
- [ ] Filtro de qualidade de sinal
- [ ] Detecção de anomalias
- [ ] Comparação com turma
- [ ] Cálculo de tendências
- [ ] Thresholds adaptativos
- [ ] Exportação de dados
- [ ] Testes unitários de todas as fórmulas
