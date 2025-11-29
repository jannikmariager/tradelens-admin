/**
 * Discord Trading Signals Integration
 * Posts AI-generated trading signals to Discord channel via webhook
 */

export interface TradingSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL';
  confidence: number; // 0-100
  currentPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  timeframe: string;
  reasons: string[];
  correctionRisk?: number;
  smcData?: {
    orderBlocks?: string[];
    fairValueGaps?: string[];
    liquidityZones?: string[];
  };
}

/**
 * Format trading signal as Discord embed message
 */
function formatSignalEmbed(signal: TradingSignal) {
  const signalColors = {
    BUY: 0x00ff00,      // Green
    SELL: 0xff0000,     // Red
    HOLD: 0xffff00,     // Yellow
    NEUTRAL: 0x808080,  // Gray
  };

  const signalEmojis = {
    BUY: '🟢',
    SELL: '🔴',
    HOLD: '🟡',
    NEUTRAL: '⚪',
  };

  const color = signalColors[signal.signal];
  const emoji = signalEmojis[signal.signal];

  // Build description with key info
  let description = `**Current Price:** $${signal.currentPrice.toFixed(2)}\n`;
  description += `**Confidence:** ${signal.confidence}%\n`;
  description += `**Timeframe:** ${signal.timeframe}\n`;

  if (signal.targetPrice) {
    description += `**Target:** $${signal.targetPrice.toFixed(2)}\n`;
  }
  if (signal.stopLoss) {
    description += `**Stop Loss:** $${signal.stopLoss.toFixed(2)}\n`;
  }
  if (signal.correctionRisk !== undefined) {
    description += `**Correction Risk:** ${signal.correctionRisk}%\n`;
  }

  // Add reasoning
  if (signal.reasons.length > 0) {
    description += `\n**Analysis:**\n`;
    signal.reasons.forEach(reason => {
      description += `• ${reason}\n`;
    });
  }

  // Add SMC data if available
  if (signal.smcData) {
    const smcParts = [];
    if (signal.smcData.orderBlocks?.length) {
      smcParts.push(`OB: ${signal.smcData.orderBlocks.join(', ')}`);
    }
    if (signal.smcData.fairValueGaps?.length) {
      smcParts.push(`FVG: ${signal.smcData.fairValueGaps.join(', ')}`);
    }
    if (signal.smcData.liquidityZones?.length) {
      smcParts.push(`LIQ: ${signal.smcData.liquidityZones.join(', ')}`);
    }
    
    if (smcParts.length > 0) {
      description += `\n**SMC Levels:**\n${smcParts.join(' | ')}`;
    }
  }

  return {
    embeds: [{
      title: `${emoji} ${signal.signal} Signal: ${signal.symbol}`,
      description,
      color,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'TradeLens AI • Not financial advice',
      },
    }],
  };
}

/**
 * Post trading signal to Discord channel
 */
export async function postTradingSignal(signal: TradingSignal): Promise<boolean> {
  try {
    const webhookUrl = process.env.DISCORD_SIGNALS_WEBHOOK;
    
    if (!webhookUrl) {
      console.error('DISCORD_SIGNALS_WEBHOOK not configured');
      return false;
    }

    const payload = formatSignalEmbed(signal);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to post signal to Discord:', response.statusText);
      return false;
    }

    console.log(`✅ Posted ${signal.signal} signal for ${signal.symbol} to Discord`);
    return true;
  } catch (error) {
    console.error('Error posting signal to Discord:', error);
    return false;
  }
}

/**
 * Post multiple signals as a batch
 */
export async function postSignalsBatch(signals: TradingSignal[]): Promise<void> {
  if (signals.length === 0) return;

  // Post signals with 1 second delay to avoid rate limiting
  for (const signal of signals) {
    await postTradingSignal(signal);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Post daily market summary to Discord
 */
export async function postDailySummary(summary: {
  totalSignals: number;
  buySignals: number;
  sellSignals: number;
  topPerformers: string[];
  marketSentiment: string;
}): Promise<boolean> {
  try {
    const webhookUrl = process.env.DISCORD_SIGNALS_WEBHOOK;
    
    if (!webhookUrl) {
      console.error('DISCORD_SIGNALS_WEBHOOK not configured');
      return false;
    }

    const payload = {
      embeds: [{
        title: '📊 Daily Trading Summary',
        description: `Market analysis for ${new Date().toLocaleDateString()}`,
        color: 0x3b82f6, // Blue
        fields: [
          {
            name: '🎯 Signals Generated',
            value: summary.totalSignals.toString(),
            inline: true,
          },
          {
            name: '🟢 Buy Signals',
            value: summary.buySignals.toString(),
            inline: true,
          },
          {
            name: '🔴 Sell Signals',
            value: summary.sellSignals.toString(),
            inline: true,
          },
          {
            name: '🏆 Top Performers',
            value: summary.topPerformers.join(', ') || 'None',
            inline: false,
          },
          {
            name: '💭 Market Sentiment',
            value: summary.marketSentiment,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'TradeLens AI',
        },
      }],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Error posting daily summary to Discord:', error);
    return false;
  }
}
