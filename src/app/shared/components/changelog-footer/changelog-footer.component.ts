import { Component } from '@angular/core';

export interface ChangelogEntry {
  date: string;
  branch: string;
  description: string;
}

@Component({
  selector: 'app-changelog-footer',
  template: `
    <footer class="changelog-footer">
      <h4 class="changelog-title">Changelog</h4>
      <ul class="changelog-list">
        @for (entry of changelogEntries; track entry.branch) {
          <li class="changelog-entry">
            <span class="changelog-date">{{ entry.date }}</span>
            <span class="changelog-description">{{ entry.description }}</span>
          </li>
        }
      </ul>
    </footer>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;

    .changelog-footer {
      margin-top: 3rem;
      padding: 1rem 1.2rem;
      border-top: 1px solid $color-gold-darker;
      text-align: center;
    }

    .changelog-title {
      font-size: 0.68rem;
      color: $color-gold-dark;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 0.5rem;
    }

    .changelog-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .changelog-entry {
      font-size: 0.75rem;
      color: $color-text-muted;
    }

    .changelog-date {
      color: $color-gold-dark;
      margin-right: 0.5rem;
      font-size: 0.7rem;
    }

    .changelog-description {
      color: $color-text-muted;
    }
  `],
})
export class ChangelogFooterComponent {
  readonly changelogEntries: ChangelogEntry[] = [
    {
      date: '2026-04-07',
      branch: 'feature/risk-view',
      description: 'Add Range damage view to Hit Analyzer result table',
    },
    {
      date: '2026-04-07',
      branch: 'fix/multiplicative-damage-scaling',
      description: 'Fix multiplicative scaling for star level, difficulty, and extra damage modifiers (it was wrongly additive)',
    },
  ];
}


