import { type NextPage } from "next";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  const hello = api.example.hello.useQuery("eip155:1/erc1155:0x495f947276749ce646f68ac8c248420045cb7b5e/23428874141363901895345748416287939877937390268703302074804412957291205099521");

  return (
    <div>
      <p>hello world</p>
    </div>
  );
};

export default Home;
