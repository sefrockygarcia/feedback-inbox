"use client";

// Client Component: runs in the browser so it can show validation errors and a
// pending state without a full page reload. No Rails equivalent; the closest is
// a form with Turbo plus a Stimulus controller.

import { useActionState, useState } from "react";
import { submitFeedback, type SubmitFeedbackState } from "@/lib/actions/feedback";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/feedback";

const initialState: SubmitFeedbackState = { status: "idle" };

const inputClass =
  "mt-1 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 aria-invalid:border-danger";

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="mt-1 text-sm text-danger">
      {errors[0]}
    </p>
  );
}

export function FeedbackForm() {
  // Changing `key` makes React throw away the inner form and its state, giving a blank form.
  const [formKey, setFormKey] = useState(0);
  return <FeedbackFormInner key={formKey} onReset={() => setFormKey((key) => key + 1)} />;
}

function FeedbackFormInner({ onReset }: { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(submitFeedback, initialState);

  if (state.status === "success") {
    return (
      <div role="status" className="py-6 text-center">
        <h2 className="text-2xl font-semibold">Thank you</h2>
        <p className="mt-2 text-muted">Your feedback has been sent to the team.</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-medium hover:bg-canvas"
        >
          Send more feedback
        </button>
      </div>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const values = state.status === "error" ? state.values : undefined;

  return (
    // key forces React to reset the inputs to the returned values after an error.
    <form action={formAction} className="space-y-5" noValidate key={JSON.stringify(values ?? {})}>
      {state.status === "error" && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {state.message}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-medium">How would you rate your experience?</legend>
        <div className="mt-2 flex gap-2" aria-describedby={errors?.rating ? "rating-error" : undefined}>
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={value}
                defaultChecked={values?.rating === String(value)}
                className="peer sr-only"
                required
              />
              <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-lg border border-line text-lg font-semibold peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 hover:border-accent">
                {value}
              </span>
              <span className="sr-only">{value} out of 5</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">1 = very unhappy, 5 = very happy</p>
        <FieldError id="rating-error" errors={errors?.rating} />
      </fieldset>

      <div>
        <label htmlFor="category" className="text-sm font-medium">
          What is it about?
        </label>
        <select
          id="category"
          name="category"
          defaultValue={values?.category ?? ""}
          className={inputClass}
          aria-invalid={Boolean(errors?.category)}
          aria-describedby={errors?.category ? "category-error" : undefined}
          required
        >
          <option value="" disabled>
            Choose a category
          </option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
        <FieldError id="category-error" errors={errors?.category} />
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-medium">
          Your feedback
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={2000}
          defaultValue={values?.message}
          className={inputClass}
          aria-invalid={Boolean(errors?.message)}
          aria-describedby={errors?.message ? "message-error" : undefined}
          required
        />
        <FieldError id="message-error" errors={errors?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-medium">
            Name <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="name" name="name" autoComplete="name" defaultValue={values?.name} className={inputClass} />
          <FieldError id="name-error" errors={errors?.name} />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={values?.email}
            className={inputClass}
            aria-invalid={Boolean(errors?.email)}
            aria-describedby={errors?.email ? "email-error" : undefined}
          />
          <FieldError id="email-error" errors={errors?.email} />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-accent px-5 font-semibold text-white hover:bg-accent-strong disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
