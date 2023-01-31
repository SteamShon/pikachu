import { ErrorMessage } from "@hookform/error-message";
import type { FieldErrors } from "react-hook-form";

type ErrorSummaryProps = {
  errors: FieldErrors;
};

function ErrorSummary({ errors }: ErrorSummaryProps) {
  if (Object.keys(errors).length === 0) {
    return null;
  }

  return (
    <div className="error-summary">
      {Object.keys(errors).map((fieldName) => (
        <ErrorMessage
          errors={errors}
          name={fieldName as string}
          as="div"
          key={fieldName}
          render={() => (
            <p>
              {fieldName}: {JSON.stringify(errors[fieldName])}
            </p>
          )}
        />
      ))}
    </div>
  );
}

export default ErrorSummary;
