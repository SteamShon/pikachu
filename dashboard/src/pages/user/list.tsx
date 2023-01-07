import { api } from "../../utils/api";

function UserList() {
  const { data: users, isLoading } = api.user.getAll.useQuery();

  return (
    <>
      {(users || []).map((user) => {
        return <p>{JSON.stringify(user)}</p>;
      })}
    </>
  );
}

export default UserList;
