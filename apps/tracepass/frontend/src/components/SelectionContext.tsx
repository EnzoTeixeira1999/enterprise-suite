import { useId, type ReactNode } from "react";

export default function SelectionContext({ title, hint, children }: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  const hintId = useId();

  return (
    <fieldset className="selection-context" aria-describedby={hintId}>
      <legend>{title}</legend>
      <p id={hintId}>{hint}</p>
      <div className="selection-context__fields">{children}</div>
    </fieldset>
  );
}
