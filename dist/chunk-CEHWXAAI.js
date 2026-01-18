// src/utils/phone.ts
function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
function unformatPhoneNumber(value) {
  return value.replace(/\D/g, "");
}
function isValidPhoneNumber(value) {
  const digits = unformatPhoneNumber(value);
  return digits.length === 10;
}
function isPhoneNumberEmpty(value) {
  return unformatPhoneNumber(value).length === 0;
}

export { formatPhoneNumber, isPhoneNumberEmpty, isValidPhoneNumber, unformatPhoneNumber };
//# sourceMappingURL=chunk-CEHWXAAI.js.map
//# sourceMappingURL=chunk-CEHWXAAI.js.map