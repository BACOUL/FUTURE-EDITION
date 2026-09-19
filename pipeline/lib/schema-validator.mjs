function typeOk(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function formatOk(value, format) {
  if (format === "uri") {
    try { const url = new URL(value); return Boolean(url.protocol && url.hostname); }
    catch { return false; }
  }
  if (format === "date") {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  }
  if (format === "date-time") return value.includes("T") && !Number.isNaN(Date.parse(value));
  return true;
}

export function validateSchema(value, schema, path = "$") {
  const errors = [];
  const types = schema.type == null ? null : Array.isArray(schema.type) ? schema.type : [schema.type];

  if (types && !types.some((type) => typeOk(value, type))) {
    return [`${path}: expected ${types.join("|")}`];
  }

  if (schema.enum && !schema.enum.some((item) => Object.is(item, value))) {
    errors.push(`${path}: value not in enum`);
  }

  if (typeof value === "string") {
    if (schema.minLength != null && value.length < schema.minLength) errors.push(`${path}: shorter than minLength ${schema.minLength}`);
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) errors.push(`${path}: pattern mismatch ${schema.pattern}`);
    if (schema.format && !formatOk(value, schema.format)) errors.push(`${path}: invalid format ${schema.format}`);
  }

  if (typeof value === "number" && schema.minimum != null && value < schema.minimum) {
    errors.push(`${path}: below minimum ${schema.minimum}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) errors.push(`${path}: fewer than minItems ${schema.minItems}`);
    if (schema.uniqueItems) {
      const seen = new Set();
      for (const item of value) {
        const key = JSON.stringify(item);
        if (seen.has(key)) errors.push(`${path}: duplicate array item`);
        seen.add(key);
      }
    }
    if (schema.items) value.forEach((item, index) => errors.push(...validateSchema(item, schema.items, `${path}[${index}]`)));
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`${path}: missing required property ${key}`);
    }

    const properties = schema.properties ?? {};
    for (const [key, item] of Object.entries(value)) {
      if (properties[key]) errors.push(...validateSchema(item, properties[key], `${path}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${path}: unexpected property ${key}`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        errors.push(...validateSchema(item, schema.additionalProperties, `${path}.${key}`));
      }
    }
  }

  return errors;
}
