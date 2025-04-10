import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Crawl failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Web Crawler</title>
        <meta name="description" content="Web crawler application" />
      </Head>

      <main>
        <h1>Web Crawler</h1>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to crawl"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Crawling...' : 'Crawl'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="result">
            <h2>Result</h2>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        form {
          display: flex;
          gap: 1rem;
          margin: 2rem 0;
        }

        input {
          padding: 0.5rem;
          font-size: 1rem;
          min-width: 300px;
        }

        button {
          padding: 0.5rem 1rem;
          font-size: 1rem;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error {
          color: red;
          margin: 1rem 0;
        }

        .result {
          margin-top: 2rem;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          max-width: 800px;
          overflow-x: auto;
        }

        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      `}</style>
    </div>
  );
} 