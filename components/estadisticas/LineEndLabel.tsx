"use client";

interface LineEndLabelProps {
  x?: number;
  y?: number;
  index?: number;
  dataLength: number;
  label: string;
  color: string;
}

export function LineEndLabel({
  x,
  y,
  index,
  dataLength,
  label,
  color,
}: LineEndLabelProps) {
  if (
    x == null ||
    y == null ||
    index == null ||
    index !== dataLength - 1
  ) {
    return null;
  }

  return (
    <text
      x={x + 6}
      y={y}
      fill={color}
      fontSize={11}
      dominantBaseline="middle"
    >
      {label}
    </text>
  );
}
