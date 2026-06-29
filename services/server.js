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
  const tokenizerPath = process.env.MODEL_PATH;
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

// === Frontend setup ===

const fs = require("fs");
const frontendRoot = process.env.FRONT_PATH;

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath;

  if (url.pathname.startsWith("/customer/")) {
    filePath = path.join(frontendRoot, "customer", url.pathname.replace("/customer/", ""));
  } else if (url.pathname.startsWith("/store/")) {
    filePath = path.join(frontendRoot, "store", url.pathname.replace("/store/", ""));
  } else {
    return false;
  }

  if (filePath.endsWith("/")) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return false;
  }

  const ext = path.extname(filePath);
  const contentType =
    ext === ".html" ? "text/html" :
    ext === ".js" ? "application/javascript" :
    ext === ".css" ? "text/css" :
    "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
  return true;
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

  if (req.url === "/api/customer/test" && req.method === "GET") {
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

  if (req.url === "/api/customer/embed" && req.method === "POST") {
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

  if (req.url === "/api/customer/similarity" && req.method === "POST") {
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

  if (req.url === "/api/store/add_product" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { product_name, product_details, location, price } = JSON.parse(body); 

        console.log("商品を受け取りました:");
        console.log(`  商品名: ${product_name}`);
        console.log(`  詳細: ${product_details}`);
        console.log(`  場所: ${location}`);
        console.log(`  価格: ${price}`);

        const documentText = `検索文書: ${product_name}（${product_details}）`;
        console.log(`ベクトル化する文章: ${documentText}`);
        const embedding = await embed([documentText]);
        // console.log("ベクトル化した数列:");
        // console.log(embedding[0]);

        let aisleCheck = await pool.query(
            "SELECT id FROM aisles WHERE aisle_name = $1", 
            [location]
        );

        let aisleId;

        if (aisleCheck.rows.length === 0) {
            const newAisle = await pool.query(
                "INSERT INTO aisles (aisle_name) VALUES ($1) RETURNING id", 
                [location]
            );
            aisleId = newAisle.rows[0].id;
        } else {
            aisleId = aisleCheck.rows[0].id;
        }

        const result = await pool.query(
            `INSERT INTO products (name, description, price, aisle_id, encoded_vector) 
              VALUES ($1, $2, $3, $4, $5) 
              RETURNING *`,
            [product_name, product_details, price, aisleId, JSON.stringify(embedding[0])]
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "dekitayo?" }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  if (req.url === "/api/store/products" && req.method === "GET") {
    try {
        console.log("/api/store/products が呼ばれました:");
        const result = await pool.query(`
            SELECT 
                p.id, 
                p.name, 
                p.description, 
                p.price, 
                a.aisle_name
            FROM products p
            LEFT JOIN aisles a ON p.aisle_id = a.id
            ORDER BY p.id DESC
        `);
        console.log(`データ取得成功！ 現在の商品数は ${result.rows.length} 件です。`);
        console.log(" 取得したデータの中身は以下の通りです：");
        console.table(result.rows);
        console.log("-----------------------------------------");

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result.rows));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    return;
  }
  if (req.url === "/api/customer/search" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        console.log("/api/customer/search が呼ばれました:");
        console.log(data);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "search received" }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  if (req.method === "GET" && serveStatic(req, res)) {
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
  console.log(`Unhandled request: ${req.method} ${req.url}`);
});

server.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`);
});
