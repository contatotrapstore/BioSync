/**
 * PDF Export Utility for NeuroOne
 * Generate session reports in PDF format
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a PDF report for a neurofeedback session
 * @param {Object} session - Session data from database
 * @param {Object} metrics - Session metrics (avg_attention, avg_relaxation, etc)
 * @param {Object} student - Student information
 * @returns {void} Downloads PDF file
 */
export function generateSessionReport(session, metrics, student) {
  // Create new PDF document
  const doc = new jsPDF();

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Colors
  const primaryColor = [76, 175, 80]; // Verde #4CAF50
  const secondaryColor = [33, 150, 243]; // Azul #2196F3
  const textColor = [51, 51, 51]; // Cinza escuro

  // ============================================
  // HEADER
  // ============================================
  // Logo text (substituir por imagem se disponível)
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('NeuroOne', margin, 25);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Neurofeedback Educacional', margin, 32);

  // Divider line
  doc.setLineWidth(0.5);
  doc.setDrawColor(...primaryColor);
  doc.line(margin, 36, pageWidth - margin, 36);

  // ============================================
  // TITLE
  // ============================================
  doc.setFontSize(18);
  doc.setTextColor(...secondaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Sessão de Neurofeedback', pageWidth / 2, 50, { align: 'center' });

  // ============================================
  // SESSION INFO
  // ============================================
  let yPos = 65;
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');

  // Student name
  doc.text('Aluno:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(student.name || 'N/A', margin + 30, yPos);

  // Session title
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Sessão:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(session.title || 'Sessão de Neurofeedback', margin + 30, yPos);

  // Date
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const sessionDate = session.started_at
    ? new Date(session.started_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';
  doc.text(sessionDate, margin + 30, yPos);

  // Duration
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Duração:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const duration = metrics.total_duration_ms
    ? `${(metrics.total_duration_ms / 60000).toFixed(1)} minutos`
    : 'N/A';
  doc.text(duration, margin + 30, yPos);

  // ============================================
  // METRICS TABLE
  // ============================================
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...secondaryColor);
  doc.text('Métricas da Sessão', margin, yPos);

  yPos += 5;

  // Prepare table data
  const tableData = [
    ['Atenção Média', `${metrics.avg_attention || 0}%`],
    ['Relaxamento Médio', `${metrics.avg_relaxation || 0}%`],
    ['Pico de Atenção', `${metrics.peak_attention || 0}%`],
    ['Pico de Relaxamento', `${metrics.peak_relaxation || 0}%`],
    ['Qualidade do Sinal', metrics.avg_signal_quality ? `${metrics.avg_signal_quality}/200` : 'N/A'],
  ];

  // Add game score if available
  if (metrics.game_score !== undefined && metrics.game_score !== null) {
    tableData.push(['Pontuação do Jogo', `${metrics.game_score} pontos`]);
  }

  // Generate table
  doc.autoTable({
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: margin, right: margin },
  });

  // ============================================
  // INTERPRETATION
  // ============================================
  yPos = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...secondaryColor);
  doc.text('Interpretação', margin, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);

  // Interpretation text
  const interpretations = [];

  // Attention interpretation
  if (metrics.avg_attention >= 70) {
    interpretations.push(' Nível excelente de atenção durante a sessão.');
  } else if (metrics.avg_attention >= 50) {
    interpretations.push('" Nível adequado de atenção, com margem para melhoria.');
  } else {
    interpretations.push('  Atenção abaixo do esperado. Considere ajustar a dificuldade dos exercícios.');
  }

  // Relaxation interpretation
  if (metrics.avg_relaxation >= 70) {
    interpretations.push(' Excelente capacidade de relaxamento demonstrada.');
  } else if (metrics.avg_relaxation >= 50) {
    interpretations.push('" Capacidade adequada de relaxamento.');
  } else {
    interpretations.push('  Dificuldade em manter relaxamento. Sugere-se exercícios de respiração.');
  }

  // Signal quality interpretation
  if (metrics.avg_signal_quality && metrics.avg_signal_quality < 50) {
    interpretations.push('  Qualidade do sinal EEG baixa. Verifique o posicionamento do dispositivo.');
  }

  // Print interpretations
  interpretations.forEach((text, index) => {
    const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(splitText, margin, yPos);
    yPos += splitText.length * 5 + 2;
  });

  // ============================================
  // RECOMMENDATIONS
  // ============================================
  yPos += 5;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...secondaryColor);
  doc.text('Recomendações', margin, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);

  const recommendations = [
    '" Continue praticando regularmente para melhores resultados.',
    '" Mantenha o ambiente tranquilo durante as sessões.',
    '" Certifique-se de que o dispositivo EEG está bem posicionado.',
    '" Tente diferentes tipos de jogos para treinar diferentes habilidades.',
  ];

  recommendations.forEach((text) => {
    const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(splitText, margin, yPos);
    yPos += splitText.length * 5 + 2;
  });

  // ============================================
  // FOOTER
  // ============================================
  const footerY = pageHeight - 20;

  // Separator line
  doc.setLineWidth(0.3);
  doc.setDrawColor(...primaryColor);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  // Footer text
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text('Gerado por NeuroOne - Sistema de Neurofeedback Educacional', pageWidth / 2, footerY, {
    align: 'center',
  });

  // Generation timestamp
  const timestamp = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Relatório gerado em: ${timestamp}`, pageWidth / 2, footerY + 5, { align: 'center' });

  // ============================================
  // SAVE PDF
  // ============================================
  const filename = `relatorio-${student.name?.replace(/\s+/g, '-') || 'sessao'}-${session.id || Date.now()}.pdf`;
  doc.save(filename);

  console.log(' PDF gerado com sucesso:', filename);
}

/**
 * Generate a summary PDF for multiple sessions
 * @param {Array} sessions - Array of session objects with metrics
 * @param {Object} student - Student information
 * @returns {void} Downloads PDF file
 */
export function generateStudentSummary(sessions, student) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(76, 175, 80);
  doc.text('NeuroOne - Relatório de Histórico', pageWidth / 2, 25, { align: 'center' });

  // Student info
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  doc.text(`Aluno: ${student.name}`, margin, 40);
  doc.text(`Total de Sessões: ${sessions.length}`, margin, 48);

  // Sessions table
  const tableData = sessions.map((s, index) => [
    index + 1,
    new Date(s.started_at).toLocaleDateString('pt-BR'),
    `${s.metrics.avg_attention}%`,
    `${s.metrics.avg_relaxation}%`,
    s.metrics.game_score || '-',
  ]);

  doc.autoTable({
    startY: 55,
    head: [['#', 'Data', 'Atenção', 'Relaxamento', 'Pontuação']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
  });

  // Save
  const filename = `historico-${student.name?.replace(/\s+/g, '-') || 'aluno'}.pdf`;
  doc.save(filename);
}
