import { badRequest } from "../errors/http-error";

export function parsePositiveInt(value: unknown, fieldName: string) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw badRequest(`${fieldName} must be a positive integer`);
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

export function requireString(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    throw badRequest(`${fieldName} is required`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw badRequest(`${fieldName} is required`);
  }

  return trimmed;
}

export function optionalString(value: unknown, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  return requireString(value, fieldName);
}

export function optionalNullableString(value: unknown, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return requireString(value, fieldName);
}

export function requireEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string,
) {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw badRequest(`${fieldName} must be one of: ${allowedValues.join(", ")}`);
  }

  return value as T;
}

export function optionalEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string,
) {
  if (value === undefined) {
    return undefined;
  }

  return requireEnum(value, allowedValues, fieldName);
}

export function parseDateTime(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    throw badRequest(`${fieldName} must be a valid date string`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw badRequest(`${fieldName} must be a valid date string`);
  }

  return date;
}

export function optionalDateTime(value: unknown, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  return parseDateTime(value, fieldName);
}

export function optionalNullableDateTime(value: unknown, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return parseDateTime(value, fieldName);
}
