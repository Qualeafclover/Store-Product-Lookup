// === データベースセットアップ ===

const http = require("http");
const { Pool } = require("pg");

// PostgreSQL 接続プールの設定（環境変数から読み込み）
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// === ONNX Runtime セットアップ ===

const ort = require("onnxruntime-node");
const { AutoTokenizer, env } = require("@xenova/transformers");
const path = require("path");

/**
 * 文のリストをベクトル埋め込みに変換する
 * @param {string[]} sentences - 埋め込む文の配列
 * @returns {number[][]} 各文の埋め込みベクトルの配列
 */
async function embed(sentences) {
  // ローカルに保存されたトークナイザーを読み込む
  const tokenizerPath = path.resolve("../model/quantized/ruri-v3-310m");
  env.localModelPath = "";
  env.allowRemoteModels = false; // リモートモデルの読み込みを禁止
  const tokenizer = await AutoTokenizer.from_pretrained(tokenizerPath);

  // 文をトークン化（パディング・切り捨てあり）
  const encoded = await tokenizer(sentences, {
    padding: true,
    truncation: true,
    return_tensors: "np",
  });

  // ONNX モデルを読み込む
  const session = await ort.InferenceSession.create(
    path.join(tokenizerPath, "model_quantized.onnx")
  );

  // ONNX モデルへの入力テンソルを構築
  const feeds = {
    input_ids: new ort.Tensor("int64", encoded.input_ids.data, encoded.input_ids.dims),
    attention_mask: new ort.Tensor("int64", encoded.attention_mask.data, encoded.attention_mask.dims),
  };

  // 推論を実行
  const results = await session.run(feeds);

  // トークン埋め込みを平均プーリングして文ベクトルを得る
  const embeddings = meanPool(results.last_hidden_state, encoded.attention_mask);
  return embeddings;
}

/**
 * アテンションマスクを考慮してトークン埋め込みを平均プーリングする
 * @param {ort.Tensor} hiddenState - モデルの最終隠れ層 [batch, seqLen, dim]
 * @param {ort.Tensor} attentionMask - パディングトークンを除外するマスク
 * @returns {number[][]} バッチごとの平均ベクトル
 */
function meanPool(hiddenState, attentionMask) {
  const [batch, seqLen, dim] = hiddenState.dims;
  const output = [];

  for (let b = 0; b < batch; b++) {
    const vec = new Array(dim).fill(0);
    let count = 0;

    for (let s = 0; s < seqLen; s++) {
      const maskVal = attentionMask.data[b * seqLen + s];
      // マスク値が 1 のトークン（パディング以外）のみ加算
      if (maskVal === 1n || maskVal === 1) {
        for (let d = 0; d < dim; d++) {
          vec[d] += hiddenState.data[b * seqLen * dim + s * dim + d];
        }
        count++;
      }
    }

    // 有効トークン数で割って平均を取る
    output.push(vec.map((v) => v / count));
  }

  return output;
}

/**
 * 2つのベクトル間のコサイン類似度を計算する（-1 〜 1）
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} コサイン類似度
 */
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

// === サーバーセットアップ ===

const host = "0.0.0.0";
const port = Number(process.env.PORT || 8080);

const server = http.createServer(async (req, res) => {
  // CORS ヘッダーを全レスポンスに付与
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // プリフライトリクエスト（CORS）への応答
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /customer/test — 全商品を取得するテスト用エンドポイント
  if (req.url === "/customer/test" && req.method === "GET") {
    try {
      const result = await pool.query("SELECT * FROM products ORDER BY id");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result.rows));
      return;
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
      return;
    }
  }

  // POST /customer/embed — 文を受け取り埋め込みベクトルを返す
  if (req.url === "/customer/embed" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { sentence } = JSON.parse(body);
        const embeddings = await embed([sentence]);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ embeddings }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // POST /customer/similarity — 2つの文のコサイン類似度を返す
  if (req.url === "/customer/similarity" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { query, doc } = JSON.parse(body);
        // それぞれの文を埋め込んでコサイン類似度を計算
        const queryEmbedding = await embed([query]);
        const docEmbedding = await embed([doc]);
        const similarity = cosineSimilarity(queryEmbedding[0], docEmbedding[0]);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ similarity }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // 未定義のルートは 404 を返す
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
  console.log(`Unhandled request: ${req.method} ${req.url}`);
});

server.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`);
});