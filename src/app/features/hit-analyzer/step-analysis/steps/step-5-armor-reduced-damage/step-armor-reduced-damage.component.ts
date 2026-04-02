import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FormatNumberPipe } from '../../../../../shared/pipes/format-number.pipe';
import { TooltipDirective } from '../../../../../shared/directives/tooltip.directive';
import { ArmorReducedDamageStepAnalysis } from '../../step-analysis.models';

@Component({
  selector: 'app-step-armor-reduced-damage',
  imports: [DecimalPipe, FormatNumberPipe, TooltipDirective],
  templateUrl: './step-armor-reduced-damage.component.html',
  styleUrl: '../_step-shared.scss',
})
export class StepArmorReducedDamageComponent {
  readonly data = input.required<ArmorReducedDamageStepAnalysis>();

  readonly staggerBuildupPercentage = computed<number>(() => {
    const armorReducedDamageStepAnalysis = this.data();
    if (armorReducedDamageStepAnalysis.staggerThreshold <= 0) return 0;
    const rawPercentage = (armorReducedDamageStepAnalysis.staggerBuildupValue / armorReducedDamageStepAnalysis.staggerThreshold) * 100;
    return Math.min(rawPercentage, 100);
  });

  readonly isStaggerBuildupOverThreshold = computed<boolean>(() => {
    const armorReducedDamageStepAnalysis = this.data();
    if (armorReducedDamageStepAnalysis.staggerThreshold <= 0) return false;
    return armorReducedDamageStepAnalysis.staggerBuildupValue > armorReducedDamageStepAnalysis.staggerThreshold;
  });
}

