import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import { CrawlerOptions, CrawlerResult } from './types';

export class WebCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private startTime = 0;
  private readonly MAX_SESSION_TIME = 30 * 60 * 1000; // 30分钟

  async init(options: CrawlerOptions = {}) {
    // 检查是否需要重新启动浏览器
    if (this.browser && Date.now() - this.startTime > this.MAX_SESSION_TIME) {
      await this.close();
    }

    if (!this.browser) {
      const launchOptions = {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          '--disable-dev-shm-usage',
          '--window-size=1920,1080',
          '--hide-scrollbars',
          '--disable-notifications',
          '--disable-extensions',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--disable-features=TranslateUI,BlinkGenPropertyTrees',
          '--disable-ipc-flooding-protection',
          '--disable-renderer-backgrounding',
          '--enable-features=NetworkService,NetworkServiceInProcess',
          '--password-store=basic',
          '--use-mock-keychain',
        ],
        headless: true,
        ignoreHTTPSErrors: true,
      };

      // 添加代理配置
      if (options.proxy) {
        launchOptions.args.push(`--proxy-server=${options.proxy}`);
      }

      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();
      this.startTime = Date.now();

      // 设置视口
      await this.page.setViewport({ width: 1920, height: 1080 });

      // 注入反检测脚本
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      // 设置请求拦截
      await this.page.setRequestInterception(true);
      this.page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // 添加页面加载超时处理
      this.page.setDefaultNavigationTimeout(30000);
      this.page.setDefaultTimeout(30000);
    }
  }

  async crawl(url: string, options: CrawlerOptions = {}): Promise<CrawlerResult> {
    if (!this.browser || !this.page) {
      await this.init(options);
    }

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        if (!this.page) throw new Error('Page not initialized');

        // 设置超时时间
        if (options.timeout) {
          this.page.setDefaultTimeout(options.timeout);
        }

        // 访问页面
        await this.page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });

        // 如果需要等待特定元素
        if (options.waitForSelector) {
          await this.page.waitForSelector(options.waitForSelector, { timeout: 10000 });
        }

        // 获取页面内容
        return await this.extractContent();
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          throw new Error(
            `爬取失败: ${error instanceof Error ? error.message : '未知错误'}`,
          );
        }
        // 重新初始化浏览器
        await this.close();
        await this.init(options);
      }
    }
    throw new Error('爬取失败: 达到最大重试次数');
  }

  private async extractContent(): Promise<CrawlerResult> {
    if (!this.page) throw new Error('Page not initialized');

    return await this.page.evaluate(() => {
      const title = document.title;
      const html = document.documentElement.outerHTML;
      const plainText = document.body.textContent || '';

      return {
        title,
        plainText,
        html,
      };
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
} 