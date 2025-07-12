
'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { HealthData } from '@/lib/types';
import { format } from 'date-fns';

interface ProgressChartProps {
  data: HealthData[];
  metric: keyof HealthData | 'bloodPressure';
  label: string;
  color: string;
}

export function ProgressChart({ data, metric, label, color }: ProgressChartProps) {

  const isBloodPressure = metric === 'bloodPressure';

  const chartData = data.map(entry => {
    const date = entry.createdAt ? format(new Date((entry.createdAt as any).seconds * 1000), 'MMM d') : 'N/A';
    if (isBloodPressure) {
      const [systolic, diastolic] = (entry.bloodPressure || "0/0").split('/').map(Number);
      return {
        date,
        systolic,
        diastolic
      };
    }
    return {
      date,
      value: entry[metric as keyof HealthData]
    };
  });

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
            {isBloodPressure && <Legend />}
            {isBloodPressure ? (
              <>
                <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#E53935" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#1E88E5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
              </>
            ) : (
               <Line type="monotone" dataKey="value" name={label} stroke={color} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
