# gas-slack-accessor
**GAS用の Slack API ラッパー**

Google Apps Script (GAS) から Slack API を直感的かつ安全に操作するためのラッパーライブラリーです。

---

## クイックスタート

### 1. Slack App の準備
[Slack API](https://api.slack.com/apps) でアプリを作成し、以下の **Bot Token Scopes** を付与してワークスペースにインストールしてください。

| 機能 | 必要な Scope |
| :--- | :--- |
| メッセージ送信 | `chat:write` |
| 履歴取得 | `channels:history`, `groups:history` |
| リアクション取得 | `reactions:read` |
| ユーザー情報取得 | `users:read` |

### 2. インストール

#### 方法A：コードをコピーする場合
`src/SlackAccessor.js` の内容を、GASエディタのスクリプトファイルに直接貼り付けてください。

#### 方法B：clasp を使用する場合
本リポジトリをクローンし、ご自身のプロジェクトへプッシュします。
プロジェクトの管理には、 `clasp` を利用します。

プッシュの前に、ルートディレクトリーに、以下の `clasp.json` の追加が必要です。
```clasp.json
{
  "scriptId": "【スクリプトID】",
  "rootDir": "./src"
}
```

```bash
# リポジトリをクローン
git clone [https://github.com/YudaiH/gas-slack-accessor.git](https://github.com/YudaiH/gas-slack-accessor.git)
cd gas-slack-accessor

# 依存関係のインストール
npm install

# 自身のGASプロジェクトIDを設定
clasp setting scriptId "【スクリプトID】"

# コードをアップロード
clasp push
```

---

## 使い方

### インスタンスの生成
```javascript
const token = "xoxb-AAAAAAAAAAAAAAAA";
const channelId = "C12345678";
const slack = new SlackAccessor(token, channelId);
```

### 主要メソッド

#### メッセージ送信
```javascript
// 通常のテキスト送信
slack.sendTextMessage("Hello Slack!");

// Block Kit 送信
const blocks = [
  {
    "type": "section",
    "text": { "type": "mrkdwn", "text": "*重要なお知らせ*" }
  }
];
slack.sendBlockMessage(blocks);
```

#### ユーザー情報取得
```javascript
// 全ユーザー取得 (自動ページネーション対応)
const users = slack.getAllUserInfo();

// 特定のユーザー詳細を取得
const user = slack.getUserInfo("U12345");
console.log(user.profile.display_name || user.profile.real_name);
```

#### 履歴・リアクション取得
```javascript
// チャンネル履歴の取得
const history = slack.getMessages({ limit: 10 });

// 特定メッセージのリアクション一覧を取得
const reactions = slack.getReactions("1712345678.123456");
```

---

## 開発者向け

### プロジェクト構造
* `src/SlackAccessor.js`: メインロジック
* `src/entryPoint.js`: GASでライブラリーとして公開する際に外部から呼び出すためのエントリーポイント
* `src/appsscript.json`: マニフェストファイル（外部リクエスト権限設定済み）

---

## ライセンス
MIT License
