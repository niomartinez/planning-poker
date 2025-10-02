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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <Card className="bg-card/80 backdrop-blur border-2 border-primary/20 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="w-6 h-6 text-primary" />
            Average Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold text-primary drop-shadow-lg">
            {average !== null ? average.toFixed(1) : 'N/A'}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Based on numeric votes only
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur border-2 border-primary/20 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="w-6 h-6 text-primary" />
            Most Popular
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold text-primary drop-shadow-lg">
            {majority !== null ? String(majority) : 'N/A'}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {distribution[String(majority)] || 0} vote(s)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
