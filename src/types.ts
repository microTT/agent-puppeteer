export interface CrawlerOptions {
  waitForSelector?: string;
  timeout?: number;
  clickSelector?: string;
  scrollTimes?: number;
  scrollDelay?: number;
  login?: boolean;
  username?: string;
  password?: string;
  proxy?: string;
}

export interface CrawlerResult {
  title: string;
  plainText: string;
  html: string;
  images?: string[];
  links?: string[];
} 