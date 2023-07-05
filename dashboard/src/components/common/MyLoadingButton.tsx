import { useState } from "react";

function MyLoadingButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
      type="button"
      onClick={() => {
        setLoading(true);
        onClick()
          .then(() => setLoading(false))
          .catch(() => setLoading(false));
      }}
      disabled={loading}
    >
      {loading && (
        <svg className="mr-3 h-5 w-5 animate-spin " viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}

export default MyLoadingButton;
