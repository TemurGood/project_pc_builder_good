require('./env');

function getTelegramConfig() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    botName: process.env.TELEGRAM_BOT_NAME || 'good_pc_builder_bot'
  };
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatUzs(amount) {
  if (!amount && amount !== 0) return '0 сум';
  return `${Number(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} сум`;
}

async function resolveFallbackChatId(baseUrl, configuredChatId) {
  try {
    const res = await fetch(`${baseUrl}/getUpdates`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
      for (let i = data.result.length - 1; i >= 0; i--) {
        const chat = data.result[i]?.message?.chat || data.result[i]?.my_chat_member?.chat;
        if (chat?.id) {
          return String(chat.id);
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return String(configuredChatId);
}

/**
 * Send order notification and attached payment receipt (image or PDF) to Telegram manager chat
 */
async function sendOrderToTelegram({ order, fileBuffer, fileName, mimeType }) {
  const { botToken, chatId, botName } = getTelegramConfig();
  if (!botToken || !chatId) {
    return { ok: false, error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID' };
  }

  let itemsList = [];
  try {
    itemsList = typeof order.items_json === 'string' ? JSON.parse(order.items_json) : (order.items_json || []);
  } catch (e) {
    itemsList = [];
  }

  const itemsText = itemsList
    .map((item, idx) => {
      const qty = item.quantity || 1;
      const linePrice = formatUzs((item.price_uzs || 0) * qty);
      let line = `${idx + 1}. ${escapeHtml(item.name_ru || item.model || item.id)} × ${qty} — ${linePrice}`;
      if (item.isCustomBuild && item.buildDetails) {
        const partsSummary = Object.entries(item.buildDetails)
          .filter(([, part]) => Boolean(part))
          .map(([slot, part]) => `   • ${escapeHtml(slot.toUpperCase())}: ${escapeHtml(part.name_ru || part.model)}`)
          .join('\n');
        if (partsSummary) {
          line += `\n${partsSummary}`;
        }
      }
      return line;
    })
    .join('\n')
    .slice(0, 500);

  const captionLines = [
    `🖥 <b>НОВЫЙ ЗАКАЗ — HYPER PC MARKET</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 <b>Номер заказа:</b> <code>${escapeHtml(order.id)}</code>`,
    `👤 <b>Клиент:</b> ${escapeHtml(order.customer_name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(order.phone)}`,
    order.telegram_username
      ? `✈️ <b>Telegram:</b> @${escapeHtml(String(order.telegram_username).replace(/^@/, ''))}`
      : null,
    `💰 <b>Сумма к оплате:</b> <b>${formatUzs(order.total_uzs)}</b>`,
    `📎 <b>Чек оплаты:</b> ${escapeHtml(fileName || order.receipt_filename || 'Прикреплен')}`,
    `☁️ <b>Neon Storage Key:</b> <code>${escapeHtml(order.receipt_key || '')}</code>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🛒 <b>Состав заказа:</b>`,
    itemsText || 'Нет позиций'
  ].filter(Boolean);

  const caption = captionLines.join('\n').slice(0, 1000);
  const baseUrl = `https://api.telegram.org/bot${botToken}`;

  try {
    // If a receipt file buffer is attached, send it via sendPhoto (for images) or sendDocument (for PDF / files)
    if (fileBuffer && fileBuffer.length > 0) {
      const isImage = mimeType && /^image\/(jpeg|jpg|png|webp)$/i.test(mimeType);
      const endpoint = isImage ? `${baseUrl}/sendPhoto` : `${baseUrl}/sendDocument`;
      const fieldName = isImage ? 'photo' : 'document';

      const formData = new FormData();
      formData.append('chat_id', String(chatId));
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');

      const blob = new Blob([fileBuffer], { type: mimeType || 'application/octet-stream' });
      formData.append(fieldName, blob, fileName || (isImage ? 'receipt.jpg' : 'receipt.pdf'));

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      if (result.ok) {
        return {
          ok: true,
          method: isImage ? 'sendPhoto' : 'sendDocument',
          botName,
          chatId,
          messageId: result.result?.message_id
        };
      }

      // If chat not found, check getUpdates in case user just pressed /start with a different chat_id
      if (result.description && result.description.includes('chat not found')) {
        const discoveredChatId = await resolveFallbackChatId(baseUrl, chatId);
        if (discoveredChatId !== String(chatId)) {
          const retryForm = new FormData();
          retryForm.append('chat_id', discoveredChatId);
          retryForm.append('caption', caption);
          retryForm.append('parse_mode', 'HTML');
          retryForm.append(fieldName, blob, fileName || (isImage ? 'receipt.jpg' : 'receipt.pdf'));
          const retryRes = await fetch(endpoint, { method: 'POST', body: retryForm });
          const retryData = await retryRes.json();
          if (retryData.ok) {
            return {
              ok: true,
              method: isImage ? 'sendPhoto' : 'sendDocument',
              botName,
              chatId: discoveredChatId,
              messageId: retryData.result?.message_id
            };
          }
        }
      }

      // If sendPhoto failed (e.g. image dimensions/format), fallback to sendDocument
      if (isImage) {
        const docForm = new FormData();
        docForm.append('chat_id', String(chatId));
        docForm.append('caption', caption);
        docForm.append('parse_mode', 'HTML');
        docForm.append('document', blob, fileName || 'receipt.png');

        const docRes = await fetch(`${baseUrl}/sendDocument`, {
          method: 'POST',
          body: docForm
        });
        const docResult = await docRes.json();
        if (docResult.ok) {
          return {
            ok: true,
            method: 'sendDocument',
            botName,
            chatId,
            messageId: docResult.result?.message_id
          };
        }
        return {
          ok: false,
          botName,
          chatId,
          error: docResult.description || 'Telegram API error'
        };
      }

      return {
        ok: false,
        botName,
        chatId,
        error: result.description || 'Telegram API error'
      };
    }

    // Fallback text message if no buffer provided
    const msgRes = await fetch(`${baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: String(chatId),
        text: caption,
        parse_mode: 'HTML'
      })
    });
    const msgData = await msgRes.json();
    return {
      ok: Boolean(msgData.ok),
      method: 'sendMessage',
      botName,
      chatId,
      messageId: msgData.result?.message_id,
      error: msgData.ok ? null : (msgData.description || 'Telegram API error')
    };
  } catch (err) {
    return {
      ok: false,
      botName,
      chatId,
      error: err.message
    };
  }
}

module.exports = {
  getTelegramConfig,
  sendOrderToTelegram
};
