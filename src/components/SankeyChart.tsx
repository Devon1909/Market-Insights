import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';
import { FinancialFlow } from '../types.ts';

interface SankeyChartProps {
  data: FinancialFlow[];
}

interface NodeExtra { id: string; name: string }
interface LinkExtra { source: string; target: string; value: number }

export const SankeyChart: React.FC<SankeyChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data.length || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const nodesMap = new Map<string, NodeExtra>();
    data.forEach(d => {
      if (!nodesMap.has(d.source)) nodesMap.set(d.source, { id: d.source, name: d.source });
      if (!nodesMap.has(d.target)) nodesMap.set(d.target, { id: d.target, name: d.target });
    });

    const nodesList = Array.from(nodesMap.values());
    const linksList = data.map(d => ({
      source: nodesList.findIndex(n => n.id === d.source),
      target: nodesList.findIndex(n => n.id === d.target),
      value: d.value
    }));

    const sankeyGenerator = sankey<NodeExtra, LinkExtra>()
      .nodeWidth(15)
      .nodePadding(20)
      .extent([[0, 0], [innerWidth, innerHeight]]);

    const graph = sankeyGenerator({
      nodes: nodesList.map(d => ({ ...d })),
      links: linksList.map(d => ({ ...d }))
    });

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Links
    g.append('g')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', d => Math.max(1, d.width || 0))
      .on('mouseover', function() { d3.select(this).attr('stroke-opacity', 0.8).attr('stroke', '#94a3b8'); })
      .on('mouseout', function() { d3.select(this).attr('stroke-opacity', 0.5).attr('stroke', '#cbd5e1'); });

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(graph.nodes)
      .join('g');

    node.append('rect')
      .attr('x', d => d.x0 || 0)
      .attr('y', d => d.y0 || 0)
      .attr('height', d => (d.y1 || 0) - (d.y0 || 0))
      .attr('width', d => (d.x1 || 0) - (d.x0 || 0))
      .attr('fill', d => color(d.name))
      .attr('stroke', '#1e293b');

    node.append('text')
      .attr('x', d => (d.x0 || 0) < innerWidth / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
      .attr('y', d => ((d.y1 || 0) + (d.y0 || 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => (d.x0 || 0) < innerWidth / 2 ? 'start' : 'end')
      .text(d => d.name)
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', '#334155');

  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px]">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="overflow-visible" />
    </div>
  );
};
