# agent-puppeteer

curl -X POST http://localhost:6102/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://127.0.0.1:6102/health",
    "options": {
      "waitForSelector": "body",
      "timeout": 30000
    }
  }'