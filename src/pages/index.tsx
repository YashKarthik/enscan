import { type NextPage } from "next";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  const data = api.ethRegistrarController.indexFromBlock.useQuery({startBlock: 16832087});

  return (
    <div>
    <p> {data.status} </p>
    <p> {data.data?.error?.message} </p>
    <p> {data.data?.error?.details} </p>
    <p> {data.data?.error?.hint} </p>
    </div>
  );
};

export default Home;
