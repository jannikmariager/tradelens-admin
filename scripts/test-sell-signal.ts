/**
 * Test SELL signal format
 * Run with: DISCORD_SIGNALS_WEBHOOK="..." npx tsx scripts/test-sell-signal.ts
 */

import 'dotenv/config';
import { postTradingSignal } from '../lib/discord-signals';

async function testSellSignal() {
  console.log('🧪 Testing SELL signal...\n');

  const testSignal = {
    symbol: 'TSLA',
    signal: 'SELL' as const,
    confidence: 78,
    currentPrice: 242.50,
    targetPrice1: 235.00,
    targetPrice2: 230.00,
    stopLoss: 247.00,
    timeframe: '4h',
    reasons: [
      'Bearish order block rejection at $245',
      'Breaking below key FVG support zone',
      'Volume spike on downside breakdown',
      'Market structure showing lower lows',
    ],
    correctionRisk: 22,
    entryRange: '$242-$243',
    trigger: 'Break below $241 with momentum',
    smcData: {
      orderBlocks: ['$245.50', '$248.20'],
      fairValueGaps: ['$239.00-$241.00'],
      liquidityZones: ['$252.00'],
    },
  };

  console.log('📊 Sending SELL signal:', testSignal.symbol);
  console.log(`   Signal: ${testSignal.signal}`);
  console.log(`   Confidence: ${testSignal.confidence}%`);
  console.log(`   Price: $${testSignal.currentPrice}\n`);

  const success = await postTradingSignal(testSignal);

  if (success) {
    console.log('✅ Success! Check your Discord #trade-signals channel');
  } else {
    console.log('❌ Failed to post signal');
  }
}

testSellSignal().catch(console.error);
