import { api } from "../../utils/api";

function ExampleList() {
  const hello = api.example.hello.useQuery({ text: "from tRPC" });

  return <>Hi</>;
}

export default ExampleList;
