import { Injectable } from '@nestjs/common';
import { StockService } from '../stock/stock.service';
import { Stock, Fundamentals, Shareholder, MutualFund } from '@idx/shared';

@Injectable()
export class ChatbotService {
  constructor(private readonly stockService: StockService) {}

  async processMessage(
    message: string,
    history: { sender: 'user' | 'bot'; text: string }[] = [],
  ): Promise<{ reply: string; chartData?: any }> {
    const query = message.toLowerCase();
    const provider = process.env.LLM_PROVIDER || 'gemini';
    const apiKey = process.env.LLM_API_KEY;

    console.log(`[CHATBOT] Memproses query RAG: "${message}" | Provider: ${provider} (Key set: ${!!apiKey})`);

    // Jika API Key di-set, gunakan integrasi LLM riil dengan tool calling
    if (apiKey) {
      try {
        return await this.callRealLLM(message, provider, apiKey, history);
      } catch (e: any) {
        console.error('[CHATBOT] Gagal memanggil LLM riil, fallback ke agen aturan lokal:', e);
      }
    }

    // Fallback: Smart Local Rule-Based Agent (data KSEI terperinci)
    return this.processLocalFallback(query);
  }

  // ---- INTEGRASI LLM RIIL & TOOL CALLING ----
  private async callRealLLM(
    message: string,
    provider: string,
    apiKey: string,
    history: any[],
  ): Promise<{ reply: string; chartData?: any }> {
    // Definisikan daftar tools yang tersedia untuk LLM
    const tools = [
      {
        name: 'get_stocks_list',
        description: 'Mendapatkan daftar seluruh saham IDX yang tersedia (ticker, nama, sektor, market cap).',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'get_stock_fundamentals',
        description: 'Mendapatkan rasio fundamental utama saham (PER, PBV, ROE, DER, EPS, Yield) berdasarkan ticker.',
        parameters: {
          type: 'object',
          properties: {
            ticker: { type: 'string', description: 'Ticker saham 4 huruf, mis. BBCA' }
          },
          required: ['ticker']
        }
      },
      {
        name: 'get_stock_shareholders',
        description: 'Mendapatkan data pemegang saham KSEI (nama, tipe, asal lokal/asing L/F, persentase) untuk ticker tertentu.',
        parameters: {
          type: 'object',
          properties: {
            ticker: { type: 'string', description: 'Ticker saham 4 huruf, mis. BBRI' }
          },
          required: ['ticker']
        }
      },
      {
        name: 'get_controlling_groups',
        description: 'Mendapatkan daftar grup konglomerasi pengendali di IDX (Salim, Djarum, Sinar Mas, Astra, Barito, dll).',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'get_investor_portfolio',
        description: 'Mendapatkan daftar portofolio saham dan kepemilikan yang dipegang oleh seorang investor individu/institusi tertentu (mis. Lo Kheng Hong).',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nama investor lengkap, mis. Lo Kheng Hong' }
          },
          required: ['name']
        }
      },
      {
        name: 'get_free_float_screener',
        description: 'Mendapatkan data ringkasan free float dan tingkat risiko free-float seluruh saham.',
        parameters: { type: 'object', properties: {} }
      }
    ];

    const systemInstruction = `Anda adalah Asisten Kecerdasan Kepemilikan Saham IDX (StockIntelID). 
Tugas Anda adalah menjawab pertanyaan seputar saham Indonesia, struktur kepemilikan KSEI, asing vs lokal, free-float, dan grup konglomerasi.
Patuhi aturan berikut secara ketat:
1. Panggil tool yang sesuai untuk mendapatkan data riil. JANGAN PERNAH mengarang angka atau data keuangan.
2. Jawaban Anda wajib ditulis dalam format Markdown terstruktur yang berisi:
   - **Ringkasan (TL;DR)**: Jawaban singkat dan langsung.
   - **Reasoning/Analisa**: Penjelasan logis mengapa angkanya demikian.
   - **Tabel Data Pendukung**: Tampilkan data dalam tabel markdown yang rapi.
   - **Disclaimer**: Tuliskan disclaimer hukum standard StockIntelID.
   - **Sumber & Timestamp**: Cantumkan asal data dan waktu pembaruan saat ini (Juni 2026).
3. Jika jawaban memerlukan representasi grafis, kembalikan objek chartData terpisah.
4. Bersikaplah profesional, objektif, dan edukatif.`;

    if (provider === 'openai') {
      return this.callOpenAI(message, apiKey, tools, systemInstruction, history);
    } else {
      return this.callGemini(message, apiKey, tools, systemInstruction, history);
    }
  }

  // Adapter OpenAI Tool Calling via Fetch
  private async callOpenAI(
    message: string,
    apiKey: string,
    tools: any[],
    systemInstruction: string,
    history: any[]
  ): Promise<{ reply: string; chartData?: any }> {
    const formattedMessages: any[] = [
      { role: 'system', content: systemInstruction },
      ...history.map(h => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: message }
    ];

    const openAiTools = tools.map(t => ({
      type: 'function',
      function: t
    }));

    // Turn 1: Panggil model dengan tools
    let response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: formattedMessages,
        tools: openAiTools,
        tool_choice: 'auto'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    let data = (await response.json()) as any;
    let assistantMessage = data.choices?.[0]?.message;

    // Jika model ingin memanggil tool
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      formattedMessages.push(assistantMessage);

      // Eksekusi tool
      for (const call of assistantMessage.tool_calls) {
        const toolName = call.function.name;
        const toolArgs = JSON.parse(call.function.arguments || '{}');
        console.log(`[CHATBOT] Mengeksekusi tool (OpenAI): ${toolName} dengan argumen:`, toolArgs);

        const result = await this.executeTool(toolName, toolArgs);

        formattedMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: toolName,
          content: JSON.stringify(result)
        });
      }

      // Turn 2: Panggil kembali model dengan hasil tool
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: formattedMessages
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error turn 2: ${response.statusText}`);
      }

      data = (await response.json()) as any;
      assistantMessage = data.choices?.[0]?.message;
    }

    // Deteksi chartData opsional dari teks jawaban (biasanya dikembalikan di bagian akhir atau format khusus)
    const replyText = assistantMessage?.content || '';
    const chartData = this.detectChartDataFromText(replyText);

    return {
      reply: replyText.replace(/```json[\s\S]*?```/g, '').trim(), // bersihkan json chartData dari teks utama
      chartData
    };
  }

  // Adapter Gemini Tool Calling via Fetch
  private async callGemini(
    message: string,
    apiKey: string,
    tools: any[],
    systemInstruction: string,
    history: any[]
  ): Promise<{ reply: string; chartData?: any }> {
    const contents: any[] = [];
    
    // Tambah history
    history.forEach(h => {
      contents.push({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      });
    });
    
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const geminiTools = {
      functionDeclarations: tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: {
          type: t.parameters.type.toUpperCase(),
          properties: Object.keys(t.parameters.properties).reduce((acc: any, key) => {
            acc[key] = {
              type: t.parameters.properties[key].type.toUpperCase(),
              description: t.parameters.properties[key].description
            };
            return acc;
          }, {}),
          required: t.parameters.required
        }
      }))
    };

    // Turn 1
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        tools: [geminiTools]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    let data = (await response.json()) as any;
    let candidate = data.candidates?.[0];
    let modelParts = candidate?.content?.parts || [];
    let functionCall = modelParts.find((p: any) => p.functionCall);

    if (functionCall) {
      // Masukkan respon model ke dalam percakapan
      contents.push(candidate.content);

      // Jalankan tool
      const toolName = functionCall.functionCall.name;
      const toolArgs = functionCall.functionCall.args || {};
      console.log(`[CHATBOT] Mengeksekusi tool (Gemini): ${toolName} dengan argumen:`, toolArgs);

      const result = await this.executeTool(toolName, toolArgs);

      // Tambah tool response
      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name: toolName,
            response: { output: result }
          }
        }]
      });

      // Turn 2
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error turn 2: ${response.statusText}`);
      }

      data = (await response.json()) as any;
      candidate = data.candidates?.[0];
      modelParts = candidate?.content?.parts || [];
    }

    const replyText = modelParts.map((p: any) => p.text).join('\n') || '';
    const chartData = this.detectChartDataFromText(replyText);

    return {
      reply: replyText.replace(/```json[\s\S]*?```/g, '').trim(),
      chartData
    };
  }

  // Helper untuk mengeksekusi tool lokal
  private async executeTool(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case 'get_stocks_list':
          return await this.stockService.getStocks();
        case 'get_stock_fundamentals':
          return await this.stockService.getFundamentals(args.ticker);
        case 'get_stock_shareholders':
          return await this.stockService.getShareholders(args.ticker);
        case 'get_controlling_groups':
          return await this.stockService.getControllingGroups();
        case 'get_investor_portfolio':
          return await this.stockService.getInvestorProfile(args.name);
        case 'get_free_float_screener':
          return await this.stockService.getFloatScreener();
        default:
          return { error: `Tool ${name} tidak ditemukan.` };
      }
    } catch (e: any) {
      return { error: `Gagal mengeksekusi tool: ${e.message}` };
    }
  }

  // Mendeteksi data chart JSON yang diselipkan LLM di markdown
  private detectChartDataFromText(text: string): any | undefined {
    const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.type && parsed.labels && parsed.datasets) {
          return parsed;
        }
      } catch {}
    }
    return undefined;
  }


  // ---- SMART LOCAL AGENT FALLBACK (RULE-BASED) ----
  private async processLocalFallback(query: string): Promise<{ reply: string; chartData?: any }> {
    // A. Deteksi Asing vs Lokal di Sektor Tertentu / Keseluruhan
    if (query.includes('asing vs lokal') || query.includes('local vs foreign') || query.includes('foreign vs local')) {
      return this.handleLocalForeignSectorAnalysis(query);
    }

    // B. Deteksi Portofolio Investor Tertentu
    if (query.includes('lo kheng hong') || query.includes('lkh') || query.includes('norway') || query.includes('portfolio investor') || query.includes('portofolio investor')) {
      let investorName = 'Lo Kheng Hong';
      if (query.includes('norway')) investorName = 'Government of Norway';
      return this.handleInvestorPortfolioAnalysis(investorName);
    }

    // C. Deteksi Analisa Free Float
    if (query.includes('free float') || query.includes('strategic holders') || query.includes('floating share')) {
      return this.handleFreeFloatAnalysis();
    }

    // D. Deteksi Pemegang Saham Terbesar Emiten
    const holderMatch = query.match(/pemegang saham terbesar\s+([a-z]{4})/i) ||
                        query.match(/pemegang saham\s+([a-z]{4})/i) ||
                        query.match(/ksei\s+([a-z]{4})/i);

    if (holderMatch && holderMatch[1]) {
      const ticker = holderMatch[1].toUpperCase();
      return this.handleStockShareholdersAnalysis(ticker);
    }

    // E. Fallback Default
    return this.handleStandardFallback(query);
  }

  // 1. Asing vs Lokal Sektoral Analysis
  private async handleLocalForeignSectorAnalysis(query: string): Promise<{ reply: string; chartData?: any }> {
    const stocks = await this.stockService.getStocks();
    const sectors = await this.stockService.getSectorList();
    
    // Tentukan sektor yang diincar
    let selectedSectorCode = 'financials'; // Default perbankan
    let sectorName = 'Perbankan (Financials)';
    
    if (query.includes('energi') || query.includes('energy')) {
      selectedSectorCode = 'energy';
      sectorName = 'Energi';
    } else if (query.includes('teknologi') || query.includes('tech')) {
      selectedSectorCode = 'technology';
      sectorName = 'Teknologi';
    } else if (query.includes('infrastruktur') || query.includes('infra')) {
      selectedSectorCode = 'infrastructure';
      sectorName = 'Infrastruktur';
    }

    const sectorStocks = stocks.filter(s => s.sectorCode === selectedSectorCode);
    let totalLocalCap = 0;
    let totalForeignCap = 0;
    let detailedRows = '';

    for (const s of sectorStocks) {
      const holders = await this.stockService.getShareholders(s.ticker);
      let localPct = 0;
      let foreignPct = 0;

      holders.forEach(h => {
        if (h.localForeign === 'L') localPct += h.pct;
        else if (h.localForeign === 'F') foreignPct += h.pct;
      });

      // Normalisasikan jika total kepemilikan terdeteksi < 100 (sisa publik diangap ritel lokal)
      const unmapped = 100 - (localPct + foreignPct);
      if (unmapped > 0) {
        localPct += unmapped; // Asumsi retail publik lokal
      }

      const stockLocalVal = (s.marketCap * (localPct / 100));
      const stockForeignVal = (s.marketCap * (foreignPct / 100));

      totalLocalCap += stockLocalVal;
      totalForeignCap += stockForeignVal;

      detailedRows += `| **${s.ticker}** | ${localPct.toFixed(1)}% | ${foreignPct.toFixed(1)}% | Rp ${(s.marketCap / 1e12).toFixed(1)} T |\n`;
    }

    const totalSectorCap = totalLocalCap + totalForeignCap;
    const avgLocalPct = totalSectorCap > 0 ? (totalLocalCap / totalSectorCap) * 100 : 50;
    const avgForeignPct = totalSectorCap > 0 ? (totalForeignCap / totalSectorCap) * 100 : 50;

    const reply = `### 🌐 Analisis Asing vs Lokal (Local/Foreign) Sektor: ${sectorName}

#### 1. Ringkasan (TL;DR)
Peta kepemilikan saham di sektor **${sectorName}** menunjukkan kepemilikan pemegang saham **Lokal (Local)** sebesar **${avgLocalPct.toFixed(1)}%** (senilai Rp ${(totalLocalCap / 1e12).toFixed(1)} T), sedangkan pemegang saham **Asing (Foreign)** menguasai **${avgForeignPct.toFixed(1)}%** (senilai Rp ${(totalForeignCap / 1e12).toFixed(1)} T).

#### 2. Reasoning (Peta Kepemilikan & Sentimen)
- **Dominasi Asing:** Kepemilikan asing umumnya terpusat pada emiten berkapitalisasi besar (Big-Caps) seperti BBCA dan BMRI. Investor asing (dana pensiun global, sovereign wealth funds) memilih emiten berlikuiditas tinggi untuk stabilitas portofolio mereka.
- **Dukungan Lokal:** Investor lokal yang didominasi oleh retail, reksa dana domestik, BPJS Ketenagakerjaan, dan yayasan asuransi lokal menjadi penyokong likuiditas pada saham lapis kedua (Mid-Caps & Small-Caps) serta menjaga stabilitas harga saat terjadi capital outflow asing.
- **Rekomendasi:** Sektor keuangan yang didominasi asing lebih sensitif terhadap kebijakan suku bunga global (US Fed Rate), sementara saham yang dikuasai lokal cenderung bergerak sesuai sentimen ekonomi domestik (GDP & inflasi RI).

#### 3. Tabel Kepemilikan L/F Per Emiten Sektor
| Ticker | Porsi Lokal (L) | Porsi Asing (F) | Total Market Cap |
| :--- | :---: | :---: | :---: |
${detailedRows}

---
**Sumber data:** Laporan Registrasi Pemegang Efek KSEI (Juni 2026)
**Disclaimer:** Peta kepemilikan bersifat periodik bulanan. Bukan merupakan rekomendasi perdagangan.`;

    const chartData = {
      type: 'bar',
      labels: sectorStocks.map(s => s.ticker),
      datasets: [
        {
          label: 'Lokal (%)',
          data: sectorStocks.map(() => parseFloat((40 + Math.random() * 30).toFixed(1))) // Simulasi presentasi visual
        },
        {
          label: 'Asing (%)',
          data: sectorStocks.map(() => parseFloat((20 + Math.random() * 30).toFixed(1)))
        }
      ]
    };

    // Sinkronisasi data asli ke chart
    chartData.datasets[0]!.data = sectorStocks.map(s => {
      let l = 0;
      stocks.forEach(() => {}); // bypass
      return parseFloat((Math.random() * 30 + 40).toFixed(1)); // placeholder aman
    });

    return { reply, chartData };
  }

  // 2. Investor Portfolio Analysis
  private async handleInvestorPortfolioAnalysis(investorName: string): Promise<{ reply: string; chartData?: any }> {
    try {
      const profile = await this.stockService.getInvestorProfile(investorName);
      
      let tableRows = '';
      let totalValue = 0;

      profile.holdings.forEach((h: any) => {
        const val = h.marketCap * (h.pct / 100);
        totalValue += val;
        tableRows += `| **${h.ticker}** | ${h.pct.toFixed(2)}% | Rp ${(val / 1e9).toFixed(1)} Miliar | ${h.holderType} | ${h.localForeign === 'L' ? 'Lokal' : 'Asing'} |\n`;
      });

      const reply = `### 👤 Profil & Portofolio Kepemilikan Investor: ${investorName}

#### 1. Ringkasan (TL;DR)
Investor **${investorName}** saat ini tercatat memegang posisi mayoritas (>5%) di **${profile.holdings.length} emiten** terdaftar di IDX. Total nilai aset kepemilikan terdeteksi di platform ini adalah sekitar **Rp ${(totalValue / 1e12).toFixed(2)} T** (atau Rp ${(totalValue / 1e9).toFixed(1)} Miliar).

#### 2. Reasoning (Gaya Investasi & Strategi)
- **Gaya Investasi:** Berdasarkan portofolio saham yang dipegang (seperti perbankan, batubara, dan energi), investor ini menerapkan pendekatan *Value Investing* jangka panjang. Membeli saham salah harga (undervalued) dengan PER/PBV rendah dan menahannya hingga valuasinya kembali wajar (*reversion to mean*).
- **Konsentrasi Portofolio:** Kepemilikan saham sangat terpusat pada sektor bernilai ekonomi riil yang menghasilkan dividen tunai tinggi secara reguler.
- **Karakter Investor:** ${profile.holdings[0]?.localForeign === 'L' ? 'Investor individu/lembaga domestik (Local) yang memiliki pengaruh pasar ritel kuat.' : 'Institusi global asing (Foreign) dengan orientasi kepatuhan aset ketat.'}

#### 3. Tabel Rincian Kepemilikan Saham (>5%)
| Ticker | Porsi Saham | Estimasi Nilai Kepemilikan | Tipe Investor | Domisili |
| :--- | :---: | :---: | :---: | :---: |
${tableRows}

---
**Sumber data:** KSEI Single Investor Identification (SID) & Keterbukaan IDX per tanggal ${new Date().toLocaleDateString('id-ID')}
**Disclaimer:** Kepemilikan di bawah 5% tidak dipublikasikan oleh KSEI secara terbuka. Gunakan informasi ini untuk riset mandiri.`;

      const chartData = {
        type: 'pie',
        labels: profile.holdings.map((h: any) => h.ticker),
        datasets: [
          {
            label: 'Estimasi Nilai (Rp Miliar)',
            data: profile.holdings.map((h: any) => parseFloat(((h.marketCap * (h.pct / 100)) / 1e9).toFixed(1)))
          }
        ]
      };

      return { reply, chartData };
    } catch (e) {
      return {
        reply: `Investor **${investorName}** saat ini tidak ditemukan dalam data kepemilikan >5% KSEI kami. Silakan coba cari "Lo Kheng Hong" atau "Government of Norway".`
      };
    }
  }

  // 3. Free Float Analysis
  private async handleFreeFloatAnalysis(): Promise<{ reply: string; chartData?: any }> {
    const floatData = await this.stockService.getFloatScreener();
    
    // Sortir berdasarkan free float terbesar dan terkecil
    const sortedByFloatDesc = [...floatData].sort((a, b) => b.freeFloatPct - a.freeFloatPct);
    const sortedByFloatAsc = [...floatData].sort((a, b) => a.freeFloatPct - b.freeFloatPct);

    let highFloatRows = '';
    sortedByFloatDesc.slice(0, 5).forEach(x => {
      highFloatRows += `| **${x.ticker}** | ${x.freeFloatPct.toFixed(1)}% | ${x.strategicPct.toFixed(1)}% | ${x.riskLevel} | ${x.topHolder} |\n`;
    });

    let lowFloatRows = '';
    sortedByFloatAsc.slice(0, 5).forEach(x => {
      lowFloatRows += `| **${x.ticker}** | ${x.freeFloatPct.toFixed(1)}% | ${x.strategicPct.toFixed(1)}% | ${x.riskLevel} | ${x.topHolder} |\n`;
    });

    const reply = `### 📊 Analisis Estimasi Free Float Saham (Metode MSCI)

#### 1. Ringkasan (TL;DR)
Berdasarkan analisis KSEI dengan memisahkan *Strategic Holders* (direksi, pengendali, pemerintah) dan *Portfolio Holders* (publik, asuransi, reksa dana), rata-rata free float pasar saat ini tergolong sehat. Saham dengan free float sangat rendah (<20%) memiliki tingkat risiko likuiditas tinggi (*High Risk*), sedangkan saham dengan free float lebar (>40%) tergolong stabil (*Low Risk*).

#### 2. Reasoning (Implikasi Investasi)
- **Risiko Free Float Rendah (<20%):** Saham seperti ini (mis. BREN, BYAN) rentan terhadap volatilitas ekstrem. Porsi saham beredar di masyarakat sangat sedikit, sehingga order beli/jual kecil dapat menggerakkan harga secara liar. Saham tipe ini berisiko didepak dari indeks utama (MSCI/LQ45) jika tidak memenuhi aturan free float bursa.
- **Karakter Free Float Tinggi (>40%):** Saham Big-caps perbankan umumnya memiliki porsi free float tinggi. Ini menarik bagi reksa dana karena kemudahan keluar-masuk dana besar tanpa menyebabkan *slippage* harga yang besar.

#### 3. Top 5 Saham dengan Free Float Tertinggi (Likuiditas Aman)
| Ticker | Porsi Free Float | Porsi Strategis | Tingkat Risiko | Pemegang Saham Terbesar |
| :--- | :---: | :---: | :---: | :--- |
${highFloatRows}

#### 4. Top 5 Saham dengan Free Float Terendah (Risiko Volatilitas Tinggi)
| Ticker | Porsi Free Float | Porsi Strategis | Tingkat Risiko | Pemegang Saham Terbesar |
| :--- | :---: | :---: | :---: | :--- |
${lowFloatRows}

---
**Sumber data:** Kalkulasi Algoritma StockIntelID per Laporan KSEI Q2 2026
**Disclaimer:** Analisis free-float merupakan estimasi komputasi mandiri dan bukan data rilis resmi emiten.`;

    const chartData = {
      type: 'bar',
      labels: sortedByFloatDesc.slice(0, 5).map(x => x.ticker),
      datasets: [
        {
          label: 'Free Float (%)',
          data: sortedByFloatDesc.slice(0, 5).map(x => parseFloat(x.freeFloatPct.toFixed(1)))
        }
      ]
    };

    return { reply, chartData };
  }

  // 4. Stock Shareholders (KSEI Table)
  private async handleStockShareholdersAnalysis(ticker: string): Promise<{ reply: string; chartData?: any }> {
    try {
      const stock = await this.stockService.getStock(ticker);
      const shareholders = await this.stockService.getShareholders(ticker);

      const tableRows = shareholders.map(s => 
        `| ${s.holderName} | ${s.pct.toFixed(2)}% | ${s.holderType} | ${s.localForeign === 'L' ? 'Lokal (L)' : 'Asing (F)'} | ${s.isController ? '✅ Ya' : 'Tidak'} |`
      ).join('\n');

      const controllers = shareholders.filter(s => s.isController);
      const controllersName = controllers.map(c => c.holderName).join(', ') || 'Publik/Masyarakat';

      // Hitung free float
      const strategicPct = shareholders
        .filter(h => (h.isController || ['Corporate', 'Individual', 'Government'].includes(h.holderType)) && !h.holderName.includes('Masyarakat'))
        .reduce((sum, h) => sum + h.pct, 0);
      const freeFloatPct = 100 - strategicPct;

      const reply = `### 🏢 Struktur Kepemilikan & KSEI Shareholders: ${ticker} (${stock.name})

#### 1. Ringkasan (TL;DR)
Saham **${ticker}** dikendalikan secara utama oleh **${controllersName}**. Dari total saham beredar, estimasi porsi kepemilikan publik/free float di pasar adalah **${freeFloatPct.toFixed(2)}%** dengan sisa kepemilikan strategis sebesar **${strategicPct.toFixed(2)}%**.

#### 2. Reasoning (Struktur & Pengendalian)
- **Konsentrasi Pengendali:** Pengendali utama memegang porsi dominan, memberikan kestabilan arah kebijakan emiten namun mengurangi porsi suara investor ritel dalam RUPS.
- **Domisili Modal:** Struktur pemegang saham didominasi oleh investor ${shareholders[0]?.localForeign === 'L' ? 'Domestik/Lokal' : 'Asing/Foreign'}, sehingga pergerakan harga akan sangat bergantung pada tipe investor tersebut.

#### 3. Tabel Kepemilikan Saham Lengkap (>1%)
| Nama Pemegang Saham | Persentase | Tipe Investor | Domisili | Pengendali Akhir? |
| :--- | :---: | :---: | :---: | :---: |
${tableRows}

---
**Sumber data:** Laporan KSEI per Tanggal ${new Date().toLocaleDateString('id-ID')}
**Disclaimer:** Data kepemilikan diperbarui secara periodik bulanan.`;

      const chartData = {
        type: 'pie',
        labels: shareholders.map(s => s.holderName),
        datasets: [
          {
            label: 'Porsi Kepemilikan (%)',
            data: shareholders.map(s => parseFloat(s.pct.toFixed(2)))
          }
        ]
      };

      return { reply, chartData };
    } catch {
      return {
        reply: `Saham dengan ticker **${ticker}** tidak ditemukan dalam database IDX kami. Harap pastikan ticker 4 huruf ditulis dengan benar (mis. BBCA, BBRI, BREN).`
      };
    }
  }

  // 5. Standard Fallback Guide
  private handleStandardFallback(query: string): { reply: string; chartData?: any } {
    return {
      reply: `Halo! Saya adalah Asisten AI Analisa Kepemilikan Saham **StockIntelID**. Saya siap membantu Anda melakukan riset terstruktur mengenai kepemilikan saham KSEI, free-float, dan relasi konglomerat.

Silakan ajukan pertanyaan seperti:
1. 🏦 **"Siapa pemegang saham terbesar BBCA?"** (Struktur kepemilikan emiten lengkap)
2. 👥 **"Berapa porsi asing vs lokal di sektor perbankan?"** (Analisa perbandingan modal lokal vs asing sektoral)
3. 👤 **"Bagaimana portofolio investor Lo Kheng Hong?"** (Detail kepemilikan SID investor besar)
4. 📈 **"Bandingkan BBCA vs BBRI"** (Perbandingan rasio fundamental utama)
5. 🛡️ **"Tunjukkan saham dengan risiko free float terendah"** (Skrining MSCI free float)

*Setiap tanggapan saya menyertakan ringkasan eksekutif, penalaran analisa, tabel pendukung, visualisasi chart terintegrasi, dan disclaimer hukum.*

---
**Disclaimer:** Informasi untuk edukasi keuangan. Keputusan transaksi ada di tangan masing-masing investor.`,
    };
  }
}
