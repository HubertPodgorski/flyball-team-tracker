import type { AnyFieldApi, ReactFormExtendedApi } from "@tanstack/react-form";

// AnyFormApi (from @tanstack/form-core) is missing .Field/.Subscribe —
// those are React-specific, only present on ReactFormApi. This is the
// type-erased equivalent that actually has them.
export type AnyReactFormApi = ReactFormExtendedApi<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

export interface FormFieldProps {
  form: AnyReactFormApi;
  name: string;
}

export const getFieldErrorMessage = (field: AnyFieldApi): string =>
  field.state.meta.errors[0] ?? "";
