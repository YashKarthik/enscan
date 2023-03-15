import Head from 'next/head';
import Image from 'next/image';

const Home = () => (
  <>
    <Head>
      <title>Enscan | Query ENS data with SQL</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    </Head>

    <div className="
      flex flex-col
      bg-black text-gray-400
      min-h-screen
    ">
      <header className="
        mb-4 py-4
        self-center
      ">
        <h1 className='
          text-4xl font-bold
          bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-violet-500
        '>
          Enscan
        </h1>
        <p className='text-gray-500'>Query ENS data with SQL</p>
      </header>

      <main className="container mx-auto px-4">
        <div className="
          mb-8
        ">
          Enscan is an indexer that crawls and indexes data stored in ENS contracts into a database to enable developers to query that data using the all-powerful SQL.
          I&lsquo;m opening up access to the Supabase DB to enable other devs to use this indexer.

          <br/>
          <br/>

          Each row in the db represents one profile, each profile adheres to the following <a href="https://zod.dev" target="_blank" className='underline decoration-wavy'>Zod</a> type.
        </div>

        <Image
          src="/types-doc.png"
          alt="Image of row type"
          width="11000"
          height="400"
        />

        Use Supabase client (or any other client) to query the db. The following secrets have been provided in good faith,
        please setup your own indexer once your project takes off. <a href="https://github.com/yashkarthik/enscan" target="_blank" className='underline decoration-wavy'>(how to)</a>
        <br/> <br/>
        Supabase DB url: https://qtquydxpjvjrdtzbksom.supabase.co <br/>

        Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cXV5ZHhwanZqcmR0emJrc29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzY5NTM0NTUsImV4cCI6MTk5MjUyOTQ1NX0.L-t1YKOtlSVeWMNpxOzS-0Cq8Q2my1zWt0GmTIZkWw4

      </main>
      <footer className="self-center">
        {[
          ["Github", "https://github.com/yashkarthik/enscan"],
          ["Blog", "https://yashkarthik.xyz/"],
          ["Twitter", "https://twitter.com/_yashkarthik/"],
          ["Farcaster", "https://warpcast.com/yashkarthik/"],
        ].map(link => <a key={link[1]!.length / link[0]!.length}
            target="_blank"
            href={link[1]}
            className="
              mx-3
              text-gray-300
              hover:underline decoration-wavy decoration-indigo-400
            ">{link[0]}</a>
        )}
      </footer>
      </div>
      </>
)

export default Home;
