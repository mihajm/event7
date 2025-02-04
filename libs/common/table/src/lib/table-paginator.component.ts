import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  Signal,
  untracked,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import {
  createNumberState,
  createSelectState,
  formGroup,
  FormGroupSignal,
  NumberState,
  SelectFieldComponent,
  SelectState,
} from '@e7/common/form';
import { injectSharedT } from '@e7/common/locale';
import { derived, mutable } from '@e7/common/reactivity';
import { injectDisableTooltips } from '@e7/common/settings';
import { injectTableLocalization } from './localization';

export type PaginationOptions = {
  sizeOptions?: () => number[];
  showFirst?: () => boolean;
  showLast?: () => boolean;
  total?: () => number;
  onPaginationChange?: (v: PaginationValue) => void;
};

export type PaginationValue = {
  size: number;
  page: number;
};

type PaginationChildren = {
  size: SelectState<number, PaginationValue>;
  page: NumberState<PaginationValue>;
};

export type PaginationState = FormGroupSignal<
  PaginationValue,
  PaginationChildren
> & {
  showFirst: Signal<boolean>;
  showLast: Signal<boolean>;
  canNext: Signal<boolean>;
  canPrevious: Signal<boolean>;
  paginationLabel: Signal<string>;
  first: () => void;
  last: () => void;
  next: () => void;
  prev: () => void;
};

export function injectCreatePaginationState() {
  const t = injectSharedT();

  return (
    prev: PaginationValue | undefined,
    currentSize: Signal<number>,
    opt?: PaginationOptions,
  ): PaginationState => {
    const sizes = computed(() => {
      const provided = opt?.sizeOptions?.() ?? [10, 25, 50];
      if (!provided.length) return [10];
      return provided;
    });

    const fallback = untracked(sizes).at(0) ?? 10;
    const initial = {
      size: fallback,
      page: 0,
      ...prev,
    };

    const value = mutable(initial);

    const children: PaginationChildren = {
      size: createSelectState(
        derived(value, {
          from: (v) => v.size,
          onChange: (v) => {
            value.mutate((cur) => {
              cur.size = v;
              return cur;
            });

            opt?.onPaginationChange?.(untracked(value));
          },
        }),
        t,
        {
          noClear: () => true,
          disable: () => sizes().length <= 1,
          options: () => sizes(),
        },
      ),
      page: createNumberState(
        derived(value, {
          from: (v) => v.page,
          onChange: (v) => {
            value.mutate((cur) => {
              cur.page = v;
              return cur;
            });
            opt?.onPaginationChange?.(untracked(value));
          },
        }),
        t,
      ),
    };

    const state = formGroup(value, children, {
      equal: (a, b) => a.size === b.size && a.page === b.page,
    });

    const startIndex = computed(() => {
      const { page, size } = state.value();
      return page * size;
    });

    const endIndex = computed(() => {
      const cur = currentSize();
      const { page, size } = state.value();

      if (cur === size) return page * size + size - 1;
      return page * size + cur - 1;
    });

    const total = computed(() => {
      const provided = opt?.total?.();
      if (provided) return provided;

      return endIndex() + 1;
    });

    const currentPage = computed(() => state.children.page.value() ?? 0);

    const lastPageNumber = computed(() => {
      const cur = total();
      const pageSize = state.children.size.value() ?? 10;
      if (pageSize === 0) return 0;
      return Math.ceil(cur / pageSize) - 1;
    });

    return {
      ...state,
      showFirst: computed(() => opt?.showFirst?.() ?? false),
      showLast: computed(() => opt?.showLast?.() ?? false),
      canNext: computed(() => endIndex() < total()),
      canPrevious: computed(() => !!children.page.value()),
      paginationLabel: computed(() => {
        const start = startIndex() + 1;
        const end = endIndex() + 1;
        const count = total();

        return t('shared.table.pagination.fromTo', {
          range: `${start}-${end > count ? count : end}`,
          total: count,
        });
      }),
      first: () => children.page.value.set(0),
      next: () => {
        const next = (untracked(currentPage) ?? 0) + 1;
        if (next > untracked(lastPageNumber)) return;
        children.page.value.set(next);
      },
      prev: () => {
        const next = (untracked(currentPage) ?? 0) - 1;
        if (next < 0) return;
        children.page.value.set(next);
      },
      last: () => children.page.value.set(untracked(lastPageNumber) ?? 0),
    };
  };
}

@Component({
  selector: 'app-table-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectFieldComponent, MatTooltip, MatIconButton, MatIcon],
  template: `
    <div class="outer-container">
      <div class="container">
        <div class="page-size">
          <div class="label">{{ msg.perPage }}</div>
          <app-select-field
            [hideSingleSelectionIndicator]="true"
            subscriptSizing="dynamic"
            [state]="state().children.size"
          />
        </div>
        <div class="range-actions">
          <div aria-live="polite" class="range-label">
            {{ state().paginationLabel() }}
          </div>
          @if (state().showFirst()) {
            <button
              type="button"
              class="first-page-btn"
              mat-icon-button
              [matTooltip]="msg.firstPage"
              [matTooltipDisabled]="disableTooltips()"
              (click)="state().first()"
              [disabled]="!state().canPrevious()"
            >
              <mat-icon>first_page</mat-icon>
            </button>
          }
          <button
            type="button"
            class="previous-page-btn"
            mat-icon-button
            [matTooltip]="msg.prevPage"
            [matTooltipDisabled]="disableTooltips()"
            (click)="state().prev()"
            [disabled]="!state().canPrevious()"
          >
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button
            type="button"
            class="next-page-btn"
            mat-icon-button
            [matTooltip]="msg.nextPage"
            [matTooltipDisabled]="disableTooltips()"
            (click)="state().next()"
            [disabled]="!state().canNext()"
          >
            <mat-icon>chevron_right</mat-icon>
          </button>
          @if (state().showLast()) {
            <button
              type="button"
              class="last-page-btn"
              mat-icon-button
              [matTooltip]="msg.lastPage"
              [matTooltipDisabled]="disableTooltips()"
              (click)="state().last()"
              [disabled]="!state().canNext()"
            >
              <mat-icon>last_page</mat-icon>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      -moz-osx-font-smoothing: grayscale;
      -webkit-font-smoothing: antialiased;
      color: var(--mat-paginator-container-text-color, rgba(0, 0, 0, 0.87));
      background: var(--mat-table-background-color, #fdfbff);
      font-family: var(--mat-paginator-container-text-font, Roboto, sans-serif);
      line-height: var(--mat-paginator-container-text-line-height, 1rem);
      font-size: var(--mat-paginator-container-text-size, 0.75rem);
      font-weight: var(--mat-paginator-container-text-weight, 400);
      letter-spacing: var(--mat-paginator-container-text-tracking, 0.025rem);
      --mat-form-field-container-height: var(
        --mat-paginator-form-field-container-height,
        40px
      );
      --mat-form-field-container-vertical-padding: var(
        --mat-paginator-form-field-container-vertical-padding,
        8px
      );

      --mat-select-disabled-trigger-text-color: var(
        --mat-select-enabled-trigger-text-color,
        #1a1b1f
      );

      div.outer-container {
        display: flex;

        align-items: center;
        justify-content: flex-end;

        div.container {
          display: flex;
          gap: 16px;
          align-items: center;
          justify-content: flex-end;
          padding-left: var(--app-paginator-padding-left, 8px);
          padding-right: var(--app-paginator-padding-right, 0);
          padding-top: var(--app-paginator-padding-top, 16px);
          padding-bottom: var(--app-paginator-padding-bottom, 0);
          flex-wrap: nowrap;
          width: 100%;
          min-height: var(--mat-paginator-container-size, 56px);

          div.page-size {
            display: flex;
            align-items: baseline;

            div.label {
              margin: 0 4px;
              white-space: nowrap;
            }

            ::ng-deep mat-form-field {
              margin: 0 4px;
              width: 84px;

              mat-select-trigger {
                font-size: var(
                  --mat-paginator-select-trigger-text-size,
                  0.75rem
                );
              }
            }
          }
        }

        div.range-actions {
          display: flex;
          align-items: center;
          flex-wrap: nowrap;

          div.range-label {
            margin: 0 16px 0 8px;
            white-space: nowrap;
          }
        }
      }
    }
  `,
})
export class TablePaginatorComponent {
  protected readonly msg = injectTableLocalization().pagination;
  protected readonly disableTooltips = injectDisableTooltips();
  readonly state = input.required<PaginationState>();
}
