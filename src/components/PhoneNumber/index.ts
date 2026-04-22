export {
  PhoneNumber,
  type PhoneNumberEntry,
  type PhoneNumberProps,
  type PhoneNumberType,
  toTelHref,
} from './PhoneNumber';
// NOTE: `formatPhoneNumber` is intentionally not re-exported here to avoid
// colliding with the canonical `formatPhoneNumber` from `src/utils/phone.ts`
// (exported from `@mieweb/ui` and `@mieweb/ui/utils`). Import it directly
// from `./PhoneNumber` if the component's display-oriented variant is needed.
