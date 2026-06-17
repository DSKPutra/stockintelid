import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { Shareholder } from '@idx/shared';
import { getThemeColors, useAppStore } from '../store';

interface NetworkGraphProps {
  ticker: string;
  stockName: string;
  groupName: string | null;
  shareholders: Shareholder[];
  height?: number;
}

interface Node {
  id: string;
  label: string;
  type: 'emiten' | 'group' | 'investor';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Link {
  source: string;
  target: string;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  ticker,
  stockName,
  groupName,
  shareholders,
  height = 240,
}) => {
  const { theme } = useAppStore();
  const colors = getThemeColors(theme);
  const { width: windowWidth } = useWindowDimensions();
  
  // Responsif width
  const isLargeScreen = windowWidth >= 768;
  const graphWidth = isLargeScreen ? windowWidth - 360 : windowWidth - 32;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    // 1. Definisikan Nodes
    const tempNodes: Node[] = [];
    const tempLinks: Link[] = [];

    // Pusat: Emiten Node
    const centerX = graphWidth / 2;
    const centerY = height / 2;

    tempNodes.push({
      id: ticker,
      label: ticker,
      type: 'emiten',
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      radius: 20,
      color: colors.primary,
    });

    // Node Grup Pengendali jika ada
    if (groupName) {
      const gId = 'group_node';
      tempNodes.push({
        id: gId,
        label: groupName.split('/')[0] || groupName,
        type: 'group',
        x: centerX + (Math.random() - 0.5) * 80,
        y: centerY - 60,
        vx: 0,
        vy: 0,
        radius: 16,
        color: colors.secondary,
      });
      tempLinks.push({ source: ticker, target: gId });
    }

    // Node Pemegang Saham (Ritel <5% dikecualikan agar grafik tidak berantakan)
    const validHolders = shareholders.filter(h => !h.holderName.includes('Masyarakat'));
    validHolders.forEach((h, idx) => {
      const angle = (idx / validHolders.length) * Math.PI * 2;
      const radiusDist = 80 + Math.random() * 20;
      
      const hId = `holder_${h.id}`;
      tempNodes.push({
        id: hId,
        label: h.holderName.length > 18 ? `${h.holderName.substring(0, 15)}...` : h.holderName,
        type: 'investor',
        x: centerX + Math.cos(angle) * radiusDist,
        y: centerY + Math.sin(angle) * radiusDist,
        vx: 0,
        vy: 0,
        radius: 12,
        color: colors.warning,
      });

      tempLinks.push({ source: hId, target: ticker });
    });

    // 2. Jalankan Force-Directed Simulation sederhana (120 Ticks)
    const kLink = 0.05; // Gaya tarik pegas link
    const kRepulsion = 400; // Gaya tolak-menolak antar node
    const kGravity = 0.01; // Gaya gravitasi ke tengah
    const targetDist = 70; // Jarak ideal link

    for (let tick = 0; tick < 120; tick++) {
      // A. Gravitasi & Redaman
      for (const node of tempNodes) {
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx += dx * kGravity;
        node.vy += dy * kGravity;
        node.vx *= 0.85; // Redaman gesekan
        node.vy *= 0.85;
      }

      // B. Tolak-menolak (Repulsion) antar node
      for (let i = 0; i < tempNodes.length; i++) {
        const n1 = tempNodes[i]!;
        for (let j = i + 1; j < tempNodes.length; j++) {
          const n2 = tempNodes[j]!;
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          
          if (dist < 180) {
            const force = kRepulsion / distSq;
            const forceX = (dx / dist) * force;
            const forceY = (dy / dist) * force;
            
            n1.vx -= forceX;
            n1.vy -= forceY;
            n2.vx += forceX;
            n2.vy += forceY;
          }
        }
      }

      // C. Tarikan Link (Attraction)
      for (const link of tempLinks) {
        const n1 = tempNodes.find(n => n.id === link.source)!;
        const n2 = tempNodes.find(n => n.id === link.target)!;
        if (!n1 || !n2) continue;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = (dist - targetDist) * kLink;
        const forceX = (dx / dist) * force;
        const forceY = (dy / dist) * force;

        n1.vx += forceX;
        n1.vy += forceY;
        n2.vx -= forceX;
        n2.vy -= forceY;
      }

      // D. Update Posisi & Batasan Layar
      for (const node of tempNodes) {
        node.x += node.vx;
        node.y += node.vy;
        
        // Jaga agar tidak keluar canvas
        node.x = Math.max(20, Math.min(graphWidth - 20, node.x));
        node.y = Math.max(20, Math.min(height - 20, node.y));
      }
    }

    setNodes(tempNodes);
    setLinks(tempLinks);
  }, [ticker, shareholders, groupName, graphWidth, height]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>🕸️ Network Relasi Struktur Kepemilikan</Text>
      
      <Svg width={graphWidth} height={height}>
        {/* Draw Links */}
        {links.map((link, idx) => {
          const sNode = nodes.find(n => n.id === link.source);
          const tNode = nodes.find(n => n.id === link.target);
          if (!sNode || !tNode) return null;

          return (
            <Line
              key={idx}
              x1={sNode.x}
              y1={sNode.y}
              x2={tNode.x}
              y2={tNode.y}
              stroke={colors.border}
              strokeWidth={1.5}
              opacity={0.7}
            />
          );
        })}

        {/* Draw Nodes */}
        {nodes.map((node) => {
          return (
            <React.Fragment key={node.id}>
              {/* Bulatan Node */}
              <Circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={node.color}
                stroke={colors.background}
                strokeWidth={2}
              />
              {/* Teks Label Node */}
              <SvgText
                x={node.x}
                y={node.y + node.radius + 12}
                fontSize="9"
                fontWeight="bold"
                fill={colors.textPrimary}
                textAnchor="middle"
              >
                {node.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Legenda Grafik */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Emiten</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Grup Pengendali</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Investor Mayoritas</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  legendRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
