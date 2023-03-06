import { type NextPage } from "next";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  const data = api.ethRegistrarController.indexFromBlock.useQuery({startBlock: 16767279});

  return (
    <div>
    <p> {data.status} </p>
    <p> {data.data?.error?.toString()} </p>
    <p> {data.data?.success?.toString()} </p>
    </div>
  );
};

export default Home;
