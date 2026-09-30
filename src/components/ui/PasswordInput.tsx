import { useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Input from "./Input";

/**
 * A password field with a reveal toggle.
 *
 * Password managers and typo-prone strong passwords both argue for letting
 * someone check what they typed. The toggle is a real `<button>` with an
 * `aria-label` that changes with its state, and it is excluded from the tab
 * order — reaching it by keyboard between the field and the submit button is
 * more nuisance than help, and the field is usable without it.
 */
export default function PasswordInput({
  label,
  hint,
  error,
  value,
  onChange,
  autoComplete = "current-password",
  required,
  autoFocus,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation("common");
  const [visible, setVisible] = useState(false);

  return (
    <Input
      type={visible ? "text" : "password"}
      label={label}
      hint={hint}
      error={error}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      required={required}
      autoFocus={autoFocus}
      trailing={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={t(visible ? "account.field.hidePassword" : "account.field.showPassword")}
          title={t(visible ? "account.field.hidePassword" : "account.field.showPassword")}
          className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-gray-700"
        >
          {visible ? (
            <EyeSlashIcon className="h-5 w-5" aria-hidden />
          ) : (
            <EyeIcon className="h-5 w-5" aria-hidden />
          )}
        </button>
      }
    />
  );
}
