import { type NextPage } from "next";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  api.example.hello.useQuery();

  return (
    <div>
      <p>hello world</p>
    </div>
  );
};

export default Home;
