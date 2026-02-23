/**
 * SlackAccessorのインスタンスを作成します。
 * 外部プロジェクトからライブラリとして使用する場合、この関数を経由して呼び出します。
 * @param {string} oauthToken SlackBot の OAuthトークン (xoxb-...)
 * @param {string} channelId Slack のチャンネルID
 * @return {SlackAccessor} SlackAccessorインスタンス
 */
function create(oauthToken, channelId) {
  return new SlackAccessor(oauthToken, channelId);
}
