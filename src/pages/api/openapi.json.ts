import { NextApiRequest, NextApiResponse } from 'next';

import { openApiDocument } from '../../server/openapi';

// Respond with our OpenAPI schema
const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).send(openApiDocument);
};

export default handler;
