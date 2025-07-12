'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { HealthData } from '@/lib/types';
import { format } from 'date-fns';

interface ProgressChartProps {
  data: HealthData[];
  metric: keyof HealthData;
  label: string;
  color: string;
}

export function ProgressChart({ data, metric, label, color }: ProgressChartProps) {

  const chartData = data.map(entry => ({
    date: format(new Date((entry.createdAt as any).seconds * 1000), 'MMM d'),
    value: entry[metric]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label} Trend</CardTitle>
        <CardDescription>Your {label.toLowerCase()} progress over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
              }}
            />
            <Line type="monotone" dataKey="value" name={label} stroke={color} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
