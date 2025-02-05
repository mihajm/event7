import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { StringFieldComponent } from '@e7/common/form';
import { injectSharedT } from '@e7/common/locale';
import { TableState } from './table.component';

@Component({
  selector: 'app-column-visibility-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,

  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconButton,
    MatIcon,
    MatBadgeModule,
    MatMenuModule,
    DragDropModule,
  ],
  template: `
    <button
      type="button"
      mat-icon-button
      [matMenuTriggerFor]="menu"
      class="app-table-column-menu-trigger"
      [matBadge]="visibleCount()"
      matBadgePosition="above before"
    >
      <mat-icon>view_week</mat-icon>
    </button>
    <mat-menu #menu class="app-table-column-menu">
      <ng-template matMenuContent>
        <div class="app-column-menu-list-container" cdkScrollable>
          <div
            class="app-column-menu-list"
            cdkDropList
            (cdkDropListDropped)="droppedColumn($event)"
          >
            <mat-form-field
              class="app-column-menu-search"
              appearance="fill"
              (click)="$event.stopPropagation()"
            >
              <mat-icon matPrefix>search</mat-icon>
              <mat-label>{{ search }}</mat-label>
              <input
                matInput
                autocomplete="off"
                name="columnSearch"
                [(ngModel)]="filter"
                (keydown)="$event.stopPropagation()"
                (keypress)="$event.stopPropagation()"
                (click)="$event.stopImmediatePropagation()"
              />
            </mat-form-field>
            @for (col of filtered(); track col.id) {
              <button
                class="app-table-column-menu-item column"
                cdkDrag
                cdkDragPreviewClass="app-table-column-drag-preview"
                mat-menu-item
                reverse
                type="button"
                (click)="
                  $event.stopImmediatePropagation(); col.toggleVisibility()
                "
                disableRipple
              >
                <mat-icon
                  class="app-table-column-menu-item-drag-handle"
                  cdkDragHandle
                  matMenuItemIcon
                  >drag_handle</mat-icon
                >
                <button
                  class="app-table-column-menu-item-button"
                  mat-icon-button
                  type="button"
                  (click)="
                    $event.stopImmediatePropagation(); col.toggleVisibility()
                  "
                  matMenuItemIcon
                  [disabled]="col.disableHide()"
                >
                  <mat-icon>
                    @if (col.show()) {
                      visibility
                    } @else {
                      visibility_off
                    }
                  </mat-icon>
                </button>
                {{ col.label() }}
              </button>
            }
          </div>
        </div>
      </ng-template>
    </mat-menu>
  `,
  styles: `
    button[mat-menu-item][reverse]:has(*[matMenuItemIcon]) {
      flex-direction: row-reverse;

      .mat-mdc-menu-item-text {
        padding-left: 0.5rem;
      }
    }

    .app-column-menu-search {
      width: 100%;
    }

    .app-table-column-menu {
      overflow: hidden;
    }

    .app-table-column-menu-item-button {
      margin-left: 1rem;
    }

    .app-column-menu-list-container {
      overflow: auto;
      max-height: 28rem;
    }

    .app-table-column-menu-trigger {
      --mat-badge-container-overlap-offset: -12px;
    }

    .app-table-column-menu div.mat-mdc-menu-content {
      padding-top: 0;
    }

    .app-table-column-menu-item {
      cursor: auto;

      &:hover {
        background-color: unset !important;
      }
    }

    .app-table-column-menu-item-drag-handle {
      cursor: move;
      --mat-menu-item-spacing: 0;
    }

    .app-table-column-drag-preview {
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow:
        0 5px 5px -3px rgba(0, 0, 0, 0.2),
        0 8px 10px 1px rgba(0, 0, 0, 0.14),
        0 3px 14px 2px rgba(0, 0, 0, 0.12);
      display: flex;
      position: relative;
      justify-content: flex-start;
      overflow: hidden;
      padding-left: var(--mat-menu-item-leading-spacing, 12px);
      padding-right: var(--mat-menu-item-trailing-spacing, 12px);
      min-height: 48px;
      width: 100%;

      .mat-mdc-menu-item-text {
        flex: 1;
        font-family: var(--mat-menu-item-label-text-font);
        line-height: var(--mat-menu-item-label-text-line-height);
        font-size: var(--mat-menu-item-label-text-size);
        letter-spacing: var(--mat-menu-item-label-text-tracking);
        font-weight: var(--mat-menu-item-label-text-weight);
      }
    }

    [cdkdragpreviewclass='app-table-column-drag-preview'].cdk-drag-placeholder {
      opacity: 0;
    }

    div.menuList.cdk-drop-list-dragging .column:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `,
})
export class ColumnVisibilityMenuComponent<T> {
  private readonly t = injectSharedT();
  readonly state = input.required<TableState<T>['header']>();

  protected readonly visibleCount = computed(
    () => this.state().row.visibleColumns().length,
  );

  protected readonly search = this.t('shared.search');

  protected readonly filter = signal('');

  protected readonly options = computed(() =>
    this.state()
      .row.columns()
      .map((d) => ({
        name: d.column.name,
        visible: d.show,
        label: d.value,
        id: d.id,
        lcsName: d.column.name.toLowerCase(),
        toggleVisibility: d.toggleVisibility,
        show: d.show,
        disableHide: d.disableHide,
      })),
  );

  protected readonly filtered = computed(() => {
    const filter = this.filter().toLowerCase();
    if (!filter) return this.options();

    return this.options().filter((d) => d.lcsName.includes(filter));
  });

  protected droppedColumn({
    previousIndex,
    currentIndex,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: CdkDragDrop<any, any>) {
    if (previousIndex === currentIndex) return;
    untracked(this.state).row.columnOrderState.update((cur) => {
      const next = [...cur];
      moveItemInArray(next, previousIndex, currentIndex);
      return next;
    });
  }
}

@Component({
  selector: 'app-table-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StringFieldComponent,
    MatIconButton,
    MatIcon,
    ColumnVisibilityMenuComponent,
  ],
  template: `
    <section>
      <div class="container">
        <div class="search">
          <app-string-field
            iconPrefix="search"
            [state]="state().globalFilter"
            subscriptSizing="dynamic"
          />
        </div>
        <div class="menus">
          @if (state().hasFilters()) {
            <button
              type="button"
              mat-icon-button
              (click)="state().clearFilters()"
            >
              <mat-icon>filter_alt_off</mat-icon>
            </button>
          }
          <app-column-visibility-menu [state]="state()" />
        </div>
      </div>
    </section>
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
      padding: 0 0.75rem;

      section,
      div.container,
      div.menus {
        display: flex;
      }

      div.container {
        align-items: center;
        justify-content: space-between;
        padding: var(--app-table-toolbar-container-padding, 0);
        flex-wrap: wrap;
        width: 100%;
        min-height: var(--mat-paginator-container-size, 56px);

        div.search {
          flex: 1;
          max-width: 40%;

          ::ng-deep mat-form-field {
            width: 100%;
          }
        }
      }

      div.menus {
        gap: 1rem;
      }
    }
  `,
})
export class TableTooblarComponent<T> {
  readonly state = input.required<TableState<T>['header']>();
}
