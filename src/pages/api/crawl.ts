import type { NextApiRequest, NextApiResponse } from 'next';
import { WebCrawler } from '../../crawler';

const crawler = new WebCrawler();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, options } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await crawler.crawl(url, options);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Crawl error:', error);
    return res.status(500).json({ 
      error: 'Crawl failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 