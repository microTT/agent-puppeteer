import { WebCrawler } from '../crawler';

describe('WebCrawler', () => {
  let crawler: WebCrawler;

  beforeEach(() => {
    crawler = new WebCrawler();
  });

  afterEach(async () => {
    await crawler.close();
  });

  it('应该能成功爬取百度首页', async () => {
    const result = await crawler.crawl('https://www.baidu.com');
    expect(result).toBeDefined();
    expect(result.title).toContain('百度');
    expect(result.html).toContain('百度');
  }, 30000);

  it('应该能处理不存在的页面', async () => {
    await expect(crawler.crawl('https://www.example.com/nonexistent')).rejects.toThrow();
  }, 30000);

  it('应该能处理超时情况', async () => {
    const options = {
      timeout: 1000, // 1秒超时
    };
    await expect(crawler.crawl('https://www.baidu.com', options)).rejects.toThrow();
  }, 30000);

  it('应该能处理等待特定元素的情况', async () => {
    const options = {
      waitForSelector: '#su', // 百度搜索按钮
    };
    const result = await crawler.crawl('https://www.baidu.com', options);
    expect(result).toBeDefined();
    expect(result.html).toContain('百度');
  }, 30000);
}); 