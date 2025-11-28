import { createClient } from './supabase/server';

export interface DiscordStats {
  totalMembers: number;
  activeMembers: number;
  totalMessages: number;
  newMembersToday: number;
  messagesGrowth: number;
}

export interface DiscordActivity {
  date: string;
  messages: number;
  activeUsers: number;
}

/**
 * Get Discord server stats from discord_activity table
 */
export async function getDiscordStats(): Promise<DiscordStats> {
  try {
    const supabase = await createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's stats
    const { data: todayData } = await supabase
      .from('discord_activity')
      .select('*')
      .gte('timestamp', today.toISOString())
      .single();

    // Get yesterday's stats for growth calculation
    const { data: yesterdayData } = await supabase
      .from('discord_activity')
      .select('*')
      .gte('timestamp', yesterday.toISOString())
      .lt('timestamp', today.toISOString())
      .single();

    // Get total members (assuming we track this)
    const { count: totalMembers } = await supabase
      .from('discord_activity')
      .select('member_count', { count: 'exact', head: true });

    // Calculate message growth
    const todayMessages = todayData?.message_count || 0;
    const yesterdayMessages = yesterdayData?.message_count || 1;
    const messagesGrowth = ((todayMessages - yesterdayMessages) / yesterdayMessages) * 100;

    return {
      totalMembers: todayData?.member_count || 0,
      activeMembers: todayData?.active_member_count || 0,
      totalMessages: todayMessages,
      newMembersToday: (todayData?.member_count || 0) - (yesterdayData?.member_count || 0),
      messagesGrowth: Math.round(messagesGrowth * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching Discord stats:', error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      totalMessages: 0,
      newMembersToday: 0,
      messagesGrowth: 0,
    };
  }
}

/**
 * Get Discord activity chart data for the last 30 days
 */
export async function getDiscordActivityChart(): Promise<DiscordActivity[]> {
  try {
    const supabase = await createClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from('discord_activity')
      .select('*')
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: true });

    if (!data) return [];

    // Group by day
    const groupedByDay = new Map<string, { messages: number; activeUsers: number }>();

    data.forEach((record) => {
      const date = new Date(record.timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      const existing = groupedByDay.get(date) || { messages: 0, activeUsers: 0 };
      groupedByDay.set(date, {
        messages: existing.messages + (record.message_count || 0),
        activeUsers: Math.max(existing.activeUsers, record.active_member_count || 0),
      });
    });

    return Array.from(groupedByDay.entries()).map(([date, stats]) => ({
      date,
      messages: stats.messages,
      activeUsers: stats.activeUsers,
    }));
  } catch (error) {
    console.error('Error fetching Discord activity chart:', error);
    return [];
  }
}

/**
 * Get top Discord channels by activity
 */
export async function getTopDiscordChannels(): Promise<Array<{
  channel: string;
  messages: number;
  activeUsers: number;
}>> {
  try {
    const supabase = await createClient();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // This assumes we have channel-level data in discord_activity
    // If not, this will return empty array
    const { data } = await supabase
      .from('discord_activity')
      .select('channel_name, message_count, active_member_count')
      .gte('timestamp', sevenDaysAgo.toISOString())
      .order('message_count', { ascending: false })
      .limit(10);

    if (!data) return [];

    // Group by channel
    const channelMap = new Map<string, { messages: number; activeUsers: number }>();

    data.forEach((record) => {
      const channel = record.channel_name || 'General';
      const existing = channelMap.get(channel) || { messages: 0, activeUsers: 0 };
      channelMap.set(channel, {
        messages: existing.messages + (record.message_count || 0),
        activeUsers: Math.max(existing.activeUsers, record.active_member_count || 0),
      });
    });

    return Array.from(channelMap.entries())
      .map(([channel, stats]) => ({
        channel,
        messages: stats.messages,
        activeUsers: stats.activeUsers,
      }))
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 10);
  } catch (error) {
    console.error('Error fetching top Discord channels:', error);
    return [];
  }
}

/**
 * Send a message to Discord via webhook
 */
export async function sendDiscordNotification(message: string, webhookUrl?: string): Promise<boolean> {
  try {
    const url = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
    if (!url) {
      console.error('Discord webhook URL not configured');
      return false;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message,
        username: 'TradeLens Admin',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    return false;
  }
}
