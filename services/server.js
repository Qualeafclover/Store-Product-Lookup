// === Database setup ===

const http = require("http");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// === ONNX Runtime setup ===

const ort = require("onnxruntime-node");
const { AutoTokenizer, env } = require("@xenova/transformers");
const path = require("path");

async function embed(sentences) {
  // Load tokenizer from the saved directory
  const tokenizerPath = path.resolve("../model/quantized/ruri-v3-310m");
  env.localModelPath = "";
  env.allowRemoteModels = false;
  const tokenizer = await AutoTokenizer.from_pretrained(tokenizerPath);

  // Tokenize
  const encoded = await tokenizer(sentences, {
    padding: true,
    truncation: true,
    return_tensors: "np",
  });

  // Load ONNX model
  const session = await ort.InferenceSession.create(
    path.join(tokenizerPath, "model_quantized.onnx")
  );

  // Build input tensors
  const feeds = {
    input_ids: new ort.Tensor("int64", encoded.input_ids.data, encoded.input_ids.dims),
    attention_mask: new ort.Tensor("int64", encoded.attention_mask.data, encoded.attention_mask.dims),
  };

  const results = await session.run(feeds);

  // Mean pooling over token embeddings
  const embeddings = meanPool(results.last_hidden_state, encoded.attention_mask);
  return embeddings;
}

function meanPool(hiddenState, attentionMask) {
  const [batch, seqLen, dim] = hiddenState.dims;
  const output = [];

  for (let b = 0; b < batch; b++) {
    const vec = new Array(dim).fill(0);
    let count = 0;

    for (let s = 0; s < seqLen; s++) {
      const maskVal = attentionMask.data[b * seqLen + s];
      if (maskVal === 1n || maskVal === 1) {
        for (let d = 0; d < dim; d++) {
          vec[d] += hiddenState.data[b * seqLen * dim + s * dim + d];
        }
        count++;
      }
    }

    output.push(vec.map((v) => v / count));
  }

  return output;
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

// === Server setup ===

const host = "0.0.0.0";
const port = Number(process.env.PORT || 8080);

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

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

  if (req.url === "/customer/similarity" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { query, doc } = JSON.parse(body);
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

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
  console.log(`Unhandled request: ${req.method} ${req.url}`);
});

server.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`);
});
