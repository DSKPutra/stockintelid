import { Injectable } from '@nestjs/common';
import { StockService } from '../stock/stock.service';
import { Stock, Fundamentals } from '@idx/shared';

@Injectable()
export class ChatbotService {
  constructor(private readonly stockService: StockService) {}

  async processMessage(
    message: string,
    history: { sender: 'user' | 'bot'; text: string }[] = [],
  ): Promise<{ reply: string; chartData?: any }> {
    const query = message.toLowerCase();
    console.log(`[CHATBOT] Memproses query RAG: "${message}"`);

    // Inisialisasi data untuk dicari
    const stocks = await this.stockService.getStocks();
    const groups = await this.stockService.getControllingGroups();
    const sectors = await this.stockService.getSectorList();

    // 1. Deteksi Intent - Perbandingan Saham (mis. "BBCA vs BBRI")
    const compareMatch = query.match(/bandingkan\s+([a-z]{4})\s+vs\s+([a-z]{4})/i) ||
                         query.match(/perbandingan\s+([a-z]{4})\s+dan\s+([a-z]{4})/i);
    
    if (compareMatch && compareMatch[1] && compareMatch[2]) {
      const t1 = compareMatch[1].toUpperCase();
      const t2 = compareMatch[2].toUpperCase();
      return this.generateComparisonResponse(t1, t2);
    }

    // 2. Deteksi Intent - Saham per Grup Pemilik (mis. "saham grup prajogo mana yang paling murah valuasinya?")
    if (query.includes('prajogo') || query.includes('barito') || query.includes('bakrie') || query.includes('happy')) {
      let groupId = 'barito';
      if (query.includes('bakrie')) groupId = 'bakrie';
      else if (query.includes('happy')) groupId = 'happy';
      
      return this.generateGroupResponse(groupId, query);
    }

    // 3. Deteksi Intent - Saham per Sektor (mis. "saham apa yang bagus di sektor energi?")
    if (query.includes('sektor') || query.includes('energi') || query.includes('keuangan') || query.includes('teknologi')) {
      let sectorCode = 'energy';
      if (query.includes('keuangan') || query.includes('financial')) sectorCode = 'financials';
      else if (query.includes('teknologi') || query.includes('tech')) sectorCode = 'technology';
      else if (query.includes('infrastruktur') || query.includes('infra')) sectorCode = 'infrastructure';
      else if (query.includes('baku') || query.includes('material')) sectorCode = 'basic';
      
      return this.generateSectorResponse(sectorCode, query);
    }

    // 4. Deteksi Intent - Detail Emiten Spesifik (mis. "detail saham BREN" atau "bagaimana fundamental GOTO")
    const tickerMatch = query.match(/\b([a-z]{4})\b/i);
    if (tickerMatch && tickerMatch[1]) {
      const ticker = tickerMatch[1].toUpperCase();
      const exists = stocks.some(s => s.ticker === ticker);
      if (exists) {
        return this.generateStockDetailResponse(ticker);
      }
    }

    // 5. Default Fallback - General Answer / Help Guide
    return {
      reply: `Halo! Saya adalah Asisten AI Analisa Saham IDX. Anda bisa mengajukan pertanyaan berbasis data riil kepada saya, seperti:
1. **"Bandingkan BBCA vs BBRI"** (Perbandingan head-to-head emiten)
2. **"Saham grup Prajogo Pangestu mana yang valuasinya paling murah?"** (Analisa emiten per grup konglomerasi)
3. **"Saham apa yang bagus di sektor energi?"** (Analisa per sektor)
4. **"Bagaimana fundamental saham BREN?"** (Bedah emiten spesifik)

*Setiap analisis yang saya berikan dilengkapi ringkasan, penalaran terstruktur, tabel perbandingan, dan grafik visual.*

---
**Disclaimer:** Informasi disajikan untuk edukasi, bukan rekomendasi/ajakan transaksi. Keputusan investasi adalah tanggung jawab pengguna.`,
    };
  }

  private async generateComparisonResponse(t1: string, t2: string): Promise<{ reply: string; chartData?: any }> {
    try {
      const s1 = await this.stockService.getStock(t1);
      const s2 = await this.stockService.getStock(t2);
      const f1 = await this.stockService.getFundamentals(t1);
      const f2 = await this.stockService.getFundamentals(t2);
      const q1 = await this.stockService.getQuote(t1);
      const q2 = await this.stockService.getQuote(t2);

      const reply = `### 📊 Perbandingan Saham: ${t1} vs ${t2}

#### 1. Ringkasan (TL;DR)
Perbandingan antara **${s1.name} (${t1})** dan **${s2.name} (${t2})** menunjukkan bahwa ${t1} memiliki kapitalisasi pasar Rp ${(s1.marketCap / 1e12).toFixed(1)} T dengan harga Rp ${q1.price} (${q1.changePercent}%), sedangkan ${t2} memiliki kapitalisasi pasar Rp ${(s2.marketCap / 1e12).toFixed(1)} T dengan harga Rp ${q2.price} (${q2.changePercent}%).

#### 2. Reasoning (Analisa Terstruktur)
- **Faktor Fundamental:** ${t1} memiliki PER ${f1.per}x dan PBV ${f1.pbv}x dengan ROE ${f1.roe}%. Di sisi lain, ${t2} diperdagangkan dengan PER ${f2.per}x, PBV ${f2.pbv}x, dan ROE ${f2.roe}%. ${f1.roe > f2.roe ? `${t1} menghasilkan profitabilitas atas ekuitas (ROE) yang lebih tinggi.` : `${t2} menawarkan ROE yang lebih unggul.`}
- **Faktor Dividen:** ${t1} menawarkan dividend yield sebesar ${f1.dividendYield}%, sedangkan ${t2} memiliki yield ${f2.dividendYield}%.
- **Struktur Utang (DER):** Tingkat leverage keuangan ${t1} (DER: ${f1.der}x) ${f1.der < f2.der ? 'lebih aman dan rendah' : 'lebih tinggi'} dibandingkan ${t2} (DER: ${f2.der}x).

#### 3. Tabel Data Pendukung
| Metrik Fundamental | ${t1} | ${t2} | Selisih / Evaluasi |
| :--- | :---: | :---: | :---: |
| **Harga Terakhir** | Rp ${q1.price} | Rp ${q2.price} | - |
| **Market Cap** | Rp ${(s1.marketCap / 1e12).toFixed(1)} T | Rp ${(s2.marketCap / 1e12).toFixed(1)} T | ${s1.marketCap > s2.marketCap ? `${t1} Lebih Besar` : `${t2} Lebih Besar`} |
| **PER (Price to Earnings)** | ${f1.per}x | ${f2.per}x | ${f1.per < f2.per ? `${t1} Lebih Murah` : `${t2} Lebih Murah`} |
| **PBV (Price to Book)** | ${f1.pbv}x | ${f2.pbv}x | ${f1.pbv < f2.pbv ? `${t1} Lebih Murah` : `${t2} Lebih Murah`} |
| **ROE (Return on Equity)** | ${f1.roe}% | ${f2.roe}% | ${f1.roe > f2.roe ? `${t1} Lebih Efisien` : `${t2} Lebih Efisien`} |
| **DER (Debt to Equity)** | ${f1.der}x | ${f2.der}x | ${f1.der < f2.der ? `${t1} Lebih Sehat` : `${t2} Lebih Sehat`} |
| **Dividend Yield** | ${f1.dividendYield}% | ${f2.dividendYield}% | ${f1.dividendYield > f2.dividendYield ? `${t1} Lebih Tinggi` : `${t2} Lebih Tinggi`} |

---
**Sumber data:** ${f1.source} (Diperbarui: ${new Date(q1.lastUpdated).toLocaleDateString('id-ID')})
**Disclaimer:** Informasi di atas bertujuan untuk edukasi dan bukan rekomendasi investasi transaksi jual/beli. Keputusan investasi ada pada masing-masing pengguna.`;

      // Kirim visual perbandingan ROE & PER ke UI
      const chartData = {
        type: 'bar',
        labels: ['ROE (%)', 'PER (x)', 'PBV (x)'],
        datasets: [
          { label: t1, data: [f1.roe, f1.per, f1.pbv] },
          { label: t2, data: [f2.roe, f2.per, f2.pbv] },
        ],
      };

      return { reply, chartData };
    } catch (e: any) {
      return { reply: `Gagal membandingkan saham. Pastikan ticker terdaftar. Error: ${e.message}` };
    }
  }

  private async generateGroupResponse(groupId: string, query: string): Promise<{ reply: string; chartData?: any }> {
    const group = await this.stockService.getControllingGroup(groupId);
    const fundamentalsList: { stock: Stock; fund: Fundamentals }[] = [];

    for (const stock of group.stocks) {
      const fund = await this.stockService.getFundamentals(stock.ticker);
      fundamentalsList.push({ stock, fund });
    }

    // Cari valuasi termurah (PER / PBV terendah)
    // Singkirkan PER negatif untuk mencari yang termurah
    const positivePerList = fundamentalsList.filter(x => x.fund.per > 0);
    const cheapestPer = positivePerList.sort((a, b) => a.fund.per - b.fund.per)[0];
    const cheapestPbv = [...fundamentalsList].sort((a, b) => a.fund.pbv - b.fund.pbv)[0];

    let tldr = '';
    if (cheapestPer) {
      tldr = `Di dalam **${group.name}**, emiten dengan valuasi PE termurah saat ini adalah **${cheapestPer.stock.ticker}** (${cheapestPer.fund.per}x), sedangkan berdasarkan PBV termurah adalah **${cheapestPbv?.stock.ticker}** (${cheapestPbv?.fund.pbv}x).`;
    } else {
      tldr = `Di dalam **${group.name}**, emiten dengan PBV termurah saat ini adalah **${cheapestPbv?.stock.ticker}** (${cheapestPbv?.fund.pbv}x).`;
    }

    let tableRows = '';
    fundamentalsList.forEach(x => {
      tableRows += `| **${x.stock.ticker}** | ${x.stock.name.substring(0, 22)}... | ${x.fund.per}x | ${x.fund.pbv}x | ${x.fund.roe}% | Rp ${(x.stock.marketCap / 1e12).toFixed(1)} T |\n`;
    });

    const reply = `### 🏢 Analisa Grup Pengendali: ${group.name}

#### 1. Ringkasan (TL;DR)
${tldr} Total market cap seluruh emiten grup ini adalah sekitar **Rp ${(group.totalMarketCap! / 1e12).toFixed(1)} T** dengan performa rata-rata harian grup sekitar **${group.avgPerformance}%**.

#### 2. Reasoning (Analisa Kepemilikan & Struktur)
- **Ultimate Beneficial Owner (UBO):** Grup ini dikendalikan secara akhir oleh **${group.ultimateOwner}**.
- **Profil Grup:** ${group.description}
- **Rekomendasi Analisa:** Emiten dengan leverage utang tinggi (seperti BREN/BRPT) biasanya memiliki valuasi PBV premium karena faktor pertumbuhan EBT/infrastruktur, sedangkan emiten tambang batubara (seperti BUMI) secara historis memiliki PER rendah karena volatilitas komoditas.

#### 3. Tabel Anggota Grup & Metrik Fundamental
| Ticker | Nama Perusahaan | PER (x) | PBV (x) | ROE (%) | Kapitalisasi (Market Cap) |
| :--- | :--- | :---: | :---: | :---: | :---: |
${tableRows}

---
**Sumber data:** Keterbukaan Pemegang Saham IDX & KSEI (Juni 2026)
**Disclaimer:** Analisa ini bersifat edukasi keuangan, bukan rekomendasi beli/jual saham grup konglomerasi terkait.`;

    const chartData = {
      type: 'treemap',
      labels: group.stocks.map(s => s.ticker),
      datasets: [
        {
          label: 'Market Cap (Rp T)',
          data: group.stocks.map(s => parseFloat((s.marketCap / 1e12).toFixed(1))),
        },
      ],
    };

    return { reply, chartData };
  }

  private async generateSectorResponse(sectorCode: string, query: string): Promise<{ reply: string; chartData?: any }> {
    const sectors = await this.stockService.getSectorList();
    const sector = sectors.find(s => s.code === sectorCode)!;
    const allStocks = await this.stockService.getStocks();
    const sectorStocks = allStocks.filter(s => s.sectorCode === sectorCode);

    const stocksWithFund: { stock: Stock; fund: Fundamentals }[] = [];
    for (const stock of sectorStocks) {
      const fund = await this.stockService.getFundamentals(stock.ticker);
      stocksWithFund.push({ stock, fund });
    }

    // Urutkan berdasarkan ROE tertinggi (paling menguntungkan)
    const bestRoe = [...stocksWithFund].sort((a, b) => b.fund.roe - a.fund.roe);

    let tableRows = '';
    bestRoe.slice(0, 5).forEach(x => {
      tableRows += `| **${x.stock.ticker}** | ${x.stock.name.substring(0, 22)}... | ${x.fund.per}x | ${x.fund.pbv}x | ${x.fund.roe}% | Rp ${(x.stock.marketCap / 1e12).toFixed(1)} T |\n`;
    });

    const reply = `### ⚡ Analisa Sektor: ${sector.nameId} (${sector.nameEn})

#### 1. Ringkasan (TL;DR)
Sektor **${sector.nameId}** memberikan kontribusi sebesar **${sector.contributionIHSG}%** terhadap bobot IHSG dengan rata-rata PER sektor **${sector.avgPe}x** dan PBV **${sector.avgPbv}x**. Performa sektoral saat ini tumbuh sekitar **${sector.performance}%**.

#### 2. Reasoning (Analisa Peluang)
- **Top Performer:** Emiten terbaik di sektor ini belakangan dipimpin oleh **${sector.bestTicker}**.
- **Rekomendasi Seleksi:** Dari sisi profitabilitas ekuitas (ROE), saham **${bestRoe[0]?.stock.ticker}** memimpin dengan ROE sebesar **${bestRoe[0]?.fund.roe}%**, diikuti oleh **${bestRoe[1]?.stock.ticker}** (${bestRoe[1]?.fund.roe}%). Investor disarankan membandingkan tingkat utang (DER) sebelum mengambil keputusan akhir.

#### 3. Top 5 Emiten Sektor Ini (Berdasarkan ROE)
| Ticker | Nama Emiten | PER (x) | PBV (x) | ROE (%) | Market Cap |
| :--- | :--- | :---: | :---: | :---: | :---: |
${tableRows}

---
**Sumber data:** Laporan Sektoral Bursa Efek Indonesia Q1 2026
**Disclaimer:** Hasil screener sektor bukan merupakan ajakan membeli. Lakukan analisis mendalam (DYOR).`;

    const chartData = {
      type: 'bar',
      labels: bestRoe.slice(0, 5).map(x => x.stock.ticker),
      datasets: [
        {
          label: 'ROE (%)',
          data: bestRoe.slice(0, 5).map(x => x.fund.roe),
        },
      ],
    };

    return { reply, chartData };
  }

  private async generateStockDetailResponse(ticker: string): Promise<{ reply: string; chartData?: any }> {
    const stock = await this.stockService.getStock(ticker);
    const fund = await this.stockService.getFundamentals(ticker);
    const quote = await this.stockService.getQuote(ticker);
    const shareholders = await this.stockService.getShareholders(ticker);

    const controllers = shareholders.filter(s => s.isController);
    const controllersStr = controllers.map(c => `${c.holderName} (${c.pct}%)`).join(', ');

    const reply = `### 🔍 Analisa Detail Saham: ${ticker} (${stock.name})

#### 1. Ringkasan (TL;DR)
Saham **${ticker}** diperdagangkan di sektor **${stock.sectorCode.toUpperCase()}** dengan harga Rp **${quote.price}** (${quote.changePercent}%). Kapitalisasi pasar mencapai **Rp ${(stock.marketCap / 1e12).toFixed(1)} T**.

#### 2. Reasoning (Kondisi Bisnis & Kepemilikan)
- **Kondisi Keuangan:** Emiten memiliki rasio PER **${fund.per}x**, PBV **${fund.pbv}x**, dan tingkat efisiensi bisnis ROE sebesar **${fund.roe}%**.
- **Struktur Kepemilikan Pengendali:** Saham dikendalikan oleh **${controllersStr || 'Masyarakat/Publik'}**. Struktur ini memberikan indikasi pengendali akhir (Ultimate Beneficial Owner).

#### 3. Metrik Utama & Pemegang Saham
- **Rasio DER (Utang/Ekuitas):** ${fund.der}x
- **Dividend Yield:** ${fund.dividendYield}%
- **EPS (Earning Per Share):** Rp ${fund.eps}
- **Net Margin:** ${fund.netMargin}%

| Pemegang Saham Utama | Persentase | Tipe Pengendali | Sumber Data |
| :--- | :---: | :---: | :--- |
${shareholders.map(s => `| ${s.holderName} | ${s.pct}% | ${s.isController ? 'Pengendali' : 'Non-Pengendali'} | ${s.source} |`).join('\n')}

---
**Sumber data:** Keterbukaan Informasi IDX Terbaru
**Disclaimer:** Informasi untuk pembelajaran investasi pribadi, bukan rekomendasi transaksi efek keuangan.`;

    const chartData = {
      type: 'pie',
      labels: shareholders.map(s => s.holderName),
      datasets: [
        {
          label: 'Persentase Kepemilikan (%)',
          data: shareholders.map(s => s.pct),
        },
      ],
    };

    return { reply, chartData };
  }
}
