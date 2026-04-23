const https = require('https');

const API_KEY = process.env.VITE_GEMINI_KEY || process.argv[2];

if (!API_KEY) {
  console.error("Please provide API key as argument");
  process.exit(1);
}

function testApi(version, model, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/${version}/models/${model}:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let respData = '';
      res.on('data', (chunk) => { respData += chunk; });
      res.on('end', () => {
        resolve({
          version,
          model,
          status: res.statusCode,
          response: respData
        });
      });
    });

    req.on('error', (e) => {
      console.error(e);
      resolve({ error: e.message });
    });

    req.write(data);
    req.end();
  });
}

const bodyCamel = {
  contents: [{ role: "user", parts: [{ text: "ping" }] }],
  systemInstruction: { parts: [{ text: "Respond pong" }] }
};

const bodySnake = {
  contents: [{ role: "user", parts: [{ text: "ping" }] }],
  system_instruction: { parts: [{ text: "Respond pong" }] }
};

async function run() {
  console.log("Testing v1 with camelCase...");
  let r = await testApi('v1', 'gemini-1.5-flash', bodyCamel);
  console.log("v1 camelCase:", r.status, r.response.slice(0, 100));

  console.log("Testing v1 with snake_case...");
  let r2 = await testApi('v1', 'gemini-1.5-flash', bodySnake);
  console.log("v1 snake_case:", r2.status, r2.response.slice(0, 100));

  console.log("Testing v1beta with gemini-1.5-flash snake_case...");
  let r3 = await testApi('v1beta', 'gemini-1.5-flash', bodySnake);
  console.log("v1beta snake_case:", r3.status, r3.response.slice(0, 100));
  
  console.log("Testing v1beta with gemini-1.5-flash camelCase...");
  let r4 = await testApi('v1beta', 'gemini-1.5-flash', bodyCamel);
  console.log("v1beta camelCase:", r4.status, r4.response.slice(0, 100));

  console.log("Testing v1beta with gemini-1.5-flash-latest camelCase...");
  let r5 = await testApi('v1beta', 'gemini-1.5-flash-latest', bodyCamel);
  console.log("v1beta latest camelCase:", r5.status, r5.response.slice(0, 100));
}

run();
