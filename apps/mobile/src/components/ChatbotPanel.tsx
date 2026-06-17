import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { getThemeColors, useAppStore } from '../store';
import { chatApi } from '../api';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  chartData?: any;
}

export const ChatbotPanel: React.FC = () => {
  const { theme } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Halo! Saya adalah Asisten AI Bursa Efek Indonesia. Saya siap membantu Anda melakukan analisa emiten, membandingkan saham, atau melacak kelompok kepemilikan konglomerasi.

Anda bisa bertanya seperti:
- **"Bandingkan BBCA vs BBRI"**
- **"Saham grup Prajogo Pangestu mana yang valuasinya paling murah?"**
- **"Saham apa yang bagus di sektor energi?"**`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: inputText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const history = messages.map((m) => ({ sender: m.sender, text: m.text }));
      const response = await chatApi.sendMessage(userMsg.text, history);

      const botMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        sender: 'bot',
        text: response.reply,
        chartData: response.chartData,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'bot',
          text: `Maaf, terjadi kesalahan saat menghubungi asisten AI: ${e.message}`,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Helper untuk merender tabel sederhana dari format markdown di respons
  const renderTextWithTable = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableLines: string[] = [];
    let inTable = false;

    lines.forEach((line, index) => {
      const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');

      if (isTableRow) {
        inTable = true;
        tableLines.push(line);
      } else {
        if (inTable && tableLines.length > 0) {
          // Render tabel yang terkumpul
          elements.push(renderTable(tableLines, `table_${index}`));
          tableLines = [];
          inTable = false;
        }
        
        // Render baris teks normal (dengan pendeteksian bold sederhana)
        if (line.trim().startsWith('###')) {
          elements.push(
            <Text key={`h3_${index}`} style={[styles.h3, { color: colors.textPrimary }]}>
              {line.replace('###', '').trim()}
            </Text>
          );
        } else if (line.trim().startsWith('####')) {
          elements.push(
            <Text key={`h4_${index}`} style={[styles.h4, { color: colors.textPrimary }]}>
              {line.replace('####', '').trim()}
            </Text>
          );
        } else if (line.trim()) {
          // Parse bold text **text**
          const parts = line.split('**');
          elements.push(
            <Text key={`text_${index}`} style={[styles.paragraph, { color: colors.textSecondary }]}>
              {parts.map((part, i) => (
                <Text key={i} style={i % 2 === 1 ? styles.boldText : undefined}>
                  {part}
                </Text>
              ))}
            </Text>
          );
        } else {
          elements.push(<View key={`space_${index}`} style={styles.spacer} />);
        }
      }
    });

    if (inTable && tableLines.length > 0) {
      elements.push(renderTable(tableLines, 'table_end'));
    }

    return elements;
  };

  const renderTable = (tableLines: string[], key: string) => {
    // Parsing baris markdown table
    const rows = tableLines
      .filter((line) => !line.includes('---')) // Buang garis divider
      .map((line) => {
        return line
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim());
      });

    if (rows.length === 0) return null;

    const headers = rows[0] || [];
    const dataRows = rows.slice(1);

    return (
      <View key={key} style={[styles.tableContainer, { borderColor: colors.border, backgroundColor: colors.cardLight }]}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
          {headers.map((h, i) => (
            <Text key={i} style={[styles.tableHeaderText, { color: colors.textPrimary, flex: i === 0 ? 2 : 1 }]}>
              {h}
            </Text>
          ))}
        </View>
        {/* Data Rows */}
        {dataRows.map((row, rowIndex) => (
          <View key={rowIndex} style={[styles.tableRow, { borderBottomColor: rowIndex === dataRows.length - 1 ? 'transparent' : colors.border }]}>
            {row.map((cell, cellIndex) => (
              <Text key={cellIndex} style={[styles.tableCellText, { color: colors.textSecondary, flex: cellIndex === 0 ? 2 : 1 }]}>
                {cell}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderMiniChart = (chartData: any, key: string) => {
    if (!chartData || !chartData.datasets || chartData.datasets.length === 0) return null;

    const labels = chartData.labels || [];
    const dataset = chartData.datasets[0] || { label: '', data: [] };
    const data: number[] = dataset.data || [];

    if (data.length === 0) return null;

    const chartHeight = 120;
    const padding = 20;
    const barWidth = 24;
    const gap = 16;
    const svgWidth = labels.length * (barWidth + gap) + padding * 2;
    const maxVal = Math.max(...data, 1);

    return (
      <View key={key} style={[styles.miniChartContainer, { backgroundColor: colors.cardLight, borderColor: colors.border }]}>
        <Text style={[styles.miniChartTitle, { color: colors.textPrimary }]}>
          📊 {dataset.label || 'Grafik Hasil Analisa'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Svg width={svgWidth} height={chartHeight}>
            {data.map((val: number, i: number) => {
              const x = padding + i * (barWidth + gap);
              const barHeight = (val / maxVal) * (chartHeight - padding * 2);
              const y = chartHeight - padding - barHeight;

              return (
                <React.Fragment key={i}>
                  {/* Bar */}
                  <Rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={colors.primary}
                    rx={2}
                  />
                  {/* Label Nilai */}
                  <Text
                    style={{
                      position: 'absolute',
                      left: x - 4,
                      top: y - 16,
                      fontSize: 9,
                      color: colors.textPrimary,
                      fontWeight: 'bold',
                    }}
                  >
                    {val}%
                  </Text>
                  {/* Label Ticker */}
                  <Text
                    style={{
                      position: 'absolute',
                      left: x - 2,
                      top: chartHeight - 14,
                      fontSize: 9,
                      color: colors.textMuted,
                    }}
                  >
                    {labels[i]}
                  </Text>
                </React.Fragment>
              );
            })}
          </Svg>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubbleWrapper,
              m.sender === 'user' ? styles.userWrapper : styles.botWrapper,
            ]}
          >
            <View
              style={[
                styles.bubble,
                m.sender === 'user'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              {m.sender === 'user' ? (
                <Text style={{ color: '#ffffff', fontSize: 14 }}>{m.text}</Text>
              ) : (
                <View>
                  {renderTextWithTable(m.text)}
                  {m.chartData && renderMiniChart(m.chartData, `chart_${m.id}`)}
                </View>
              )}
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Asisten sedang berpikir & memanggil data bursa...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input Form */}
      <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
          placeholder="Tanya saham, grup Prajogo, emiten energi..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
        />
        <Pressable
          style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>Kirim</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  botWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  h3: {
    fontSize: 15,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  h4: {
    fontSize: 13,
    fontWeight: '700',
    marginVertical: 4,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 2,
  },
  boldText: {
    fontWeight: 'bold',
  },
  spacer: {
    height: 8,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
  },
  tableHeaderRow: {
    borderBottomWidth: 1.5,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  tableCellText: {
    fontSize: 11,
  },
  miniChartContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  miniChartTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 12,
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    marginRight: 8,
  },
  sendButton: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
