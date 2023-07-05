import { useEffect, useState } from "react";
import type { SMSContentTypeDetail } from "../../utils/smsContentType";
import { extractVariables, toPlainText } from "../../utils/text";

function SMSContentPreview({
  contentTypeDetails,
  contentValues,
}: {
  contentTypeDetails?: Partial<SMSContentTypeDetail>;
  contentValues?: { [x: string]: unknown };
}) {
  const [template, setTemplate] = useState<string | undefined>(undefined);
  const [values, setValues] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    setTemplate(toPlainText(contentTypeDetails?.template || ""));

    if (contentValues && Object.keys(contentValues).length > 0) {
      // use provided content's value.
      const values = contentValues as Record<string, string | undefined>;
      setValues(values);
    } else {
      // intialize values from contentType
      const variables = extractVariables(contentTypeDetails?.template);
      const values = (variables || []).reduce((prev, cur) => {
        prev[cur] = undefined;
        return prev;
      }, {} as Record<string, string | undefined>);
      setValues(values);
    }
  }, [contentTypeDetails, contentValues]);

  const columnExistInCube = (variable: string) => {
    if (!contentTypeDetails) return;

    return (
      contentTypeDetails?.columns?.findIndex(
        ({ column_name }) => column_name === variable
      ) !== -1
    );
  };

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="border-t border-gray-200">
        <label
          htmlFor="template"
          className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
        >
          <textarea
            id="template"
            className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
            rows={10}
            readOnly
            value={template}
          />
          <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
            Template
          </span>
        </label>
      </div>
      {/* <div className="border-t border-gray-200">
        <h3>Values</h3>
      </div> */}
      <div className="border-t border-gray-200">
        {Object.keys(values).map((variable) => {
          return (
            <label
              key={`${variable}`}
              htmlFor={`${variable}`}
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span
                className={`text-xs font-medium ${
                  columnExistInCube(variable) ? "text-gray-700" : "text-red-700"
                }`}
              >
                {variable}
              </span>
              <input
                // {...register(`${prefix}.${variable}`)}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                readOnly
                value={values[`${variable}`]}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
export default SMSContentPreview;
