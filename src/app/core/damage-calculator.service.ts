import { Injectable } from '@angular/core';
import { calculate, calculateRiskView, sampleRng, getPercentileRng } from './damage-calculator';
import { CalculationInputs, CalculationOptions, CalculationResult, RiskViewResult } from './models';

@Injectable({ providedIn: 'root' })
export class DamageCalculatorService {

  calculate(inputs: CalculationInputs, options: CalculationOptions = {}): CalculationResult {
    return calculate(inputs, options);
  }

  calculateRiskView(inputs: CalculationInputs): RiskViewResult {
    return calculateRiskView(inputs);
  }

  sampleRng(): number {
    return sampleRng();
  }

  getPercentileRng(percentile: number): number {
    return getPercentileRng(percentile);
  }
}

