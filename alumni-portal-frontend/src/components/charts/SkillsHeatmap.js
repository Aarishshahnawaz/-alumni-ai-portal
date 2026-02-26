import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

const SkillsHeatmap = ({ data, height = 300 }) => {
  // Transform data for treemap
  const treemapData = data.map((skill, index) => ({
    name: skill.name,
    size: skill.value,
    category: skill.category,
    fill: getColorByCategory(skill.category, index),
  }));

  function getColorByCategory(category, index) {
    const colors = {
      'Programming': '#3b82f6',
      'Frontend': '#10b981',
      'Backend': '#f59e0b',
      'Cloud': '#8b5cf6',
      'AI/ML': '#ef4444',
      'Database': '#06b6d4',
      'DevOps': '#84cc16',
      'Mobile': '#f97316',
      'Design': '#ec4899',
    };
    
    return colors[category] || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">Category: {data.category}</p>
          <p className="text-sm text-gray-600">Count: {data.size}</p>
        </div>
      );
    }
    return null;
  };

  const CustomContent = ({ root, depth, x, y, width, height, index, payload }) => {
    if (depth === 1) {
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            style={{
              fill: payload.fill,
              stroke: '#fff',
              strokeWidth: 2,
              strokeOpacity: 1,
            }}
          />
          {width > 60 && height > 30 && (
            <text
              x={x + width / 2}
              y={y + height / 2}
              textAnchor="middle"
              fill="#fff"
              fontSize={Math.min(width / 8, height / 4, 14)}
              fontWeight="bold"
            >
              {payload.name}
            </text>
          )}
          {width > 80 && height > 50 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 16}
              textAnchor="middle"
              fill="#fff"
              fontSize={Math.min(width / 12, height / 6, 10)}
              opacity={0.8}
            >
              {payload.size}
            </text>
          )}
        </g>
      );
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Treemap
        data={treemapData}
        dataKey="size"
        aspectRatio={4 / 3}
        stroke="#fff"
        fill="#8884d8"
        content={<CustomContent />}
      >
        <Tooltip content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  );
};

export default SkillsHeatmap;