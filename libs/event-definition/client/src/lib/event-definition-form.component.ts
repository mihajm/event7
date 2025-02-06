import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import {
  createNumberState,
  createSelectState,
  createStringState,
  formGroup,
  FormGroupSignal,
  NumberFieldComponent,
  NumberState,
  SelectFieldComponent,
  SelectState,
  StringFieldComponent,
  StringState,
  TextareaFieldComponent,
} from '@e7/common/form';
import { derived, mutable } from '@e7/common/reactivity';
import { EventDefinition } from '@e7/event-definition/shared';
import { EventDefinitionTypeStore } from './event-definition-type.store';
import { injectNamespaceT } from './locale';

export type NullableEventDefinition = Required<{
  [K in keyof EventDefinition]: EventDefinition[K] | null;
}>;

export function toNullable(e: EventDefinition | null): NullableEventDefinition {
  return {
    id: e?.id ?? null,
    name: e?.name ?? null,
    description: e?.description ?? null,
    type: e?.type ?? null,
    priority: e?.priority ?? 0,
    status: e?.status ?? 'draft',
    createdAt: e?.createdAt ?? null,
    updatedAt: e?.updatedAt ?? null,
  };
}

type CreateEventChildren = {
  status: StringState<NullableEventDefinition>;
  name: StringState<NullableEventDefinition>;
  description: StringState<NullableEventDefinition>;
  type: SelectState<Required<EventDefinition>['type'], NullableEventDefinition>;
  priority: NumberState<NullableEventDefinition>;
};

export type CreateUpdateEventState = FormGroupSignal<
  NullableEventDefinition,
  CreateEventChildren
>;

function createTypesTranslations(): Record<
  Required<EventDefinition>['type'],
  string | undefined
> {
  const t = injectNamespaceT();

  return {
    crosspromo: t('eventDef.types.crosspromo'),
    liveops: t('eventDef.types.liveops'),
    app: t('eventDef.types.app'),
    ads: t('eventDef.types.ads'),
  };
}

export function injectCreateFormState() {
  const t = injectNamespaceT();
  const typeStore = inject(EventDefinitionTypeStore);

  const typeTranslations = createTypesTranslations();

  return (
    initial: EventDefinition | null = null,
    prevState?: CreateUpdateEventState,
  ): CreateUpdateEventState => {
    const nullable = toNullable(initial);
    if (prevState) {
      prevState.reconcile(nullable);
      return prevState;
    }
    const value = mutable(nullable);

    const status = createStringState(
      derived(value, {
        from: (v) => v.status,
        onChange: (v) => {
          value.mutate((cur) => {
            cur.status = v;
            return cur;
          });
        },
      }),
      t,
      {
        readonly: () => true,
        label: () => t('eventDef.status'),
      },
    );

    const children: CreateEventChildren = {
      status,
      name: createStringState(
        derived(value, {
          from: (v) => v.name,
          onChange: (v) => {
            value.mutate((cur) => {
              cur.name = v;
              return cur;
            });
          },
        }),
        t,
        {
          readonly: () => status.value() === 'archived',
          validation: () => ({
            required: true,
            blanks: true,
            maxLength: 255,
          }),
          label: () => t('eventDef.name'),
        },
      ),
      description: createStringState(
        derived(value, {
          from: (v) => v.description,
          onChange: (v) => {
            value.mutate((cur) => {
              cur.description = v;
              return cur;
            });
          },
        }),
        t,
        {
          validation: () => ({
            required: true,
            blanks: true,
          }),
          readonly: () => status.value() === 'archived',
          label: () => t('eventDef.description'),
        },
      ),
      type: createSelectState(
        derived(value, {
          from: (v) => v.type,
          onChange: (v) => {
            value.mutate((cur) => {
              cur.type = v;
              return cur;
            });
          },
        }),
        t,
        {
          readonly: () => status.value() === 'archived',
          required: () => true,
          label: () => t('eventDef.type'),
          display: () => (v) => {
            if (!v) return '';
            return typeTranslations[v] ?? v;
          },
          options: () => typeStore.types.value(),
        },
      ),
      priority: createNumberState(
        derived(value, {
          from: (v) => v.priority,
          onChange: (v) => {
            value.mutate((cur) => {
              cur.priority = v;
              return cur;
            });
          },
        }),
        t,
        {
          readonly: () => status.value() === 'archived',
          label: () => t('eventDef.priority'),
          validation: () => ({
            required: true,
            min: 0,
            max: 10,
            integer: true,
          }),
        },
      ),
    };

    return formGroup(value, children);
  };
}

@Component({
  selector: 'app-event-definition-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StringFieldComponent,
    NumberFieldComponent,
    SelectFieldComponent,
    TextareaFieldComponent,
  ],
  template: `
    <app-string-field class="name" [state]="state().children.name" />
    <div>
      <app-select-field [state]="state().children.type" />
      <app-number-field [state]="state().children.priority" />
    </div>

    <app-textarea-field [state]="state().children.description" />
  `,
  styles: `
    :host {
      display: contents;

      ::ng-deep mat-form-field,
      div {
        flex: 1;
      }
      div {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        ::ng-deep mat-form-field {
          flex: 1 0 calc(50% - 0.25rem);
          min-width: 250px;
        }
      }
    }
  `,
})
export class EventDefinitionFormComponent {
  readonly state = input.required<CreateUpdateEventState>();
}
