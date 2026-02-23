/**
 * SlackAccessor: GAS用の Slack API ラッパー
 */
class SlackAccessor {
  /**
   * コンストラクター
   * @param {string} oauthToken SlackBot の OAuthトークン (xoxb-...)
   * @param {string} channelId Slack のチャンネルID
   */
  constructor(oauthToken, channelId) {
    this.oauthToken = oauthToken;
    this.channelId = channelId;
    this.baseUrl = "https://slack.com/api/";
  }

  /**
   * シンプルなテキストメッセージを送信します。
   * @param {string} text 送信する本文
   * @param {Object} [options={}] thread_ts などの追加オプション
   */
  sendTextMessage(text, options = {}) {
    const params = {
      channel: this.channelId,
      text: text,
      ...options,
    };
    return this._request("chat.postMessage", "POST", params);
  }

  /**
   * Block Kit を使用した（リッチな）メッセージを送信します。
   * @param {Array|Object} blocks Block配列、または {blocks: []} 形式のオブジェクト
   * @param {string} [fallbackText] 通知用などのプレーンテキスト
   * @param {Object} [options={}] thread_ts などの追加オプション
   */
  sendBlockMessage(blocks, fallbackText = "アプリからの通知", options = {}) {
    const params = {
      channel: this.channelId,
      blocks: Array.isArray(blocks) ? blocks : blocks.blocks || [blocks],
      text: fallbackText,
      ...options,
    };
    return this._request("chat.postMessage", "POST", params);
  }

  /**
   * チャンネルの履歴を取得します。
   * @param {Object} [options={}] APIに渡す追加パラメータ (oldest, limit, cursorなど)
   * @returns {Object} { messages: Array, nextCursor: String|null }
   */
  getMessages(options = {}) {
    const params = {
      channel: this.channelId,
      ...options,
    };

    const content = this._request("conversations.history", "GET", params);
    if (!content.ok) {
      return { messages: [], nextCursor: null };
    }

    return {
      messages: content.messages || [],
      nextCursor: content.response_metadata?.next_cursor || null,
    };
  }

  /**
   * 特定メッセージのリアクションを取得します。
   * @param {string} timestamp メッセージのタイムスタンプ (例: "1712345678.123456")
   * @returns {Object[]|null} リアクションの配列（エラー時はnull、リアクションなしは空配列）
   */
  getReactions(timestamp) {
    const params = {
      channel: this.channelId,
      timestamp: String(timestamp),
    };

    const content = this._request("reactions.get", "GET", params);
    if (!content.ok) {
      return null;
    }

    return content.message?.reactions || [];
  }

  /**
   * ユーザーの表示名を取得します。
   * (display_name を優先し、未設定なら real_name を返します)
   * @param {string} userId ユーザーID
   * @returns {string} ユーザー表示名（取得失敗時は空文字）
   */
  getUserName(userId) {
    const params = { user: userId };
    const content = this._request("users.info", "GET", params);

    if (!content.ok || !content.user) {
      return "";
    }

    const profile = content.user.profile;
    return profile?.display_name || profile?.real_name || "Unknown User";
  }

  // ==========

  /**
   * Slack API への共通リクエストメソッド
   * @param {string} endpoint APIエンドポイント (例: 'chat.postMessage')
   * @param {'GET' | 'POST'} method HTTPメソッド
   * @param {Object} [data={}] パラメーター
   * @returns {Object} Slack APIからのレスポンスオブジェクト
   * @private
   */
  _request(endpoint, method, data = {}) {
    if (method !== "GET" && method !== "POST") {
      throw new Error(`Unsupported method: ${method}`);
    }

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v != null),
    );

    const queryString = Object.keys(cleanData)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(cleanData[key])}`)
      .join("&");
    const url =
      method === "GET" && queryString
        ? `${this.baseUrl}${endpoint}?${queryString}`
        : `${this.baseUrl}${endpoint}`;

    const options = {
      method: method,
      headers: {
        Authorization: `Bearer ${this.oauthToken}`,
      },
      muteHttpExceptions: true,
    };
    if (method === "POST") {
      options.contentType = "application/json; charset=utf-8";
      if (Object.keys(cleanData).length > 0) {
        options.payload = JSON.stringify(cleanData);
      }
    }

    try {
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();
      const headers = response.getHeaders();
      const contentText = response.getContentText();
      const content = this._safeJsonParse(contentText);

      // 429 Too Many Requests への対応
      if (statusCode === 429) {
        const retryAfter = headers["Retry-After"] || headers["retry-after"];
        console.error(`Rate limited by Slack. Retry-After: ${retryAfter}`);
        return { ok: false, error: "rate_limited", retry_after: retryAfter };
      }

      if (!content.ok) {
        console.warn(
          `Slack API Error [${endpoint}]: ${content.error || "Unknown error"}`,
        );
      }

      return content;
    } catch (e) {
      console.error(`Network or Parsing Error [${endpoint}]: ${e.message}`);
      return { ok: false, error: "request_failed", message: e.message };
    }
  }

  /** @private */
  _safeJsonParse(text) {
    try {
      return JSON.parse(text || "{}");
    } catch (e) {
      return { ok: false, error: "invalid_json_response", detail: text };
    }
  }
}
