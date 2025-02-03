import { createSharedTranslation } from './shared.namespace';

export default createSharedTranslation('sl-SI', {
  themeMode: {
    auto: 'Samodejno',
    dark: 'Temno',
    light: 'Svetlo',
  },
  settings: {
    showTooltips: 'Prikaži namige',
  },
  close: 'Zapri',
  confirm: 'Potrdi',
  clear: 'Počisti',
  noItemsFound: 'Ni najdenih {items}',
  results: 'rezultatov',
  areYouSure: 'Ali ste prepričani?',
  editItem: 'Uredi {item}',
  table: {
    pagination: {
      firstPage: 'Prva stran',
      lastPage: 'Zadnja stran',
      nextPage: 'Naslednja stran',
      prevPage: 'Prejšnja stran',
      fromTo: '{range} od {total}',
      perPage: '{items} na stran',
    },
  },
  validation: {
    general: {
      required: 'Polje je obvezno',
      mustBe: 'Mora biti {value}',
      mustBeOneOf: 'Mora biti eden izmed {values}',
      mustBeEmpty: 'Mora biti prazno',
    },
    string: {
      minLength: 'Mora biti vsaj {min} znakov dolgo',
      maxLength: 'Mora biti največ {max} znakov dolgo',
      pattern: 'Mora se ujemati z {pattern}',
      blanks: 'Izogibajte se vodilnih/zadnjih presledkov',
      string: 'Mora biti niz',
    },
    date: {
      date: 'Mora biti datum',
    },
    number: {
      min: 'Mora biti vsaj {min}',
      max: 'Mora biti največ {max}',
      integer: 'Mora biti celo število',
      number: 'Mora biti število',
      multipleOf: 'Mora biti večkratnik {value}',
    },
  },
});
