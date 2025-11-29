/**
 * Test script to verify Discord trading signals webhook
 * Run with: npx tsx scripts/test-discord-signal.ts
 */

import 'dotenv/config';
import { postTradingSignal } from '../lib/discord-signals';

async function testDiscordSignal() {
  console.log('🧪 Testing Discord webhook...\n');

  const testSignal = {
    symbol: 'AAPL',
    signal: 'BUY' as const,
    confidence: 85,
    currentPrice: 182.45,
    targetPrice1: 186.00,
    targetPrice2: 188.00,
    stopLoss: 179.50,
    timeframe: '1h',
    reasons: [
      'Strong bullish order block at $180',
      'Fair Value Gap aligning with support level',
      'Volume increasing on uptrend',
      'RSI showing strong momentum',
    ],
    correctionRisk: 15,
    entryRange: '$182-$183',
    trigger: 'Break above $183 with volume confirmation',
    smcData: {
      orderBlocks: ['$180.20', '$178.50'],
      fairValueGaps: ['$181.00-$182.00'],
      liquidityZones: ['$177.00'],
    },
  };

  console.log('📊 Sending test signal:', testSignal.symbol);
  console.log(`   Signal: ${testSignal.signal}`);
  console.log(`   Confidence: ${testSignal.confidence}%`);
  console.log(`   Price: $${testSignal.currentPrice}\n`);

  const success = await postTradingSignal(testSignal);

  if (success) {
    console.log('✅ Success! Check your Discord #trade-signals channel');
  } else {
    console.log('❌ Failed to post signal');
    console.log('   Make sure DISCORD_SIGNALS_WEBHOOK is set in .env.local');
  }
}

// Run the test
testDiscordSignal().catch(console.error);
