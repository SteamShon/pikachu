import { useFieldArray, useFormContext } from "react-hook-form";

function KeyValueArrayEditor({ name }: { name: string }) {
  type KeyValueArray = { key: string; value: string }[];
  const { register, control } = useFormContext<{
    [name: string]: KeyValueArray;
  }>();
  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name,
  });
  return (
    <>
      <button type="button" onClick={() => append({ key: "", value: "" })}>
        Add
      </button>
      {fields.map((field, index) => (
        <div key={field.id} className="mx-auto mt-8 mb-0 max-w-md space-y-4">
          <label
            htmlFor="key"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> Key </span>
            <input
              {...register(`${name}.${index}.key`)}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="key"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> Value </span>
            <input
              {...register(`${name}.${index}.value`)}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
            <span className="absolute inset-y-0 right-0 grid w-10 place-content-center">
              <button
                type="button"
                className="rounded-full bg-rose-600 p-0.5 text-white hover:bg-rose-700"
                onClick={() => remove(index)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </span>
          </label>
        </div>
      ))}
    </>
  );
}
export default KeyValueArrayEditor;
