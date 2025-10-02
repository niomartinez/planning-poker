'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target } from 'lucide-react';

interface ResultsProps {
  average: number | null;
  majority: string | number | null;
  distribution: Record<string, number>;
}

export function Results({ average, majority, distribution }: ResultsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            Average
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {average !== null ? average.toFixed(1) : 'N/A'}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Based on numeric votes only
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5" />
            Most Voted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {majority !== null ? String(majority) : 'N/A'}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {distribution[String(majority)] || 0} vote(s)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
