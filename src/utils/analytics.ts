import { RevenuePoint } from '../data/mockData';

export type AnalysisOption = 'GROWTH' | 'VOLATILITY' | 'RUN_RATE' | 'FTE_PRODUCTIVITY';

export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
export const average = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;

export const standardDeviation = (arr: number[]) => {
  const avg = average(arr);
  const sqDiffs = arr.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(average(sqDiffs));
};

export interface PointAnalysis {
  point: RevenuePoint;
  value: number;
  label: string;
  colorClass: string;
}

export function analyzePoints(points: RevenuePoint[], option: AnalysisOption): PointAnalysis[] {
  let overallFteAvg = 0;
  if (option === 'FTE_PRODUCTIVITY') {
    let totalRev = 0;
    let totalHeadcount = 0;
    points.forEach(p => {
      totalRev += sum(p.revenues);
      totalHeadcount += p.headCount;
    });
    overallFteAvg = totalHeadcount > 0 ? totalRev / totalHeadcount : 0;
  }

  return points.map(point => {
    const revs = point.revenues;
    
    switch (option) {
      case 'GROWTH': {
        let growthRates = [];
        for (let i = 1; i < revs.length; i++) {
          if (revs[i-1] !== 0) {
            growthRates.push((revs[i] - revs[i-1]) / revs[i-1]);
          } else if (revs[i] > 0) {
            growthRates.push(1);
          } else {
            growthRates.push(0);
          }
        }
        const avgGrowth = average(growthRates); 
        const pct = avgGrowth * 100;
        
        let color = '';
        if (pct === 0) color = 'bg-amber-500';
        else if (pct > 10) color = 'bg-green-700';
        else if (pct > 0) color = 'bg-green-500';
        else if (pct < -10) color = 'bg-red-700';
        else color = 'bg-red-500';

        return {
          point,
          value: pct,
          label: `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`,
          colorClass: color
        };
      }
      case 'VOLATILITY': {
        const mean = average(revs);
        const sd = standardDeviation(revs);
        const cv = mean === 0 ? 0 : (sd / mean) * 100;

        let color = '';
        if (cv === 0) color = 'bg-amber-500';
        else if (cv < 10) color = 'bg-green-700'; 
        else if (cv < 25) color = 'bg-amber-500'; 
        else color = 'bg-red-600'; 

        return {
          point,
          value: cv,
          label: `${cv.toFixed(2)}%`,
          colorClass: color
        };
      }
      case 'RUN_RATE': {
        const ytd = sum(revs); 
        const passedDays = revs.length; 
        const totalDays = 31; 
        const runRate = (ytd / passedDays) * totalDays;
        
        let pctTarget = 0;
        if (point.monthlyTarget > 0) {
          pctTarget = (runRate / point.monthlyTarget) * 100;
        }

        let color = '';
        if (pctTarget >= 100) color = 'bg-green-600';
        else if (pctTarget >= 90) color = 'bg-amber-500';
        else color = 'bg-red-600';

        return {
          point,
          value: pctTarget,
          label: `${pctTarget.toFixed(2)}%`,
          colorClass: color
        };
      }
      case 'FTE_PRODUCTIVITY': {
        const totalRev = sum(revs);
        const revPerFte = point.headCount > 0 ? totalRev / point.headCount : 0;
        
        let color = '';
        if (revPerFte >= overallFteAvg * 1.2) color = 'bg-green-700';
        else if (revPerFte >= overallFteAvg) color = 'bg-green-500';
        else if (revPerFte >= overallFteAvg * 0.8) color = 'bg-red-500';
        else color = 'bg-red-700';

        return {
          point,
          value: revPerFte,
          label: `${revPerFte.toFixed(1)} M`,
          colorClass: color
        };
      }
    }
  });
}
