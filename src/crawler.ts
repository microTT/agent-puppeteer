import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
// import { createCursor } from 'ghost-cursor';
// import { random } from 'lodash';
import { CrawlerOptions, CrawlerResult } from './types';

export class WebCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;
  // private cursor: any = null;
  private startTime = 0;
  private readonly MAX_SESSION_TIME = 30 * 60 * 1000; // 30分钟
  // private readonly MAX_RETRIES = 3;
  private readonly DEFAULT_TIMEOUT = 30000;

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

      try {
        this.browser = await puppeteer.launch(launchOptions);
        this.page = await this.browser.newPage();
        this.startTime = Date.now();

        // 设置视口
        await this.page.setViewport({ width: 1920, height: 1080 });

        // 注入反检测脚本
        await this.page.evaluateOnNewDocument(() => {
          // 修改自动化检测属性
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
          Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
          Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
          
          // Canvas 指纹混淆
          const originalGetContext = HTMLCanvasElement.prototype.getContext;
          interface GetContextOverload {
            (contextId: '2d', options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null;
            (contextId: 'bitmaprenderer', options?: ImageBitmapRenderingContextSettings): ImageBitmapRenderingContext | null;
            (contextId: 'webgl', options?: WebGLContextAttributes): WebGLRenderingContext | null;
            (contextId: 'webgl2', options?: WebGLContextAttributes): WebGL2RenderingContext | null;
          }
          
          HTMLCanvasElement.prototype.getContext = function(
            this: HTMLCanvasElement,
            contextId: '2d' | 'bitmaprenderer' | 'webgl' | 'webgl2',
            options?: any
          ): CanvasRenderingContext2D | ImageBitmapRenderingContext | WebGLRenderingContext | WebGL2RenderingContext | null {
            const context = originalGetContext.call(this, contextId, options);
            if (contextId === '2d' && context && 'getImageData' in context) {
              const originalGetImageData = context.getImageData;
              context.getImageData = function(
                this: CanvasRenderingContext2D,
                sx: number,
                sy: number,
                sw: number,
                sh: number
              ) {
                const imageData = originalGetImageData.call(this, sx, sy, sw, sh);
                for (let i = 0; i < imageData.data.length; i += 4) {
                  imageData.data[i] += (Math.random() - 0.5) * 0.1;
                }
                return imageData;
              };
            }
            return context;
          } as GetContextOverload;
        });

        // 初始化鼠标轨迹生成器
        // this.cursor = createCursor(this.page);

        // 设置请求拦截
        await this.page.setRequestInterception(true);
        this.page.on('request', (request) => {
          const resourceType = request.resourceType();
          // 只加载必要的资源
          if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
            request.abort();
          } else {
            request.continue();
          }
        });

        // 设置超时
        this.page.setDefaultNavigationTimeout(this.DEFAULT_TIMEOUT);
        this.page.setDefaultTimeout(this.DEFAULT_TIMEOUT);
      } catch (error) {
        throw new Error(`启动浏览器失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  }

  // // 模拟人类滚动行为
  // private async humanScroll() {
  //   if (!this.page) return;

  //   const viewportHeight = await this.page.evaluate(() => window.innerHeight);
  //   const totalHeight = await this.page.evaluate(
  //     () => document.body.scrollHeight,
  //   );
  //   let currentPosition = 0;

  //   while (currentPosition < totalHeight) {
  //     // 使用更自然的滚动距离
  //     const scrollDistance = random(200, 400);
  //     currentPosition += scrollDistance;

  //     // 使用平滑滚动
  //     await this.page.evaluate((distance) => {
  //       window.scrollBy({
  //         top: distance,
  //         behavior: 'smooth',
  //       });
  //     }, scrollDistance);

  //     // 使用更自然的停留时间
  //     await new Promise((resolve) => setTimeout(resolve, random(800, 1500)));

  //     // 偶尔进行小幅回滚
  //     if (Math.random() > 0.8) {
  //       await this.page.evaluate(() => {
  //         window.scrollBy({
  //           top: random(-30, 30),
  //           behavior: 'smooth',
  //         });
  //       });
  //     }
  //   }
  // }

  // // 模拟人类点击行为
  // private async humanClick(selector: string) {
  //   if (!this.page || !this.cursor) return;

  //   const element = await this.page.$(selector);
  //   if (!element) return;

  //   // 使用更自然的点击延迟
  //   await this.cursor.click(element, {
  //     waitForClickable: true,
  //     moveDelay: random(200, 800),
  //     clickDelay: random(100, 300),
  //   });
  // }

  async crawl(
    url: string,
    options: CrawlerOptions = {},
  ): Promise<CrawlerResult> {
    if (!this.browser || !this.page) {
      await this.init();
    }

    try {
      if (!this.page) throw new Error('Page not initialized');

      // 设置超时时间
      if (options.timeout) {
        this.page.setDefaultTimeout(options.timeout);
      }

      // 访问页面
      await this.page.goto(url, { waitUntil: 'networkidle0' });

      // 如果需要登录
      if (options.login && options.username && options.password) {
        await this.handleLogin(options.username, options.password);
      }

      // 如果需要等待特定元素
      if (options.waitForSelector) {
        await this.page.waitForSelector(options.waitForSelector);
      }

      // 如果需要点击
      if (options.clickSelector) {
        await this.handleClick(options.clickSelector, options.waitForSelector);
      }

      // 如果需要滚动
      if (options.scrollTimes) {
        await this.handleScroll(options.scrollTimes, options.scrollDelay);
      }

      // 获取页面内容
      return await this.extractContent();
    } catch (error) {
      throw new Error(
        `爬取失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  private async handleLogin(username: string, password: string) {
    if (!this.page) return;
    // 这里需要根据具体网站的登录表单调整选择器
    await this.page.type('#username', username);
    await this.page.type('#password', password);
    await this.page.click('#login-button');
    await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
  }

  private async handleClick(clickSelector: string, waitForSelector?: string) {
    if (!this.page) return;
    await this.page.click(clickSelector);
    if (waitForSelector) {
      await this.page.waitForSelector(waitForSelector);
    }
  }

  private async handleScroll(times = 0, delay = 1000) {
    if (!this.page) return;
    for (let i = 0; i < times; i++) {
      await this.page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  private async extractContent(): Promise<CrawlerResult> {
    if (!this.page) throw new Error('Page not initialized');

    return await this.page.evaluate(() => {
      // 获取标题
      const title = document.title;

      // 定义需要移除的标签
      const tagsToRemove = [
        'script',
        'style',
        'link',
        'meta',
        'noscript',
        'template',
        'svg',
        'canvas',
        'object',
        'embed',
        'applet',
        'frame',
        'frameset',
        'noframes',
        'base',
        'basefont',
        'bgsound',
        'command',
        'keygen',
        'source',
        'track',
        'wbr',
        'nav',
        'header',
        'footer',
        'aside',
        'form',
        'button',
        'input',
        'select',
        'textarea',
        'iframe',
        'video',
        'audio',
      ];

      // 定义需要保留的属性
      const allowedAttributes = {
        a: ['href'],
        img: ['src', 'alt'],
        // '*': ['role', 'aria-label', 'data-*'],
        '*': [],
      };

      // 克隆文档
      const doc = document.cloneNode(true) as Document;

      // 移除不需要的标签
      tagsToRemove.forEach((tagName) => {
        const elements = doc.getElementsByTagName(tagName);
        while (elements.length > 0) {
          elements[0].parentNode?.removeChild(elements[0]);
        }
      });

      // 移除广告和无关内容
      const removeElementsBySelector = (selectors: string[]) => {
        selectors.forEach((selector) => {
          const elements = doc.querySelectorAll(selector);
          elements.forEach((el) => el.remove());
        });
      };

      // 移除常见广告和无关内容的选择器
      removeElementsBySelector([
        '.ad',
        '.ads',
        '.advertisement',
        '.sidebar',
        '.menu',
        '.navigation',
        '.header',
        '.footer',
        '.cookie-banner',
        '.popup',
        '.modal',
        '.notification',
        '.social-share',
        '.related-posts',
        '.comments',
        '[role="navigation"]',
        '[role="complementary"]',
        '[role="banner"]',
        '[role="contentinfo"]',
      ]);

      // 清理元素属性
      const cleanElement = (element: Element) => {
        const tagName = element.tagName.toLowerCase();
        const allowedAttrs =
          allowedAttributes[tagName as keyof typeof allowedAttributes] ||
          allowedAttributes['*'];

        Array.from(element.attributes).forEach((attr) => {
          const attrName = attr.name.toLowerCase();
          const shouldKeep = allowedAttrs.some((allowed) => {
            if (allowed === 'data-*') {
              return attrName.startsWith('data-');
            }
            return attrName === allowed;
          });

          if (!shouldKeep) {
            element.removeAttribute(attr.name);
          }
        });

        Array.from(element.children).forEach((child) => cleanElement(child));
      };

      // 清理整个文档
      cleanElement(doc.documentElement);

      // 获取主要内容区域
      const getMainContent = () => {
        // const selectors = [
        //   'article',
        //   'main',
        //   '[role="main"]',
        //   '.content',
        //   '.article',
        //   '.post',
        //   '.entry',
        //   '.main-content',
        //   '#content',
        //   '#main',
        // ];

        // for (const selector of selectors) {
        //   const element = doc.querySelector(selector);
        //   if (element) {
        //     return element;
        //   }
        // }
        return doc.body;
      };

      const mainContent = getMainContent();

      // 获取清理后的 HTML
      const html = mainContent.outerHTML;

      // 获取纯文本内容
      const plainText = mainContent.textContent || '';

      // // 获取所有图片链接
      // const images = Array.from(mainContent.querySelectorAll('img'))
      //   .map((img) => {
      //     const src = img.getAttribute('data-src') || img.src;
      //     const alt = img.alt || '';
      //     return src.startsWith('http') ? { src, alt } : null;
      //   })
      //   .filter((img): img is { src: string; alt: string } => img !== null);

      // // 获取所有外部链接
      // const links = Array.from(mainContent.querySelectorAll('a'))
      //   .map((a) => ({
      //     href: a.href,
      //     text: a.textContent?.trim() || '',
      //   }))
      //   .filter((link) => link.href.startsWith('http'));

      return {
        title,
        plainText,
        html,
        // images,
        // links,
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