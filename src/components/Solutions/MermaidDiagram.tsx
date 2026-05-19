import type React from 'react';
import { useEffect, useId, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

function cleanMermaidChart(chart: string): string {
  return chart
    .replace(/```mermaid/gi, '')
    .replace(/```/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\u2192/g, '-->')
    .replace(/\u2013|\u2014/g, '-')
    .split('\n')
    .map((line) => line.trimEnd().replace(/;+\s*$/, ''))
    .filter(Boolean)
    .join('\n')
    .trim();
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const id = useId().replace(/:/g, '');
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const mermaid = (await import('mermaid')).default;
        const cleanedChart =
          cleanMermaidChart(chart);

        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          flowchart: {
            curve: 'basis',
            htmlLabels: false,
          },
        });

        let result;

        try {
          result = await mermaid.render(
            `interview-diagram-${id}`,
            cleanedChart,
          );
        } catch {
          result = await mermaid.render(
            `interview-diagram-retry-${id}`,
            cleanedChart.replace(/^graph\s+/i, 'flowchart '),
          );
        }

        if (!cancelled) {
          setSvg(result.svg);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setSvg(null);
          setError(true);
        }
      }
    }

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error || !svg) {
    return (
      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-700/70 bg-black/30 p-3 font-mono text-[10px] leading-5 text-zinc-200">
        {chart}
      </pre>
    );
  }

  return (
    <div
      className="max-h-[420px] overflow-auto rounded-lg border border-zinc-700/70 bg-black/20 p-3 [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;
