import { Component, input } from '@angular/core';
import { FormatNumberPipe } from '../../../../../shared/pipes/format-number.pipe';
import { TooltipDirective } from '../../../../../shared/directives/tooltip.directive';
import { EffectiveBlockArmorStepAnalysis } from '../../step-analysis.models';

@Component({
  selector: 'app-step-effective-block-armor',
  imports: [FormatNumberPipe, TooltipDirective],
  templateUrl: './step-effective-block-armor.component.html',
  styleUrl: '../_step-shared.scss',
})
export class StepEffectiveBlockArmorComponent {
  readonly data = input.required<EffectiveBlockArmorStepAnalysis>();
}

