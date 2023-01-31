import { api } from "../../../utils/api";

function UserList() {
  const { data: users } = api.user.getAll.useQuery();

  return (
    <>
      {(users || []).map((user) => {
        return <p key={user.id}>{JSON.stringify(user)}</p>;
      })}
    </>
  );
}

export default UserList;
