'use strict';

// src/utils/date.ts
function formatDateValue(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
function parseDateValue(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const month = parseInt(digits.slice(0, 2), 10);
  const day = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day || date.getFullYear() !== year) {
    return null;
  }
  return date;
}
function isValidDate(value) {
  return parseDateValue(value) !== null;
}
function isDateEmpty(value) {
  return value.replace(/\D/g, "").length === 0;
}
function calculateAge(dob) {
  const birthDate = parseDateValue(dob);
  if (!birthDate) return null;
  const today = /* @__PURE__ */ new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birthDate.getDate()) {
    age--;
  }
  return age;
}
function isValidDrivingAge(dob) {
  const age = calculateAge(dob);
  return age !== null && age >= 16;
}
function isDateInPast(value) {
  const date = parseDateValue(value);
  if (!date) return false;
  return date < /* @__PURE__ */ new Date();
}
function isDateInFuture(value) {
  const date = parseDateValue(value);
  if (!date) return false;
  return date > /* @__PURE__ */ new Date();
}

exports.calculateAge = calculateAge;
exports.formatDateValue = formatDateValue;
exports.isDateEmpty = isDateEmpty;
exports.isDateInFuture = isDateInFuture;
exports.isDateInPast = isDateInPast;
exports.isValidDate = isValidDate;
exports.isValidDrivingAge = isValidDrivingAge;
exports.parseDateValue = parseDateValue;
//# sourceMappingURL=chunk-KMN7JX2X.cjs.map
//# sourceMappingURL=chunk-KMN7JX2X.cjs.map