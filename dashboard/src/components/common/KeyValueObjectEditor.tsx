/**
 * need to wrapped under FormProvider(react-hook-form)
 * @param param0
 * @returns
 */
function KeyValueObjectEditor({
  label,
  name,
  components,
}: {
  label: string;
  name: string;
  components: Record<string, JSX.Element>;
}) {
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{label}</h3>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          {Object.entries(components).map(([key, component]) => {
            return (
              <>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{key}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {component}
                  </dd>
                </div>
              </>
            );
          })}
        </dl>
      </div>
    </div>
  );
}
export default KeyValueObjectEditor;
