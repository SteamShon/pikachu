import { useFormContext } from "react-hook-form";

function CustomsetInfo() {
  const { register } = useFormContext();

  return (
    <div className="pl-8">
      <input {...register("info.customsetId", { value: "1" })} type="hidden" />
      <label>filePath</label>
      <input
        {...register("info.filePath")}
        className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
      />
      <label>config</label>
      <input
        {...register("info.config")}
        className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
      />
    </div>
  );
}
export default CustomsetInfo;
