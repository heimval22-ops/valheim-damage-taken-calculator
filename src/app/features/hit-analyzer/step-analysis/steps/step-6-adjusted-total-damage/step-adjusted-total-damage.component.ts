import { Component, input } from '@angular/core';
import { FormatNumberPipe } from '../../../../../shared/pipes/format-number.pipe';
import { TooltipDirective } from '../../../../../shared/directives/tooltip.directive';
import { AdjustedTotalDamageStepAnalysis } from '../../step-analysis.models';

@Component({
  selector: 'app-step-adjusted-total-damage',
  imports: [FormatNumberPipe, TooltipDirective],
  templateUrl: './step-adjusted-total-damage.component.html',
  styleUrl: '../_step-shared.scss',
})
export class StepAdjustedTotalDamageComponent {
  readonly data = input.required<AdjustedTotalDamageStepAnalysis>();
}

