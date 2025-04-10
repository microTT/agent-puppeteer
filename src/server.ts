import express from 'express';
import { WebCrawler } from './crawler';
import { CrawlerOptions } from './types';

const app = express();
const port = process.env.PORT || 6102;

// 中间件
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 爬虫端点
app.post('/crawl', async (req, res) => {
  try {
    const { url, options } = req.body as {
      url: string;
      options?: CrawlerOptions;
    };

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const crawler = new WebCrawler();
    const result = await crawler.crawl(url, options);
    
    res.json(result);
  } catch (error) {
    console.error('Crawling error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 