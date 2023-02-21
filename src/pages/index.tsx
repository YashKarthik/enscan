import { type NextPage } from "next";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  //const hello = api.example.hello.useQuery({ text: "from tRPC" });

  return (
    <div>
      <p>Hello world</p>
    </div>
  );
};

export default Home;
