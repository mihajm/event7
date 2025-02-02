const PRECISION = 10;

const PRECISION_SYMBOL = Symbol.for('OMNI_PRECISION');

type BigDecimal = {
  value: bigint;
  [PRECISION_SYMBOL]: number;
};

function isBigDecimal(
  value: string | number | bigint | BigDecimal,
): value is BigDecimal {
  return typeof value === 'object' && PRECISION_SYMBOL in value;
}

function changePrecision(value: BigDecimal, precision: number): BigDecimal {
  if (value[PRECISION_SYMBOL] === precision) return value;
  const scale = BigInt(10 ** (precision - value[PRECISION_SYMBOL]));
  return { value: value.value * scale, [PRECISION_SYMBOL]: precision };
}

function mergeScale(a: BigDecimal, b: BigDecimal): [BigDecimal, BigDecimal] {
  if (a[PRECISION_SYMBOL] === b[PRECISION_SYMBOL]) return [a, b];
  const precision = Math.max(a[PRECISION_SYMBOL], b[PRECISION_SYMBOL]);
  return [changePrecision(a, precision), changePrecision(b, precision)];
}

export function toBigDecimal(
  value: BigDecimal | number | string | bigint,
  precision = PRECISION,
): BigDecimal {
  if (isBigDecimal(value)) {
    return changePrecision(value, precision);
  }
  if (typeof value === 'bigint') {
    return { value, [PRECISION_SYMBOL]: precision };
  }
  if (typeof value === 'number') {
    return {
      value: BigInt(value * 10 ** precision),
      [PRECISION_SYMBOL]: precision,
    };
  }
  if (typeof value === 'string') {
    const [integer = '0', fraction = ''] = value.toString().split('.');
    const fractionValue = fraction ? BigInt(fraction) : BigInt(0);
    const fractionScale = BigInt(10 ** (precision - fraction.length));
    return {
      value: BigInt(integer + fractionValue * fractionScale),
      [PRECISION_SYMBOL]: precision,
    };
  }
  throw new Error(`Unsupported value type: ${typeof value}`);
}

export function fromBigDecimal(value: BigDecimal): number {
  const { value: v, [PRECISION_SYMBOL]: precision } = value;
  return Number(v) / 10 ** precision;
}

export function add(a: BigDecimal, b: BigDecimal): BigDecimal {
  const precision = Math.max(a[PRECISION_SYMBOL], b[PRECISION_SYMBOL]);
  const [aScaled, bScaled] = mergeScale(a, b);

  return {
    value: aScaled.value + bScaled.value,
    [PRECISION_SYMBOL]: precision,
  };
}

export function subtract(a: BigDecimal, b: BigDecimal): BigDecimal {
  const precision = Math.max(a[PRECISION_SYMBOL], b[PRECISION_SYMBOL]);

  const [aScaled, bScaled] = mergeScale(a, b);

  return {
    value: aScaled.value - bScaled.value,
    [PRECISION_SYMBOL]: precision,
  };
}

export function multiply(a: BigDecimal, b: BigDecimal): BigDecimal {
  const precision = a[PRECISION_SYMBOL] + b[PRECISION_SYMBOL];

  const [aScaled, bScaled] = mergeScale(a, b);

  return {
    value: aScaled.value * bScaled.value,
    [PRECISION_SYMBOL]: precision,
  };
}

export function divide(a: BigDecimal, b: BigDecimal): BigDecimal {
  const precision = Math.max(a[PRECISION_SYMBOL], b[PRECISION_SYMBOL]);

  const [aScaled, bScaled] = mergeScale(a, b);

  return {
    value: aScaled.value / bScaled.value,
    [PRECISION_SYMBOL]: precision,
  };
}

export function mod(a: BigDecimal, b: BigDecimal): BigDecimal {
  const precision = Math.max(a[PRECISION_SYMBOL], b[PRECISION_SYMBOL]);

  const [aScaled, bScaled] = mergeScale(a, b);

  return {
    value: aScaled.value % bScaled.value,
    [PRECISION_SYMBOL]: precision,
  };
}

const ZERO = toBigDecimal(0);

export function equalsZero(value: BigDecimal): boolean {
  return equals(value, ZERO);
}

export function equals(a: BigDecimal, b: BigDecimal): boolean {
  if (a[PRECISION_SYMBOL] === b[PRECISION_SYMBOL] && a.value === b.value)
    return true;
  const precision = Math.max(a[PRECISION_SYMBOL], b[PRECISION_SYMBOL]);
  return (
    toBigDecimal(a, precision).value ===
    toBigDecimal(fromBigDecimal(b), precision).value
  );
}

export function multipleOf(
  multiple: BigDecimal,
): (value: BigDecimal) => boolean {
  if (equalsZero(multiple)) return () => true;

  return (value: BigDecimal): boolean => equalsZero(mod(value, multiple));
}
